import React, { useState } from "react";
import type { PaymentInfo } from "../types";

interface PaymentComponentProps {
  reservationId: string;
  amount: number;
  onPaymentComplete: (paymentInfo: PaymentInfo) => void;
  isProcessing?: boolean;
}

const PaymentComponent: React.FC<PaymentComponentProps> = ({
  reservationId,
  amount,
  onPaymentComplete,
  isProcessing = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validatePhoneNumber = (phone: string): boolean => {
    // Kenya phone number format: +254 or 0 followed by 9 digits
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const handleMpesaPayment = async () => {
    setError("");

    // Validate phone number
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError(
        "Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Simulate M-Pesa STK Push
      // In production, this would call your backend which would trigger the actual M-Pesa API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, we'll always succeed
      const paymentInfo: PaymentInfo = {
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        amount,
        reservationId,
        status: "completed",
      };

      onPaymentComplete(paymentInfo);
    } catch (err) {
      setError("Payment failed. Please try again.");
      console.error("Payment error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="payment-component">
      <div className="payment-header">
        <h3>M-Pesa Payment</h3>
        <p className="payment-amount">Amount Due: KES {amount}</p>
      </div>

      <div className="payment-form">
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            placeholder="+254712345678 or 0712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading || isProcessing}
            className="phone-input"
          />
          <p className="hint">Enter your M-Pesa registered phone number</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="btn-pay-mpesa"
          onClick={handleMpesaPayment}
          disabled={isLoading || isProcessing}
        >
          {isLoading || isProcessing ? "Processing..." : "Pay with M-Pesa"}
        </button>

        <div className="payment-info">
          <h4>How it works:</h4>
          <ol>
            <li>Enter your M-Pesa registered phone number above</li>
            <li>Click "Pay with M-Pesa"</li>
            <li>Enter your M-Pesa PIN on your phone</li>
            <li>Payment will be processed automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PaymentComponent;
