import supabase from "../db/supabase.js";

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

/** EAT timestamp YYYYMMDDHHmmss */
function timestamp() {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

/** Normalize phone → 254XXXXXXXXX */
function formatPhone(phone) {
  let p = String(phone).replace(/[\s\-+]/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  return p;
}

async function getToken() {
  const key    = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET not set");

  const creds = Buffer.from(`${key}:${secret}`).toString("base64");
  const res   = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${creds}` } }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// POST /api/mpesa/stk-push
export async function stkPush(req, res) {
  const { phone, amount, reservationId } = req.body;

  if (!phone || !amount || !reservationId) {
    return res.status(400).json({ error: "phone, amount and reservationId are required" });
  }

  const shortcode   = process.env.MPESA_SHORTCODE;
  const passkey     = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL ||
    "https://crocodile-virid.vercel.app/api/mpesa/callback";

  if (!shortcode || !passkey) {
    return res.status(500).json({ error: "MPESA_SHORTCODE / MPESA_PASSKEY not configured" });
  }

  try {
    const token    = await getToken();
    const ts       = timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
    const ph       = formatPhone(phone);
    const partyB   = process.env.MPESA_TILL_NUMBER || shortcode;
    const txType   = process.env.MPESA_TILL_NUMBER
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline";

    const payload = {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         ts,
      TransactionType:   txType,
      Amount:            Math.ceil(Number(amount)),
      PartyA:            ph,
      PartyB:            partyB,
      PhoneNumber:       ph,
      CallBackURL:       callbackUrl,
      AccountReference:  String(reservationId).slice(0, 12),
      TransactionDesc:   "Crocodile Lodge",
    };

    const stkRes  = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await stkRes.json();
    console.log("[mpesa] STK response:", JSON.stringify(data));

    if (data.ResponseCode !== "0") {
      return res.status(400).json({
        error:  data.errorMessage || data.ResponseDescription || "STK Push failed",
        detail: data,
      });
    }

    return res.json({
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      message: "STK Push sent – enter your M-Pesa PIN on your phone",
    });
  } catch (err) {
    console.error("[mpesa] stkPush error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/mpesa/status?id=CheckoutRequestID
export async function stkStatus(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id (CheckoutRequestID) is required" });

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey   = process.env.MPESA_PASSKEY;

  try {
    const token    = await getToken();
    const ts       = timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

    const qRes = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        BusinessShortCode: shortcode,
        Password:          password,
        Timestamp:         ts,
        CheckoutRequestID: id,
      }),
    });

    const raw = await qRes.text();
    let data;
    try { data = JSON.parse(raw); } catch {
      console.error("[mpesa] status non-JSON response:", raw.slice(0, 200));
      return res.json({ status: "pending", message: "Awaiting payment confirmation" });
    }

    console.log("[mpesa] status response:", JSON.stringify(data));
    const code = String(data.ResultCode ?? data.errorCode ?? data.ResponseCode ?? "");

    if (code === "0")    return res.json({ status: "completed" });
    if (code === "1032") return res.json({ status: "cancelled", message: "Payment was cancelled" });
    if (code === "1037") return res.json({ status: "timeout",   message: "Request timed out" });
    if (code === "1")    return res.json({ status: "pending",   message: "Awaiting payment" });
    return res.json({ status: "pending", message: data.ResultDesc || data.errorMessage || "Awaiting payment" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/mpesa/callback  (called by Safaricom)
export async function stkCallback(req, res) {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: "Accepted" });

    const { ResultCode, CallbackMetadata } = body;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const item  = (name) => CallbackMetadata.Item.find((i) => i.Name === name)?.Value ?? null;
      const phone = String(item("PhoneNumber") || "");

      if (phone) {
        await supabase
          .from("reservations")
          .update({ payment_status: "paid", confirmed: true })
          .eq("phone", phone)
          .eq("payment_status", "pending");
      }
    }

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("[mpesa] callback error:", err);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
