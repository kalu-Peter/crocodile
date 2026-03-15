import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("adminSecret")) {
      navigate("/crocodile-admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reservations", {
        headers: { "x-admin-secret": password },
      });
      if (res.ok) {
        sessionStorage.setItem("adminSecret", password);
        sessionStorage.setItem("adminUser", username);
        navigate("/crocodile-admin/dashboard", { replace: true });
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch {
      setError("Connection error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Josefin+Sans:wght@300;400&display=swap');

        .al-root {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Josefin Sans', sans-serif;
        }

        .al-card {
          width: 100%;
          max-width: 400px;
          padding: 52px 48px;
          background: #141414;
          border: 1px solid #282828;
        }

        .al-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          color: #f0f0f0;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .al-logo span { color: #909090; }

        .al-subtitle {
          font-size: 0.62rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #505050;
          margin-bottom: 44px;
        }

        .al-field {
          margin-bottom: 20px;
        }

        .al-field label {
          display: block;
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #505050;
          margin-bottom: 8px;
        }

        .al-field input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #282828;
          color: #f0f0f0;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.9rem;
          padding: 13px 16px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .al-field input:focus {
          border-color: #909090;
        }

        .al-error {
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          color: #ef4444;
          margin-bottom: 20px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
        }

        .al-btn {
          width: 100%;
          background: #909090;
          color: #0a0a0a;
          border: none;
          padding: 14px;
          font-family: 'Josefin Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 400;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 8px;
        }

        .al-btn:hover:not(:disabled) { background: #e0e0e0; }
        .al-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .al-back {
          display: block;
          text-align: center;
          margin-top: 28px;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #505050;
          text-decoration: none;
          transition: color 0.2s;
        }
        .al-back:hover { color: #909090; }
      `}</style>

      <div className="al-root">
        <div className="al-card">
          <div className="al-logo">Croc<span>odile</span> Lodge</div>
          <div className="al-subtitle">Admin Portal</div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="al-field">
              <label htmlFor="al-username">Username</label>
              <input
                id="al-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>

            <div className="al-field">
              <label htmlFor="al-password">Password</label>
              <input
                id="al-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <div className="al-error">{error}</div>}

            <button className="al-btn" type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Sign In →"}
            </button>
          </form>

          <a className="al-back" href="/">← Back to site</a>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
