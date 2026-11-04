"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../lib";

const STEPS = ["Input", "Extract", "Validate", "Store", "Schedule", "Simulate"];

type Dash = {
  summary?: { total?: number; open?: number; completed?: number; overdue?: number; completion_rate?: number };
  risks?: { level?: string; p_delay?: number };
  recent?: Array<{ id: string; action: string; person?: string | null; deadline_text?: string | null; confidence?: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [input, setInput] = useState("I'll send Brian the database notes tonight.");
  const [phase, setPhase] = useState(-1);
  const [result, setResult] = useState("");
  const first = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("first") === "1";

  useEffect(() => {
    fetch(`${API}/api/v1/dashboard`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  async function capture() {
    setResult("Capturing…");
    setPhase(0);
    const tick = setInterval(() => setPhase((p) => (p < STEPS.length - 1 ? p + 1 : p)), 220);
    try {
      const r = await fetch(`${API}/api/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text: input }),
      });
      clearInterval(tick);
      setPhase(STEPS.length - 1);
      if (r.ok) {
        setResult("Saved to Memory Feed.");
        const d = await fetch(`${API}/api/v1/dashboard`, { headers: authHeaders() }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        if (d) setData(d);
      }
      else if (r.status === 401) setResult("Sign in on /auth first, then retry Capture.");
      else setResult(`API ${r.status} — is the backend up?`);
    } catch {
      clearInterval(tick);
      setResult("Backend unreachable. Run: docker compose up --build");
    }
  }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const open = data?.summary?.open ?? 0;

  return (
    <Shell testid="dashboard-page" title={`${greet}, Alex`} subtitle={`${new Date().toDateString()} · ${open} priorities`}>
      {first && <p className="anchor-chip" role="status"><Icon name="bolt" size={14} /> Forced first capture — try the pipeline below.</p>}
      {!data ? (
        <div className="anchor-card"><p>Sign in on <Link href="/auth">/auth</Link>, then reload. Backend: {API}</p></div>
      ) : (
        <div className="anchor-grid anchor-grid-2">
          <div style={{ display: "grid", gap: 16 }}>
            <div className="anchor-card" data-testid="capture-box">
              <h2><Icon name="bolt" size={15} /> Capture — try the AI pipeline</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <input aria-label="Commitment text" value={input} onChange={(e) => setInput(e.target.value)}
                  style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "12px 14px", fontSize: 15 }} />
                <button onClick={capture} className="anchor-btn">Capture</button>
              </div>
              <ol aria-label="Extraction pipeline" style={{ display: "flex", gap: 6, flexWrap: "wrap", listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 12 }}>
                {STEPS.map((s, i) => (
                  <li key={s} className="anchor-chip" style={i <= phase ? { borderColor: "#14B8A6", background: "#e6f7f4" } : undefined}>
                    {i <= phase ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />} {s}
                  </li>
                ))}
              </ol>
              {result && <p role="status" style={{ marginTop: 10 }}>{result}</p>}
              <p className="anchor-muted" style={{ fontSize: 13 }}>Input → Extraction → Validation → Storage → Scheduling → Simulation → Explanation</p>
            </div>

            <div className="anchor-card">
              <h2><Icon name="alert" size={15} /> Risk panel</h2>
              <p>Delay risk <strong>{String(data.risks?.level ?? "—")}</strong> · p(delay) {String(data.risks?.p_delay ?? "—")}</p>
              <Link href="/forecast" className="anchor-btn anchor-btn-secondary" style={{ textDecoration: "none" }}>What if I start tonight?</Link>
            </div>

            <div className="anchor-card" data-testid="memory-feed">
              <h2><Icon name="memory" size={15} /> Memory — last 5 captured</h2>
              {(data.recent ?? []).length === 0 ? <p className="anchor-muted">Nothing yet — capture above.</p> : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(data.recent ?? []).slice(0, 5).map((c) => (
                    <li key={c.id}>“{c.action}” · {c.deadline_text ?? "no date"} · {c.confidence ?? "—"}</li>
                  ))}
                </ul>
              )}
              <p><Link href="/memory">Open memory feed →</Link></p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <div className="anchor-card" data-testid="dashboard-today">
              <h2><Icon name="check" size={15} /> Today</h2>
              <p className="anchor-kpi">{open} open</p>
              <p className="anchor-muted">Overdue {data.summary?.overdue ?? 0} · Kept {data.summary?.completion_rate ?? 0}%</p>
            </div>
            <div className="anchor-card" data-testid="forecast-center">
              <h2><Icon name="chart" size={15} /> Forecast</h2>
              <p className="anchor-kpi">{data.summary?.completion_rate ?? 0}% ready</p>
              <p className="anchor-muted">Deterministic, no LLM math. <Link href="/forecast">Open Forecast →</Link></p>
            </div>
            <div className="anchor-card" data-testid="weekly-review">
              <h2><Icon name="activity" size={15} /> Health</h2>
              <p>Completed {data.summary?.completed ?? 0} of {data.summary?.total ?? 0}</p>
              <p className="anchor-muted">Upcoming (7 days): check commitments.</p>
            </div>
            <div className="anchor-card">
              <h2><Icon name="spark" size={15} /> Life areas</h2>
              <p className="anchor-muted">Academics · Work · Health · Family</p>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
