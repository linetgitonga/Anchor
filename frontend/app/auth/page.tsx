"use client";

import { useState } from "react";
import { API, Icon, NAVY } from "../lib";

export default function AuthPage() {
  const [email, setEmail] = useState("student@anchor.test");
  const [password, setPassword] = useState("pw123456");
  const [msg, setMsg] = useState("");

  async function action(kind: "register" | "login") {
    setMsg("Working…");
    try {
      const r = await fetch(`${API}/api/v1/auth/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok) return setMsg(typeof j.detail === "string" ? j.detail : `HTTP ${r.status}`);
      if (j.access_token) localStorage.setItem("anchor_token", j.access_token);
      setMsg(kind === "register" ? "Registered and signed in." : "Signed in. Continue to onboarding or dashboard.");
      if (kind === "login") {
        const s = await fetch(`${API}/api/v1/onboarding/status`, {
          headers: { Authorization: `Bearer ${j.access_token}` },
        }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        window.location.href = s && s.completed ? "/dashboard" : "/onboarding";
      } else {
        window.location.href = "/onboarding";
      }
    } catch {
      setMsg("Backend unreachable. Run: docker compose up --build");
    }
  }

  const input: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 14, width: "100%" };
  return (
    <main style={{ background: "#FAFAF7", color: NAVY, minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="anchor-card" data-testid="auth-page" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Anchor</div>
          <div className="anchor-muted" style={{ fontSize: 13 }}>Memory layer for commitments</div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <button className="anchor-btn" style={{ justifyContent: "center" }} onClick={() => setMsg("Google sign-in is deferred to post-hackathon. Use email below.")}>
            <Icon name="user" size={16} /> Continue with Google
          </button>
          <button className="anchor-btn anchor-btn-secondary" style={{ justifyContent: "center" }} onClick={() => setMsg("Microsoft sign-in is a stub for the hackathon demo.")}>
            Continue with Microsoft
          </button>
          <label style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }} htmlFor="auth-email">Email</label>
          <input id="auth-email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          <button className="anchor-btn anchor-btn-secondary" style={{ justifyContent: "center" }} onClick={() => setMsg("Magic link expires in 15 min — stubbed for demo. Use password sign-in below.")}>
            Send magic link
          </button>
          <label style={{ fontSize: 13, fontWeight: 600 }} htmlFor="auth-pw">Password (student MVP)</label>
          <input id="auth-pw" aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => action("register")} className="anchor-btn" style={{ flex: 1, justifyContent: "center" }}>Register</button>
            <button onClick={() => action("login")} className="anchor-btn anchor-btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Login</button>
          </div>
          <p className="anchor-muted" style={{ fontSize: 12 }}>WhatsApp OTP is a future step — not in this demo.</p>
          {msg && <p role="status">{msg}</p>}
          <p className="anchor-muted" style={{ fontSize: 12 }}>Terms · Privacy</p>
        </div>
      </div>
    </main>
  );
}
