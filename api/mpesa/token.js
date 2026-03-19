/**
 * Internal helper – NOT an HTTP route.
 * Fetches a fresh M-Pesa OAuth token using Basic auth.
 */
const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export async function getMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;

  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET not set");

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa token error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { token: data.access_token, baseUrl: BASE_URL };
}
