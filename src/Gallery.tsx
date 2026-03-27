import React, { useState } from "react";
import { Link } from "react-router-dom";

const Gallery: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("general");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const galleryData = {
    general: [
      {
        src: "/images/crocodile/Maisons Diani-photos-Pierre_Rich-2.jpg",
        alt: "Crocodile Lodge",
      },
      { src: "/images/crocodile/FB_IMG_1734527214582.jpg", alt: "Lodge View" },
      { src: "/images/crocodile/20250318_171046.jpg", alt: "Property Grounds" },
      {
        src: "/images/crocodile/IMG_20241121_135225.jpg",
        alt: "Lodge Exterior",
      },
      { src: "/images/crocodile/IMG_20241121_135032.jpg", alt: "Common Area" },
      { src: "/images/crocodile/IMG_20240717_131652.jpg", alt: "Garden View" },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.25.32.jpeg",
        alt: "Poolside",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.25.33.jpeg",
        alt: "Pool Area",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.25.36.jpeg",
        alt: "Outdoor Space",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.25.37.jpeg",
        alt: "Lodge Surroundings",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.25.52.jpeg",
        alt: "Tropical Gardens",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.25.58.jpeg",
        alt: "Property View",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.26.32.jpeg",
        alt: "Grounds",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.26.36.jpeg",
        alt: "Lodge Area",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.26.37.jpeg",
        alt: "Outdoor Living",
      },
      {
        src: "/images/crocodile/WhatsApp Image 2026-03-09 at 13.26.42.jpeg",
        alt: "Lodge Entrance",
      },
      { src: "/images/gate.jpg", alt: "Main Gate" },
      { src: "/images/poolview.jpeg", alt: "Pool View" },
      { src: "/images/IMG-20250728-WA0039.jpg", alt: "General View" },
    ],
    blue: [
      {
        src: "/images/crocodile/blue/Maisons Diani-photos-Pierre_Rich-45.jpg",
        alt: "Blue Villa",
      },
      {
        src: "/images/crocodile/blue/Maisons Diani-photos-Pierre_Rich-37.jpg",
        alt: "Blue Villa Interior",
      },
      {
        src: "/images/crocodile/blue/IMG-20250728-WA0040.jpg",
        alt: "Blue Villa Room",
      },
      {
        src: "/images/crocodile/blue/IMG-20250728-WA0036.jpg",
        alt: "Blue Villa Bedroom",
      },
      {
        src: "/images/crocodile/blue/IMG-20250728-WA0033.jpg",
        alt: "Blue Villa Living Area",
      },
      {
        src: "/images/crocodile/blue/IMG-20250728-WA0031.jpg",
        alt: "Blue Villa Exterior",
      },
      {
        src: "/images/crocodile/blue/IMG-20250728-WA0015.jpg",
        alt: "Blue Villa View",
      },
      {
        src: "/images/crocodile/blue/20241121_140024.jpg",
        alt: "Blue Villa Space",
      },
      {
        src: "/images/crocodile/blue/20241121_135924.jpg",
        alt: "Blue Villa Detail",
      },
      {
        src: "/images/crocodile/blue/20241121_135917.jpg",
        alt: "Blue Villa Area",
      },
      {
        src: "/images/crocodile/blue/20241121_135844.jpg",
        alt: "Blue Villa Garden",
      },
    ],
    green: [
      {
        src: "/images/crocodile/green/Maisons Diani-photos-Pierre_Rich-38.jpg",
        alt: "Green Villa",
      },
      {
        src: "/images/crocodile/green/Maisons Diani-photos-Pierre_Rich-42.jpg",
        alt: "Green Villa Interior",
      },
      {
        src: "/images/crocodile/green/20250803_162422.jpg",
        alt: "Green Villa Room",
      },
      {
        src: "/images/crocodile/green/IMG-20250728-WA0038.jpg",
        alt: "Green Villa Bedroom",
      },
      {
        src: "/images/crocodile/green/IMG-20250728-WA0037.jpg",
        alt: "Green Villa Living Area",
      },
      {
        src: "/images/crocodile/green/IMG-20250728-WA0033.jpg",
        alt: "Green Villa Exterior",
      },
      {
        src: "/images/crocodile/green/IMG-20250728-WA0032.jpg",
        alt: "Green Villa Garden",
      },
      {
        src: "/images/crocodile/green/IMG-20250728-WA0024.jpg",
        alt: "Green Villa View",
      },
    ],
    gold: [
      {
        src: "/images/crocodile/gold/Maisons Diani-photos-Pierre_Rich-15.jpg",
        alt: "Gold Lodge",
      },
      {
        src: "/images/crocodile/gold/Maisons Diani-photos-Pierre_Rich-11.jpg",
        alt: "Gold Lodge Interior",
      },
      {
        src: "/images/crocodile/gold/WhatsApp Image 2026-03-09 at 13.25.46.jpeg",
        alt: "Gold Lodge Space",
      },
      {
        src: "/images/crocodile/gold/20250803_162410.jpg",
        alt: "Gold Lodge Room",
      },
      {
        src: "/images/crocodile/gold/20250803_162250.jpg",
        alt: "Gold Lodge Bedroom",
      },
      {
        src: "/images/crocodile/gold/20250803_162139.jpg",
        alt: "Gold Lodge Area",
      },
      {
        src: "/images/crocodile/gold/20250803_162136.jpg",
        alt: "Gold Lodge Living",
      },
      {
        src: "/images/crocodile/gold/20250307_142357.jpg",
        alt: "Gold Lodge View",
      },
      {
        src: "/images/crocodile/gold/20250307_142209.jpg",
        alt: "Gold Lodge Detail",
      },
      {
        src: "/images/crocodile/gold/20250307_142205.jpg",
        alt: "Gold Lodge Exterior",
      },
      {
        src: "/images/crocodile/gold/20250307_142151.jpg",
        alt: "Gold Lodge Garden",
      },
      {
        src: "/images/crocodile/gold/IMG-20250307-WA0019.jpg",
        alt: "Gold Lodge Amenity",
      },
      {
        src: "/images/crocodile/gold/IMG-20250307-WA0012.jpg",
        alt: "Gold Lodge Feature",
      },
      {
        src: "/images/crocodile/gold/IMG_20250226_192834.jpg",
        alt: "Gold Lodge Evening",
      },
      {
        src: "/images/crocodile/gold/IMG_20250226_134129.jpg",
        alt: "Gold Lodge Dining",
      },
      {
        src: "/images/crocodile/gold/IMG_20250226_134110.jpg",
        alt: "Gold Lodge Lounge",
      },
      {
        src: "/images/crocodile/gold/IMG_20250226_132636.jpg",
        alt: "Gold Lodge Pool",
      },
    ],
    mango1stfloor: [
      { src: "/images/mango 1st floor/1st floor 1.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 2.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 3.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 4.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 5.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 6.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 7.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 8.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 9.jpg", alt: "Mango 1st Floor" },
      { src: "/images/mango 1st floor/1st floor 10.jpg", alt: "Mango 1st Floor" },
    ],
    mangopark: [
      { src: "/images/mango park/Maisons Diani-photos-Pierre_Rich-55.jpg", alt: "Mango Park" },
      { src: "/images/mango park/Maisons Diani-photos-Pierre_Rich-52.jpg", alt: "Mango Park" },
      { src: "/images/mango park/Maisons Diani-photos-Pierre_Rich-61_BD.jpg", alt: "Mango Park" },
      { src: "/images/mango park/Maisons Diani-photos-Pierre_Rich-58.jpg", alt: "Mango Park" },
      { src: "/images/mango park/Maisons Diani-photos-Pierre_Rich-57.jpg", alt: "Mango Park" },
      { src: "/images/mango park/20250731_100752.jpg", alt: "Mango Park" },
      { src: "/images/mango park/20250731_100808.jpg", alt: "Mango Park" },
      { src: "/images/mango park/20250731_100905.jpg", alt: "Mango Park" },
      { src: "/images/mango park/20250731_101142.jpg", alt: "Mango Park" },
    ],
  };

  const currentImages = galleryData[activeSection as keyof typeof galleryData] ?? [];

  const sections = [
    { id: "general", label: "General", color: "#c8b89a" },
    { id: "blue", label: "Blue Villa", color: "#3b82f6" },
    { id: "green", label: "Green Villa", color: "#10b981" },
    { id: "gold", label: "Gold Lodge", color: "#eab308" },
    { id: "mango1stfloor", label: "Mango Villas 1st Floor", color: "#f97316" },
    { id: "mangopark", label: "Mango Villas", color: "#84cc16" },
  ];

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
          --croc-water: #686868;
          --croc-sky: #c0c0c0;
          --text-dark: #0a0a0a;
          --text-light: #f0f0f0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Cormorant Garamond', serif;
          background: #ffffff;
          color: #0a0a0a;
          overflow-x: hidden;
        }

        /* NAV */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 28px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%);
          backdrop-filter: blur(2px);
        }

        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--croc-cream);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .nav-logo span { color: var(--croc-gold); }

        .nav-links {
          display: flex;
          gap: 44px;
          list-style: none;
        }
        .nav-links a {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-cream);
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.3s, color 0.3s;
        }
        .nav-links a:hover { opacity: 1; color: var(--croc-gold); }

        .nav-links a, .nav-links button {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-cream);
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.3s, color 0.3s;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .nav-links a:hover, .nav-links button:hover { opacity: 1; color: var(--croc-gold); }

        .nav-book {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-deep);
          background: var(--croc-gold);
          padding: 12px 28px;
          text-decoration: none;
          transition: background 0.3s, transform 0.2s;
        }
        .nav-book:hover { background: var(--croc-amber); transform: translateY(-1px); }

        /* HAMBURGER MENU */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 101;
        }

        .hamburger span {
          width: 24px;
          height: 2px;
          background: var(--croc-cream);
          transition: all 0.3s ease;
          display: block;
        }

        .hamburger.active span:nth-child(1) {
          transform: rotate(45deg) translate(8px, 8px);
        }

        .hamburger.active span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.active span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -7px);
        }

        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(10, 10, 10, 0.98);
          z-index: 50;
          padding-top: 100px;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          backdrop-filter: blur(4px);
        }

        .mobile-menu.active {
          display: flex;
        }

        .mobile-menu a, .mobile-menu button {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-cream);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.3s;
        }

        .mobile-menu a:hover, .mobile-menu button:hover {
          color: var(--croc-gold);
        }

        .mobile-menu .nav-book {
          display: inline-block;
          margin-top: 20px;
          font-size: 0.75rem;
        }

        /* GALLERY */
        .gallery-container {
          min-height: 100vh;
          background: #ffffff;
          padding-top: 120px;
          padding-bottom: 80px;
        }

        .gallery-header {
          text-align: center;
          margin-bottom: 60px;
          padding: 0 60px;
        }

        .gallery-eyebrow {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(10,10,10,0.45);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .gallery-eyebrow::before {
          content: '';
          display: block;
          width: 50px;
          height: 1px;
          background: rgba(10,10,10,0.2);
        }
        .gallery-eyebrow::after {
          content: '';
          display: block;
          width: 50px;
          height: 1px;
          background: rgba(10,10,10,0.2);
        }

        .gallery-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          color: #0a0a0a;
          margin-bottom: 40px;
        }

        /* SECTION TABS */
        .section-tabs {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 80px;
          flex-wrap: wrap;
          padding: 0 60px;
        }

        .section-tab {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 14px 28px;
          border: 1px solid rgba(10,10,10,0.2);
          background: transparent;
          color: #0a0a0a;
          cursor: pointer;
          transition: all 0.3s;
        }

        .section-tab.active {
          background: #0a0a0a;
          color: #ffffff;
          border-color: #0a0a0a;
        }

        .section-tab:hover {
          border-color: #0a0a0a;
          color: #0a0a0a;
          background: rgba(10,10,10,0.06);
        }

        /* GALLERY ITEMS */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 60px;
        }

        .gallery-item {
          position: relative;
          overflow: hidden;
          aspect-ratio: 1;
          cursor: pointer;
          group: 'image';
        }

        .gallery-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .gallery-item:hover .gallery-item-img {
          transform: scale(1.08);
        }

        .gallery-item-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10,10,10,0.6);
          opacity: 0;
          transition: opacity 0.4s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gallery-item:hover .gallery-item-overlay {
          opacity: 1;
        }
        .gallery-item { cursor: zoom-in; }

        /* Full-page image viewer */
        .img-viewer {
          position: fixed; inset: 0; background: #0a0a0a;
          display: flex; flex-direction: column;
          z-index: 9999;
        }
        .img-viewer-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 28px; flex-shrink: 0;
        }
        .img-viewer-back {
          display: inline-flex; align-items: center; gap: 8px;
          background: none; border: none; color: rgba(255,255,255,0.75);
          font-family: 'Josefin Sans', sans-serif; font-size: 0.68rem;
          letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer;
          transition: color 0.2s; padding: 0;
        }
        .img-viewer-back:hover { color: #fff; }
        .img-viewer-counter {
          font-family: 'Josefin Sans', sans-serif; font-size: 0.68rem;
          letter-spacing: 0.15em; color: rgba(255,255,255,0.45);
        }
        .img-viewer-stage {
          flex: 1; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; width: 100%;
        }
        .img-viewer-img {
          width: 100%; height: 100%;
          object-fit: contain; display: block;
          user-select: none;
        }
        .img-viewer-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.1); border: none; color: #fff;
          font-size: 2.4rem; width: 52px; height: 52px; border-radius: 50%;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .img-viewer-arrow:hover { background: rgba(255,255,255,0.22); }
        .img-viewer-arrow--prev { left: 14px; }
        .img-viewer-arrow--next { right: 14px; }
        .img-viewer-label {
          text-align: center; padding: 14px 28px; flex-shrink: 0;
          font-family: 'Josefin Sans', sans-serif; font-size: 0.65rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }
        @media (max-width: 600px) {
          .img-viewer-arrow { width: 40px; height: 40px; font-size: 1.8rem; }
          .img-viewer-arrow--prev { left: 6px; }
          .img-viewer-arrow--next { right: 6px; }
        }

        .gallery-item-text {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: var(--croc-cream);
          text-align: center;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .gallery-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
          .gallery-header { padding: 0 30px; }
          .section-tabs { padding: 0 30px; }
          .gallery-grid { padding: 0 30px; }
          nav { padding: 24px 30px; }
        }

        @media (max-width: 600px) {
          .gallery-grid { grid-template-columns: 1fr; }
          .gallery-title { font-size: 2rem; }
          .section-tabs { gap: 10px; }
          .section-tab { padding: 10px 16px; font-size: 0.65rem; }
          .gallery-container { padding-top: 100px; }
          .hamburger { display: flex; }
          .nav-links { display: none; }
          .nav-book { display: none; }
          nav { padding: 20px 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <Link to="/" className="nav-logo">
          Croc<span>odile</span> Lodge
        </Link>
        <ul className="nav-links">
          <li>
            <a href="/">Villas</a>
          </li>
          <li>
            <a href="#amenities">Amenities</a>
          </li>
          <li>
            <Link to="/gallery">Gallery</Link>
          </li>
          <li>
            <a href="/">Contact</a>
          </li>
        </ul>
        <button
          className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${mobileMenuOpen ? "active" : ""}`}>
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          Home
        </Link>
        <a href="/" onClick={() => setMobileMenuOpen(false)}>
          Villas
        </a>
        <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>
          Gallery
        </Link>
        <a href="/" onClick={() => setMobileMenuOpen(false)}>
          About
        </a>
        <a href="/" onClick={() => setMobileMenuOpen(false)}>
          Contact
        </a>
        <a
          href="/"
          className="nav-book"
          onClick={() => setMobileMenuOpen(false)}
        >
          Book Direct — Best Rate
        </a>
      </div>

      {/* GALLERY */}
      <section className="gallery-container">
        <div className="gallery-header">
          <div className="gallery-eyebrow">Our Collections</div>
          <h1 className="gallery-title">Photo Gallery</h1>
        </div>

        {/* Section Tabs */}
        <div className="section-tabs">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`section-tab ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
              style={
                activeSection === section.id
                  ? { borderColor: section.color }
                  : {}
              }
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {currentImages.map((image, index) => (
            <div key={index} className="gallery-item" onClick={() => { setViewerIndex(index); setViewerOpen(true); }}>
              <img src={image.src} alt={image.alt} className="gallery-item-img" />
              <div className="gallery-item-overlay">
                <div className="gallery-item-text">{image.alt}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full-page image viewer */}
      {viewerOpen && (
        <div className="img-viewer">
          <div className="img-viewer-topbar">
            <button className="img-viewer-back" onClick={() => setViewerOpen(false)}>
              ← Back to gallery
            </button>
            <span className="img-viewer-counter">{viewerIndex + 1} / {currentImages.length}</span>
          </div>
          <div className="img-viewer-stage">
            {viewerIndex > 0 && (
              <button className="img-viewer-arrow img-viewer-arrow--prev" onClick={() => setViewerIndex((i) => i - 1)}>&#8249;</button>
            )}
            <img
              className="img-viewer-img"
              src={currentImages[viewerIndex]?.src}
              alt={currentImages[viewerIndex]?.alt}
            />
            {viewerIndex < currentImages.length - 1 && (
              <button className="img-viewer-arrow img-viewer-arrow--next" onClick={() => setViewerIndex((i) => i + 1)}>&#8250;</button>
            )}
          </div>
          <div className="img-viewer-label">{currentImages[viewerIndex]?.alt}</div>
        </div>
      )}
    </>
  );
};

export default Gallery;
