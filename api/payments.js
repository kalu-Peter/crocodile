import { cors } from "./_lib/helpers.js";

// ─── M-Pesa helpers ────────────────────────────────────────────────────────
const MPESA_BASE = process.env.MPESA_SANDBOX !== "false"
  ? "https://sandbox.safaricom.co.ke"
  : "https://api.safaricom.co.ke";

async function getMpesaToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return (await res.json()).access_token;
}

function mpesaTimestamp() {
  return new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

function mpesaPassword(ts) {
  return Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString("base64");
}

function formatPhone(phone) {
  return "254" + phone.replace(/\D/g, "").replace(/^(254|0)/, "");
}

// ─── PayPal helpers ─────────────────────────────────────────────────────────
const PAYPAL_BASE = process.env.PAYPAL_SANDBOX !== "false"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

async function getPaypalToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  return (await res.json()).access_token;
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

// ─── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, ...body } = req.body ?? {};

  try {
    // ── M-Pesa: initiate STK Push ──────────────────────────────────────────
    if (action === "mpesa-initiate") {
      const { phone, amount, reference } = body;
      if (!phone || !amount) return res.status(400).json({ error: "phone and amount are required" });

      const token = await getMpesaToken();
      const ts = mpesaTimestamp();
      const formattedPhone = formatPhone(phone);

      const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: mpesaPassword(ts),
          Timestamp: ts,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.ceil(amount),
          PartyA: formattedPhone,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: reference || "CrocodileLodge",
          TransactionDesc: "Villa Reservation",
        }),
      });
      const data = await stkRes.json();
      if (data.ResponseCode === "0") return res.json({ success: true, checkoutRequestId: data.CheckoutRequestID });
      return res.status(400).json({ error: data.ResponseDescription || "STK Push failed" });
    }

    // ── M-Pesa: query payment status ───────────────────────────────────────
    if (action === "mpesa-query") {
      const { checkoutRequestId } = body;
      if (!checkoutRequestId) return res.status(400).json({ error: "checkoutRequestId required" });

      const token = await getMpesaToken();
      const ts = mpesaTimestamp();

      const qRes = await fetch(`${MPESA_BASE}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: mpesaPassword(ts),
          Timestamp: ts,
          CheckoutRequestID: checkoutRequestId,
        }),
      });
      const data = await qRes.json();
      const code = String(data.ResultCode ?? "");
      if (code === "0") return res.json({ status: "success" });
      if (code === "1032") return res.json({ status: "cancelled", message: "Payment was cancelled" });
      if (code !== "") return res.json({ status: "failed", message: data.ResultDesc || "Payment failed" });
      return res.json({ status: "pending" });
    }

    // ── PayPal: create order ───────────────────────────────────────────────
    if (action === "paypal-create") {
      const { amountKES, description } = body;
      if (!amountKES) return res.status(400).json({ error: "amountKES required" });

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
    }

    // ── PayPal: capture order ──────────────────────────────────────────────
    if (action === "paypal-capture") {
      const { orderId } = body;
      if (!orderId) return res.status(400).json({ error: "orderId required" });

      const token = await getPaypalToken();
      const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await captureRes.json();
      if (data.status === "COMPLETED") {
        return res.json({
          success: true,
          transactionId: data.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        });
      }
      return res.status(400).json({ error: "Payment not completed" });
    }

    return res.status(400).json({ error: "Invalid action. Use: mpesa-initiate, mpesa-query, paypal-create, paypal-capture" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
