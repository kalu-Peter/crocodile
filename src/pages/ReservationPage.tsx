import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { VILLAS, getVillaPrice } from "../types";
import { useCurrency } from "../context/CurrencyContext";

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const ReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { formatPrice } = useCurrency();

  const villaId = queryParams.get("villaId") ?? "";

  const villa = VILLAS.find((v) => v.id === villaId);

  const [checkin, setCheckin] = useState(queryParams.get("checkIn") ?? "");
  const [checkout, setCheckout] = useState(queryParams.get("checkOut") ?? "");
  const [guestCount, setGuestCount] = useState(Number(queryParams.get("guestCount") ?? 1));
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", billingAddress: "", city: "",
    zipCode: "", country: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");

  useEffect(() => {
    if (!villaId) navigate("/");
  }, [villaId, navigate]);

  if (!villa) return null;

  const pricePerNight = getVillaPrice(villa.id, guestCount) ?? 0;
  const nights = nightsBetween(checkin, checkout);
  const total = pricePerNight * nights;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkin || !checkout || nights <= 0) { alert("Please select valid check-in and check-out dates."); return; }
    if (!formData.firstName.trim() || !formData.lastName.trim()) { alert("Please enter your full name."); return; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { alert("Please enter a valid email."); return; }
    if (!formData.phone.trim()) { alert("Please enter your phone number."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_name: villa.name,
          guests: guestCount,
          checkin: checkin,
          checkout: checkout,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          email: formData.email,
          total_price: total,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not save reservation. Please contact us."); return; }
      setConfirmationId(data.reservation?.id ?? "");
      setBookingConfirmed(true);
    } catch {
      alert("Network error. Please contact us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingConfirmed) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@200;300;400&family=Cormorant+Garamond:wght@300;400&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Cormorant Garamond',serif; background:#fff; color:#0a0a0a; }
          .confirm-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:60px 20px; }
          .confirm-box { max-width:500px; width:100%; text-align:center; }
          .confirm-icon { width:64px; height:64px; border-radius:50%; background:#0a0a0a; color:#fff; font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 28px; }
          .confirm-box h1 { font-family:'Playfair Display',serif; font-size:2rem; margin-bottom:10px; }
          .confirm-box p { color:rgba(10,10,10,0.6); font-size:1.05rem; line-height:1.7; margin-bottom:28px; }
          .confirm-id { font-family:'Josefin Sans',sans-serif; font-size:0.7rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:36px; }
          .btn-home { display:inline-block; padding:14px 36px; background:#0a0a0a; color:#fff; font-family:'Josefin Sans',sans-serif; font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; border:none; border-radius:4px; cursor:pointer; text-decoration:none; }
        `}</style>
        <div className="confirm-wrap">
          <div className="confirm-box">
            <div className="confirm-icon">✓</div>
            <h1>Booking Confirmed</h1>
            <p>Thank you, <strong>{formData.firstName}</strong>! Your reservation at <strong>{villa.name}</strong> has been received. We'll be in touch shortly.</p>
            {confirmationId && <div className="confirm-id">Confirmation # RES-{confirmationId.substring(0, 8).toUpperCase()}</div>}
            <button className="btn-home" onClick={() => navigate("/")}>Back to Home</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@200;300;400&family=Cormorant+Garamond:wght@300;400&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cormorant Garamond',serif; background:#fff; color:#0a0a0a; }

        .rp-nav {
          position:fixed; top:0; left:0; right:0; z-index:100;
          padding:22px 60px; display:flex; align-items:center; gap:20px;
          background:#fff; border-bottom:1px solid rgba(0,0,0,0.08);
        }
        .rp-nav-logo { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:#0a0a0a; text-decoration:none; }
        .rp-nav-logo span { color:#909090; }
        .rp-nav-back { font-family:'Josefin Sans',sans-serif; font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:rgba(10,10,10,0.4); text-decoration:none; display:flex; align-items:center; gap:6px; transition:color 0.2s; margin-left:auto; }
        .rp-nav-back:hover { color:#0a0a0a; }

        .rp-wrap { max-width:1140px; margin:0 auto; padding:110px 40px 80px; display:grid; grid-template-columns:1fr 400px; gap:72px; align-items:start; }

        /* ── LEFT ── */
        .rp-left h1 { font-family:'Playfair Display',serif; font-size:2rem; font-weight:700; margin-bottom:36px; }

        .rp-section { margin-bottom:36px; padding-bottom:36px; border-bottom:1px solid rgba(0,0,0,0.08); }
        .rp-section:last-of-type { border-bottom:none; }
        .rp-section-title { font-family:'Josefin Sans',sans-serif; font-size:0.65rem; letter-spacing:0.22em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:18px; }

        .rp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .rp-field { margin-bottom:14px; }
        .rp-field label { display:block; font-family:'Josefin Sans',sans-serif; font-size:0.6rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.45); margin-bottom:7px; }
        .rp-field input, .rp-field select {
          width:100%; padding:12px 14px;
          background:#fafafa; border:1px solid rgba(0,0,0,0.15); border-radius:6px;
          font-family:'Cormorant Garamond',serif; font-size:1rem; color:#0a0a0a;
          outline:none; transition:border-color 0.2s;
          appearance:none;
        }
        .rp-field input:focus, .rp-field select:focus { border-color:#0a0a0a; background:#fff; }
        .rp-field input::placeholder { color:rgba(10,10,10,0.3); }

        .rp-phone-wrap { display:flex; }
        .rp-phone-prefix {
          padding:12px 14px; background:#f0f0f0; border:1px solid rgba(0,0,0,0.15);
          border-right:none; border-radius:6px 0 0 6px;
          font-family:'Josefin Sans',sans-serif; font-size:0.75rem; color:#0a0a0a;
          white-space:nowrap;
        }
        .rp-phone-wrap input { border-radius:0 6px 6px 0; }

        /* enhance */
        .rp-enhance-item { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border:1px solid rgba(0,0,0,0.12); border-radius:8px; }
        .rp-enhance-info h4 { font-family:'Josefin Sans',sans-serif; font-size:0.78rem; letter-spacing:0.04em; margin-bottom:4px; }
        .rp-enhance-info span { font-size:0.85rem; color:rgba(10,10,10,0.5); }
        .rp-enhance-btn {
          padding:8px 18px; border:1px solid #0a0a0a; border-radius:20px;
          background:transparent; font-family:'Josefin Sans',sans-serif; font-size:0.65rem;
          letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; white-space:nowrap;
        }
        .rp-enhance-btn.added { background:#0a0a0a; color:#fff; }

        /* special requests */
        .rp-textarea {
          width:100%; padding:12px 14px; background:#fafafa; border:1px solid rgba(0,0,0,0.15);
          border-radius:6px; font-family:'Cormorant Garamond',serif; font-size:1rem; color:#0a0a0a;
          outline:none; resize:vertical; min-height:100px; transition:border-color 0.2s;
        }
        .rp-textarea:focus { border-color:#0a0a0a; background:#fff; }
        .rp-textarea::placeholder { color:rgba(10,10,10,0.3); }

        /* terms + submit */
        .rp-terms { display:flex; align-items:flex-start; gap:12px; margin-bottom:24px; cursor:pointer; }
        .rp-terms input[type=checkbox] { margin-top:3px; accent-color:#0a0a0a; width:15px; height:15px; flex-shrink:0; cursor:pointer; }
        .rp-terms p { font-size:0.9rem; color:rgba(10,10,10,0.6); line-height:1.6; }
        .rp-terms a { color:#0a0a0a; }

        .btn-reserve {
          width:100%; padding:16px; background:#0a0a0a; color:#fff; border:none; border-radius:6px;
          font-family:'Josefin Sans',sans-serif; font-size:0.75rem; letter-spacing:0.18em;
          text-transform:uppercase; cursor:pointer; transition:opacity 0.2s;
        }
        .btn-reserve:hover { opacity:0.85; }
        .btn-reserve:disabled { opacity:0.5; cursor:not-allowed; }

        /* ── RIGHT — summary ── */
        .rp-summary {
          position:sticky; top:110px;
          border:1px solid rgba(0,0,0,0.12); border-radius:12px; overflow:hidden;
          box-shadow:0 4px 24px rgba(0,0,0,0.06);
        }
        .rp-summary-img { width:100%; height:200px; object-fit:cover; display:block; }
        .rp-summary-body { padding:24px; }
        .rp-summary-name { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; margin-bottom:18px; line-height:1.3; }

        .rp-policy { margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid rgba(0,0,0,0.08); }
        .rp-policy-title { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:10px; }
        .rp-policy-item { font-size:0.88rem; color:rgba(10,10,10,0.65); line-height:1.6; padding-left:10px; border-left:2px solid rgba(0,0,0,0.1); margin-bottom:4px; }

        .rp-trip { margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid rgba(0,0,0,0.08); }
        .rp-trip-title { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:12px; }
        .rp-trip-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .rp-trip-row span:first-child { font-size:0.92rem; color:#0a0a0a; }
        .rp-trip-edit { font-family:'Josefin Sans',sans-serif; font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:rgba(10,10,10,0.4); text-decoration:underline; cursor:pointer; background:none; border:none; }

        .rp-price-title { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:12px; }
        .rp-price-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem; color:rgba(10,10,10,0.75); }
        .rp-price-total { display:flex; justify-content:space-between; margin-top:14px; padding-top:14px; border-top:1px solid rgba(0,0,0,0.1); font-family:'Josefin Sans',sans-serif; font-size:0.75rem; letter-spacing:0.06em; font-weight:400; }
        .rp-due { display:flex; justify-content:space-between; margin-top:8px; font-family:'Playfair Display',serif; font-size:1.05rem; font-weight:700; }

        .rp-coupon { margin-top:16px; padding-top:16px; border-top:1px solid rgba(0,0,0,0.08); display:flex; gap:8px; }
        .rp-coupon input { flex:1; padding:10px 12px; background:#fafafa; border:1px solid rgba(0,0,0,0.15); border-radius:5px; font-family:'Cormorant Garamond',serif; font-size:0.95rem; outline:none; }
        .rp-coupon button { padding:10px 16px; background:transparent; border:1px solid #0a0a0a; border-radius:5px; font-family:'Josefin Sans',sans-serif; font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; white-space:nowrap; }

        .rp-secure { margin-top:18px; display:flex; align-items:center; gap:8px; }
        .rp-secure svg { flex-shrink:0; color:#0a0a0a; opacity:0.4; }
        .rp-secure p { font-size:0.8rem; color:rgba(10,10,10,0.45); line-height:1.5; }

        @media(max-width:900px) {
          .rp-wrap { grid-template-columns:1fr; gap:40px; padding:90px 20px 60px; }
          .rp-summary { position:static; }
        }
        @media(max-width:600px) {
          .rp-row { grid-template-columns:1fr; }
          .rp-nav { padding:18px 20px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="rp-nav">
        <Link to="/" className="rp-nav-logo">Croc<span>odile</span> Lodge</Link>
        <Link to={`/villa/${villaId}`} className="rp-nav-back">← Back to villa</Link>
      </nav>

      <div className="rp-wrap">

        {/* ── LEFT FORM ── */}
        <div className="rp-left">
          <h1>Finalize your booking</h1>

          <form onSubmit={handleSubmit}>

            {/* Trip details */}
            <div className="rp-section">
              <div className="rp-section-title">Trip details</div>
              <div className="rp-row">
                <div className="rp-field">
                  <label>Check In</label>
                  <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} required />
                </div>
                <div className="rp-field">
                  <label>Check Out</label>
                  <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} required />
                </div>
              </div>
              <div className="rp-field">
                <label>Guests</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 6, overflow: "hidden", background: "#fafafa" }}>
                  <button type="button" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} disabled={guestCount <= 1} style={{ width: 44, height: 44, background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#0a0a0a" }}>−</button>
                  <span style={{ flex: 1, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>{guestCount} guest{guestCount !== 1 ? "s" : ""}</span>
                  <button type="button" onClick={() => setGuestCount((g) => Math.min(villa.maxGuests, g + 1))} disabled={guestCount >= villa.maxGuests} style={{ width: 44, height: 44, background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#0a0a0a" }}>+</button>
                </div>
              </div>
            </div>

            {/* Enter your details */}
            <div className="rp-section">
              <div className="rp-section-title">Enter your details</div>
              <div className="rp-row">
                <div className="rp-field">
                  <label>First name</label>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" required />
                </div>
                <div className="rp-field">
                  <label>Last name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" required />
                </div>
              </div>
              <div className="rp-field">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
              </div>
              <div className="rp-field">
                <label>Phone number</label>
                <div className="rp-phone-wrap">
                  <span className="rp-phone-prefix">+254</span>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="712 345 678" required />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="rp-section">
              <div className="rp-section-title">Payment Information</div>
              <div className="rp-section-title" style={{ marginTop: -8, marginBottom: 14, opacity: 0.7 }}>Billing Address</div>
              <div className="rp-field">
                <label>Billing Address</label>
                <input name="billingAddress" value={formData.billingAddress} onChange={handleChange} placeholder="Billing Address" />
              </div>
              <div className="rp-row">
                <div className="rp-field">
                  <label>City</label>
                  <input name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                </div>
                <div className="rp-field">
                  <label>Zip code</label>
                  <input name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Zip code" />
                </div>
              </div>
              <div className="rp-field">
                <label>Country</label>
                <input name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
              </div>
            </div>


            <button type="submit" className="btn-reserve" disabled={submitting}>
              {submitting ? "Reserving..." : "Reserve Now"}
            </button>

          </form>
        </div>

        {/* ── RIGHT SUMMARY ── */}
        <div className="rp-summary">
          <img src={villa.image} alt={villa.name} className="rp-summary-img" />
          <div className="rp-summary-body">
            <div className="rp-summary-name">{villa.name}</div>

            {/* Trip details */}
            <div className="rp-trip">
              <div className="rp-trip-title">Trip details</div>
              <div className="rp-trip-row">
                <span>{checkin && checkout ? `${formatDate(checkin)} – ${formatDate(checkout)}` : "—"}</span>
              </div>
              <div className="rp-trip-row">
                <span>{guestCount} guest{guestCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Price details */}
            <div>
              <div className="rp-price-title">Price details</div>
              <div className="rp-price-row">
                <span>{formatPrice(pricePerNight)} × {nights} night{nights !== 1 ? "s" : ""}</span>
                <span>{formatPrice(total)}</span>
              </div>
<div className="rp-price-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="rp-due">
                <span>Due today</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Secure */}
            <div className="rp-secure">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p>Your payment is 100% secure using SSL encryption</p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default ReservationPage;
