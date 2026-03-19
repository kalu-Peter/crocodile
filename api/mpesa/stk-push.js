export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, amount, reservationId } = req.body ?? {};

    if (!phone || !amount || !reservationId) {
      return res.status(400).json({ error: "phone, amount and reservationId are required" });
    }

    const key       = process.env.MPESA_CONSUMER_KEY;
    const secret    = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey   = process.env.MPESA_PASSKEY;
    const baseUrl   = process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
    const callbackUrl = process.env.MPESA_CALLBACK_URL ||
      "https://crocodile-virid.vercel.app/api/mpesa/callback";

    if (!key || !secret || !shortcode || !passkey) {
      return res.status(500).json({
        error: "Missing M-Pesa env vars",
        missing: {
          MPESA_CONSUMER_KEY:    !key,
          MPESA_CONSUMER_SECRET: !secret,
          MPESA_SHORTCODE:       !shortcode,
          MPESA_PASSKEY:         !passkey,
        },
      });
    }

    // ── 1. Get access token ──────────────────────────────────────
    const creds = Buffer.from(`${key}:${secret}`).toString("base64");
    const tokenRes = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${creds}` } }
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(500).json({ error: "Failed to get M-Pesa token", detail: tokenData });
    }
    const token = tokenData.access_token;

    // ── 2. Build STK push payload ────────────────────────────────
    // Timestamp in EAT (UTC+3)
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const ts  = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

    // Normalize phone → 254XXXXXXXXX
    let ph = String(phone).replace(/[\s\-+]/g, "");
    if (ph.startsWith("0")) ph = "254" + ph.slice(1);
    if (ph.startsWith("7") || ph.startsWith("1")) ph = "254" + ph;

    const partyB = process.env.MPESA_TILL_NUMBER || shortcode;
    const txType = process.env.MPESA_TILL_NUMBER
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

    // ── 3. Fire STK push ─────────────────────────────────────────
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const stkData = await stkRes.json();

    console.log("[stk-push] Safaricom response:", JSON.stringify(stkData));

    if (stkData.ResponseCode !== "0") {
      return res.status(400).json({
        error:  stkData.errorMessage || stkData.ResponseDescription || "STK Push failed",
        detail: stkData,
      });
    }

    return res.json({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      message:           "STK Push sent – enter your M-Pesa PIN on your phone",
    });

  } catch (err) {
    console.error("[stk-push] Unhandled error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
