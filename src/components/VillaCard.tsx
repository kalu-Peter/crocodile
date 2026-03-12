import React from "react";
import type { Villa } from "../types";

interface VillaCardProps {
  villa: Villa;
  onSelectVilla: (villa: Villa) => void;
}

const VillaCard: React.FC<VillaCardProps> = ({ villa, onSelectVilla }) => {
  return (
    <div className="villa-card reveal">
      <div className="villa-card-image">
        <img src={villa.image} alt={villa.name} />
      </div>
      <div
        className="villa-card-header"
        style={{ backgroundColor: villa.color }}
      >
        <h3>{villa.name}</h3>
      </div>
      <div className="villa-card-content">
        <p className="villa-guests">
          <strong>Max Guests:</strong> {villa.maxGuests}
        </p>
        <p className="villa-description">{villa.description}</p>
        <div className="villa-status">
          {villa.isAvailable ? (
            <span className="status-available">✓ Available</span>
          ) : (
            <span className="status-unavailable">✗ Unavailable</span>
          )}
        </div>
        <div className="villa-card-buttons">
          <button
            className="btn-view-details"
            style={{ backgroundColor: villa.color }}
            onClick={() => onSelectVilla(villa)}
            disabled={!villa.isAvailable}
          >
            View Details
          </button>
          <button
            className="btn-reserve-quick"
            style={{ backgroundColor: villa.color }}
            onClick={() => onSelectVilla(villa)}
            disabled={!villa.isAvailable}
          >
            Reserve Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
