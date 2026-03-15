import React, { useState } from "react";
import type { Villa } from "../types";
import { getVillaPrice, VILLAS } from "../types";


interface DetailsModalProps {
  villa: Villa;
  checkInDate: string;
  checkOutDate: string;
  onClose: () => void;
  onReserve: (
    villaId: string,
    guestCount: number,
    price: number,
    checkIn: string,
    checkOut: string,
  ) => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  villa,
  checkInDate,
  checkOutDate,
  onClose,
  onReserve,
}) => {
  const [guestCount, setGuestCount] = useState<number>(1);
  const [activeGalleryImg, setActiveGalleryImg] = useState<number>(0);
  const price = getVillaPrice(villa.id, guestCount);
  const tier = VILLAS.find((v) => v.id === villa.id)?.pricing[0] ?? null;

  const handleReserve = () => {
    if (price === null) {
      alert(`Sorry, ${villa.name} is not available for ${guestCount} guests.`);
      return;
    }

    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates first.");
      return;
    }

    onReserve(villa.id, guestCount, price, checkInDate, checkOutDate);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header" style={{ backgroundColor: villa.color }}>
          <h2>{villa.name}</h2>
          {(villa.bedrooms || villa.bathrooms) && (
            <p style={{ marginTop: 6, fontSize: "0.85rem", opacity: 0.85 }}>
              {villa.bedrooms && `${villa.bedrooms} Bedroom${villa.bedrooms > 1 ? "s" : ""}`}
              {villa.bedrooms && villa.bathrooms && " · "}
              {villa.bathrooms && `${villa.bathrooms} Bathroom${villa.bathrooms > 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {/* Gallery */}
        {villa.gallery && villa.gallery.length > 0 && (
          <div className="modal-gallery">
            <div className="modal-gallery-main">
              <img
                src={villa.gallery[activeGalleryImg]}
                alt={`${villa.name} — photo ${activeGalleryImg + 1}`}
              />
            </div>
            <div className="modal-gallery-thumbs">
              {villa.gallery.map((src, i) => (
                <button
                  key={i}
                  className={`modal-gallery-thumb${i === activeGalleryImg ? " active" : ""}`}
                  onClick={() => setActiveGalleryImg(i)}
                >
                  <img src={src} alt={`Thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="modal-body">
          <div className="modal-section">
            <h4>Description</h4>
            <p>{villa.description}</p>
          </div>

          {villa.amenities && villa.amenities.length > 0 && (
            <div className="modal-section">
              <h4>Amenities</h4>
              <ul className="amenities-list">
                {villa.amenities.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-section">
            <h4>Details</h4>
            <ul>
              <li>
                <strong>Maximum Guests:</strong> {villa.maxGuests}
              </li>
              <li>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: villa.isAvailable ? "#10b981" : "#ef4444",
                  }}
                >
                  {villa.isAvailable ? "Available" : "Unavailable"}
                </span>
              </li>
            </ul>
          </div>

          <div className="modal-section">
            <h4>Select Number of Guests</h4>
            <div className="guest-selector">
              <label htmlFor="guestCount">Guests:</label>
              <select
                id="guestCount"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              >
                {Array.from({ length: villa.maxGuests }, (_, i) => i + 1).map(
                  (num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="modal-section">
            <h4>Dates</h4>
            <p>
              <strong>Check-in:</strong> {checkInDate}
            </p>
            <p>
              <strong>Check-out:</strong> {checkOutDate}
            </p>
          </div>

          <div className="modal-section price-section">
            {price !== null ? (
              <>
                <h4>Price per Night</h4>
                <div className="price-display">${price}</div>
                {tier && (
                  <div className="price-breakdown">
                    <span>Base rate (up to {tier.baseGuests} guests): ${tier.basePrice}</span>
                    {tier.extraPersonFee > 0 && (
                      <span>Extra guest: +${tier.extraPersonFee} / person</span>
                    )}
                    {tier.extraPersonFee === 0 && villa.maxGuests <= tier.baseGuests && (
                      <span>Max {villa.maxGuests} guest{villa.maxGuests > 1 ? "s" : ""} — no additional guests</span>
                    )}
                  </div>
                )}
                <button className="btn-reserve-now" onClick={handleReserve}>
                  Reserve Now
                </button>
              </>
            ) : (
              <div className="unavailable-message">
                This accommodation is currently unavailable for the selected dates.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
