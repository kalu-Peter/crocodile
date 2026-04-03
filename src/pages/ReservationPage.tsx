import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { VILLAS, getVillaPrice } from "../types";
import { useCurrency } from "../context/CurrencyContext";

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );
}

const MIN_NIGHTS: Record<string, number> = {
  "gold-lodge": 2,
  "blue-villa": 5,
  "green-villa": 5,
  "apartment-1": 5,
  "mango-park-bungalow": 5,
  "mango-park-1st-floor": 5,
};

function getMinNights(villaId: string) {
  return MIN_NIGHTS[villaId] ?? 1;
}

function minCheckout(checkin: string, villaId: string) {
  if (!checkin) return "";
  const d = new Date(checkin);
  d.setDate(d.getDate() + getMinNights(villaId));
  return d.toISOString().split("T")[0];
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type PesapalStatus = "idle" | "initiating" | "checking" | "success" | "failed";

const STORAGE_KEY = "pesapal_pending_booking";

const ReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { formatPrice } = useCurrency();

  const villaId = queryParams.get("villaId") ?? "";
  const villa = VILLAS.find((v) => v.id === villaId);

  const [checkin, setCheckin] = useState(
    queryParams.get("checkin") ?? queryParams.get("checkIn") ?? "",
  );
  const [checkout, setCheckout] = useState(
    queryParams.get("checkout") ?? queryParams.get("checkOut") ?? "",
  );
  const [guestCount, setGuestCount] = useState(
    Number(queryParams.get("guestCount") ?? 1),
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");

  // PesaPal state
  const [pesapalStatus, setPesapalStatus] = useState<PesapalStatus>("idle");
  const [pesapalMessage, setPesapalMessage] = useState("");

  // Seasonal price
  const [seasonalPrice, setSeasonalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!villaId) navigate("/");
  }, [villaId, navigate]);

  if (!villa) return null;

  const minNights = getMinNights(villa.id);
  const basePricePerNight = getVillaPrice(villa.id, guestCount) ?? 0;
  const pricePerNight = seasonalPrice ?? basePricePerNight;
  const nights = nightsBetween(checkin, checkout);
  const accommodationTotal = pricePerNight * nights;
  const laundryFee = nights > 0 ? Math.ceil(nights / 3) * 600 : 0;
  const acFee = nights > 0 ? nights * 1000 * (villa.bedrooms ?? 1) : 0;
  const total = accommodationTotal + laundryFee + acFee;

  useEffect(() => {
    if (!checkin || !villa) {
      setSeasonalPrice(null);
      return;
    }
    fetch(`/api/seasonal-price?villaId=${encodeURIComponent(villa.id)}&checkin=${checkin}`)
      .then((r) => r.json())
      .then((data) => setSeasonalPrice(data.price ?? null))
      .catch(() => setSeasonalPrice(null));
  }, [checkin, villa]);

  // On mount: check if returning from PesaPal callback
  useEffect(() => {
    const orderTrackingId = queryParams.get("OrderTrackingId");
    if (!orderTrackingId) return;

    const pending = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as {
      firstName?: string; lastName?: string; email?: string; phone?: string;
    };
    if (pending.firstName) {
      setFormData({
        firstName: pending.firstName ?? "",
        lastName:  pending.lastName  ?? "",
        email:     pending.email     ?? "",
        phone:     pending.phone     ?? "",
      });
    }

    setPesapalStatus("checking");
    setPesapalMessage("Verifying your payment, please wait...");

    fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pesapal-status", orderTrackingId }),
    })
      .then((r) => r.json())
      .then(async (data: { status: string; transactionId?: string }) => {
        if (data.status === "success") {
          setPesapalStatus("success");
          setPesapalMessage("Payment confirmed!");
          sessionStorage.removeItem(STORAGE_KEY);
          await createReservation(
            "pesapal",
            data.transactionId ?? orderTrackingId,
            pending,
          );
        } else if (data.status === "failed") {
          setPesapalStatus("failed");
          setPesapalMessage("Payment was not successful. Please try again.");
        } else {
          setPesapalStatus("failed");
          setPesapalMessage("Payment could not be verified. Please contact us if your money was deducted.");
        }
      })
      .catch(() => {
        setPesapalStatus("failed");
        setPesapalMessage("Network error while verifying payment. Please contact us.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    if (!checkin || !checkout || nights <= 0) {
      alert("Please select valid check-in and check-out dates.");
      return false;
    }
    if (nights < minNights) {
      alert(`${villa.name} requires a minimum stay of ${minNights} nights.`);
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please enter your full name.");
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email.");
      return false;
    }
    if (!formData.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }
    return true;
  };

  const createReservation = async (
    method: string,
    transactionId?: string,
    overrideForm?: { firstName?: string; lastName?: string; email?: string; phone?: string },
  ) => {
    const fd = overrideForm ?? formData;
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_name: villa.name,
        guests: guestCount,
        checkin,
        checkout,
        name: `${fd.firstName} ${fd.lastName}`,
        phone: fd.phone,
        email: fd.email,
        total_price: total,
        laundry_fee: laundryFee,
        ac_fee: acFee,
        payment_method: method,
        payment_transaction_id: transactionId ?? null,
      }),
    });
    const data = (await res.json()) as { reservation?: { id: string }; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not save reservation");
    setConfirmationId(data.reservation?.id ?? "");
    setBookingConfirmed(true);
  };

  const handlePesapalPay = async () => {
    if (!validateForm()) return;

    setPesapalStatus("initiating");
    setPesapalMessage("Connecting to PesaPal...");

    // Save form data to sessionStorage before redirect
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

    // Build callback URL (current page URL — PesaPal appends its params)
    const callbackUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pesapal-initiate",
          amount: total,
          description: `${villa.name} – ${nights} night${nights !== 1 ? "s" : ""}`,
          email: formData.email,
          phone: `+254${formData.phone.replace(/\D/g, "")}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          callbackUrl,
        }),
      });

      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setPesapalStatus("failed");
        setPesapalMessage(data.error ?? "Failed to connect to PesaPal. Please try again.");
        return;
      }

      // Redirect to PesaPal hosted payment page
      window.location.href = data.redirectUrl;
    } catch {
      setPesapalStatus("failed");
      setPesapalMessage("Network error. Please try again.");
    }
  };

  if (bookingConfirmed) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&family=Cormorant+Garamond:wght@300;400&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Cormorant Garamond',serif; background:#fff; color:#0a0a0a; }
          .confirm-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:60px 20px; }
          .confirm-box { max-width:500px; width:100%; text-align:center; }
          .confirm-icon { width:64px; height:64px; border-radius:50%; background:#0a0a0a; color:#fff; font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 28px; }
          .confirm-box h1 { font-family:'Playfair Display',serif; font-size:2rem; margin-bottom:10px; }
          .confirm-box p { color:rgba(10,10,10,0.6); font-size:1.05rem; line-height:1.7; margin-bottom:28px; }
          .confirm-id { font-family:'Inter',sans-serif; font-size:0.7rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:36px; }
          .btn-home { display:inline-block; padding:14px 36px; background:#0a0a0a; color:#fff; font-family:'Inter',sans-serif; font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; border:none; border-radius:4px; cursor:pointer; text-decoration:none; }
        `}</style>
        <div className="confirm-wrap">
          <div className="confirm-box">
            <div className="confirm-icon">✓</div>
            <h1>Booking Confirmed</h1>
            <p>
              Thank you, <strong>{formData.firstName}</strong>! Your reservation
              at <strong>{villa.name}</strong> has been received. We'll be in
              touch shortly.
            </p>
            {confirmationId && (
              <div className="confirm-id">
                Confirmation # RES-{confirmationId.substring(0, 8).toUpperCase()}
              </div>
            )}
            <button className="btn-home" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:wght@300;400&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cormorant Garamond',serif; background:#f5f6fa; color:#1a1a2e; }

        .rp-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:22px 60px; display:flex; align-items:center; gap:20px; background:rgba(201,168,76,0.95); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,0.18); box-shadow:0 2px 16px rgba(0,0,0,0.08); }
        .rp-nav-logo { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:#fff; text-decoration:none; }
        .rp-nav-logo span { color:rgba(255,255,255,0.65); }
        .rp-nav-back { font-family:'Inter',sans-serif; font-size:0.72rem; font-weight:500; color:rgba(255,255,255,0.6); text-decoration:none; display:flex; align-items:center; gap:6px; transition:color 0.2s; margin-left:auto; }
        .rp-nav-back:hover { color:#fff; }

        .rp-wrap { max-width:1140px; margin:0 auto; padding:110px 40px 80px; display:grid; grid-template-columns:1fr 400px; gap:64px; align-items:start; }

        .rp-left h1 { font-family:'Playfair Display',serif; font-size:2rem; font-weight:700; margin-bottom:32px; color:#1a1a2e; }
        .rp-section { margin-bottom:32px; padding-bottom:32px; border-bottom:1px solid #eef0f4; }
        .rp-section:last-of-type { border-bottom:none; }
        .rp-section-title { font-family:'Inter',sans-serif; font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9098a9; margin-bottom:18px; }
        .rp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .rp-field { margin-bottom:14px; }
        .rp-field label { display:block; font-family:'Inter',sans-serif; font-size:0.65rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#9098a9; margin-bottom:7px; }
        .rp-field input { width:100%; padding:12px 14px; background:#fff; border:1.5px solid #e5e7eb; border-radius:10px; font-family:'Cormorant Garamond',serif; font-size:1rem; color:#1a1a2e; outline:none; transition:border-color 0.18s, box-shadow 0.18s; }
        .rp-field input:focus { border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,0.12); background:#fff; }
        .rp-field input::placeholder { color:#c4c9d4; }
        .rp-phone-wrap { display:flex; }
        .rp-phone-prefix { padding:12px 14px; background:#f5f6fa; border:1.5px solid #e5e7eb; border-right:none; border-radius:10px 0 0 10px; font-family:'Inter',sans-serif; font-size:0.8rem; font-weight:500; color:#6b7280; white-space:nowrap; }
        .rp-phone-wrap input { border-radius:0 10px 10px 0; }

        /* PesaPal payment */
        .pesapal-note { font-family:'Inter',sans-serif; font-size:0.88rem; color:#6b7280; margin-bottom:20px; line-height:1.6; }
        .pesapal-methods { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
        .pesapal-method-pill { display:flex; align-items:center; gap:6px; padding:6px 12px; background:#f5f6fa; border:1px solid #e5e7eb; border-radius:20px; font-family:'Inter',sans-serif; font-size:0.72rem; font-weight:500; color:#6b7280; }

        .pesapal-status { padding:13px 16px; border-radius:10px; font-family:'Inter',sans-serif; font-size:0.78rem; font-weight:500; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
        .pesapal-status.initiating { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
        .pesapal-status.checking   { background:#fef3c7; color:#92400e; border:1px solid #fde68a; }
        .pesapal-status.success    { background:#d1fae5; color:#065f46; border:1px solid #a7f3d0; }
        .pesapal-status.failed     { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
        .pesapal-spinner { width:14px; height:14px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .btn-pesapal { width:100%; padding:16px; background:#1a1a2e; color:#fff; border:none; border-radius:10px; font-family:'Inter',sans-serif; font-size:0.82rem; font-weight:600; letter-spacing:0.04em; cursor:pointer; transition:opacity 0.18s, transform 0.12s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .btn-pesapal:hover { opacity:0.88; transform:translateY(-1px); }
        .btn-pesapal:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .btn-pesapal-logo { font-size:1.1rem; }

        /* Summary */
        .rp-summary { position:sticky; top:110px; background:#fff; border:1px solid #eef0f4; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); }
        .rp-summary-img { width:100%; height:200px; object-fit:cover; display:block; }
        .rp-summary-body { padding:24px; }
        .rp-summary-name { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; margin-bottom:18px; line-height:1.3; color:#1a1a2e; }
        .rp-trip { margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #eef0f4; }
        .rp-trip-title { font-family:'Inter',sans-serif; font-size:0.62rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#9098a9; margin-bottom:12px; }
        .rp-trip-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .rp-trip-row span:first-child { font-size:0.92rem; color:#374151; font-family:'Inter',sans-serif; font-weight:500; }
        .rp-price-title { font-family:'Inter',sans-serif; font-size:0.62rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#9098a9; margin-bottom:12px; }
        .rp-price-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.92rem; color:#6b7280; font-family:'Inter',sans-serif; }
        .rp-price-total { display:flex; justify-content:space-between; margin-top:14px; padding-top:14px; border-top:1px solid #eef0f4; font-family:'Inter',sans-serif; font-size:0.75rem; font-weight:600; color:#374151; }
        .rp-due { display:flex; justify-content:space-between; margin-top:8px; font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:#1a1a2e; }
        .rp-secure { margin-top:18px; display:flex; align-items:center; gap:8px; background:#f5f6fa; border-radius:8px; padding:10px 12px; }
        .rp-secure svg { flex-shrink:0; color:#9098a9; }
        .rp-secure p { font-size:0.75rem; font-family:'Inter',sans-serif; color:#9098a9; line-height:1.5; }

        @media(max-width:900px) { .rp-wrap { grid-template-columns:1fr; gap:40px; padding:90px 20px 60px; } .rp-summary { position:static; } }
        @media(max-width:600px) { .rp-row { grid-template-columns:1fr; } .rp-nav { padding:18px 20px; } }
      `}</style>

      <nav className="rp-nav">
        <Link to="/" className="rp-nav-logo">
          Croc<span>odile</span> Lodge
        </Link>
      </nav>

      <div className="rp-wrap">
        <div className="rp-left">
          <h1>Finalize your booking</h1>

          {/* Trip details */}
          <div className="rp-section">
            <div className="rp-section-title">Trip details</div>
            <div className="rp-row">
              <div className="rp-field">
                <label>Check In</label>
                <input
                  type="date"
                  value={checkin}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setCheckin(e.target.value);
                    if (checkout && nightsBetween(e.target.value, checkout) < minNights) {
                      setCheckout(minCheckout(e.target.value, villa.id));
                    }
                  }}
                />
              </div>
              <div className="rp-field">
                <label>Check Out {minNights > 1 && <span style={{ color: "#888", fontSize: "0.75em" }}>({minNights}-night min)</span>}</label>
                <input
                  type="date"
                  value={checkout}
                  min={minCheckout(checkin, villa.id)}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>
            </div>
            <div className="rp-field">
              <label>Guests</label>
              <div style={{ display:"flex", alignItems:"center", border:"1px solid rgba(0,0,0,0.15)", borderRadius:6, overflow:"hidden", background:"#fafafa" }}>
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                  disabled={guestCount <= 1}
                  style={{ width:44, height:44, background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#0a0a0a" }}
                >−</button>
                <span style={{ flex:1, textAlign:"center", fontFamily:"'Cormorant Garamond', serif", fontSize:"1rem" }}>
                  {guestCount} guest{guestCount !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.min(villa.maxGuests, g + 1))}
                  disabled={guestCount >= villa.maxGuests}
                  style={{ width:44, height:44, background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#0a0a0a" }}
                >+</button>
              </div>
            </div>
          </div>

          {/* Your details */}
          <div className="rp-section">
            <div className="rp-section-title">Your details</div>
            <div className="rp-row">
              <div className="rp-field">
                <label>First name</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" />
              </div>
              <div className="rp-field">
                <label>Last name</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" />
              </div>
            </div>
            <div className="rp-field">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" />
            </div>
            <div className="rp-field">
              <label>Phone number</label>
              <div className="rp-phone-wrap">
                <span className="rp-phone-prefix">+254</span>
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="712 345 678" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rp-section">
            <div className="rp-section-title">Payment</div>

            <p className="pesapal-note">
              Pay securely via PesaPal — accepts M-Pesa, Visa, Mastercard, and more.
              You'll be redirected to complete payment of <strong>{formatPrice(total)}</strong>.
            </p>

            <div className="pesapal-methods">
              <span className="pesapal-method-pill">📱 M-Pesa</span>
              <span className="pesapal-method-pill">💳 Visa</span>
              <span className="pesapal-method-pill">💳 Mastercard</span>
              <span className="pesapal-method-pill">🏦 Airtel Money</span>
            </div>

            {pesapalStatus !== "idle" && (
              <div className={`pesapal-status ${pesapalStatus}`}>
                {(pesapalStatus === "initiating" || pesapalStatus === "checking") && (
                  <span className="pesapal-spinner" />
                )}
                {pesapalStatus === "success" && "✓"}
                {pesapalStatus === "failed"  && "✗"}
                <span>{pesapalMessage}</span>
              </div>
            )}

            <button
              type="button"
              className="btn-pesapal"
              onClick={handlePesapalPay}
              disabled={
                pesapalStatus === "initiating" ||
                pesapalStatus === "checking"   ||
                pesapalStatus === "success"    ||
                total <= 0
              }
            >
              <span className="btn-pesapal-logo">🔒</span>
              {pesapalStatus === "initiating"
                ? "Connecting to PesaPal..."
                : pesapalStatus === "checking"
                ? "Verifying payment..."
                : `Pay ${formatPrice(total)} with PesaPal`}
            </button>
          </div>
        </div>

        {/* Right summary */}
        <div className="rp-summary">
          <img src={villa.image} alt={villa.name} className="rp-summary-img" />
          <div className="rp-summary-body">
            <div className="rp-summary-name">{villa.name}</div>

            <div className="rp-trip">
              <div className="rp-trip-title">Trip details</div>
              <div className="rp-trip-row">
                <span>
                  {checkin && checkout
                    ? `${formatDate(checkin)} – ${formatDate(checkout)}`
                    : "—"}
                </span>
              </div>
              <div className="rp-trip-row">
                <span>{guestCount} guest{guestCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div>
              <div className="rp-price-title">Price details</div>
              <div className="rp-price-row">
                <span>{formatPrice(pricePerNight)} × {nights} night{nights !== 1 ? "s" : ""}</span>
                <span>{formatPrice(accommodationTotal)}</span>
              </div>
              {nights > 0 && (
                <>
                  <div className="rp-price-row">
                    <span>Laundry ({Math.ceil(nights / 3)} week{Math.ceil(nights / 3) !== 1 ? "s" : ""})</span>
                    <span>{formatPrice(laundryFee)}</span>
                  </div>
                  <div className="rp-price-row">
                    <span>AC ({villa.bedrooms ?? 1} room{(villa.bedrooms ?? 1) > 1 ? "s" : ""} × {nights} night{nights !== 1 ? "s" : ""})</span>
                    <span>{formatPrice(acFee)}</span>
                  </div>
                </>
              )}
              <div className="rp-price-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="rp-due">
                <span>Due today</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="rp-secure">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p>Payments processed securely via PesaPal</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReservationPage;
