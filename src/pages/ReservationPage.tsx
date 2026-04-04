import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { VILLAS, getVillaPrice } from "../types";
import { useCurrency } from "../context/CurrencyContext";

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

const MIN_NIGHTS: Record<string, number> = {
  "gold-lodge": 2,
  "blue-villa": 5,
  "green-villa": 5,
  "apartment-1": 5,
  "mango-park-bungalow": 5,
  "mango-park-1st-floor": 5,
};

function getMinNights(villaId: string) { return MIN_NIGHTS[villaId] ?? 1; }

function minCheckout(checkin: string, villaId: string) {
  if (!checkin) return "";
  const d = new Date(checkin);
  d.setDate(d.getDate() + getMinNights(villaId));
  return d.toISOString().split("T")[0];
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

type ModalStatus = "idle" | "initiating" | "open" | "checking" | "success" | "failed";

const ReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { formatPrice, currency, rates } = useCurrency();
  const rate = rates[currency.code] ?? 1;
  const toDisplay = (kes: number) => Math.round(kes * rate * 100) / 100;
  const toKES = (display: number) => Math.round(display / rate);

  const villaId = queryParams.get("villaId") ?? "";
  const villa = VILLAS.find((v) => v.id === villaId);

  const [checkin, setCheckin] = useState(queryParams.get("checkin") ?? queryParams.get("checkIn") ?? "");
  const [checkout, setCheckout] = useState(queryParams.get("checkout") ?? queryParams.get("checkOut") ?? "");
  const [guestCount, setGuestCount] = useState(Number(queryParams.get("guestCount") ?? 1));
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");

  // Partial payment
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAmountInput, setPayAmountInput] = useState<string>("");

  // Modal / PesaPal iframe
  const [modalStatus, setModalStatus] = useState<ModalStatus>("idle");
  const [modalMessage, setModalMessage] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [, setOrderTrackingId] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Seasonal price
  const [seasonalPrice, setSeasonalPrice] = useState<number | null>(null);

  useEffect(() => { if (!villaId) navigate("/"); }, [villaId, navigate]);

  if (!villa) return null;

  const minNights   = getMinNights(villa.id);
  const pricePerNight = seasonalPrice ?? (getVillaPrice(villa.id, guestCount) ?? 0);
  const nights      = nightsBetween(checkin, checkout);
  const accommodationTotal = pricePerNight * nights;
  const laundryFee  = nights > 0 ? Math.ceil(nights / 3) * 600 : 0;
  const acFee       = nights > 0 ? nights * 1000 * (villa.bedrooms ?? 1) : 0;
  const total       = accommodationTotal + laundryFee + acFee;
  const minPay      = 1;  // no minimum enforced

  // Sync payAmount when total or currency changes
  useEffect(() => {
    if (total > 0) {
      setPayAmount(total);
      setPayAmountInput(String(toDisplay(total)));
    }
  }, [total, currency.code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!checkin || !villa) { setSeasonalPrice(null); return; }
    fetch(`/api/seasonal-price?villaId=${encodeURIComponent(villa.id)}&checkin=${checkin}`)
      .then((r) => r.json())
      .then((data) => setSeasonalPrice(data.price ?? null))
      .catch(() => setSeasonalPrice(null));
  }, [checkin, villa]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    if (!checkin || !checkout || nights <= 0) { alert("Please select valid check-in and check-out dates."); return false; }
    if (nights < minNights) { alert(`${villa.name} requires a minimum stay of ${minNights} nights.`); return false; }
    if (!formData.firstName.trim() || !formData.lastName.trim()) { alert("Please enter your full name."); return false; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { alert("Please enter a valid email."); return false; }
    if (!formData.phone.trim()) { alert("Please enter your phone number."); return false; }
    if (payAmount < 1) { alert(`Please enter a valid payment amount.`); return false; }
    if (payAmount > total) { alert(`Amount cannot exceed total of ${formatPrice(total)}.`); return false; }
    return true;
  };

  const createReservation = async (transactionId: string) => {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_name: villa.name,
        guests: guestCount,
        checkin,
        checkout,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: formData.email,
        total_price: total,
        laundry_fee: laundryFee,
        ac_fee: acFee,
        payment_method: "pesapal",
        payment_transaction_id: transactionId,
        amount_paid: payAmount,
      }),
    });
    const data = (await res.json()) as { reservation?: { id: string }; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not save reservation");
    setConfirmationId(data.reservation?.id ?? "");
    setBookingConfirmed(true);
  };

  const startPolling = (trackingId: string) => {
    let polls = 0;
    pollRef.current = setInterval(async () => {
      polls++;
      if (polls > 36) { // 3 minutes
        clearInterval(pollRef.current!);
        setModalStatus("failed");
        setModalMessage("Payment timed out. Please try again.");
        return;
      }
      try {
        const r = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pesapal-status", orderTrackingId: trackingId }),
        });
        const d = (await r.json()) as { status: string; transactionId?: string };
        if (d.status === "success") {
          clearInterval(pollRef.current!);
          setModalStatus("success");
          setModalMessage("Payment confirmed!");
          setIframeUrl("");
          await createReservation(d.transactionId ?? trackingId);
        } else if (d.status === "failed") {
          clearInterval(pollRef.current!);
          setModalStatus("failed");
          setModalMessage("Payment failed. Please try again.");
          setIframeUrl("");
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const handlePay = async () => {
    if (!validateForm()) return;
    setModalStatus("initiating");
    setModalMessage("Opening payment window...");

    const callbackUrl = `${window.location.origin}/payment-callback`;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pesapal-initiate",
          amount: payAmount,
          description: `${villa.name} – ${nights} night${nights !== 1 ? "s" : ""}${payAmount < total ? " (partial)" : ""}`,
          email: formData.email,
          phone: `+254${formData.phone.replace(/\D/g, "")}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          callbackUrl,
        }),
      });

      const data = (await res.json()) as { redirectUrl?: string; orderTrackingId?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setModalStatus("failed");
        setModalMessage(data.error ?? "Failed to connect to PesaPal. Please try again.");
        return;
      }

      setIframeUrl(data.redirectUrl);
      setOrderTrackingId(data.orderTrackingId ?? "");
      setModalStatus("open");
      startPolling(data.orderTrackingId ?? "");
    } catch {
      setModalStatus("failed");
      setModalMessage("Network error. Please try again.");
    }
  };

  const closeModal = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setModalStatus("idle");
    setModalMessage("");
    setIframeUrl("");
    setOrderTrackingId("");
  };

  const isPartial = payAmount > 0 && payAmount < total;

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:wght@300;400&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cormorant Garamond',serif; background:#f5f6fa; color:#1a1a2e; }

        .rp-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:22px 60px; display:flex; align-items:center; gap:20px; background:rgba(201,168,76,0.95); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,0.18); box-shadow:0 2px 16px rgba(0,0,0,0.08); }
        .rp-nav-logo { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:#fff; text-decoration:none; }
        .rp-nav-logo span { color:rgba(255,255,255,0.65); }

        .rp-wrap { max-width:1140px; margin:0 auto; padding:110px 40px 80px; display:grid; grid-template-columns:1fr 400px; gap:64px; align-items:start; }

        .rp-left h1 { font-family:'Playfair Display',serif; font-size:2rem; font-weight:700; margin-bottom:32px; color:#1a1a2e; }
        .rp-section { margin-bottom:32px; padding-bottom:32px; border-bottom:1px solid #eef0f4; }
        .rp-section:last-of-type { border-bottom:none; }
        .rp-section-title { font-family:'Inter',sans-serif; font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9098a9; margin-bottom:18px; }
        .rp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .rp-field { margin-bottom:14px; }
        .rp-field label { display:block; font-family:'Inter',sans-serif; font-size:0.65rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#9098a9; margin-bottom:7px; }
        .rp-field input { width:100%; padding:12px 14px; background:#fff; border:1.5px solid #e5e7eb; border-radius:10px; font-family:'Cormorant Garamond',serif; font-size:1rem; color:#1a1a2e; outline:none; transition:border-color 0.18s, box-shadow 0.18s; }
        .rp-field input:focus { border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
        .rp-field input::placeholder { color:#c4c9d4; }
        .rp-phone-wrap { display:flex; }
        .rp-phone-prefix { padding:12px 14px; background:#f5f6fa; border:1.5px solid #e5e7eb; border-right:none; border-radius:10px 0 0 10px; font-family:'Inter',sans-serif; font-size:0.8rem; font-weight:500; color:#6b7280; white-space:nowrap; }
        .rp-phone-wrap input { border-radius:0 10px 10px 0; }

        /* Partial payment */
        .pay-amount-card { background:#fff; border:1.5px solid #e5e7eb; border-radius:12px; padding:20px; margin-bottom:20px; }
        .pay-amount-card .label { font-family:'Inter',sans-serif; font-size:0.65rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#9098a9; margin-bottom:12px; }
        .pay-amount-row { display:flex; align-items:center; gap:12px; }
        .pay-amount-prefix { padding:12px 14px; background:#f5f6fa; border:1.5px solid #e5e7eb; border-right:none; border-radius:10px 0 0 10px; font-family:'Inter',sans-serif; font-size:0.82rem; font-weight:600; color:#1a1a2e; white-space:nowrap; }
        .pay-amount-input { flex:1; padding:12px 14px; background:#fff; border:1.5px solid #e5e7eb; border-left:none; border-radius:0 10px 10px 0; font-family:'Inter',sans-serif; font-size:1rem; font-weight:600; color:#1a1a2e; outline:none; transition:border-color 0.18s, box-shadow 0.18s; }
        .pay-amount-input:focus { border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
        .pay-amount-hints { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
        .pay-hint-btn { padding:5px 12px; border-radius:20px; border:1.5px solid #e5e7eb; background:#f5f6fa; font-family:'Inter',sans-serif; font-size:0.72rem; font-weight:500; color:#6b7280; cursor:pointer; transition:all 0.15s; }
        .pay-hint-btn:hover, .pay-hint-btn.active { border-color:#c9a84c; background:#fffbf0; color:#c9a84c; }
        .pay-amount-note { font-family:'Inter',sans-serif; font-size:0.72rem; color:#6b7280; margin-top:10px; line-height:1.5; }
        .pay-amount-note.partial { color:#c9a84c; font-weight:500; }

        /* PesaPal */
        .pesapal-note { font-family:'Inter',sans-serif; font-size:0.88rem; color:#6b7280; margin-bottom:16px; line-height:1.6; }
        .pesapal-methods { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
        .pesapal-method-pill { display:flex; align-items:center; gap:6px; padding:5px 12px; background:#f5f6fa; border:1px solid #e5e7eb; border-radius:20px; font-family:'Inter',sans-serif; font-size:0.72rem; font-weight:500; color:#6b7280; }
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

        /* PesaPal iframe modal */
        .pp-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
        .pp-modal { background:#fff; border-radius:16px; overflow:hidden; width:100%; max-width:560px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 24px 64px rgba(0,0,0,0.3); }
        .pp-modal-head { padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #eef0f4; }
        .pp-modal-title { font-family:'Inter',sans-serif; font-size:0.82rem; font-weight:600; color:#1a1a2e; display:flex; align-items:center; gap:8px; }
        .pp-modal-close { width:32px; height:32px; border-radius:50%; border:none; background:#f5f6fa; cursor:pointer; font-size:1rem; color:#6b7280; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
        .pp-modal-close:hover { background:#eef0f4; }
        .pp-modal-body { flex:1; overflow:hidden; min-height:480px; position:relative; }
        .pp-iframe { width:100%; height:100%; min-height:480px; border:none; display:block; }
        .pp-modal-checking { position:absolute; inset:0; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; }
        .pp-modal-checking p { font-family:'Inter',sans-serif; font-size:0.88rem; color:#6b7280; }
        .pp-big-spinner { width:40px; height:40px; border:3px solid #e5e7eb; border-top-color:#c9a84c; border-radius:50%; animation:spin 0.9s linear infinite; }
        .pp-modal-note { padding:12px 20px; background:#f5f6fa; border-top:1px solid #eef0f4; font-family:'Inter',sans-serif; font-size:0.72rem; color:#9098a9; text-align:center; }

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
        .rp-due-partial { display:flex; justify-content:space-between; margin-top:4px; font-family:'Inter',sans-serif; font-size:0.75rem; color:#9098a9; }
        .rp-secure { margin-top:18px; display:flex; align-items:center; gap:8px; background:#f5f6fa; border-radius:8px; padding:10px 12px; }
        .rp-secure svg { flex-shrink:0; color:#9098a9; }
        .rp-secure p { font-size:0.75rem; font-family:'Inter',sans-serif; color:#9098a9; line-height:1.5; }

        @media(max-width:900px) { .rp-wrap { grid-template-columns:1fr; gap:40px; padding:90px 20px 60px; } .rp-summary { position:static; } }
        @media(max-width:600px) { .rp-row { grid-template-columns:1fr; } .rp-nav { padding:18px 20px; } }
      `}</style>

      {/* PesaPal iframe modal */}
      {(modalStatus === "open" || modalStatus === "checking") && (
        <div className="pp-overlay">
          <div className="pp-modal">
            <div className="pp-modal-head">
              <div className="pp-modal-title">
                🔒 Secure Payment via PesaPal
                {isPartial && <span style={{ color: "#c9a84c", fontSize: "0.72rem" }}>— Partial ({formatPrice(payAmount)})</span>}
              </div>
              <button className="pp-modal-close" onClick={closeModal} title="Close">✕</button>
            </div>
            <div className="pp-modal-body">
              {modalStatus === "open" && iframeUrl && (
                <iframe className="pp-iframe" src={iframeUrl} title="PesaPal Payment" allow="payment" />
              )}
              {modalStatus === "checking" && (
                <div className="pp-modal-checking">
                  <div className="pp-big-spinner" />
                  <p>Verifying your payment, please wait…</p>
                </div>
              )}
            </div>
            <div className="pp-modal-note">Complete your payment in the window above. Do not close this page.</div>
          </div>
        </div>
      )}

      <nav className="rp-nav">
        <Link to="/" className="rp-nav-logo">Croc<span>odile</span> Lodge</Link>
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
                <input type="date" value={checkin} min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setCheckin(e.target.value);
                    if (checkout && nightsBetween(e.target.value, checkout) < minNights)
                      setCheckout(minCheckout(e.target.value, villa.id));
                  }} />
              </div>
              <div className="rp-field">
                <label>Check Out {minNights > 1 && <span style={{ color:"#888", fontSize:"0.75em" }}>({minNights}-night min)</span>}</label>
                <input type="date" value={checkout} min={minCheckout(checkin, villa.id)} onChange={(e) => setCheckout(e.target.value)} />
              </div>
            </div>
            <div className="rp-field">
              <label>Guests</label>
              <div style={{ display:"flex", alignItems:"center", border:"1px solid rgba(0,0,0,0.15)", borderRadius:6, overflow:"hidden", background:"#fafafa" }}>
                <button type="button" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} disabled={guestCount <= 1}
                  style={{ width:44, height:44, background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#0a0a0a" }}>−</button>
                <span style={{ flex:1, textAlign:"center", fontFamily:"'Cormorant Garamond', serif", fontSize:"1rem" }}>
                  {guestCount} guest{guestCount !== 1 ? "s" : ""}
                </span>
                <button type="button" onClick={() => setGuestCount((g) => Math.min(villa.maxGuests, g + 1))} disabled={guestCount >= villa.maxGuests}
                  style={{ width:44, height:44, background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#0a0a0a" }}>+</button>
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

            {/* Amount to pay */}
            {total > 0 && (
              <div className="pay-amount-card">
                <div className="label">Amount to pay now</div>
                <div className="pay-amount-row">
                  <span className="pay-amount-prefix">{currency.symbol}</span>
                  <input
                    className="pay-amount-input"
                    type="number"
                    min={toDisplay(minPay)}
                    max={toDisplay(total)}
                    step="any"
                    value={payAmountInput}
                    onChange={(e) => {
                      setPayAmountInput(e.target.value);
                      const v = Number(e.target.value);
                      if (!isNaN(v) && v > 0) setPayAmount(toKES(v));
                    }}
                  />
                </div>
                <div className="pay-amount-hints">
                  {[
                    { label: "30%", val: Math.ceil(total * 0.3) },
                    { label: "50%", val: Math.ceil(total * 0.5) },
                    { label: "Full amount", val: total },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      type="button"
                      className={`pay-hint-btn${payAmount === val ? " active" : ""}`}
                      onClick={() => { setPayAmount(val); setPayAmountInput(String(toDisplay(val))); }}
                    >{label}</button>
                  ))}
                </div>
                <p className={`pay-amount-note${isPartial ? " partial" : ""}`}>
                  {isPartial
                    ? `Partial payment — remaining balance of ${formatPrice(total - payAmount)} due on arrival.`
                    : `You can pay any amount now and settle the balance on arrival.`}
                </p>
              </div>
            )}

            <p className="pesapal-note">
              Pay securely via PesaPal — accepts M-Pesa, Visa, Mastercard, and more.
            </p>
            <div className="pesapal-methods">
              <span className="pesapal-method-pill">📱 M-Pesa</span>
              <span className="pesapal-method-pill">💳 Visa</span>
              <span className="pesapal-method-pill">💳 Mastercard</span>
              <span className="pesapal-method-pill">🏦 Airtel Money</span>
            </div>

            {(modalStatus === "failed" || modalStatus === "success") && (
              <div className={`pesapal-status ${modalStatus}`}>
                {modalStatus === "success" ? "✓" : "✗"}
                <span>{modalMessage}</span>
              </div>
            )}

            <button
              type="button"
              className="btn-pesapal"
              onClick={handlePay}
              disabled={modalStatus === "initiating" || modalStatus === "open" || modalStatus === "checking" || modalStatus === "success" || total <= 0}
            >
              🔒{" "}
              {modalStatus === "initiating"
                ? "Opening payment window..."
                : `Pay ${payAmount > 0 ? formatPrice(payAmount) : "…"} with PesaPal`}
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
                <span>{checkin && checkout ? `${formatDate(checkin)} – ${formatDate(checkout)}` : "—"}</span>
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
                <span>Due now</span>
                <span>{payAmount > 0 ? formatPrice(payAmount) : formatPrice(total)}</span>
              </div>
              {isPartial && (
                <div className="rp-due-partial">
                  <span>Balance on arrival</span>
                  <span>{formatPrice(total - payAmount)}</span>
                </div>
              )}
            </div>
            <div className="rp-secure">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
