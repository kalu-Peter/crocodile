export default async function handler(_req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Step 1 – check env vars are loaded
  const env = {
    MPESA_CONSUMER_KEY:    process.env.MPESA_CONSUMER_KEY    ? "✓ set" : "✗ MISSING",
    MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET ? "✓ set" : "✗ MISSING",
    MPESA_SHORTCODE:       process.env.MPESA_SHORTCODE       || "✗ MISSING",
    MPESA_PASSKEY:         process.env.MPESA_PASSKEY         ? "✓ set" : "✗ MISSING",
    MPESA_ENV:             process.env.MPESA_ENV             || "✗ MISSING",
  };

  // Step 2 – try fetching M-Pesa token directly (no imports)
  let tokenResult = "not tested";
  try {
    const key    = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const base   = process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const creds = Buffer.from(`${key}:${secret}`).toString("base64");
    const r = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    const data = await r.json();
    tokenResult = r.ok && data.access_token ? "✓ token OK" : `✗ ${JSON.stringify(data)}`;
  } catch (e) {
    tokenResult = `✗ ${e.message}`;
  }

  return res.json({ env, tokenResult });
}
