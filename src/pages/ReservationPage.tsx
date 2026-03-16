import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PaymentComponent from "../components/PaymentComponent";
import type { PaymentInfo } from "../types";
import { VILLAS } from "../types";
import { useCurrency } from "../context/CurrencyContext";

const ReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
  });

  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);

  // Get booking details from URL params
  const villaId = queryParams.get("villaId");
  const guestCount = queryParams.get("guestCount");
  const price = queryParams.get("price");
  const checkInDate = queryParams.get("checkIn");
  const checkOutDate = queryParams.get("checkOut");

  const villaName =
    VILLAS.find((v) => v.id === villaId)?.name || "Unknown Villa";
  const { formatPrice } = useCurrency();

  // Redirect if missing required params
  useEffect(() => {
    if (!villaId || !guestCount || !price || !checkInDate || !checkOutDate) {
      navigate("/");
    }
  }, [villaId, guestCount, price, checkInDate, checkOutDate, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      alert("Please enter your name");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      alert("Please enter your phone number");
      return false;
    }
    if (!formData.email.trim()) {
      alert("Please enter your email");
      return false;
    }
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateForm()) {
      setShowPayment(true);
    }
  };

  const handlePaymentComplete = async (payment: PaymentInfo) => {
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_name: villaName,
          guests: Number(guestCount),
          checkin: checkInDate,
          checkout: checkOutDate,
          name: formData.customerName,
          phone: formData.phoneNumber,
          email: formData.email,
          total_price: Number(price),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not save reservation. Please contact us.");
        return;
      }

      setPaymentInfo({ ...payment, reservationId: data.reservation.id });
      setBookingConfirmed(true);
    } catch {
      alert("Network error saving reservation. Please contact us directly.");
    }
  };

  if (!villaId || !guestCount || !price || !checkInDate || !checkOutDate) {
    return <div>Loading...</div>;
  }

  if (bookingConfirmed && paymentInfo) {
    return (
      <div className="reservation-page">
        <div className="confirmation-container reveal">
          <div className="success-icon">✓</div>
          <h2>Booking Confirmed!</h2>

          <div className="confirmation-details">
            <h3>Reservation Details</h3>
            <div className="detail-row">
              <span className="label">Confirmation#:</span>
              <span className="value">
                RES{paymentInfo.reservationId.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Villa:</span>
              <span className="value">{villaName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Guests:</span>
              <span className="value">{guestCount}</span>
            </div>
            <div className="detail-row">
              <span className="label">Check-in:</span>
              <span className="value">{checkInDate}</span>
            </div>
            <div className="detail-row">
              <span className="label">Check-out:</span>
              <span className="value">{checkOutDate}</span>
            </div>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{formData.customerName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{formData.email}</span>
            </div>
            <div className="detail-row highlight">
              <span className="label">Total Amount Paid:</span>
              <span className="value">{formatPrice(Number(price))}</span>
            </div>
            <div className="detail-row">
              <span className="label">Payment Method:</span>
              <span className="value">M-Pesa</span>
            </div>
          </div>

          <p className="confirmation-message">
            A confirmation email has been sent to{" "}
            <strong>{formData.email}</strong>
          </p>

          <button className="btn-back-home" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-page reveal">
      <div className="reservation-container">
        <button
          className="btn-back-arrow"
          onClick={() => (showPayment ? setShowPayment(false) : navigate(-1))}
          aria-label="Go back"
        >
          &#8592; {showPayment ? "Back to Details" : "Back"}
        </button>
        <h1>Complete Your Reservation</h1>

        <div className="reservation-summary">
          <h3>Booking Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Villa:</span>
              <span className="value">{villaName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Number of Guests:</span>
              <span className="value">{guestCount}</span>
            </div>
            <div className="summary-item">
              <span className="label">Check-in Date:</span>
              <span className="value">{checkInDate}</span>
            </div>
            <div className="summary-item">
              <span className="label">Check-out Date:</span>
              <span className="value">{checkOutDate}</span>
            </div>
            <div className="summary-item highlight">
              <span className="label">Price per Night:</span>
              <span className="value">{formatPrice(Number(price))}</span>
            </div>
          </div>
        </div>

        {!showPayment ? (
          <div className="guest-information">
            <h3>Guest Information</h3>
            <form className="reservation-form">
              <div className="form-group">
                <label htmlFor="customerName">Full Name</label>
                <input
                  id="customerName"
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+254712345678"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <button
                type="button"
                className="btn-continue"
                onClick={handleContinueToPayment}
              >
                Continue to Payment
              </button>
            </form>
          </div>
        ) : (
          <PaymentComponent
            reservationId={`RES-${Date.now()}`}
            amount={Number(price)}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ReservationPage;
