import supabase from "./_lib/supabase.js";
import { cors, sendEmail } from "./_lib/helpers.js";

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

    const nights = Math.round((checkoutDate - checkinDate) / 86400000);
    const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });

    // ── Guest confirmation email ───────────────────────────────────────────
    await sendEmail({
      to: email.trim().toLowerCase(),
      subject: `Booking Request Received – ${property_name} | Crocodile Lodge`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <div style="background:#0a0a0a;padding:32px 40px;">
            <h1 style="font-family:Georgia,serif;color:#f0f0f0;font-size:1.4rem;margin:0;letter-spacing:0.04em;">
              Crocodile Lodge
            </h1>
            <p style="color:#909090;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;margin:6px 0 0;">
              Diani Beach, Kenya
            </p>
          </div>
          <div style="padding:40px;">
            <p style="font-size:1rem;margin-bottom:8px;">Dear ${name.trim()},</p>
            <p style="color:#555;line-height:1.7;margin-bottom:28px;">
              Thank you for choosing Crocodile Lodge. We have received your booking request and our team will confirm it shortly.
            </p>
            <div style="background:#f9f9f9;border:1px solid #e8e8e8;padding:24px;margin-bottom:28px;">
              <h2 style="font-size:0.7rem;letter-spacing:0.25em;text-transform:uppercase;color:#aaa;margin:0 0 18px;">Booking Summary</h2>
              <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <tr><td style="padding:6px 0;color:#888;width:40%;">Property</td><td style="font-weight:bold;">${property_name}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Check-in</td><td>${fmtDate(checkin)}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Check-out</td><td>${fmtDate(checkout)}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Nights</td><td>${nights}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Guests</td><td>${guestCount}</td></tr>
                <tr style="border-top:1px solid #e8e8e8;">
                  <td style="padding:12px 0 6px;color:#888;">Total</td>
                  <td style="padding:12px 0 6px;font-weight:bold;font-size:1.1rem;">Ksh ${Number(total_price).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            <p style="color:#555;font-size:0.85rem;line-height:1.7;">
              For inquiries, contact us at <a href="mailto:info@crocodilelodge.co.ke" style="color:#0a0a0a;">info@crocodilelodge.co.ke</a>
            </p>
          </div>
          <div style="background:#f9f9f9;border-top:1px solid #e8e8e8;padding:20px 40px;text-align:center;">
            <p style="font-size:0.72rem;color:#aaa;letter-spacing:0.1em;">Crocodile Lodge · Diani Beach, Kwale County, Kenya</p>
          </div>
        </div>
      `,
    });

    // ── Admin notification email ───────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Booking – ${property_name} (${fmtDate(checkin)} → ${fmtDate(checkout)})`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
            <div style="background:#0a0a0a;padding:24px 32px;">
              <h1 style="font-family:Georgia,serif;color:#f0f0f0;font-size:1.1rem;margin:0;">New Booking Request</h1>
            </div>
            <div style="padding:32px;">
              <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <tr><td style="padding:6px 0;color:#888;width:35%;">Property</td><td style="font-weight:bold;">${property_name}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Guest</td><td>${name.trim()}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Email</td><td>${email.trim().toLowerCase()}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Phone</td><td>${phone.trim()}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Check-in</td><td>${fmtDate(checkin)}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Check-out</td><td>${fmtDate(checkout)}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Nights</td><td>${nights}</td></tr>
                <tr><td style="padding:6px 0;color:#888;">Guests</td><td>${guestCount}</td></tr>
                <tr style="border-top:1px solid #e8e8e8;">
                  <td style="padding:12px 0 6px;color:#888;">Total</td>
                  <td style="padding:12px 0 6px;font-weight:bold;font-size:1.1rem;">Ksh ${Number(total_price).toLocaleString()}</td>
                </tr>
              </table>
              <a href="https://crocodilelodge.co.ke/crocodile-admin/dashboard" style="display:inline-block;margin-top:24px;background:#0a0a0a;color:#fff;padding:12px 28px;text-decoration:none;font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;">
                View in Dashboard →
              </a>
            </div>
          </div>
        `,
      });
    }

    return res.status(201).json({ message: "Reservation created successfully", reservation: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
