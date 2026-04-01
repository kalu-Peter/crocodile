import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { VILLAS } from "../types";
import CurrencySelector from "../components/CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";

function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface VillaStatus {
  villaId: string;
  available: boolean;
  price: number | null;
}

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const checkin = searchParams.get("checkin") ?? "";
  const checkout = searchParams.get("checkout") ?? "";
  const guests = Number(searchParams.get("guests") ?? 1);
  const nights = nightsBetween(checkin, checkout);

  const [statuses, setStatuses] = useState<Record<string, VillaStatus>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!checkin || !checkout) {
      setLoading(false);
      return;
    }

    const checkAll = async () => {
      setLoading(true);
      const results: Record<string, VillaStatus> = {};

      await Promise.all(
        VILLAS.map(async (villa) => {
          // Check availability — skip API if villa is marked unavailable in config
          let available = villa.isAvailable !== false;
          if (available) {
            try {
              const params = new URLSearchParams({
                property: villa.name,
                checkin,
                checkout,
              });
              const res = await fetch(`/api/availability?${params}`);
              if (res.ok) {
                const data = await res.json();
                available = !!data.available;
              }
            } catch {
              /* keep available=true on network error */
            }
          }

          // Fetch seasonal price
          let price: number | null = null;
          try {
            const res = await fetch(
              `/api/seasonal-price?villaId=${encodeURIComponent(villa.id)}&checkin=${checkin}`,
            );
            if (res.ok) {
              const data = await res.json();
              price = data.price ?? null;
            }
          } catch {
            /* fallback to base */
          }

          results[villa.id] = { villaId: villa.id, available, price };
        }),
      );

      setStatuses(results);
      setLoading(false);
    };

    checkAll();
  }, [checkin, checkout]);

  const handleReserve = (villaId: string) => {
    navigate(
      `/reservation?villaId=${villaId}&guestCount=${guests}&checkin=${checkin}&checkout=${checkout}`,
    );
  };

  return (
    <>
      <style>{`

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cormorant Garamond',serif; background:#fff; color:#0a0a0a; }

        .sr-nav {
          position:fixed; top:0; left:0; right:0; z-index:100;
          padding:22px 60px; display:flex; align-items:center; justify-content:space-between;
          background:rgba(201,168,76,0.92); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
          border-bottom:1px solid rgba(255,255,255,0.15);
        }
        .sr-nav-logo { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:#f0f0f0; text-decoration:none; }
        .sr-nav-logo span { color:#909090; }
        .sr-nav-links { display:flex; gap:36px; list-style:none; }
        .sr-nav-links a { font-family:'Josefin Sans',sans-serif; font-size:0.68rem; letter-spacing:0.18em; text-transform:uppercase; color:#f0f0f0; text-decoration:none; opacity:0.6; transition:opacity 0.2s; }
        .sr-nav-links a:hover { opacity:1; }
        .hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; }
        .hamburger span { width:22px; height:2px; background:#f0f0f0; display:block; }
        .mobile-menu { display:none; position:fixed; inset:0; background:rgba(10,10,10,0.97); z-index:50; flex-direction:column; align-items:center; justify-content:center; gap:28px; }
        .mobile-menu.open { display:flex; }
        .mobile-menu a { font-family:'Josefin Sans',sans-serif; font-size:1rem; letter-spacing:0.2em; text-transform:uppercase; color:#f0f0f0; text-decoration:none; }

        .sr-wrap { max-width:1200px; margin:0 auto; padding:110px 40px 80px; }

        .sr-header { margin-bottom:48px; }
        .sr-back { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; color:rgba(10,10,10,0.4); text-decoration:none; display:inline-flex; align-items:center; gap:6px; margin-bottom:24px; transition:color 0.2s; }
        .sr-back:hover { color:#0a0a0a; }
        .sr-title { font-family:'Playfair Display',serif; font-size:clamp(1.6rem,4vw,2.4rem); font-weight:700; margin-bottom:10px; }
        .sr-subtitle { font-family:'Josefin Sans',sans-serif; font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase; color:rgba(10,10,10,0.4); }

        .sr-grid {
          display:grid; grid-template-columns:repeat(auto-fill, minmax(340px,1fr)); gap:32px;
        }

        .sr-card {
          border:1px solid rgba(0,0,0,0.1); border-radius:12px; overflow:hidden;
          transition:box-shadow 0.2s, transform 0.2s;
        }
        .sr-card:hover { box-shadow:0 8px 32px rgba(0,0,0,0.1); transform:translateY(-2px); }
        .sr-card.unavailable { opacity:0.6; }

        .sr-card-img { position:relative; width:100%; height:220px; overflow:hidden; }
        .sr-card-img img { width:100%; height:100%; object-fit:cover; display:block; }
        .sr-card-badge {
          position:absolute; top:14px; right:14px;
          font-family:'Josefin Sans',sans-serif; font-size:0.6rem; letter-spacing:0.15em; text-transform:uppercase;
          padding:5px 12px; border-radius:20px;
        }
        .sr-card-badge.available     { background:rgba(16,185,129,0.9); color:#fff; }
        .sr-card-badge.reserved      { background:rgba(239,68,68,0.9);  color:#fff; }
        .sr-card-badge.opening-soon  { background:rgba(124,58,237,0.9); color:#fff; }

        .sr-card-body { padding:22px 24px 24px; }
        .sr-card-type { font-family:'Josefin Sans',sans-serif; font-size:0.58rem; letter-spacing:0.2em; text-transform:uppercase; color:rgba(10,10,10,0.35); margin-bottom:6px; }
        .sr-card-name { font-family:'Playfair Display',serif; font-size:1.25rem; font-weight:700; margin-bottom:10px; }
        .sr-card-meta { display:flex; gap:16px; font-family:'Josefin Sans',sans-serif; font-size:0.65rem; letter-spacing:0.06em; color:rgba(10,10,10,0.5); margin-bottom:16px; }
        .sr-card-amenities { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px; }
        .sr-card-amenity {
          background:#f5f5f5; border-radius:4px; padding:4px 10px;
          font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.04em; color:#555;
        }
        .sr-card-price { margin-bottom:18px; }
        .sr-card-price-main { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:700; color:#0a0a0a; }
        .sr-card-price-sub { font-family:'Josefin Sans',sans-serif; font-size:0.62rem; letter-spacing:0.08em; color:rgba(10,10,10,0.4); margin-top:2px; }
        .sr-card-price-total { font-family:'Josefin Sans',sans-serif; font-size:0.72rem; letter-spacing:0.06em; color:#0a0a0a; margin-top:4px; }

        .sr-btn-reserve {
          width:100%; padding:14px; background:#0a0a0a; color:#fff; border:none; border-radius:6px;
          font-family:'Josefin Sans',sans-serif; font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase;
          cursor:pointer; transition:background 0.2s;
        }
        .sr-btn-reserve:hover { background:#333; }
        .sr-btn-reserved {
          width:100%; padding:14px; background:#f5f5f5; color:#aaa; border:1px solid #e0e0e0; border-radius:6px;
          font-family:'Josefin Sans',sans-serif; font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase;
          cursor:not-allowed;
        }

        .sr-loading { text-align:center; padding:80px 0; font-family:'Josefin Sans',sans-serif; font-size:0.7rem; letter-spacing:0.2em; text-transform:uppercase; color:rgba(10,10,10,0.35); }

        @media(max-width:768px) {
          .sr-nav { padding:18px 20px; }
          .sr-nav-links { display:none; }
          .hamburger { display:flex; }
          .sr-wrap { padding:90px 20px 60px; }
          .sr-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="sr-nav">
        <Link to="/" className="sr-nav-logo">
          Croc<span>odile</span> Lodge
        </Link>
        <ul className="sr-nav-links">
          <li>
            <a href="/#villas">Villas</a>
          </li>
          <li>
            <Link to="/gallery">Gallery</Link>
          </li>
          <li>
            <a href="/#contact">Contact</a>
          </li>
        </ul>
        <CurrencySelector />
        <button
          className="hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
        <a href="/#villas" onClick={() => setMobileMenuOpen(false)}>
          Villas
        </a>
        <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>
          Gallery
        </Link>
        <a href="/#contact" onClick={() => setMobileMenuOpen(false)}>
          Contact
        </a>
      </div>

      <div className="sr-wrap">
        <div className="sr-header">
          <h1 className="sr-title">Available Villas</h1>
          <div className="sr-subtitle">
            {fmtDate(checkin)} — {fmtDate(checkout)} &nbsp;·&nbsp; {nights}{" "}
            night{nights !== 1 ? "s" : ""} &nbsp;·&nbsp; {guests} guest
            {guests !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="sr-loading">Checking availability…</div>
        ) : (
          <div className="sr-grid">
            {VILLAS.map((villa) => {
              const status = statuses[villa.id];
              const available = status?.available ?? true;
              const pricePerNight =
                status?.price ?? villa.pricing[0]?.basePrice ?? 0;
              const totalBase = pricePerNight * nights;

              return (
                <div
                  key={villa.id}
                  className={`sr-card${!available ? " unavailable" : ""}`}
                >
                  <div className="sr-card-img">
                    <img
                      src={villa.image}
                      alt={villa.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <span
                      className={`sr-card-badge ${villa.openingSoon ? "opening-soon" : available ? "available" : "reserved"}`}
                    >
                      {villa.openingSoon
                        ? "Opening Soon"
                        : available
                          ? "Available"
                          : "Reserved"}
                    </span>
                  </div>
                  <div className="sr-card-body">
                    <div className="sr-card-type">{villa.type}</div>
                    <div className="sr-card-name">{villa.name}</div>
                    <div className="sr-card-meta">
                      {villa.bedrooms && (
                        <span>
                          {villa.bedrooms} Bed{villa.bedrooms > 1 ? "s" : ""}
                        </span>
                      )}
                      <span>Up to {villa.maxGuests} guests</span>
                    </div>
                    <div className="sr-card-amenities">
                      <span className="sr-card-amenity">Pool</span>
                      <span className="sr-card-amenity">AC</span>
                      <span className="sr-card-amenity">Kitchen</span>
                      <span className="sr-card-amenity">WiFi</span>
                      <span className="sr-card-amenity">Laundry</span>
                    </div>
                    <div className="sr-card-price">
                      <div className="sr-card-price-main">
                        {formatPrice(pricePerNight)}
                      </div>
                      <div className="sr-card-price-sub">per night</div>
                      {nights > 0 && (
                        <div className="sr-card-price-total">
                          {formatPrice(totalBase)} for {nights} night
                          {nights !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <Link
                        to={`/villa/${villa.id}`}
                        style={{
                          fontFamily: "'Josefin Sans',sans-serif",
                          fontSize: "0.65rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: villa.color ?? "#0a0a0a",
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                        }}
                      >
                        View Details
                      </Link>
                      {villa.contactOnly ? (
                        <a
                          href={`https://wa.me/254715510119?text=${encodeURIComponent(`Hi, I'd like to book ${villa.name} from ${checkin} to ${checkout} for ${guests} guest${guests !== 1 ? "s" : ""}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 16px",
                            background: "#25d366",
                            color: "#fff",
                            borderRadius: 6,
                            fontFamily: "'Josefin Sans',sans-serif",
                            fontSize: "0.65rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.533 5.864L0 24l6.303-1.656A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.371l-.36-.214-3.732.979.996-3.641-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                          </svg>
                          WhatsApp
                        </a>
                      ) : villa.openingSoon ? (
                        <button
                          className="sr-btn-reserved"
                          style={{
                            width: "auto",
                            padding: "10px 20px",
                            color: "#7c3aed",
                            borderColor: "#c4b5fd",
                          }}
                          disabled
                        >
                          Opening Soon
                        </button>
                      ) : available ? (
                        <button
                          className="sr-btn-reserve"
                          style={{ width: "auto", padding: "10px 20px" }}
                          onClick={() => handleReserve(villa.id)}
                        >
                          Reserve
                        </button>
                      ) : (
                        <button
                          className="sr-btn-reserved"
                          style={{ width: "auto", padding: "10px 20px" }}
                          disabled
                        >
                          Reserved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsPage;
