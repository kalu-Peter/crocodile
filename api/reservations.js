import supabase from "./_lib/supabase.js";
import { cors } from "./_lib/helpers.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { property_name, guests, checkin, checkout, name, phone, email, total_price } = req.body;

  if (!property_name || !guests || !checkin || !checkout || !name || !phone || !email || total_price === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const guestCount = parseInt(guests, 10);
  if (isNaN(guestCount) || guestCount < 1) {
    return res.status(400).json({ error: "guests must be a positive integer" });
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);

  if (isNaN(checkinDate) || isNaN(checkoutDate)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }
  if (checkoutDate <= checkinDate) {
    return res.status(400).json({ error: "checkout must be after checkin" });
  }
  if (checkinDate < new Date(new Date().toDateString())) {
    return res.status(400).json({ error: "checkin cannot be in the past" });
  }

  try {
    // Availability check before inserting
    const { data: conflicts } = await supabase
      .from("reservations")
      .select("id")
      .eq("property_name", property_name)
      .eq("cancelled", false)
      .lt("checkin", checkout)
      .gt("checkout", checkin);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ error: "Property already booked for those dates" });
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        property_name,
        guests: guestCount,
        checkin,
        checkout,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        total_price: parseFloat(total_price),
        payment_status: "pending",
        confirmed: false,
        cancelled: false,
      })
      .select("id, property_name, checkin, checkout, total_price, payment_status")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ message: "Reservation created successfully", reservation: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
