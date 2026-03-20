import React, { useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { VILLAS, getVillaPrice } from "../types";
import { useCurrency } from "../context/CurrencyContext";
import CurrencySelector from "../components/CurrencySelector";

const WA_NUMBER = "254715510119";

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

const VillaDetailsPage: React.FC = () => {
  const { villaId } = useParams<{ villaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const villa = VILLAS.find((v) => v.id === villaId);

  const [activeImg, setActiveImg] = useState(0);
  const [guestCount, setGuestCount] = useState(1);
  const [checkin, setCheckin] = useState(searchParams.get("checkin") ?? "");
  const [checkout, setCheckout] = useState(searchParams.get("checkout") ?? "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!villa) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem" }}>Villa not found</h2>
          <Link to="/" style={{ color: "#c9a84c", fontFamily: "'Josefin Sans', sans-serif", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const price = getVillaPrice(villa.id, guestCount);
  const tier = villa.pricing[0] ?? null;
  const nights = nightsBetween(checkin, checkout);
  const images = villa.gallery && villa.gallery.length > 0 ? villa.gallery : [villa.image];

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hi, I'm interested in booking the ${villa.name}. Could you please provide availability and pricing details?`
  )}`;

  const handleReserve = () => {
    if (!checkin || !checkout) {
      alert("Please select check-in and check-out dates.");
      return;
    }
    if (nights <= 0) {
      alert("Check-out must be after check-in.");
      return;
    }
    if (price === null) {
      alert(`Sorry, ${villa.name} is not available for ${guestCount} guests.`);
      return;
    }
    navigate(
      `/reservation?villaId=${villa.id}&guestCount=${guestCount}&price=${price}&checkIn=${checkin}&checkOut=${checkout}`
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Josefin+Sans:wght@200;300;400&display=swap');

        :root {
          --croc-deep: #0a0a0a;
          --croc-forest: #141414;
          --croc-moss: #282828;
          --croc-sage: #505050;
          --croc-sand: #d4d4d4;
          --croc-cream: #f0f0f0;
          --croc-gold: #909090;
          --croc-amber: #e0e0e0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Cormorant Garamond', serif; background: var(--croc-deep); color: var(--croc-cream); overflow-x: hidden; }

        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 28px 60px; display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%);
          backdrop-filter: blur(2px);
        }
        .nav-logo {
          font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700;
          letter-spacing: 0.05em; color: var(--croc-cream); text-decoration: none;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .nav-logo span { color: var(--croc-gold); }
        .nav-links { display: flex; gap: 44px; list-style: none; }
        .nav-links a, .nav-links button {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.7rem; font-weight: 300;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--croc-cream);
          text-decoration: none; opacity: 0.8; transition: opacity 0.3s, color 0.3s;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .nav-links a:hover, .nav-links button:hover { opacity: 1; color: var(--croc-gold); }

        .hamburger { display: none; flex-direction: column; gap: 6px; background: none; border: none; cursor: pointer; padding: 0; z-index: 101; }
        .hamburger span { width: 24px; height: 2px; background: var(--croc-cream); transition: all 0.3s ease; display: block; }
        .hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(8px, 8px); }
        .hamburger.active span:nth-child(2) { opacity: 0; }
        .hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(7px, -7px); }

        .mobile-menu {
          display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(10,10,10,0.98); z-index: 50; padding-top: 100px;
          flex-direction: column; align-items: center; gap: 30px; backdrop-filter: blur(4px);
        }
        .mobile-menu.active { display: flex; }
        .mobile-menu a, .mobile-menu button {
          font-family: 'Josefin Sans', sans-serif; font-size: 1rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--croc-cream); text-decoration: none;
          background: none; border: none; cursor: pointer; padding: 0; transition: color 0.3s;
        }
        .mobile-menu a:hover, .mobile-menu button:hover { color: var(--croc-gold); }

        /* ── VILLA DETAILS PAGE ── */
        .vdp-page { min-height: 100vh; background: #0a0a0a; padding-top: 90px; }

        .vdp-hero {
          width: 100%; height: 62vh; position: relative; overflow: hidden;
        }
        .vdp-hero img { width: 100%; height: 100%; object-fit: cover; }
        .vdp-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%);
        }
        .vdp-hero-content {
          position: absolute; bottom: 44px; left: 60px; right: 60px;
        }
        .vdp-type {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.35em; text-transform: uppercase; color: #c9a84c; margin-bottom: 10px;
        }
        .vdp-title {
          font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.8rem);
          font-weight: 900; color: #f0f0f0; line-height: 1.05; margin-bottom: 14px;
        }
        .vdp-meta {
          display: flex; gap: 22px; flex-wrap: wrap;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.7rem;
          letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.65);
        }

        /* ── GALLERY ── */
        .vdp-gallery { background: #050505; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .vdp-gallery-main { width: 100%; height: 500px; position: relative; overflow: hidden; }
        .vdp-gallery-main img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; display: block; }
        .vdp-thumbs {
          display: flex; gap: 6px; padding: 10px 60px; overflow-x: auto;
          background: #050505; scrollbar-width: thin; scrollbar-color: #333 #050505;
        }
        .vdp-thumb {
          flex-shrink: 0; width: 84px; height: 60px; border: 2px solid transparent;
          border-radius: 3px; overflow: hidden; cursor: pointer; padding: 0;
          background: none; opacity: 0.4; transition: opacity 0.2s, border-color 0.2s;
        }
        .vdp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vdp-thumb:hover, .vdp-thumb.active { opacity: 1; border-color: #c9a84c; }

        /* ── BODY GRID ── */
        .vdp-body {
          max-width: 1200px; margin: 0 auto;
          padding: 64px 60px 100px;
          display: grid; grid-template-columns: 1fr 400px; gap: 64px; align-items: start;
        }

        /* back link */
        .vdp-back {
          display: inline-flex; align-items: center; gap: 8px; margin-bottom: 32px;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.45); text-decoration: none;
          transition: color 0.2s;
        }
        .vdp-back:hover { color: #c9a84c; }

        .vdp-section { margin-bottom: 44px; }
        .vdp-section-label {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.6rem;
          letter-spacing: 0.28em; text-transform: uppercase; color: #c9a84c;
          margin-bottom: 16px; display: flex; align-items: center; gap: 14px;
        }
        .vdp-section-label::after {
          content: ''; flex: 1; height: 1px; background: rgba(201,168,76,0.18);
        }
        .vdp-description {
          font-family: 'Cormorant Garamond', serif; font-size: 1.12rem;
          color: rgba(240,240,240,0.78); line-height: 1.9;
        }

        /* ── BOOKING WIDGET ── */
        .vdp-widget {
          position: sticky; top: 110px;
          background: #111; border: 1px solid rgba(201,168,76,0.2); border-radius: 10px; overflow: hidden;
        }
        .vdp-widget-header {
          padding: 26px 28px 22px; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .vdp-widget-header h3 {
          font-family: 'Playfair Display', serif; font-size: 1.45rem; font-weight: 700;
          color: #f0f0f0; margin-bottom: 4px;
        }
        .vdp-widget-sub {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.3);
        }
        .vdp-widget-body {
          padding: 26px 28px 30px; display: flex; flex-direction: column; gap: 20px;
        }
        .vdp-field label {
          display: block; font-family: 'Josefin Sans', sans-serif; font-size: 0.58rem;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.38); margin-bottom: 8px;
        }
        .vdp-field input {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.2);
          border-radius: 5px; font-family: 'Cormorant Garamond', serif; font-size: 1rem;
          color: #f0f0f0; outline: none; transition: border-color 0.2s;
        }
        .vdp-field input:focus { border-color: #c9a84c; background: rgba(255,255,255,0.07); }
        .vdp-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      `}</style>

      {/* NAV */}
      <nav>
        <Link to="/" className="nav-logo">Croc<span>odile</span> Lodge</Link>
        <ul className="nav-links">
          <li><a href="/#villas">Villas</a></li>
          <li><a href="/#amenities">Amenities</a></li>
          <li><Link to="/gallery">Gallery</Link></li>
          <li><a href="/#contact">Contact</a></li>
        </ul>
        <CurrencySelector />
        <button
          className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${mobileMenuOpen ? "active" : ""}`}>
        <a href="/#villas" onClick={() => setMobileMenuOpen(false)}>Villas</a>
        <a href="/#amenities" onClick={() => setMobileMenuOpen(false)}>Amenities</a>
        <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
        <a href="/#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
      </div>

      <div className="vdp-page">

        {/* HERO */}
        <div className="vdp-hero">
          <img src={villa.image} alt={villa.name} />
          <div className="vdp-hero-overlay" />
          <div className="vdp-hero-content">
            <div className="vdp-type">{villa.type}</div>
            <h1 className="vdp-title">{villa.name}</h1>
            <div className="vdp-meta">
              {villa.bedrooms && <span>🛏 {villa.bedrooms} Bedroom{villa.bedrooms > 1 ? "s" : ""}</span>}
              {villa.bathrooms && <span>🚿 {villa.bathrooms} Bathroom{villa.bathrooms > 1 ? "s" : ""}</span>}
              <span>👥 Up to {villa.maxGuests} guests</span>
            </div>
          </div>
        </div>

        {/* GALLERY */}
        {images.length > 1 && (
          <div className="vdp-gallery">
            <div className="vdp-gallery-main">
              <img src={images[activeImg]} alt={`${villa.name} — photo ${activeImg + 1}`} />
              {activeImg > 0 && (
                <button className="gallery-arrow gallery-arrow--prev" onClick={() => setActiveImg((i) => i - 1)} aria-label="Previous">&#8249;</button>
              )}
              {activeImg < images.length - 1 && (
                <button className="gallery-arrow gallery-arrow--next" onClick={() => setActiveImg((i) => i + 1)} aria-label="Next">&#8250;</button>
              )}
              <div className="gallery-counter">{activeImg + 1} / {images.length}</div>
            </div>
            <div className="vdp-thumbs">
              {images.map((src, i) => (
                <button key={i} className={`vdp-thumb${i === activeImg ? " active" : ""}`} onClick={() => setActiveImg(i)}>
                  <img src={src} alt={`Thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="vdp-body">

          {/* LEFT — Info */}
          <div>
            <Link to="/" className="vdp-back">← All villas</Link>

            <div className="vdp-section">
              <div className="vdp-section-label">About this property</div>
              <p className="vdp-description">{villa.description}</p>
            </div>

            {villa.amenities && villa.amenities.length > 0 && (
              <div className="vdp-section">
                <div className="vdp-section-label">Amenities</div>
                <ul className="amenities-list">
                  {villa.amenities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT — Booking widget */}
          <div className="vdp-widget">
            <div className="vdp-widget-header">
              <h3>Book This Villa</h3>
              <div className="vdp-widget-sub">Direct booking — best rate</div>
            </div>

            <div className="vdp-widget-body">
              {villa.contactOnly ? (
                <>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, letterSpacing: "0.02em" }}>
                    This property is booked directly with the owners. Contact us on WhatsApp to check availability and arrange your stay.
                  </p>
                  <a
                    className="btn-reserve-now"
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: "#25d366", display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.737 5.469 2.027 7.773L0 32l8.473-2.007A15.938 15.938 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.853l-.485-.29-5.027 1.19 1.213-4.903-.317-.503A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.87c-.397-.2-2.352-1.16-2.717-1.293-.364-.133-.63-.2-.896.2-.265.397-1.03 1.293-1.262 1.56-.232.265-.464.298-.86.1-.397-.2-1.676-.617-3.192-1.97-1.18-1.052-1.977-2.352-2.208-2.748-.232-.397-.025-.612.174-.81.179-.178.397-.464.596-.696.2-.232.265-.397.397-.663.133-.265.067-.497-.033-.696-.1-.2-.896-2.16-1.228-2.958-.323-.775-.65-.67-.896-.683l-.763-.013c-.265 0-.696.1-1.06.497-.364.397-1.393 1.36-1.393 3.317s1.427 3.847 1.626 4.113c.2.265 2.807 4.287 6.803 6.013.95.41 1.692.655 2.27.838.953.303 1.82.26 2.506.158.764-.114 2.352-.962 2.683-1.89.33-.928.33-1.724.232-1.89-.1-.165-.364-.265-.762-.464z" />
                    </svg>
                    Contact Us on WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <div className="vdp-dates">
                    <div className="vdp-field">
                      <label>Check In</label>
                      <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
                    </div>
                    <div className="vdp-field">
                      <label>Check Out</label>
                      <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontFamily: "'Josefin Sans', sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 10 }}>Guests</label>
                    <div className="guest-selector">
                      <button className="guest-step-btn" onClick={() => setGuestCount((g) => Math.max(1, g - 1))} disabled={guestCount <= 1} aria-label="Remove guest">−</button>
                      <div className="guest-count-display">{guestCount} <span>{guestCount === 1 ? "guest" : "guests"}</span></div>
                      <button className="guest-step-btn" onClick={() => setGuestCount((g) => Math.min(villa.maxGuests, g + 1))} disabled={guestCount >= villa.maxGuests} aria-label="Add guest">+</button>
                    </div>
                  </div>

                  <div className="price-section">
                    <h4>Price per night</h4>
                    <div className="price-display">{price !== null ? formatPrice(price) : "—"}</div>
                    {nights > 0 && price !== null && (
                      <div className="price-per-night-label">
                        {formatPrice(price * nights)} total for {nights} night{nights !== 1 ? "s" : ""}
                      </div>
                    )}
                    {tier && (
                      <div className="price-breakdown">
                        <span>Base rate (up to {tier.baseGuests} guests): {formatPrice(tier.basePrice)}</span>
                        {tier.extraPersonFee > 0 && (
                          <span>Extra guest: +{formatPrice(tier.extraPersonFee)} / person / night</span>
                        )}
                        {tier.extraPersonFee === 0 && (
                          <span>Max {villa.maxGuests} guest{villa.maxGuests > 1 ? "s" : ""} — no extra charges</span>
                        )}
                      </div>
                    )}
                    <button className="btn-reserve-now" onClick={handleReserve}>Reserve Now</button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default VillaDetailsPage;
