import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { VILLAS } from "../types";
import CurrencySelector from "../components/CurrencySelector";

const WA_NUMBER = "254715510119";

const VillaDetailsPage: React.FC = () => {
  const { villaId } = useParams<{ villaId: string }>();

  const villa = VILLAS.find((v) => v.id === villaId);

  const [activeImg, setActiveImg] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setActiveImg((i) => Math.min(i + 1, images.length - 1));
      else setActiveImg((i) => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  if (!villa) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", color: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem" }}>Villa not found</h2>
          <Link to="/" style={{ color: "#b8913e", fontFamily: "'Josefin Sans', sans-serif", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const images = villa.gallery && villa.gallery.length > 0 ? villa.gallery : [villa.image];

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hi, I'm interested in booking the ${villa.name}. Could you please provide availability and pricing details?`
  )}`;

  return (
    <>
      <style>{`


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
        body { font-family: 'Cormorant Garamond', serif; background: #ffffff; color: #0a0a0a; overflow-x: hidden; }

        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 22px 60px; display: flex; justify-content: space-between; align-items: center;
          background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .nav-logo {
          font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700;
          letter-spacing: 0.05em; color: #0a0a0a; text-decoration: none;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .nav-logo span { color: #909090; }
        .nav-links { display: flex; gap: 44px; list-style: none; }
        .nav-links a, .nav-links button {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.7rem; font-weight: 300;
          letter-spacing: 0.2em; text-transform: uppercase; color: #0a0a0a;
          text-decoration: none; opacity: 0.6; transition: opacity 0.3s;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .nav-links a:hover, .nav-links button:hover { opacity: 1; }

        .hamburger { display: none; flex-direction: column; gap: 6px; background: none; border: none; cursor: pointer; padding: 0; z-index: 101; }
        .hamburger span { width: 24px; height: 2px; background: #0a0a0a; transition: all 0.3s ease; display: block; }
        .hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(8px, 8px); }
        .hamburger.active span:nth-child(2) { opacity: 0; }
        .hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(7px, -7px); }

        .mobile-menu {
          display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: #fff; z-index: 50; padding-top: 100px;
          flex-direction: column; align-items: center; gap: 30px;
        }
        .mobile-menu.active { display: flex; }
        .mobile-menu a, .mobile-menu button {
          font-family: 'Josefin Sans', sans-serif; font-size: 1rem; letter-spacing: 0.2em;
          text-transform: uppercase; color: #0a0a0a; text-decoration: none;
          background: none; border: none; cursor: pointer; padding: 0; transition: color 0.3s;
        }
        .mobile-menu a:hover, .mobile-menu button:hover { color: #b8913e; }

        /* ── VILLA DETAILS PAGE ── */
        .vdp-page { min-height: 100vh; background: #ffffff; padding-top: 70px; }

        /* ── PAGE HEADER (replaces hero) ── */
        .vdp-header {
          max-width: 860px; margin: 0 auto;
          padding: 36px 40px 20px;
        }
        .vdp-type {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.58rem;
          letter-spacing: 0.35em; text-transform: uppercase; color: #b8913e; margin-bottom: 8px;
        }
        .vdp-title {
          font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 900; color: #0a0a0a; line-height: 1.1; margin-bottom: 10px;
        }
        .vdp-meta {
          display: flex; gap: 16px; flex-wrap: wrap;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.65rem;
          letter-spacing: 0.1em; text-transform: uppercase; color: rgba(10,10,10,0.45);
        }

        /* ── GALLERY ── */
        .vdp-gallery {
          max-width: 860px; margin: 0 auto 0;
          padding: 0 40px;
        }
        .vdp-gallery-main {
          width: 100%; height: 380px; position: relative; overflow: hidden;
          background: #f2f2f2;
        }
        .vdp-gallery-main img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; display: block; }
        .vdp-thumbs {
          display: flex; gap: 6px; padding: 8px 0; overflow-x: auto;
          scrollbar-width: thin; scrollbar-color: #ccc transparent;
        }
        .vdp-thumb {
          flex-shrink: 0; width: 72px; height: 52px; border: 2px solid transparent;
          border-radius: 4px; overflow: hidden; cursor: pointer; padding: 0;
          background: none; opacity: 0.55; transition: opacity 0.2s, border-color 0.2s;
        }
        .vdp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vdp-thumb:hover, .vdp-thumb.active { opacity: 1; border-color: #b8913e; }

        @media(max-width:768px) {
          .vdp-header { padding: 24px 20px 16px; }
          .vdp-gallery { padding: 0 20px; }
          .vdp-gallery-main { height: 240px; }
          .vdp-thumb { width: 58px; height: 42px; }
        }

        /* ── BODY GRID ── */
        .vdp-body {
          max-width: 860px; margin: 0 auto;
          padding: 36px 40px 100px;
        }
        @media(max-width:768px) {
          .vdp-body { padding: 24px 20px 80px; }
        }

        /* back link */
        .vdp-back {
          display: inline-flex; align-items: center; gap: 8px; margin-bottom: 32px;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(10,10,10,0.4); text-decoration: none;
          transition: color 0.2s;
        }
        .vdp-back:hover { color: #b8913e; }

        .vdp-section { margin-bottom: 44px; }

        .vdp-info-header { margin-bottom: 20px; }
        .vdp-info-name {
          font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700;
          color: #0a0a0a; margin-bottom: 10px; line-height: 1.15;
        }
        .vdp-info-stats {
          display: flex; align-items: center; gap: 0;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.72rem;
          letter-spacing: 0.1em; text-transform: uppercase; color: rgba(10,10,10,0.5);
          flex-wrap: wrap;
        }
        .vdp-info-stat { display: flex; align-items: center; gap: 6px; }
        .vdp-info-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(10,10,10,0.25); margin: 0 12px;
        }

        .vdp-description {
          font-family: 'Cormorant Garamond', serif; font-size: 1.12rem;
          color: rgba(10,10,10,0.72); line-height: 1.9; margin-bottom: 32px;
        }

        /* amenities grid */
        .vdp-amenities { border-top: 1px solid rgba(0,0,0,0.08); padding-top: 28px; }
        .vdp-amenities-group { margin-bottom: 22px; }
        .vdp-amenities-group-title {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.58rem;
          letter-spacing: 0.22em; text-transform: uppercase; color: rgba(10,10,10,0.4);
          margin-bottom: 12px;
        }
        .vdp-amenities-items {
          display: flex; flex-wrap: wrap; gap: 10px;
        }
        .vdp-amenity-chip {
          display: flex; align-items: center; gap: 8px;
          background: #f5f5f5; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px;
          padding: 8px 14px;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.72rem;
          letter-spacing: 0.04em; color: #0a0a0a;
        }
        .vdp-amenity-chip svg { flex-shrink: 0; color: #b8913e; }

        /* ── BOOKING WIDGET ── */
        .vdp-widget {
          position: sticky; top: 110px;
          background: #ffffff; border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 4px 30px rgba(0,0,0,0.08);
        }
        .vdp-widget-header {
          padding: 26px 28px 22px; border-bottom: 1px solid rgba(0,0,0,0.08);
          background: #fafafa;
        }
        .vdp-widget-header h3 {
          font-family: 'Playfair Display', serif; font-size: 1.45rem; font-weight: 700;
          color: #0a0a0a; margin-bottom: 4px;
        }
        .vdp-widget-sub {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.62rem;
          letter-spacing: 0.14em; text-transform: uppercase; color: rgba(10,10,10,0.35);
        }
        .vdp-widget-body {
          padding: 26px 28px 30px; display: flex; flex-direction: column; gap: 20px;
        }
        .vdp-field label {
          display: block; font-family: 'Josefin Sans', sans-serif; font-size: 0.58rem;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(10,10,10,0.45); margin-bottom: 8px;
        }
        .vdp-field input {
          width: 100%; padding: 11px 14px;
          background: #f9f9f9; border: 1px solid rgba(0,0,0,0.15);
          border-radius: 5px; font-family: 'Cormorant Garamond', serif; font-size: 1rem;
          color: #0a0a0a; outline: none; transition: border-color 0.2s;
        }
        .vdp-field input:focus { border-color: #b8913e; background: #ffffff; }
        .vdp-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* guest selector override for light bg */
        .vdp-page .guest-selector {
          border: 1px solid rgba(0,0,0,0.18); background: #f9f9f9;
        }
        .vdp-page .guest-step-btn { color: #b8913e; }
        .vdp-page .guest-step-btn:disabled { color: #bbb; }
        .vdp-page .guest-count-display {
          color: #0a0a0a;
          border-left: 1px solid rgba(0,0,0,0.12);
          border-right: 1px solid rgba(0,0,0,0.12);
        }
        .vdp-page .guest-count-display span { color: rgba(10,10,10,0.4); }

        /* price section override for light bg */
        .vdp-page .price-section {
          background: #f5f5f5;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .vdp-page .price-section h4 { color: #b8913e !important; }
        .vdp-page .price-display { color: #b8913e; }
        .vdp-page .price-per-night-label { color: rgba(10,10,10,0.45); }
        .vdp-page .price-breakdown {
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.07);
        }
        .vdp-page .price-breakdown span { color: rgba(10,10,10,0.6); }
        .vdp-page .unavailable-message { color: rgba(10,10,10,0.55); }
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

        {/* PAGE HEADER */}
        <div className="vdp-header">
          <div className="vdp-type">{villa.type}</div>
          <h1 className="vdp-title">{villa.name}</h1>
          <div className="vdp-meta">
            {villa.bedrooms && <span>{villa.bedrooms} Bedroom{villa.bedrooms > 1 ? "s" : ""}</span>}
            {villa.bathrooms && <span>{villa.bathrooms} Bathroom{villa.bathrooms > 1 ? "s" : ""}</span>}
            <span>Up to {villa.maxGuests} guests</span>
          </div>
        </div>

        {/* GALLERY */}
        <div className="vdp-gallery">
          <div
            className="vdp-gallery-main"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[activeImg]}
              alt={`${villa.name} — photo ${activeImg + 1}`}
              decoding="async"
            />
            {activeImg > 0 && (
              <button className="gallery-arrow gallery-arrow--prev" onClick={() => setActiveImg((i) => i - 1)} aria-label="Previous">&#8249;</button>
            )}
            {activeImg < images.length - 1 && (
              <button className="gallery-arrow gallery-arrow--next" onClick={() => setActiveImg((i) => i + 1)} aria-label="Next">&#8250;</button>
            )}
            {images.length > 1 && (
              <div className="gallery-counter">{activeImg + 1} / {images.length}</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="vdp-thumbs">
              {images.map((src, i) => (
                <button key={i} className={`vdp-thumb${i === activeImg ? " active" : ""}`} onClick={() => setActiveImg(i)}>
                  <img src={src} alt={`Thumbnail ${i + 1}`} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="vdp-body">
            <Link to="/" className="vdp-back">← All villas</Link>

            <div className="vdp-section">
              {/* Name + stats header */}
              <div className="vdp-info-header">
                <h2 className="vdp-info-name">{villa.name}</h2>
                <div className="vdp-info-stats">
                  {villa.bedrooms && (
                    <span className="vdp-info-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 9V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4"/><path d="M2 9h20v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9z"/><path d="M10 9V5"/><path d="M2 14h20"/>
                      </svg>
                      {villa.bedrooms} Bed{villa.bedrooms > 1 ? "s" : ""}
                    </span>
                  )}
                  {villa.bedrooms && <span className="vdp-info-dot" />}
                  <span className="vdp-info-stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
                    </svg>
                    Up to {villa.maxGuests} guests
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="vdp-description">{villa.description}</p>

              {/* Amenities */}
              <div className="vdp-amenities">
                <div className="vdp-amenities-group">
                  <div className="vdp-amenities-group-title">Pool</div>
                  <div className="vdp-amenities-items">
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h2a2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2"/><path d="M2 6h2a2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2"/><path d="M4 20h16"/></svg>
                      Swimming pool
                    </div>
                  </div>
                </div>

                <div className="vdp-amenities-group">
                  <div className="vdp-amenities-group-title">Kitchen &amp; dining</div>
                  <div className="vdp-amenities-items">
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v20"/><path d="M18 8a4 4 0 0 0-4-4H6v8h8a4 4 0 0 0 4-4z"/></svg>
                      Kitchen
                    </div>
                  </div>
                </div>

                <div className="vdp-amenities-group">
                  <div className="vdp-amenities-group-title">General</div>
                  <div className="vdp-amenities-items">
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="m15 14 5-5-5-5"/><path d="M4 20h16"/></svg>
                      Air conditioning
                    </div>
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3"/><path d="M21 6h-3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
                      Washing machine
                    </div>
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      Internet
                    </div>
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
                      Wireless
                    </div>
                    <div className="vdp-amenity-chip">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M17 2H7l-1 5h12z"/></svg>
                      TV
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Reserve / WhatsApp button */}
          <div style={{ marginTop: 36 }}>
            {villa.contactOnly ? (
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
            ) : (
              <Link
                to={`/reservation?villaId=${villa.id}`}
                className="btn-reserve-now"
                style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              >
                Reserve Now
              </Link>
            )}
          </div>

        </div>
      </div>

    </>
  );
};

export default VillaDetailsPage;
