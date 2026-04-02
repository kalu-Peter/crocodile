import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VILLAS } from "../types";
import type { AdminReservation, BlockedDate, SeasonalPricingRule } from "../types";

type Tab = "reservations" | "blocked-dates" | "seasonal-pricing" | "users";
type ResFilter = "all" | "pending" | "confirmed" | "cancelled";

const PROPERTY_NAMES = VILLAS.map((v) => v.name);

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const secret = sessionStorage.getItem("adminSecret") ?? "";
  const adminUser = sessionStorage.getItem("adminUser") ?? "Admin";

  useEffect(() => {
    if (!secret) navigate("/admin", { replace: true });
  }, [secret, navigate]);

  const api = useCallback(
    (path: string, options: RequestInit = {}) =>
      fetch(`/api/admin${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
          ...(options.headers as Record<string, string>),
        },
      }),
    [secret],
  );

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("reservations");

  // ── Notifications ─────────────────────────────────────────────────────────
  const [lastSeenAt, setLastSeenAt] = useState<string>(
    () => localStorage.getItem("adminLastSeenAt") ?? new Date(0).toISOString()
  );

  const markReservationsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem("adminLastSeenAt", now);
    setLastSeenAt(now);
  };

  // ── Reservations ─────────────────────────────────────────────────────────
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resFilter, setResFilter] = useState<ResFilter>("all");
  const [resPropFilter, setResPropFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReservations = useCallback(async (markSeen = false) => {
    setResLoading(true);
    try {
      const res = await api("/reservations");
      if (res.ok) {
        setReservations(await res.json());
        if (markSeen) markReservationsSeen();
      }
    } finally {
      setResLoading(false);
    }
  }, [api]); // eslint-disable-line

  // ── Blocked Dates ─────────────────────────────────────────────────────────
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockPropFilter, setBlockPropFilter] = useState("all");
  const [blockMode, setBlockMode] = useState<"single" | "range" | "month">("single");
  const [blockForm, setBlockForm] = useState({
    property_name: PROPERTY_NAMES[0] ?? "",
    single_date: "",
    start_date: "",
    end_date: "",
    month: "",
    reason: "manual_block",
  });
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [blockSuccess, setBlockSuccess] = useState("");

  const fetchBlockedDates = useCallback(async () => {
    setBlockLoading(true);
    try {
      const param = blockPropFilter !== "all" ? `?property=${encodeURIComponent(blockPropFilter)}` : "";
      const res = await api(`/blocked-dates${param}`);
      if (res.ok) setBlockedDates(await res.json());
    } finally {
      setBlockLoading(false);
    }
  }, [api, blockPropFilter]);


  // ── Seasonal Pricing ──────────────────────────────────────────────────────
  const [seasonalRules, setSeasonalRules] = useState<SeasonalPricingRule[]>([]);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [seasonalVilla, setSeasonalVilla] = useState(VILLAS[0].id);
  const [seasonalForm, setSeasonalForm] = useState({ label: "", start_date: "", end_date: "", price_per_night: "" });
  const [seasonalError, setSeasonalError] = useState("");
  const [seasonalSuccess, setSeasonalSuccess] = useState("");
  const [seasonalSaving, setSeasonalSaving] = useState(false);

  const fetchSeasonalPricing = useCallback(async (villaId: string) => {
    setSeasonalLoading(true);
    try {
      const res = await api(`/seasonal-pricing?villa_id=${encodeURIComponent(villaId)}`);
      if (res.ok) setSeasonalRules(await res.json());
    } finally {
      setSeasonalLoading(false);
    }
  }, [api]);

  const submitSeasonalRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeasonalError(""); setSeasonalSuccess("");
    if (!seasonalForm.start_date || !seasonalForm.end_date || !seasonalForm.price_per_night) {
      setSeasonalError("Start date, end date and price are required."); return;
    }
    setSeasonalSaving(true);
    try {
      const res = await api("/seasonal-pricing", {
        method: "POST",
        body: JSON.stringify({ villa_id: seasonalVilla, ...seasonalForm, price_per_night: parseFloat(seasonalForm.price_per_night) }),
      });
      const data = await res.json();
      if (!res.ok) { setSeasonalError(data.error ?? "Failed to create rule."); return; }
      setSeasonalSuccess("Pricing rule added.");
      setSeasonalForm({ label: "", start_date: "", end_date: "", price_per_night: "" });
      await fetchSeasonalPricing(seasonalVilla);
    } finally {
      setSeasonalSaving(false);
    }
  };

  const deleteSeasonalRule = async (id: number) => {
    if (!window.confirm("Delete this pricing rule?")) return;
    await api(`/seasonal-pricing/${id}`, { method: "DELETE" });
    await fetchSeasonalPricing(seasonalVilla);
  };

  // ── Users ─────────────────────────────────────────────────────────────────
  type AdminUser = { id: string; username: string; created_at: string };
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", password: "" });
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [userSaving, setUserSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await api("/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setUsersLoading(false);
    }
  }, [api]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(""); setUserSuccess("");
    if (!userForm.username || !userForm.password) { setUserError("Both fields are required."); return; }
    setUserSaving(true);
    try {
      const res = await api("/users", { method: "POST", body: JSON.stringify(userForm) });
      const data = await res.json();
      if (!res.ok) { setUserError(data.error ?? "Failed to create user."); return; }
      setUserSuccess(`User "${data.user.username}" created.`);
      setUserForm({ username: "", password: "" });
      await fetchUsers();
    } finally {
      setUserSaving(false);
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Delete user "${username}"?`)) return;
    await api(`/users?id=${id}`, { method: "DELETE" });
    await fetchUsers();
  };

  // ── Load on tab switch ────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "reservations") fetchReservations(true);
    if (activeTab === "blocked-dates") fetchBlockedDates();
    if (activeTab === "seasonal-pricing") fetchSeasonalPricing(seasonalVilla);
    if (activeTab === "users") fetchUsers();
  }, [activeTab, fetchReservations, fetchBlockedDates, fetchSeasonalPricing, fetchUsers, seasonalVilla]);

  useEffect(() => {
    if (activeTab === "blocked-dates") fetchBlockedDates();
  }, [blockPropFilter]); // eslint-disable-line

  // ── Actions ───────────────────────────────────────────────────────────────
  const confirmReservation = async (id: string) => {
    setActionLoading(id + "-confirm");
    try {
      await api(`/reservations/${id}`, { method: "PUT", body: JSON.stringify({ action: "confirm" }) });
      await fetchReservations();
    } finally {
      setActionLoading(null);
    }
  };

  const cancelReservation = async (id: string) => {
    if (!window.confirm("Cancel this reservation?")) return;
    setActionLoading(id + "-cancel");
    try {
      await api(`/reservations/${id}`, { method: "PUT", body: JSON.stringify({ action: "cancel" }) });
      await fetchReservations();
    } finally {
      setActionLoading(null);
    }
  };

  const unblockDate = async (id: number) => {
    if (!window.confirm("Unblock this date?")) return;
    await api(`/blocked-dates/${id}`, { method: "DELETE" });
    await fetchBlockedDates();
  };

  const submitBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(""); setBlockSuccess("");

    let start_date = "", end_date = "";

    if (blockMode === "single") {
      if (!blockForm.single_date) { setBlockError("Please select a date."); return; }
      start_date = blockForm.single_date;
      end_date = blockForm.single_date;
    } else if (blockMode === "range") {
      if (!blockForm.start_date || !blockForm.end_date) { setBlockError("Please select both start and end dates."); return; }
      if (blockForm.end_date < blockForm.start_date) { setBlockError("End date must be after start date."); return; }
      start_date = blockForm.start_date;
      end_date = blockForm.end_date;
    } else {
      if (!blockForm.month) { setBlockError("Please select a month."); return; }
      const [y, m] = blockForm.month.split("-").map(Number);
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      start_date = firstDay.toISOString().split("T")[0];
      end_date = lastDay.toISOString().split("T")[0];
    }

    setBlockSaving(true);
    try {
      const res = await api("/blocked-dates", {
        method: "POST",
        body: JSON.stringify({ property_name: blockForm.property_name, start_date, end_date, reason: blockForm.reason }),
      });
      const data = await res.json();
      if (!res.ok) { setBlockError(data.error ?? "Failed to block dates."); return; }
      setBlockSuccess(data.message ?? "Dates blocked successfully.");
      setBlockForm((f) => ({ ...f, single_date: "", start_date: "", end_date: "", month: "" }));
      await fetchBlockedDates();
    } finally {
      setBlockSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredReservations = reservations.filter((r) => {
    const matchProp = resPropFilter === "all" || r.property_name === resPropFilter;
    const matchStatus =
      resFilter === "all" ||
      (resFilter === "confirmed" && r.confirmed && !r.cancelled) ||
      (resFilter === "cancelled" && r.cancelled) ||
      (resFilter === "pending" && !r.confirmed && !r.cancelled);
    return matchProp && matchStatus;
  });

  const newCount = reservations.filter(
    (r) => new Date(r.created_at) > new Date(lastSeenAt)
  ).length;

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.confirmed && !r.cancelled).length,
    pending: reservations.filter((r) => !r.confirmed && !r.cancelled).length,
    cancelled: reservations.filter((r) => r.cancelled).length,
    revenue: reservations
      .filter((r) => r.confirmed && !r.cancelled)
      .reduce((sum, r) => sum + Number(r.total_price), 0),
  };

  const logout = () => {
    sessionStorage.removeItem("adminSecret");
    sessionStorage.removeItem("adminUser");
    navigate("/admin", { replace: true });
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });

  if (!secret) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .adm-root {
          min-height: 100vh;
          background: #f5f6fa;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .adm-topbar {
          background: #ffffff;
          border-bottom: 1px solid #eef0f4;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .adm-topbar-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          color: #1a1a2e;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .adm-topbar-logo::before {
          content: '';
          width: 8px; height: 8px;
          background: #c9a84c;
          border-radius: 50%;
          display: inline-block;
        }
        .adm-topbar-logo span { color: #c9a84c; }
        .adm-topbar-right { display: flex; align-items: center; gap: 16px; }
        .adm-topbar-user {
          font-size: 0.78rem;
          color: #9098a9;
          font-weight: 400;
        }
        .adm-topbar-user strong { color: #1a1a2e; font-weight: 600; }
        .adm-logout {
          font-size: 0.72rem;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 18px;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'Inter', sans-serif;
        }
        .adm-logout:hover { background: #f9fafb; border-color: #d1d5db; color: #374151; }

        /* ── Stats ── */
        .adm-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          padding: 24px 32px;
          background: transparent;
        }
        .adm-stat {
          background: #ffffff;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          border: 1px solid #eef0f4;
          position: relative;
          overflow: hidden;
        }
        .adm-stat::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #e5e7eb;
          border-radius: 14px 14px 0 0;
        }
        .adm-stat:nth-child(2)::after { background: #10b981; }
        .adm-stat:nth-child(3)::after { background: #f59e0b; }
        .adm-stat:nth-child(4)::after { background: #ef4444; }
        .adm-stat:nth-child(5)::after { background: #c9a84c; }
        .adm-stat-label {
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #9098a9;
          margin-bottom: 10px;
        }
        .adm-stat-value {
          font-size: 1.9rem;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1;
          font-family: 'Playfair Display', serif;
        }
        .adm-stat-value.accent { color: #c9a84c; }

        /* ── Tabs ── */
        .adm-tabs {
          display: flex;
          gap: 4px;
          background: #ffffff;
          padding: 0 32px;
          border-bottom: 1px solid #eef0f4;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .adm-tab {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #9098a9;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 16px 20px 14px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: color 0.18s, border-color 0.18s;
        }
        .adm-tab:hover { color: #4b5563; }
        .adm-tab.active { color: #1a1a2e; border-bottom-color: #c9a84c; font-weight: 600; }
        .adm-tab-wrap { display: inline-flex; align-items: center; gap: 8px; }
        .adm-badge {
          background: #ef4444;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          letter-spacing: 0;
        }

        /* ── Content area ── */
        .adm-body { flex: 1; padding: 28px 32px; }

        /* ── Section header ── */
        .adm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .adm-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.35rem;
          color: #1a1a2e;
        }
        .adm-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .adm-select {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          color: #374151;
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 8px 14px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.18s;
        }
        .adm-select:focus { border-color: #c9a84c; }
        .adm-filter-btn {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          color: #9098a9;
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .adm-filter-btn:hover { color: #374151; border-color: #c9a84c; }
        .adm-filter-btn.active { background: #1a1a2e; color: #ffffff; border-color: #1a1a2e; }

        /* ── Table card ── */
        .adm-table-wrap {
          overflow-x: auto;
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #eef0f4;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .adm-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }
        .adm-table th {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9098a9;
          text-align: left;
          padding: 14px 18px;
          border-bottom: 1px solid #eef0f4;
          white-space: nowrap;
          background: #fafbfc;
        }
        .adm-table th:first-child { border-radius: 14px 0 0 0; }
        .adm-table th:last-child  { border-radius: 0 14px 0 0; }
        .adm-table td {
          font-size: 0.82rem;
          color: #374151;
          padding: 14px 18px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }
        .adm-table tr:hover td { background: #fafbfc; }
        .adm-table tr:last-child td { border-bottom: none; }

        /* ── Status badges ── */
        .badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .badge-confirmed { background: #d1fae5; color: #065f46; }
        .badge-pending   { background: #fef3c7; color: #92400e; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; }
        .badge-paid      { background: #d1fae5; color: #065f46; }
        .badge-failed    { background: #fee2e2; color: #991b1b; }
        .badge-default   { background: #f3f4f6; color: #6b7280; }

        /* ── Action buttons ── */
        .adm-btn {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 7px 14px;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .adm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .adm-btn-confirm { background: #d1fae5; color: #065f46; }
        .adm-btn-confirm:hover:not(:disabled) { background: #10b981; color: #fff; }
        .adm-btn-cancel  { background: #f3f4f6; color: #6b7280; }
        .adm-btn-cancel:hover:not(:disabled)  { background: #fee2e2; color: #991b1b; }
        .adm-btn-remove  { background: #f3f4f6; color: #6b7280; }
        .adm-btn-remove:hover:not(:disabled)  { background: #fee2e2; color: #991b1b; }
        .adm-btn-save    { background: #1a1a2e; color: #ffffff; border-radius: 8px; }
        .adm-btn-save:hover:not(:disabled)    { background: #2d2d4e; }

        /* ── Loading / empty ── */
        .adm-loading {
          padding: 60px 0;
          text-align: center;
          font-size: 0.78rem;
          font-weight: 500;
          color: #9098a9;
        }

        /* ── Form card ── */
        .adm-form-card {
          background: #ffffff;
          border: 1px solid #eef0f4;
          border-radius: 14px;
          padding: 28px 32px;
          margin-top: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .adm-form-card h3 {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9098a9;
          margin-bottom: 20px;
        }
        .adm-form-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        .adm-form-field { display: flex; flex-direction: column; gap: 6px; }
        .adm-form-field label {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #9098a9;
        }
        .adm-form-field input,
        .adm-form-field select {
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          padding: 10px 14px;
          outline: none;
          min-width: 160px;
          transition: border-color 0.18s;
        }
        .adm-form-field input:focus,
        .adm-form-field select:focus { border-color: #c9a84c; background: #fff; }
        .adm-form-msg {
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 8px;
        }
        .adm-form-msg.error { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; }
        .adm-form-msg.success { color: #065f46; background: #f0fdf4; border: 1px solid #bbf7d0; }

        /* ── Price input ── */
        .adm-price-input {
          background: #ffffff;
          border: 1.5px solid #c9a84c;
          border-radius: 6px;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          padding: 6px 10px;
          outline: none;
          width: 110px;
        }
        .adm-price-cell { display: flex; align-items: center; gap: 8px; }
        .adm-price-click {
          cursor: pointer;
          border-bottom: 1.5px dashed #c9a84c;
          padding-bottom: 1px;
          color: #374151;
        }
        .adm-price-click:hover { color: #1a1a2e; border-bottom-color: #1a1a2e; }

        @media (max-width: 768px) {
          .adm-topbar { padding: 0 16px; }
          .adm-stats  { grid-template-columns: repeat(2, 1fr); padding: 16px; }
          .adm-tabs   { padding: 0 16px; }
          .adm-body   { padding: 20px 16px; }
        }
      `}</style>

      <div className="adm-root">
        {/* Top bar */}
        <div className="adm-topbar">
          <div className="adm-topbar-logo">Croc<span>odile</span> Lodge</div>
          <div className="adm-topbar-right">
            <div className="adm-topbar-user">
              Signed in as <strong>{adminUser}</strong>
            </div>
            <button className="adm-logout" onClick={logout}>Sign Out</button>
          </div>
        </div>

        {/* Stats */}
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-label">Total Reservations</div>
            <div className="adm-stat-value">{stats.total}</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-label">Confirmed</div>
            <div className="adm-stat-value" style={{ color: "#10b981" }}>{stats.confirmed}</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-label">Pending</div>
            <div className="adm-stat-value" style={{ color: "#eab308" }}>{stats.pending}</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-label">Cancelled</div>
            <div className="adm-stat-value" style={{ color: "#ef4444" }}>{stats.cancelled}</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-label">Confirmed Revenue</div>
            <div className="adm-stat-value accent">
              Ksh {stats.revenue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          {(["reservations", "blocked-dates", "seasonal-pricing", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`adm-tab${activeTab === t ? " active" : ""}`}
              onClick={() => {
                setActiveTab(t);
                if (t === "reservations") markReservationsSeen();
              }}
            >
              <span className="adm-tab-wrap">
                {t === "reservations" ? "Reservations"
                  : t === "blocked-dates" ? "Blocked Dates"
                  : t === "seasonal-pricing" ? "Pricing"
                  : "Users"}
                {t === "reservations" && newCount > 0 && (
                  <span className="adm-badge">{newCount}</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="adm-body">

          {/* ── RESERVATIONS ──────────────────────────────── */}
          {activeTab === "reservations" && (
            <>
              <div className="adm-section-head">
                <div className="adm-section-title">Reservations</div>
                <div className="adm-filters">
                  <select
                    className="adm-select"
                    value={resPropFilter}
                    onChange={(e) => setResPropFilter(e.target.value)}
                  >
                    <option value="all">All Properties</option>
                    {PROPERTY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {(["all", "pending", "confirmed", "cancelled"] as ResFilter[]).map((f) => (
                    <button
                      key={f}
                      className={`adm-filter-btn${resFilter === f ? " active" : ""}`}
                      onClick={() => setResFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <button className="adm-filter-btn" onClick={() => fetchReservations()}>↺ Refresh</button>
                </div>
              </div>

              {resLoading ? (
                <div className="adm-loading">Loading reservations…</div>
              ) : filteredReservations.length === 0 ? (
                <div className="adm-loading">No reservations found.</div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Property</th>
                        <th>Guest Name</th>
                        <th>Phone</th>
                        <th>Guests</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Total (Ksh)</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Booked</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.map((r) => {
                        const status = r.cancelled ? "cancelled" : r.confirmed ? "confirmed" : "pending";
                        return (
                          <tr key={r.id}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#aaaaaa" }}>
                              {r.id.slice(0, 8)}…
                            </td>
                            <td>{r.property_name}</td>
                            <td>
                              <div>{r.name}</div>
                              <div style={{ fontSize: "0.65rem", color: "#aaaaaa" }}>{r.email}</div>
                            </td>
                            <td>{r.phone}</td>
                            <td style={{ textAlign: "center" }}>{r.guests}</td>
                            <td>{fmt(r.checkin)}</td>
                            <td>{fmt(r.checkout)}</td>
                            <td>Ksh {Number(r.total_price).toLocaleString()}</td>
                            <td>
                              <span className={`badge badge-${r.payment_status === "paid" ? "paid" : r.payment_status === "failed" ? "failed" : "default"}`}>
                                {r.payment_status}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${status}`}>{status}</span>
                            </td>
                            <td style={{ fontSize: "0.68rem", color: "#aaaaaa" }}>
                              {fmt(r.created_at)}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  className="adm-btn adm-btn-confirm"
                                  disabled={r.confirmed || r.cancelled || actionLoading === r.id + "-confirm"}
                                  onClick={() => confirmReservation(r.id)}
                                >
                                  {actionLoading === r.id + "-confirm" ? "…" : "Confirm"}
                                </button>
                                <button
                                  className="adm-btn adm-btn-cancel"
                                  disabled={r.cancelled || actionLoading === r.id + "-cancel"}
                                  onClick={() => cancelReservation(r.id)}
                                >
                                  {actionLoading === r.id + "-cancel" ? "…" : "Cancel"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── BLOCKED DATES ─────────────────────────────── */}
          {activeTab === "blocked-dates" && (
            <>
              <div className="adm-section-head">
                <div className="adm-section-title">Blocked Dates</div>
                <div className="adm-filters">
                  <select
                    className="adm-select"
                    value={blockPropFilter}
                    onChange={(e) => setBlockPropFilter(e.target.value)}
                  >
                    <option value="all">All Properties</option>
                    {PROPERTY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="adm-filter-btn" onClick={fetchBlockedDates}>↺ Refresh</button>
                </div>
              </div>

              {blockLoading ? (
                <div className="adm-loading">Loading blocked dates…</div>
              ) : blockedDates.length === 0 ? (
                <div className="adm-loading">No blocked dates found.</div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Blocked Date</th>
                        <th>Reason</th>
                        <th>Blocked On</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedDates.map((b) => (
                        <tr key={b.id}>
                          <td>{b.property_name}</td>
                          <td>{fmt(b.blocked_date)}</td>
                          <td>
                            <span className="badge badge-default">
                              {b.reason.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.68rem", color: "#aaaaaa" }}>{fmt(b.created_at)}</td>
                          <td>
                            <button
                              className="adm-btn adm-btn-remove"
                              onClick={() => unblockDate(b.id)}
                            >
                              Unblock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add block form */}
              <div className="adm-form-card">
                <h3>Block Dates</h3>

                {/* Mode selector */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {(["single", "range", "month"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBlockMode(m)}
                      style={{
                        padding: "6px 16px",
                        fontSize: "0.7rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontFamily: "'Josefin Sans', sans-serif",
                        border: "1px solid",
                        borderColor: blockMode === m ? "#0a0a0a" : "#e0e0e0",
                        background: blockMode === m ? "#0a0a0a" : "#ffffff",
                        color: blockMode === m ? "#ffffff" : "#aaaaaa",
                        cursor: "pointer",
                      }}
                    >
                      {m === "single" ? "Single Day" : m === "range" ? "Date Range" : "Whole Month"}
                    </button>
                  ))}
                </div>

                <form onSubmit={submitBlockDate}>
                  <div className="adm-form-row">
                    <div className="adm-form-field">
                      <label>Property</label>
                      <select
                        className="adm-select"
                        value={blockForm.property_name}
                        onChange={(e) => setBlockForm((f) => ({ ...f, property_name: e.target.value }))}
                      >
                        {PROPERTY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>

                    {blockMode === "single" && (
                      <div className="adm-form-field">
                        <label>Date</label>
                        <input
                          type="date"
                          value={blockForm.single_date}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setBlockForm((f) => ({ ...f, single_date: e.target.value }))}
                        />
                      </div>
                    )}

                    {blockMode === "range" && (
                      <>
                        <div className="adm-form-field">
                          <label>Start Date</label>
                          <input
                            type="date"
                            value={blockForm.start_date}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setBlockForm((f) => ({ ...f, start_date: e.target.value }))}
                          />
                        </div>
                        <div className="adm-form-field">
                          <label>End Date</label>
                          <input
                            type="date"
                            value={blockForm.end_date}
                            min={blockForm.start_date || new Date().toISOString().split("T")[0]}
                            onChange={(e) => setBlockForm((f) => ({ ...f, end_date: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    {blockMode === "month" && (
                      <div className="adm-form-field">
                        <label>Month</label>
                        <input
                          type="month"
                          value={blockForm.month}
                          min={new Date().toISOString().slice(0, 7)}
                          onChange={(e) => setBlockForm((f) => ({ ...f, month: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="adm-form-field">
                      <label>Reason</label>
                      <select
                        value={blockForm.reason}
                        onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                        style={{ background: "#ffffff", border: "1px solid #e0e0e0", color: "#1a1a1a", fontFamily: "'Josefin Sans', sans-serif", fontSize: "0.8rem", padding: "10px 14px", outline: "none", minWidth: 160 }}
                      >
                        <option value="manual_block">Manual Block</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="owner_stay">Owner Stay</option>
                      </select>
                    </div>

                    <button className="adm-btn adm-btn-save" type="submit" disabled={blockSaving} style={{ padding: "10px 24px", alignSelf: "flex-end" }}>
                      {blockSaving ? "Blocking…" : blockMode === "single" ? "Block Day" : blockMode === "range" ? "Block Range" : "Block Month"}
                    </button>
                  </div>
                  {blockError   && <div className="adm-form-msg error">{blockError}</div>}
                  {blockSuccess && <div className="adm-form-msg success">{blockSuccess}</div>}
                </form>
              </div>
            </>
          )}

          {/* ── SEASONAL PRICING ──────────────────────────── */}
          {activeTab === "seasonal-pricing" && (
            <>
              <div className="adm-section-head">
                <div className="adm-section-title">Seasonal Pricing</div>
                <div className="adm-filters">
                  <select
                    className="adm-select"
                    value={seasonalVilla}
                    onChange={(e) => { setSeasonalVilla(e.target.value); fetchSeasonalPricing(e.target.value); }}
                  >
                    {VILLAS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <button className="adm-filter-btn" onClick={() => fetchSeasonalPricing(seasonalVilla)}>↺ Refresh</button>
                </div>
              </div>
              <div style={{ fontSize: "0.65rem", color: "#505050", letterSpacing: "0.05em", marginBottom: 20 }}>
                Set date-range prices per villa. When a guest's check-in falls within a range, the seasonal price overrides the base price.
              </div>

              {seasonalLoading ? (
                <div className="adm-loading">Loading rules…</div>
              ) : seasonalRules.length === 0 ? (
                <div className="adm-loading">No seasonal pricing rules for this villa.</div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Price / Night (Ksh)</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonalRules.map((r) => (
                        <tr key={r.id}>
                          <td>{r.label}</td>
                          <td>{fmt(r.start_date)}</td>
                          <td>{fmt(r.end_date)}</td>
                          <td style={{ color: "#0a0a0a", fontFamily: "monospace" }}>Ksh {Number(r.price_per_night).toLocaleString()}</td>
                          <td style={{ fontSize: "0.68rem", color: "#aaaaaa" }}>{fmt(r.created_at)}</td>
                          <td>
                            <button className="adm-btn adm-btn-remove" onClick={() => deleteSeasonalRule(r.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add rule form */}
              <div className="adm-form-card">
                <h3>Add Pricing Rule — {VILLAS.find((v) => v.id === seasonalVilla)?.name}</h3>
                <form onSubmit={submitSeasonalRule}>
                  <div className="adm-form-row">
                    <div className="adm-form-field">
                      <label>Label (e.g. High Season)</label>
                      <input
                        type="text"
                        placeholder="e.g. Easter Holiday"
                        value={seasonalForm.label}
                        onChange={(e) => setSeasonalForm((f) => ({ ...f, label: e.target.value }))}
                      />
                    </div>
                    <div className="adm-form-field">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={seasonalForm.start_date}
                        onChange={(e) => setSeasonalForm((f) => ({ ...f, start_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="adm-form-field">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={seasonalForm.end_date}
                        min={seasonalForm.start_date}
                        onChange={(e) => setSeasonalForm((f) => ({ ...f, end_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="adm-form-field">
                      <label>Price / Night (Ksh)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 9500"
                        value={seasonalForm.price_per_night}
                        onChange={(e) => setSeasonalForm((f) => ({ ...f, price_per_night: e.target.value }))}
                        required
                      />
                    </div>
                    <button className="adm-btn adm-btn-save" type="submit" disabled={seasonalSaving} style={{ padding: "10px 24px", alignSelf: "flex-end" }}>
                      {seasonalSaving ? "…" : "Add Rule"}
                    </button>
                  </div>
                  {seasonalError   && <div className="adm-form-msg error">{seasonalError}</div>}
                  {seasonalSuccess && <div className="adm-form-msg success">{seasonalSuccess}</div>}
                </form>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <>
              <div className="adm-section">
                <div className="adm-section-title">Create Admin User</div>
                <form onSubmit={createUser}>
                  <div className="adm-form-row">
                    <div className="adm-form-field">
                      <label>Username</label>
                      <input
                        type="text"
                        placeholder="e.g. manager"
                        value={userForm.username}
                        onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="adm-form-field">
                      <label>Password (min 8 chars)</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={userForm.password}
                        onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                        required
                      />
                    </div>
                    <button className="adm-btn adm-btn-save" type="submit" disabled={userSaving} style={{ padding: "10px 24px", alignSelf: "flex-end" }}>
                      {userSaving ? "…" : "Create User"}
                    </button>
                  </div>
                  {userError   && <div className="adm-form-msg error">{userError}</div>}
                  {userSuccess && <div className="adm-form-msg success">{userSuccess}</div>}
                </form>
              </div>

              <div className="adm-section">
                <div className="adm-section-title">Admin Users</div>
                {usersLoading ? (
                  <div className="adm-empty">Loading…</div>
                ) : users.length === 0 ? (
                  <div className="adm-empty">No users yet.</div>
                ) : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Created</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{fmt(u.created_at)}</td>
                            <td>
                              <button
                                className="adm-btn adm-btn-cancel"
                                onClick={() => deleteUser(u.id, u.username)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
