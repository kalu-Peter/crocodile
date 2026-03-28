const isSandbox = process.env.MPESA_SANDBOX !== "false";
const MPESA_BASE = isSandbox ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke";
const PAYPAL_BASE = process.env.PAYPAL_SANDBOX !== "false"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

// ─── M-Pesa helpers ────────────────────────────────────────────────────────

async function getMpesaToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    console.error("[M-Pesa] Token response not JSON:", text);
    throw new Error("M-Pesa auth failed – unexpected response from Safaricom");
  }
  if (!data.access_token) {
    console.error("[M-Pesa] Token error:", JSON.stringify(data));
    throw new Error(data.errorMessage || data.error_description || "Failed to get M-Pesa token");
  }
  return data.access_token;
}

function mpesaTimestamp() {
  return new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

function mpesaPassword(timestamp) {
  const shortcode = process.env.MPESA_SHORTCODE;
  return Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
}

function formatPhone(phone) {
  return "254" + phone.replace(/\D/g, "").replace(/^(254|0)/, "");
}

// ─── M-Pesa routes ─────────────────────────────────────────────────────────

export async function initiateMpesa(req, res) {
  const { phone, amount, reference } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: "phone and amount are required" });

  try {
    const token = await getMpesaToken();
    const timestamp = mpesaTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const formattedPhone = formatPhone(phone);

    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: mpesaPassword(timestamp),
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: reference || "CrocodileLodge",
        TransactionDesc: "Villa Reservation",
      }),
    });

    const stkText = await stkRes.text();
    let data;
    try { data = JSON.parse(stkText); } catch {
      console.error("[M-Pesa] STK response not JSON:", stkText);
      return res.status(500).json({ error: "Invalid response from Safaricom" });
    }
    console.log("[M-Pesa] STK response:", JSON.stringify(data));
    if (data.ResponseCode === "0") {
      return res.json({ success: true, checkoutRequestId: data.CheckoutRequestID });
    }
    return res.status(400).json({ error: data.ResponseDescription || data.errorMessage || "STK Push failed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function queryMpesa(req, res) {
  const { checkoutRequestId } = req.body;
  if (!checkoutRequestId) return res.status(400).json({ error: "checkoutRequestId required" });

  try {
    const token = await getMpesaToken();
    const timestamp = mpesaTimestamp();

    const queryRes = await fetch(`${MPESA_BASE}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: mpesaPassword(timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await queryRes.json();
    const code = String(data.ResultCode ?? "");
    if (code === "0") return res.json({ status: "success" });
    if (code === "1032") return res.json({ status: "cancelled", message: "Payment was cancelled" });
    if (code && code !== "") return res.json({ status: "failed", message: data.ResultDesc || "Payment failed" });
    return res.json({ status: "pending" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── PayPal helpers ─────────────────────────────────────────────────────────

async function getPaypalToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function kesToUsd(kes) {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/KES");
    const d = await r.json();
    return (kes * (d?.rates?.USD ?? 0.0077)).toFixed(2);
  } catch {
    return (kes * 0.0077).toFixed(2);
  }
}

// ─── PayPal routes ──────────────────────────────────────────────────────────

export async function createPaypalOrder(req, res) {
  const { amountKES, description } = req.body;
  if (!amountKES) return res.status(400).json({ error: "amountKES required" });

  try {
    const amountUSD = await kesToUsd(amountKES);
    const token = await getPaypalToken();

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amountUSD },
          description: description || "Villa Reservation – Crocodile Lodge",
        }],
      }),
    });

    const order = await orderRes.json();
    if (!order.id) return res.status(400).json({ error: order.message || "Failed to create PayPal order" });
    return res.json({ orderId: order.id, amountUSD });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function capturePaypalOrder(req, res) {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId required" });

  try {
    const token = await getPaypalToken();
    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    const data = await captureRes.json();
    if (data.status === "COMPLETED") {
      const transactionId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      return res.json({ success: true, transactionId });
    }
    return res.status(400).json({ error: "Payment not completed", details: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
