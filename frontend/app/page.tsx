"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, BG, Icon, NAVY, TEAL, authHeaders } from "./lib";

type Health = { status?: string } | null;

function Card({ title, icon, testid, children }: { title: string; icon: string; testid: string; children: React.ReactNode }) {
  return (
    <section
      data-testid={testid}
      style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,33,61,0.06)" }}
    >
      <h2 style={{ fontSize: 14, letterSpacing: 0.4, textTransform: "uppercase", margin: "0 0 12px", color: "#4b5b70", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={icon} size={15} /> {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [health, setHealth] = useState<Health>(null);
  const [input, setInput] = useState("I'll send Brian the database notes tonight.");
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    fetch(`${API}/api/health`).then((r) => r.json()).then(setHealth).catch(() => setHealth({ status: "offline" }));
  }, []);

  async function capture() {
    setResult("Capturing…");
    try {
      const r = await fetch(`${API}/api/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text: input }),
      });
      if (r.ok) setResult("Saved to Memory Feed.");
      else if (r.status === 401) setResult("API 401 — sign in on /auth first, then retry Capture.");
      else setResult(`API ${r.status} — is the backend up?`);
    } catch {
      setResult("Backend unreachable. Run: docker compose up --build");
    }
  }

  return (
    <main style={{ background: BG, color: NAVY, minHeight: "100vh" }}>
      <header style={{ background: NAVY, color: "#fff", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Anchor</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Memory layer for human commitments</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span data-testid="api-status" style={{ fontSize: 12, opacity: 0.85 }}>API: {health ? health.status || "ok" : "…"}</span>
          <span style={{ background: TEAL, color: "#06281f", borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>Student MVP</span>
        </div>
      </header>

      <nav aria-label="Surfaces" style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[["/auth", "Auth"], ["/onboarding", "Onboarding"], ["/dashboard", "Dashboard"], ["/memory", "Memory"], ["/commitments", "Commitments"], ["/forecast", "Forecast"], ["/insights", "Insights"], ["/workspaces", "Workspaces"], ["/settings", "Settings"], ["/admin", "Admin"]].map(([href, label]) => (
          <Link key={href} href={href} style={{ fontSize: 13, color: TEAL }}>{label}</Link>
        ))}
      </nav>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 48px", display: "grid", gap: 16 }}>
        <Card title="Capture — try the AI pipeline" icon="bolt" testid="capture-box">
          <div style={{ display: "flex", gap: 10 }}>
            <input
              aria-label="Commitment text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "12px 14px", fontSize: 15 }}
            />
            <button onClick={capture} style={{ background: NAVY, color: "#fff", border: 0, borderRadius: 10, padding: "0 20px", fontWeight: 600, cursor: "pointer" }}>
              Capture
            </button>
          </div>
          {result && <p style={{ marginTop: 10 }} role="status">{result}</p>}
          <p style={{ color: "#4b5b70", fontSize: 13 }}>Input → Extraction → Validation → Storage → Scheduling → Simulation → Explanation · <Link href="/dashboard">Open command center →</Link></p>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          <Card title="Today" icon="check" testid="dashboard-today">
            <p style={{ fontSize: 28, margin: "4px 0" }}>3 priorities</p>
            <p style={{ color: "#4b5b70" }}>Due tonight, tomorrow, Friday.</p>
          </Card>
          <Card title="Memory Feed" icon="memory" testid="memory-feed">
            <p>Every commitment with source, extraction confidence, and history.</p>
          </Card>
          <Card title="Forecast Center" icon="chart" testid="forecast-center">
            <p style={{ fontSize: 28, margin: "4px 0" }}>82% ready</p>
            <p style={{ color: "#4b5b70" }}>Skip a session → −3%. Deterministic, no LLM math.</p>
          </Card>
          <Card title="Weekly Review" icon="activity" testid="weekly-review">
            <p>Completion rate, captured / missed, trends, forecast.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
