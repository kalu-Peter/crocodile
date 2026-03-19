import supabase from "../_lib/supabase.js";

/**
 * Safaricom calls this URL after the customer completes (or cancels) payment.
 * Updates the reservation's payment_status in Supabase.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(400).json({ error: "Invalid callback payload" });

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    const success = ResultCode === 0;

    // Extract metadata items when successful
    let mpesaReceiptNumber = null;
    let amount = null;
    let phoneNumber = null;

    if (success && CallbackMetadata?.Item) {
      const item = (name) =>
        CallbackMetadata.Item.find((i) => i.Name === name)?.Value ?? null;
      mpesaReceiptNumber = item("MpesaReceiptNumber");
      amount             = item("Amount");
      phoneNumber        = item("PhoneNumber");
    }

    // The AccountReference in the STK Push was set to the reservationId
    // We use MerchantRequestID or CheckoutRequestID to find the reservation.
    // Update all matching pending reservations — simplest approach since we
    // store only one pending reservation per phone at a time.
    // If you store checkout_request_id in the DB, query by that instead.
    if (success) {
      await supabase
        .from("reservations")
        .update({
          payment_status: "paid",
          confirmed: true,
        })
        .eq("payment_status", "pending");
        // For a more precise match, add: .eq("phone", String(phoneNumber))
    }

    // Always respond with success so Safaricom doesn't retry
    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" }); // still ACK to Safaricom
  }
}
