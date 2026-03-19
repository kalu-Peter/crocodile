export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id (CheckoutRequestID) is required" });

    const key       = process.env.MPESA_CONSUMER_KEY;
    const secret    = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey   = process.env.MPESA_PASSKEY;
    const baseUrl   = process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    // Get token
    const creds = Buffer.from(`${key}:${secret}`).toString("base64");
    const tokenRes  = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${creds}` } }
    );
    const tokenData = await tokenRes.json();
    const token     = tokenData.access_token;

    // Query STK status
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const ts  = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

    const qRes  = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: ts, CheckoutRequestID: id }),
    });
    const data = await qRes.json();
    const code = String(data.ResultCode ?? data.errorCode ?? "");

    if (code === "0")    return res.json({ status: "completed" });
    if (code === "1032") return res.json({ status: "cancelled", message: "Payment was cancelled" });
    if (code === "1037") return res.json({ status: "timeout",   message: "Request timed out" });

    return res.json({ status: "pending", message: data.ResultDesc || "Awaiting payment" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
