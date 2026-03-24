import React, { useState } from "react";
import type { Villa } from "../types";

interface VillaCardProps {
  villa: Villa;
  onSelectVilla: (villa: Villa) => void;
}

const WA_NUMBER = "254715510119";

const BedIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4"/>
    <path d="M2 9h20v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9z"/>
    <path d="M10 9V5"/>
    <path d="M2 14h20"/>
  </svg>
);

const GuestIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
  </svg>
);

const VillaCard: React.FC<VillaCardProps> = ({ villa, onSelectVilla }) => {
  const images = villa.gallery && villa.gallery.length > 0 ? villa.gallery : [villa.image];
  const [imgIndex, setImgIndex] = useState(0);

  const waMessage = encodeURIComponent(
    `Hi, I'm interested in booking the ${villa.name}. Could you please provide more details?`
  );
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % images.length);
  };

  return (
    <div className="villa-card reveal" onClick={() => onSelectVilla(villa)} style={{ cursor: "pointer" }}>
      <div className="villa-card-image" style={{ position: "relative" }}>
        <img src={images[imgIndex]} alt={villa.name} />
        {images.length > 1 && (
          <>
            <button className="card-img-nav card-img-prev" onClick={prev}>‹</button>
            <button className="card-img-nav card-img-next" onClick={next}>›</button>
            <div className="card-img-dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`card-img-dot${i === imgIndex ? " active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="villa-card-header">
        <h3>{villa.name}</h3>
      </div>

      <div className="villa-card-content">
        {/* Icon chips row */}
        <div className="villa-meta-chips">
          {villa.bedrooms && (
            <span className="villa-chip">
              <BedIcon />
              {villa.bedrooms} Bed{villa.bedrooms > 1 ? "s" : ""}
            </span>
          )}
          <span className="villa-chip">
            <GuestIcon />
            Max {villa.maxGuests}
          </span>
        </div>

        <div className="villa-amenity-chips">
          <span className="villa-amenity-chip">Pool</span>
          <span className="villa-amenity-chip">AC</span>
          <span className="villa-amenity-chip">Kitchen</span>
          <span className="villa-amenity-chip">WiFi</span>
          <span className="villa-amenity-chip">Laundry</span>
        </div>

        <div className="villa-status">
          {villa.isAvailable ? (
            <span className="status-available">✓ Available</span>
          ) : (
            <span className="status-unavailable">✗ Unavailable</span>
          )}
        </div>

        <div className="villa-card-buttons">
          <span
            onClick={() => villa.isAvailable && onSelectVilla(villa)}
            style={{
              color: villa.color,
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: villa.isAvailable ? "pointer" : "default",
              opacity: villa.isAvailable ? 1 : 0.4,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            View Details
          </span>
        </div>
      </div>
    </div>
  );
};

export default VillaCard;
