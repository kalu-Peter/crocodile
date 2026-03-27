import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { VILLAS, getVillaPrice } from "../types";
import { useCurrency } from "../context/CurrencyContext";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (selector: string) => void;
      };
    };
  }
}

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type MpesaStatus = "idle" | "pending" | "polling" | "success" | "failed";

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

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paypal">(
    "mpesa",
  );
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>("idle");
  const [mpesaMessage, setMpesaMessage] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Seasonal price
  const [seasonalPrice, setSeasonalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!villaId) navigate("/");
  }, [villaId, navigate]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (!villa) return null;

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
    fetch(
      `/api/seasonal-price?villaId=${encodeURIComponent(villa.id)}&checkin=${checkin}`,
    )
      .then((r) => r.json())
      .then((data) => setSeasonalPrice(data.price ?? null))
      .catch(() => setSeasonalPrice(null));
  }, [checkin, villa]);

  // Re-render PayPal buttons when method or total changes
  useEffect(() => {
    if (paymentMethod !== "paypal") return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) return;

    const renderButtons = () => {
      const container = document.getElementById("paypal-btn-container");
      if (!container || !window.paypal) return;
      container.innerHTML = "";
      window.paypal
        .Buttons({
          createOrder: async () => {
            if (!validateForm())
              throw new Error("Please fill in all required fields.");
            const res = await fetch("/api/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "paypal-create",
                amountKES: total,
                description: `${villa.name} – ${nights} nights`,
              }),
            });
            const data = (await res.json()) as {
              orderId?: string;
              error?: string;
            };
            if (!res.ok) throw new Error(data.error ?? "PayPal order failed");
            return data.orderId;
          },
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch("/api/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "paypal-capture",
                orderId: data.orderID,
              }),
            });
            const result = (await res.json()) as {
              success?: boolean;
              transactionId?: string;
              error?: string;
            };
            if (result.success) {
              await createReservation("paypal", result.transactionId);
            } else {
              alert(result.error ?? "PayPal capture failed. Please try again.");
            }
          },
          onError: () => {
            alert("PayPal encountered an error. Please try again.");
          },
        })
        .render("#paypal-btn-container");
    };

    if (window.paypal) {
      renderButtons();
      return;
    }

    const existing = document.getElementById("paypal-sdk-script");
    if (existing) {
      existing.addEventListener("load", renderButtons, { once: true });
      return () => existing.removeEventListener("load", renderButtons);
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk-script";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.addEventListener("load", renderButtons, { once: true });
    document.head.appendChild(script);
    return () => script.removeEventListener("load", renderButtons);
  }, [paymentMethod, total]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    if (!checkin || !checkout || nights <= 0) {
      alert("Please select valid check-in and check-out dates.");
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please enter your full name.");
      return false;
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      alert("Please enter a valid email.");
      return false;
    }
    if (!formData.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }
    return true;
  };

  const createReservation = async (method: string, transactionId?: string) => {
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
        payment_method: method,
        payment_transaction_id: transactionId ?? null,
      }),
    });
    const data = (await res.json()) as {
      reservation?: { id: string };
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Could not save reservation");
    setConfirmationId(data.reservation?.id ?? "");
    setBookingConfirmed(true);
  };

  const handleMpesaPay = async () => {
    if (!validateForm()) return;
    const phone = mpesaPhone.trim() || formData.phone.trim();
    if (!phone) {
      alert("Please enter an M-Pesa phone number.");
      return;
    }

    setMpesaStatus("pending");
    setMpesaMessage("Sending STK Push to your phone...");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mpesa-initiate",
          phone,
          amount: total,
          reference: villa.name,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        checkoutRequestId?: string;
        error?: string;
      };

      if (!res.ok || !data.checkoutRequestId) {
        setMpesaStatus("failed");
        setMpesaMessage(data.error ?? "Failed to initiate M-Pesa payment.");
        return;
      }

      setMpesaStatus("polling");
      setMpesaMessage("Check your phone and enter your M-Pesa PIN...");

      const checkoutRequestId = data.checkoutRequestId;
      let polls = 0;
      pollRef.current = setInterval(async () => {
        polls++;
        if (polls > 24) {
          if (pollRef.current) clearInterval(pollRef.current);
          setMpesaStatus("failed");
          setMpesaMessage("Payment timed out. Please try again.");
          return;
        }
        try {
          const qRes = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "mpesa-query", checkoutRequestId }),
          });
          const q = (await qRes.json()) as { status: string; message?: string };
          if (q.status === "success") {
            if (pollRef.current) clearInterval(pollRef.current);
            setMpesaStatus("success");
            setMpesaMessage("Payment confirmed!");
            await createReservation("mpesa");
          } else if (q.status === "failed" || q.status === "cancelled") {
            if (pollRef.current) clearInterval(pollRef.current);
            setMpesaStatus("failed");
            setMpesaMessage(q.message ?? "Payment failed. Please try again.");
          }
        } catch {
          // continue polling on network error
        }
      }, 5000);
    } catch {
      setMpesaStatus("failed");
      setMpesaMessage("Network error. Please try again.");
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
            <p>
              Thank you, <strong>{formData.firstName}</strong>! Your reservation
              at <strong>{villa.name}</strong> has been received. We'll be in
              touch shortly.
            </p>
            {confirmationId && (
              <div className="confirm-id">
                Confirmation # RES-
                {confirmationId.substring(0, 8).toUpperCase()}
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@200;300;400&family=Cormorant+Garamond:wght@300;400&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cormorant Garamond',serif; background:#fff; color:#0a0a0a; }

        .rp-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:22px 60px; display:flex; align-items:center; gap:20px; background:#fff; border-bottom:1px solid rgba(0,0,0,0.08); }
        .rp-nav-logo { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:#0a0a0a; text-decoration:none; }
        .rp-nav-logo span { color:#909090; }
        .rp-nav-back { font-family:'Josefin Sans',sans-serif; font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:rgba(10,10,10,0.4); text-decoration:none; display:flex; align-items:center; gap:6px; transition:color 0.2s; margin-left:auto; }
        .rp-nav-back:hover { color:#0a0a0a; }

        .rp-wrap { max-width:1140px; margin:0 auto; padding:110px 40px 80px; display:grid; grid-template-columns:1fr 400px; gap:72px; align-items:start; }

        .rp-left h1 { font-family:'Playfair Display',serif; font-size:2rem; font-weight:700; margin-bottom:36px; }
        .rp-section { margin-bottom:36px; padding-bottom:36px; border-bottom:1px solid rgba(0,0,0,0.08); }
        .rp-section:last-of-type { border-bottom:none; }
        .rp-section-title { font-family:'Josefin Sans',sans-serif; font-size:0.65rem; letter-spacing:0.22em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:18px; }
        .rp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .rp-field { margin-bottom:14px; }
        .rp-field label { display:block; font-family:'Josefin Sans',sans-serif; font-size:0.6rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.45); margin-bottom:7px; }
        .rp-field input { width:100%; padding:12px 14px; background:#fafafa; border:1px solid rgba(0,0,0,0.15); border-radius:6px; font-family:'Cormorant Garamond',serif; font-size:1rem; color:#0a0a0a; outline:none; transition:border-color 0.2s; }
        .rp-field input:focus { border-color:#0a0a0a; background:#fff; }
        .rp-field input::placeholder { color:rgba(10,10,10,0.3); }
        .rp-phone-wrap { display:flex; }
        .rp-phone-prefix { padding:12px 14px; background:#f0f0f0; border:1px solid rgba(0,0,0,0.15); border-right:none; border-radius:6px 0 0 6px; font-family:'Josefin Sans',sans-serif; font-size:0.75rem; color:#0a0a0a; white-space:nowrap; }
        .rp-phone-wrap input { border-radius:0 6px 6px 0; }

        /* Payment method tabs */
        .pm-tabs { display:flex; gap:0; border:1px solid rgba(0,0,0,0.15); border-radius:8px; overflow:hidden; margin-bottom:24px; }
        .pm-tab { flex:1; padding:14px; background:#fafafa; border:none; font-family:'Josefin Sans',sans-serif; font-size:0.65rem; letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; color:rgba(10,10,10,0.5); }
        .pm-tab:first-child { border-right:1px solid rgba(0,0,0,0.15); }
        .pm-tab.active { background:#0a0a0a; color:#fff; }
        .pm-tab img { height:18px; object-fit:contain; }

        /* M-Pesa section */
        .mpesa-note { font-size:0.88rem; color:rgba(10,10,10,0.55); margin-bottom:18px; line-height:1.6; }
        .mpesa-status { padding:14px 18px; border-radius:8px; font-family:'Josefin Sans',sans-serif; font-size:0.7rem; letter-spacing:0.08em; margin-top:16px; display:flex; align-items:center; gap:10px; }
        .mpesa-status.pending, .mpesa-status.polling { background:#fff9e6; color:#92610a; border:1px solid #f5d078; }
        .mpesa-status.success { background:#e6f9ee; color:#1a7a3f; border:1px solid #7dd9a8; }
        .mpesa-status.failed { background:#fdf0ef; color:#a33025; border:1px solid #f5a99e; }
        .mpesa-spinner { width:14px; height:14px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .btn-mpesa { width:100%; padding:16px; background:#00a651; color:#fff; border:none; border-radius:6px; font-family:'Josefin Sans',sans-serif; font-size:0.75rem; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:opacity 0.2s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .btn-mpesa:hover { opacity:0.88; }
        .btn-mpesa:disabled { opacity:0.5; cursor:not-allowed; }

        /* PayPal section */
        .paypal-note { font-size:0.88rem; color:rgba(10,10,10,0.55); margin-bottom:18px; line-height:1.6; }
        #paypal-btn-container { min-height:45px; }

        /* Summary */
        .rp-summary { position:sticky; top:110px; border:1px solid rgba(0,0,0,0.12); border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
        .rp-summary-img { width:100%; height:200px; object-fit:cover; display:block; }
        .rp-summary-body { padding:24px; }
        .rp-summary-name { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; margin-bottom:18px; line-height:1.3; }
        .rp-trip { margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid rgba(0,0,0,0.08); }
        .rp-trip-title { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:12px; }
        .rp-trip-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .rp-trip-row span:first-child { font-size:0.92rem; color:#0a0a0a; }
        .rp-price-title { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); margin-bottom:12px; }
        .rp-price-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem; color:rgba(10,10,10,0.75); }
        .rp-price-total { display:flex; justify-content:space-between; margin-top:14px; padding-top:14px; border-top:1px solid rgba(0,0,0,0.1); font-family:'Josefin Sans',sans-serif; font-size:0.75rem; letter-spacing:0.06em; }
        .rp-due { display:flex; justify-content:space-between; margin-top:8px; font-family:'Playfair Display',serif; font-size:1.05rem; font-weight:700; }
        .rp-secure { margin-top:18px; display:flex; align-items:center; gap:8px; }
        .rp-secure svg { flex-shrink:0; color:#0a0a0a; opacity:0.4; }
        .rp-secure p { font-size:0.8rem; color:rgba(10,10,10,0.45); line-height:1.5; }

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
                  onChange={(e) => setCheckin(e.target.value)}
                />
              </div>
              <div className="rp-field">
                <label>Check Out</label>
                <input
                  type="date"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>
            </div>
            <div className="rp-field">
              <label>Guests</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "#fafafa",
                }}
              >
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                  disabled={guestCount <= 1}
                  style={{
                    width: 44,
                    height: 44,
                    background: "none",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    color: "#0a0a0a",
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1rem",
                  }}
                >
                  {guestCount} guest{guestCount !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGuestCount((g) => Math.min(villa.maxGuests, g + 1))
                  }
                  disabled={guestCount >= villa.maxGuests}
                  style={{
                    width: 44,
                    height: 44,
                    background: "none",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    color: "#0a0a0a",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Your details */}
          <div className="rp-section">
            <div className="rp-section-title">Your details</div>
            <div className="rp-row">
              <div className="rp-field">
                <label>First name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>
              <div className="rp-field">
                <label>Last name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="rp-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>
            <div className="rp-field">
              <label>Phone number</label>
              <div className="rp-phone-wrap">
                <span className="rp-phone-prefix">+254</span>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="712 345 678"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rp-section">
            <div className="rp-section-title">Payment method</div>

            <div className="pm-tabs">
              <button
                type="button"
                className={`pm-tab${paymentMethod === "mpesa" ? " active" : ""}`}
                onClick={() => {
                  setPaymentMethod("mpesa");
                  setMpesaStatus("idle");
                  setMpesaMessage("");
                }}
              >
                📱 M-Pesa
              </button>
              <button
                type="button"
                className={`pm-tab${paymentMethod === "paypal" ? " active" : ""}`}
                onClick={() => setPaymentMethod("paypal")}
              >
                🅿 PayPal
              </button>
            </div>

            {paymentMethod === "mpesa" && (
              <>
                <p className="mpesa-note">
                  You'll receive an M-Pesa STK Push prompt on your phone. Enter
                  your PIN to complete payment of{" "}
                  <strong>{formatPrice(total)}</strong>.
                </p>
                <div className="rp-field">
                  <label>M-Pesa phone (leave blank to use phone above)</label>
                  <div className="rp-phone-wrap">
                    <span className="rp-phone-prefix">+254</span>
                    <input
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="712 345 678"
                      disabled={
                        mpesaStatus === "polling" || mpesaStatus === "pending"
                      }
                    />
                  </div>
                </div>

                {mpesaStatus !== "idle" && (
                  <div className={`mpesa-status ${mpesaStatus}`}>
                    {(mpesaStatus === "pending" ||
                      mpesaStatus === "polling") && (
                      <span className="mpesa-spinner" />
                    )}
                    {mpesaStatus === "success" && "✓"}
                    {mpesaStatus === "failed" && "✗"}
                    <span>{mpesaMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-mpesa"
                  style={{ marginTop: 16 }}
                  onClick={handleMpesaPay}
                  disabled={
                    mpesaStatus === "pending" ||
                    mpesaStatus === "polling" ||
                    mpesaStatus === "success" ||
                    total <= 0
                  }
                >
                  {mpesaStatus === "pending" || mpesaStatus === "polling"
                    ? "Waiting for payment..."
                    : `Pay ${formatPrice(total)} via M-Pesa`}
                </button>
              </>
            )}

            {paymentMethod === "paypal" && (
              <>
                <p className="paypal-note">
                  Complete your payment of <strong>{formatPrice(total)}</strong>{" "}
                  securely via PayPal. The amount will be converted to USD at
                  the current exchange rate.
                </p>
                <div id="paypal-btn-container" />
              </>
            )}
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
                <span>
                  {guestCount} guest{guestCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div>
              <div className="rp-price-title">Price details</div>
              <div className="rp-price-row">
                <span>
                  {formatPrice(pricePerNight)} × {nights} night
                  {nights !== 1 ? "s" : ""}
                </span>
                <span>{formatPrice(accommodationTotal)}</span>
              </div>
              {nights > 0 && (
                <>
                  <div className="rp-price-row">
                    <span>
                      Laundry ({Math.ceil(nights / 3)} week
                      {Math.ceil(nights / 3) !== 1 ? "s" : ""})
                    </span>
                    <span>{formatPrice(laundryFee)}</span>
                  </div>
                  <div className="rp-price-row">
                    <span>
                      AC ({villa.bedrooms ?? 1} room
                      {(villa.bedrooms ?? 1) > 1 ? "s" : ""} × {nights} night
                      {nights !== 1 ? "s" : ""})
                    </span>
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p>Payments processed securely via M-Pesa or PayPal</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReservationPage;
