import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VillaCard from "./components/VillaCard";
import DetailsModal from "./components/DetailsModal";
import type { Villa } from "./types";
import { VILLAS, getVillaPrice } from "./types";

const CrocodileLodge: React.FC = () => {
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState<string>("");
  const [checkout, setCheckout] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedVilla, setSelectedVilla] = useState<Villa | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [guests, setGuests] = useState<number>(1);
  const [accommodationType, setAccommodationType] = useState<string>("Villa");

  // Set default dates on mount
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    setCheckin(fmt(today));
    setCheckout(fmt(tomorrow));
  }, []);

  // Scroll Reveal Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const getNightsCount = (): number => {
    if (!checkin || !checkout) return 0;
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    return Math.max(
      0,
      Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
    );
  };

  const getVillasOfType = (type: string): Villa[] =>
    VILLAS.filter((v) => v.type === type);

  const handleCheckAvailability = async () => {
    if (!checkin || !checkout) {
      alert("Please select check-in and check-out dates.");
      return;
    }
    if (getNightsCount() <= 0) {
      alert("Check-out date must be after check-in date.");
      return;
    }
    try {
      const villasOfType = getVillasOfType(accommodationType);
      let availableVilla: Villa | null = null;

      for (const villa of villasOfType) {
        const params = new URLSearchParams({
          property: villa.name,
          checkin,
          checkout,
        });
        const res = await fetch(`/api/availability?${params}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.available) {
          availableVilla = villa;
          break;
        }
      }

      if (availableVilla) {
        const pricePerNight = getVillaPrice(availableVilla.id, guests) ?? 0;
        const totalPrice = pricePerNight * getNightsCount();
        navigate(
          `/reservation?villaId=${availableVilla.id}&guestCount=${guests}&price=${totalPrice}&checkIn=${checkin}&checkOut=${checkout}`,
        );
      } else {
        alert(
          `No ${accommodationType.toLowerCase()} is available for your selected dates. Please try different dates or another accommodation type.`,
        );
      }
    } catch {
      alert("Could not check availability. Please try again.");
    }
  };

  const handleSelectVilla = (villa: Villa) => {
    setSelectedVilla(villa);
    setShowModal(true);
  };

  const handleReserve = (
    villaId: string,
    guestCount: number,
    price: number,
    checkIn: string,
    checkOut: string,
  ) => {
    setShowModal(false);
    navigate(
      `/reservation?villaId=${villaId}&guestCount=${guestCount}&price=${price}&checkIn=${checkIn}&checkOut=${checkOut}`,
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
          --croc-water: #686868;
          --croc-sky: #c0c0c0;
          --text-dark: #0a0a0a;
          --text-light: #f0f0f0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Cormorant Garamond', serif;
          background: var(--croc-deep);
          color: var(--croc-cream);
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
          background: rgba(13, 26, 15, 0.98);
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

        /* HERO */
        .hero {
          height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: url('/images/goldvilla.jpg') center center / cover no-repeat;
        }

        .hero-gate-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.7) 100%);
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 900px;
          padding: 0 40px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .booking-bar-hero {
          position: relative;
          z-index: 10;
          width: 100%;
        }

        .hero-eyebrow {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--croc-gold);
          margin-bottom: 28px;
          opacity: 0;
          animation: fade-up 1s ease 0.3s forwards;
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 6vw, 6rem);
          font-weight: 900;
          line-height: 1.05;
          color: var(--croc-cream);
          opacity: 0;
          animation: fade-up 1s ease 0.5s forwards;
          margin-bottom: 0;
        }
        .hero-title em {
          font-style: italic;
          color: var(--croc-gold);
          display: block;
        }

        .btn-primary {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-deep);
          background: var(--croc-gold);
          padding: 18px 42px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--croc-amber);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .btn-primary:hover::before { transform: translateX(0); }
        .btn-primary span { position: relative; z-index: 1; }

        .btn-ghost {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 300;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-cream);
          text-decoration: none;
          border-bottom: 1px solid rgba(240,240,240,0.3);
          padding-bottom: 3px;
          transition: border-color 0.3s, color 0.3s;
        }
        .btn-ghost:hover { border-color: var(--croc-gold); color: var(--croc-gold); }

        .hero-stats {
          position: absolute;
          bottom: 60px;
          right: 10%;
          display: flex;
          gap: 50px;
          opacity: 0;
          animation: fade-up 1s ease 1.1s forwards;
        }
        .stat-item { text-align: center; }
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--croc-gold);
          display: block;
        }
        .stat-label {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(240,240,240,0.5);
        }

        .scroll-hint {
          position: absolute;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          opacity: 0;
          animation: fade-in 1s ease 1.5s forwards;
        }
        .scroll-hint span {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.55rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(240,240,240,0.4);
        }
        .scroll-line {
          width: 1px;
          height: 60px;
          background: linear-gradient(180deg, var(--croc-gold), transparent);
          animation: scroll-pulse 2s ease-in-out infinite;
        }
        @keyframes scroll-pulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.1); }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* WHATSAPP FLOAT */
        .whatsapp-float {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          animation: fade-in 1s ease 1s forwards;
          opacity: 0;
        }

        .whatsapp-label {
          background: #fff;
          color: #128c7e;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 8px 14px;
          border-radius: 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          white-space: nowrap;
          opacity: 0;
          transform: translateX(10px);
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: none;
        }

        .whatsapp-float:hover .whatsapp-label {
          opacity: 1;
          transform: translateX(0);
        }

        .whatsapp-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25d366;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37,211,102,0.45);
          transition: transform 0.3s, box-shadow 0.3s;
          flex-shrink: 0;
        }

        .whatsapp-float:hover .whatsapp-btn {
          transform: scale(1.08);
          box-shadow: 0 6px 26px rgba(37,211,102,0.6);
        }

        .whatsapp-btn svg {
          width: 30px;
          height: 30px;
          fill: #fff;
        }

        /* CAROUSEL */
        .carousel-container {
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          animation: fade-in 1s ease 0.5s forwards;
        }

        .carousel-slides {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .carousel-slide {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 0.8s ease;
        }

        .carousel-slide.active {
          opacity: 1;
        }

        .carousel-controls {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .carousel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(144,144,144,0.3);
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid rgba(144,144,144,0.5);
        }

        .carousel-dot.active {
          background: var(--croc-gold);
          width: 28px;
          border-radius: 5px;
        }

        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          background: rgba(10,10,10,0.5);
          border: 1px solid rgba(144,144,144,0.4);
          color: var(--croc-gold);
          font-size: 1.6rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .carousel-btn:hover {
          background: rgba(10,10,10,0.8);
          border-color: var(--croc-gold);
        }

        .carousel-btn.prev {
          left: 10px;
        }

        .carousel-btn.next {
          right: 10px;
        }

        /* BOOKING SECTION */
        .booking-section {
          background: var(--croc-sand);
          padding: 0;
          position: relative;
          z-index: 10;
        }

        .booking-bar {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 60px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto;
          gap: 0;
          background: var(--croc-sand);
        }

        .booking-field {
          padding: 32px 40px;
          border-right: 1px solid rgba(10,10,10,0.15);
          position: relative;
        }

        .booking-field label {
          display: block;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(10,10,10,0.5);
          margin-bottom: 8px;
        }

        .booking-field input, .booking-field select {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: var(--croc-deep);
          cursor: pointer;
        }

        .booking-field select option { background: var(--croc-sand); }

        .booking-check {
          padding: 32px 40px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
        }
        .booking-check span {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(10,10,10,0.5);
        }

        .booking-submit {
          background: var(--croc-forest);
          color: var(--croc-cream);
          border: none;
          padding: 0 50px;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s;
          white-space: nowrap;
        }
        .booking-submit:hover { background: var(--croc-moss); }

        /* BOOKING RESULT SECTION */
        .booking-result-section {
          background: var(--croc-cream);
          padding: 100px 60px;
          display: flex;
          justify-content: center;
        }

        .booking-widget {
          max-width: 640px;
          width: 100%;
          text-align: center;
        }

        .booking-widget .section-title { color: var(--croc-deep); }
        .booking-widget .section-title em { color: var(--croc-moss); }
        .booking-widget .section-tag { color: var(--croc-gold); }

        .price-summary {
          background: white;
          border: 1px solid rgba(10,10,10,0.1);
          padding: 32px 40px;
          margin: 0 0 32px;
          text-align: left;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(10,10,10,0.07);
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--croc-deep);
        }

        .price-row:last-child { border-bottom: none; }

        .price-total {
          border-top: 2px solid var(--croc-gold) !important;
          border-bottom: none !important;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .price-total span:last-child {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: var(--croc-moss);
          font-weight: 700;
        }

        .booking-hint {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-style: italic;
          color: rgba(10,10,10,0.5);
          margin: 32px 0;
          line-height: 1.7;
        }

        .checking-avail {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--croc-gold);
          margin: 40px 0;
          animation: avail-pulse 1.4s ease-in-out infinite;
        }

        @keyframes avail-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .avail-result {
          padding: 36px 40px;
          margin: 8px 0 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
        }

        .avail-available {
          background: #0a0a0a;
          border: 1px solid #0a0a0a;
        }

        .avail-booked {
          background: rgba(10,10,10,0.04);
          border: 1px solid rgba(10,10,10,0.18);
        }

        .avail-icon {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1;
        }

        .avail-available .avail-icon { color: var(--croc-cream); }
        .avail-booked .avail-icon { color: var(--croc-sage); }

        .avail-text {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .avail-text strong {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-deep);
        }

        .avail-available .avail-text strong { color: var(--croc-cream); }

        .avail-text span {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          color: rgba(10,10,10,0.65);
          line-height: 1.6;
        }

        .avail-available .avail-text span { color: rgba(240,240,240,0.72); }

        .avail-text em { font-style: italic; color: var(--croc-sage); }
        .avail-available .avail-text em { color: var(--croc-sky); }

        .btn-reserve {
          background: var(--croc-cream);
          color: var(--croc-deep);
          border: none;
          padding: 16px 44px;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s, color 0.3s;
          margin-top: 8px;
        }

        .btn-reserve:hover { background: var(--croc-sand); color: var(--croc-deep); }

        .booking-footnote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: rgba(10,10,10,0.4);
          margin-top: 32px;
        }

        /* AVAILABILITY CALENDAR (legacy — kept for reference) */
        .availability-section {
          background: white;
          padding: 100px 60px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 70px;
        }

        .section-tag {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.62rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--croc-gold);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .section-tag::before, .section-tag::after {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background: var(--croc-gold);
          opacity: 0.5;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 4vw, 3.5rem);
          font-weight: 700;
          color: var(--croc-deep);
          line-height: 1.15;
        }
        .section-title em { font-style: italic; color: var(--croc-gold); }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
          max-width: 900px;
          margin: 0 auto;
        }

        .calendar-month {
          background: var(--croc-sand);
          border: 1px solid rgba(144,144,144,0.2);
          padding: 30px;
        }

        .calendar-month-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: var(--croc-deep);
          text-align: center;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cal-nav {
          background: none;
          border: 1px solid rgba(144,144,144,0.3);
          color: var(--croc-deep);
          width: 30px; height: 30px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cal-nav:hover { background: rgba(144,144,144,0.2); }

        .calendar-days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }
        .day-name {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(144,144,144,0.6);
          text-align: center;
          padding: 6px 0;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .cal-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.75rem;
          color: rgba(144,144,144,0.7);
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s;
          position: relative;
        }
        .cal-day:hover:not(.booked):not(.empty) {
          background: rgba(144,144,144,0.2);
          color: var(--croc-deep);
        }
        .cal-day.available { color: var(--croc-deep); }
        .cal-day.booked {
          background: rgba(144,144,144,0.1);
          cursor: not-allowed;
          text-decoration: line-through;
          color: rgba(144,144,144,0.3);
        }
        .cal-day.selected {
          background: var(--croc-deep);
          color: var(--croc-sand);
          font-weight: 400;
        }
        .cal-day.today::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%; transform: translateX(-50%);
          width: 3px; height: 3px;
          border-radius: 50%;
          background: var(--croc-gold);
        }
        .cal-day.empty { cursor: default; }

        .calendar-legend {
          display: flex;
          gap: 24px;
          justify-content: center;
          margin-top: 30px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240,240,240,0.5);
        }
        .legend-dot {
          width: 10px; height: 10px;
          border-radius: 2px;
        }
        .legend-dot.available { background: var(--croc-cream); }
        .legend-dot.booked { background: rgba(240,240,240,0.1); border: 1px solid rgba(240,240,240,0.2); }
        .legend-dot.selected { background: var(--croc-gold); }

        /* VILLAS SECTION */
        .villas-section {
          background: white;
          padding: 120px 60px;
          position: relative;
          overflow: hidden;
        }
        .villas-section::before {
          content: 'VILLAS';
          position: absolute;
          top: 50%;
          left: -2%;
          transform: translateY(-50%) rotate(-90deg);
          font-family: 'Playfair Display', serif;
          font-size: 15rem;
          font-weight: 900;
          color: rgba(240,240,240,0.02);
          letter-spacing: 0.1em;
          white-space: nowrap;
          pointer-events: none;
        }

        .villas-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 1fr;
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .villa-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background: white;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(13, 26, 15, 0.15);
          transition: box-shadow 0.3s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .villa-card:hover {
          box-shadow: 0 8px 24px rgba(13, 26, 15, 0.25);
        }
        .villa-card-header h3 {
          color: #000000;
          font-size: 1.4rem;
        }
        .villa-card-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
          padding: 20px;
        }
        
        .villa-guests {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.85rem;
          color: rgba(13, 26, 15, 0.7);
          margin: 0;
        }
        .villa-guests strong {
          color: var(--croc-deep);
          font-weight: 600;
        }
        
        .villa-description {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.95rem;
          color: rgba(13, 26, 15, 0.65);
          line-height: 1.5;
          margin: 0;
          flex-grow: 1;
        }
        
        .villa-status {
          display: flex;
          align-items: center;
        }
        .status-available {
          color: var(--croc-moss);
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .status-unavailable {
          color: var(--croc-sage);
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .villa-card-buttons {
          display: flex;
          gap: 12px;
          margin-top: auto;
        }
        .btn-view-details,
        .btn-reserve-quick {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 4px;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: white;
          cursor: pointer;
          transition: opacity 0.3s, transform 0.2s;
        }
        .btn-view-details:hover:not(:disabled),
        .btn-reserve-quick:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .btn-view-details:disabled,
        .btn-reserve-quick:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .villa-card-image {
          width: 100%;
          height: 280px;
          overflow: hidden;
          position: relative;
        }
        .villa-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .villa-card:hover .villa-card-image img {
          transform: scale(1.05);
        }

        .villa-img-bg {
          height: 380px;
          transition: transform 0.6s ease;
          position: relative;
          overflow: hidden;
        }
        .villa-card:nth-child(1) .villa-img-bg { background: linear-gradient(135deg, #111111 0%, #222222 50%, #0a0a0a 100%); }
        .villa-card:nth-child(2) .villa-img-bg { background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 50%, #141414 100%); }
        .villa-card:nth-child(3) .villa-img-bg { background: linear-gradient(135deg, #262626 0%, #3a3a3a 50%, #1e1e1e 100%); }

        /* Decorative villa illustrations */
        .villa-decoration {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.15;
          font-size: 6rem;
        }

        .villa-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.88) 100%);
          opacity: 0.7;
          transition: opacity 0.4s;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 36px;
        }
        .villa-category {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.58rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--croc-gold);
          margin-bottom: 10px;
        }
        .villa-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--croc-cream);
          margin-bottom: 10px;
          line-height: 1.2;
        }
        .villa-detail {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.95rem;
          font-style: italic;
          color: rgba(240,240,240,0.65);
          margin-bottom: 20px;
        }
        .villa-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 18px;
        }
        .price-num {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          color: var(--croc-gold);
        }
        .price-per {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: rgba(240,240,240,0.4);
        }
        .villa-btn {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--croc-deep);
          background: var(--croc-gold);
          padding: 12px 24px;
          text-decoration: none;
          display: inline-block;
          width: fit-content;
          transition: background 0.3s;
        }
        .villa-btn:hover { background: var(--croc-amber); }

        /* AMENITIES SECTION */
        .amenities-section {
          background: white;
          padding: 120px 60px;
          color: var(--croc-deep);
        }

        /* Section tag overrides for light-background sections */
        .amenities-section .section-tag,
        .villas-section .section-tag,
        .testimonials-section .section-tag,
        .experience-section .section-tag,
        .booking-widget .section-tag { color: var(--croc-sage); }

        .amenities-section .section-tag::before,
        .amenities-section .section-tag::after,
        .villas-section .section-tag::before,
        .villas-section .section-tag::after,
        .testimonials-section .section-tag::before,
        .testimonials-section .section-tag::after { background: var(--croc-sage); opacity: 0.6; }

        .amenities-section .section-title { color: var(--croc-deep); }
        .amenities-section .section-title em { color: var(--croc-moss); }

        .amenities-intro {
          font-size: 1.2rem;
          font-style: italic;
          color: rgba(10,10,10,0.6);
          max-width: 600px;
          margin: 24px auto 70px;
          text-align: center;
          line-height: 1.8;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .amenity-card {
          background: rgba(10,10,10,0.03);
          border: 1px solid rgba(10,10,10,0.08);
          padding: 44px 28px;
          text-align: center;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          font-family: sans-serif;
        }
        .amenity-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--croc-deep);
          transform: translateY(100%);
          transition: transform 0.4s ease;
        }
        .amenity-card:hover::before { transform: translateY(0); }
        .amenity-card:hover .amenity-icon { transform: scale(1.2) rotate(10deg); }
        .amenity-card:hover .amenity-name { color: var(--croc-cream); }
        .amenity-card:hover .amenity-desc { color: rgba(240,240,240,0.6); }

        .amenity-icon {
          font-size: 2.4rem;
          margin-bottom: 20px;
          display: block;
          position: relative;
          z-index: 1;
          transition: transform 0.4s ease;
        }
        .amenity-name {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--croc-deep);
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
          line-height: 1.3;
        }
        .amenity-desc {
          font-size: 0.82rem;
          font-style: italic;
          color: rgba(10,10,10,0.65);
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        .amenities-row2 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
          max-width: 1200px;
          margin: 2px auto 0;
        }

        /* EXPERIENCE SECTION */
        .experience-section {
          background: white;
          padding: 120px 0;
          position: relative;
          overflow: hidden;
        }

        .experience-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 60px;
          gap: 80px;
          align-items: center;
        }

        .experience-visual {
          position: relative;
        }

        .exp-main-img {
          width: 100%;
          height: 560px;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #111111 100%);
          position: relative;
          overflow: hidden;
        }
        .exp-main-img::before {
          content: '🌊';
          position: absolute;
          font-size: 12rem;
          opacity: 0.07;
          bottom: -20px;
          right: -20px;
        }
        .exp-main-img::after {
          content: '🌴';
          position: absolute;
          font-size: 8rem;
          opacity: 0.1;
          top: 20px;
          left: 20px;
        }

        .exp-float-card {
          position: absolute;
          bottom: -30px;
          right: -30px;
          background: var(--croc-gold);
          color: var(--croc-deep);
          padding: 30px;
          width: 180px;
          text-align: center;
        }
        .exp-float-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 900;
          display: block;
          line-height: 1;
        }
        .exp-float-label {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.58rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.7;
          line-height: 1.4;
          margin-top: 6px;
        }

        .experience-text .section-tag { justify-content: flex-start; }
        .experience-text .section-tag::before { display: none; }
        .experience-text .section-title { text-align: left; margin-bottom: 24px; }

        .exp-desc {
          font-size: 1.08rem;
          font-style: italic;
          color: rgba(10,10,10,0.65);
          line-height: 1.9;
          margin-bottom: 40px;
        }

        .exp-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 44px;
        }
        .exp-feature {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(240,240,240,0.07);
        }
        .exp-feature:last-child { border: none; padding: 0; }
        .exp-feature-icon {
          width: 44px; height: 44px;
          border: 1px solid rgba(144,144,144,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          color: var(--croc-gold);
        }
        .exp-feature-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--croc-cream);
          margin-bottom: 4px;
        }
        .exp-feature-desc {
          font-size: 0.88rem;
          font-style: italic;
          color: rgba(240,240,240,0.5);
          line-height: 1.5;
        }

        /* TESTIMONIALS */
        .testimonials-section {
          background: white;
          padding: 100px 60px;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          max-width: 1100px;
          margin: 60px auto 0;
        }

        .testimonial-card {
          background: rgba(10,10,10,0.03);
          border: 1px solid rgba(10,10,10,0.1);
          padding: 40px;
          position: relative;
        }
        .testimonial-card::before {
          content: '"';
          font-family: 'Playfair Display', serif;
          font-size: 6rem;
          color: var(--croc-gold);
          opacity: 0.2;
          position: absolute;
          top: 10px;
          left: 28px;
          line-height: 1;
        }

        .testimonial-text {
          font-size: 1rem;
          font-style: italic;
          color: rgba(10,10,10,0.7);
          line-height: 1.8;
          margin-bottom: 28px;
          padding-top: 30px;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .author-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .avatar-1 { background: linear-gradient(135deg, #141414, #2e2e2e); }
        .avatar-2 { background: linear-gradient(135deg, #2a2a2a, #484848); }
        .avatar-3 { background: linear-gradient(135deg, #484848, #6a6a6a); }

        .author-name {
          font-family: 'Playfair Display', serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--croc-deep);
        }
        .author-origin {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.58rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(10,10,10,0.5);
          margin-top: 2px;
        }

        .stars {
          color: var(--croc-gold);
          font-size: 0.7rem;
          letter-spacing: 2px;
          margin-bottom: 14px;
        }

        /* CONTACT/FOOTER */
        footer {
          background: var(--croc-sand);
          padding: 100px 60px 50px;
          border-top: 1px solid rgba(144,144,144,0.15);
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          max-width: 1200px;
          margin: 0 auto 80px;
        }

        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--croc-deep);
          margin-bottom: 16px;
        }
        .footer-logo span { color: var(--croc-deep); }
        .footer-tagline {
          font-size: 0.95rem;
          font-style: italic;
          color: rgba(10,10,10,0.65);
          line-height: 1.7;
          margin-bottom: 30px;
          max-width: 280px;
        }

        .social-links {
          display: flex;
          gap: 14px;
        }
        .social-link {
          width: 38px; height: 38px;
          border: 1px solid rgba(10,10,10,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          text-decoration: none;
          color: var(--croc-deep);
          transition: all 0.3s;
        }
        .social-link:hover { background: var(--croc-deep); color: var(--croc-sand); border-color: var(--croc-deep); }

        .footer-col h4 {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--croc-deep);
          margin-bottom: 24px;
        }

        .footer-col ul { list-style: none; }
        .footer-col ul li { margin-bottom: 12px; }
        .footer-col ul li a {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.95rem;
          color: rgba(10,10,10,0.65);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-col ul li a:hover { color: var(--croc-deep); }

        .footer-contact-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: flex-start;
        }
        .contact-icon {
          width: 20px;
          text-align: center;
          color: var(--croc-deep);
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 0.85rem;
        }
        .contact-text {
          font-size: 0.88rem;
          color: rgba(10,10,10,0.65);
          line-height: 1.5;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 40px;
          border-top: 1px solid rgba(10,10,10,0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .copyright {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: rgba(10,10,10,0.5);
        }
        .footer-legal {
          display: flex;
          gap: 30px;
        }
        .footer-legal a {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: rgba(10,10,10,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-legal a:hover { color: var(--croc-deep); }

        /* Reveal animation */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          nav { padding: 24px 30px; }
          .nav-links { display: none; }
          .hero-content { padding-left: 6%; }
          .hero-stats { right: 6%; gap: 30px; }
          .booking-bar { grid-template-columns: 1fr 1fr; }
          .booking-submit { grid-column: span 2; padding: 20px; }
          .booking-bar .booking-field:last-of-type { grid-column: span 2; }
          .booking-result-section { padding: 80px 24px; }
          .price-summary { padding: 24px; }
          .avail-result { padding: 28px 24px; }
          .villas-grid, .villa-row-2 { grid-template-columns: 1fr; }
          .amenities-grid, .amenities-row2 { grid-template-columns: repeat(3, 1fr); }
          .experience-inner { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; gap: 40px; }
          .booking-field { padding: 24px 20px; }
        }

        @media (max-width: 600px) {
          .amenities-grid, .amenities-row2 { grid-template-columns: repeat(2, 1fr); }
          .testimonials-grid { grid-template-columns: 1fr; }
          .hero-stats { display: none; }
          .calendar-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr; }
          footer { padding: 60px 24px 40px; }
          .amenities-section, .villas-section, .experience-section, .testimonials-section { padding: 80px 24px; }
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
            <a href="#villas">Villas</a>
          </li>
          <li>
            <a href="#amenities">Amenities</a>
          </li>
          <li>
            <Link to="/gallery">Gallery</Link>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
        <a href="#availability" className="nav-book">
          Book Direct — Best Rate
        </a>
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
        <a href="#villas" onClick={() => setMobileMenuOpen(false)}>
          Villas
        </a>
        <a href="#amenities" onClick={() => setMobileMenuOpen(false)}>
          Amenities
        </a>
        <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>
          Gallery
        </Link>
        <a href="#about" onClick={() => setMobileMenuOpen(false)}>
          About
        </a>
        <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
          Contact
        </a>
        <a
          href="#availability"
          className="nav-book"
          onClick={() => setMobileMenuOpen(false)}
        >
          Book Direct — Best Rate
        </a>
      </div>

      {/* HERO */}
      <section className="hero" id="availability">
        <div className="hero-gate-overlay"></div>

        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to
            <br />
            <em>Crocodile Lodge</em>
          </h1>
        </div>

        {/* BOOKING BAR */}
        <div className="booking-bar-hero">
          <div className="booking-bar">
            <div className="booking-field">
              <label>Check In</label>
              <input
                type="date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
              />
            </div>
            <div className="booking-field">
              <label>Check Out</label>
              <input
                type="date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
              />
            </div>
            <div className="booking-field">
              <label>Accommodation</label>
              <select
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value)}
              >
                <option value="Villa">Villa</option>
                <option value="Lodge">Lodge</option>
                <option value="Apartment">Apartment</option>
                <option value="Bungalow">Bungalow</option>
              </select>
            </div>
            <div className="booking-field">
              <label>Guests</label>
              <input
                type="number"
                min="1"
                max={getVillasOfType(accommodationType)[0]?.maxGuests ?? 21}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>
            <div className="booking-field">
              <label>Total Price</label>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.1rem",
                  color: "var(--croc-deep)",
                }}
              >
                {(() => {
                  const nights = getNightsCount();
                  if (nights <= 0) return "—";
                  const sampleVilla = getVillasOfType(accommodationType)[0];
                  const ppn = sampleVilla ? getVillaPrice(sampleVilla.id, guests) : null;
                  if (!ppn) return "—";
                  return `Ksh ${(ppn * nights).toLocaleString()}`;
                })()}
              </div>
            </div>
            <button
              className="booking-submit"
              onClick={handleCheckAvailability}
            >
              → Book Now
            </button>
          </div>
        </div>
      </section>

      {/* VILLAS */}
      <section className="villas-section" id="villas">
        <div className="section-header reveal" style={{ marginBottom: "60px" }}>
          <div className="section-tag">Our Accommodations</div>
          <h2 className="section-title">Crocodile Stay</h2>
        </div>

        <div className="villas-grid">
          {VILLAS.map((villa, index) => (
            <div key={villa.id} style={{ transitionDelay: `${index * 0.1}s` }}>
              <VillaCard villa={villa} onSelectVilla={handleSelectVilla} />
            </div>
          ))}
        </div>
      </section>

      {/* VILLA DETAILS MODAL */}
      {showModal && selectedVilla && (
        <DetailsModal
          villa={selectedVilla}
          checkInDate={checkin}
          checkOutDate={checkout}
          onClose={() => setShowModal(false)}
          onReserve={handleReserve}
        />
      )}

      {/* AMENITIES */}
      <section className="amenities-section" id="amenities">
        <div className="section-header reveal">
          <div className="section-tag">What Awaits You</div>
          <h2 className="section-title">
            The <em>Crocodile Villas</em> Experience
          </h2>
        </div>

        <div className="amenities-grid reveal">
          <div className="amenity-card">
            <div className="amenity-name">Swimming Pool</div>
            <div className="amenity-desc">
              Infinity-edge pool overlooking the coastal palms, heated to
              perfection year-round
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Quiet Ambience</div>
            <div className="amenity-desc">
              Surrounded by lush wetlands — the only sounds are birdsong and the
              tide
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Immaculate Cleanliness</div>
            <div className="amenity-desc">
              Daily housekeeping with eco-friendly products and pristine linen
              standards
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Private Villas</div>
            <div className="amenity-desc">
              Standalone villas with full privacy, your own entrance and outdoor
              space
            </div>
          </div>
        </div>

        <div
          className="amenities-row2 reveal"
          style={{ transitionDelay: "0.15s" }}
        >
          <div className="amenity-card">
            <div className="amenity-name">Family Houses</div>
            <div className="amenity-desc">
              Spacious multi-room houses designed for large families and group
              retreats
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Attentive Staff</div>
            <div className="amenity-desc">
              A trained team available around the clock for every need, big or
              small
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Full Amenities</div>
            <div className="amenity-desc">
              High-speed WiFi, air conditioning, outdoor kitchen, BBQ, beach
              equipment
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Wildlife Proximity Bora Bora</div>
            <div className="amenity-desc">
              Wake to monitor lizards, exotic birds, and the magic of coastal
              wetland life
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">Laundry &amp; Cleaning Services</div>
            <div className="amenity-desc">
              Full laundry and daily cleaning services available throughout your
              stay
            </div>
          </div>
          <div className="amenity-card">
            <div className="amenity-name">24hr Solar Power Supply</div>
            <div className="amenity-desc">
              Uninterrupted solar-powered electricity around the clock —
              reliable, clean, and eco-friendly
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              Croc<span>odile</span> Villas
            </div>
            <p className="footer-tagline">
              A coastal sanctuary where wild Kenya meets the Indian Ocean.
              Direct bookings always welcome.
            </p>
            <div className="social-links">
              <a
                href="https://www.facebook.com/share/1CWQwy8KEX/"
                className="social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@crocodilelodgediani?_r=1&_t=ZS-94XeUr1MiH7"
                className="social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              </a>
              <a
                href="https://wa.me/254715510119"
                className="social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="mailto:crocodilelodgediani@gmail.com"
                className="social-link"
                aria-label="Email"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li>
                <a href="#villas">Our Villas</a>
              </li>
              <li>
                <a href="#amenities">Amenities</a>
              </li>
              <li>
                <a href="#availability">Booking</a>
              </li>
              <li>
                <a href="#about">Our Story</a>
              </li>
              <li>
                <a href="#">Gallery</a>
              </li>
              <li>
                <a href="#">Activities</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Policies</h4>
            <ul>
              <li>
                <a href="#">Booking Policy</a>
              </li>
              <li>
                <a href="#">Cancellation</a>
              </li>
              <li>
                <a href="#">House Rules</a>
              </li>
              <li>
                <a href="#">Pet Policy</a>
              </li>
              <li>
                <a href="#">Privacy</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-item">
              <span className="contact-icon">📍</span>
              <span className="contact-text">
                Diani Beach Road,
                <br />
                Kwale County, Kenya
              </span>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">📞</span>
              <a
                href="https://wa.me/254715510119"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span className="contact-text">+254 715 510 119</span>
              </a>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">📧</span>
              <a
                href="mailto:crocodilelodgediani@gmail.com"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span className="contact-text">
                  crocodilelodgediani@gmail.com
                </span>
              </a>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">⏰</span>
              <span className="contact-text">Reception: 6am – 10pm daily</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="copyright">
            © 2026 Crocodile Villas. All rights reserved.
          </span>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOAT */}
      <a
        className="whatsapp-float"
        href="https://wa.me/254715510119"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <span className="whatsapp-label">Chat with us</span>
        <span className="whatsapp-btn">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.737 5.469 2.027 7.773L0 32l8.473-2.007A15.938 15.938 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.853l-.485-.29-5.027 1.19 1.213-4.903-.317-.503A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.87c-.397-.2-2.352-1.16-2.717-1.293-.364-.133-.63-.2-.896.2-.265.397-1.03 1.293-1.262 1.56-.232.265-.464.298-.86.1-.397-.2-1.676-.617-3.192-1.97-1.18-1.052-1.977-2.352-2.208-2.748-.232-.397-.025-.612.174-.81.179-.178.397-.464.596-.696.2-.232.265-.397.397-.663.133-.265.067-.497-.033-.696-.1-.2-.896-2.16-1.228-2.958-.323-.775-.65-.67-.896-.683l-.763-.013c-.265 0-.696.1-1.06.497-.364.397-1.393 1.36-1.393 3.317s1.427 3.847 1.626 4.113c.2.265 2.807 4.287 6.803 6.013.95.41 1.692.655 2.27.838.953.303 1.82.26 2.506.158.764-.114 2.352-.962 2.683-1.89.33-.928.33-1.724.232-1.89-.1-.165-.364-.265-.762-.464z" />
          </svg>
        </span>
      </a>
    </>
  );
};

export default CrocodileLodge;
