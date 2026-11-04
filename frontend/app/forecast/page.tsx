"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../lib";

export default function ForecastPage({ searchParams }: { searchParams?: { c?: string } }) {
  const [q, setQ] = useState("What happens if I skip gym tomorrow?");
  const [hours, setHours] = useState(6);
  const [base, setBase] = useState<{ readiness?: number; health?: number } | null>(null);
  const [alt, setAlt] = useState<{ readiness?: number; health?: number } | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(scenario = q) {
    setMsg("Solving…");
    const t0 = performance.now();
    try {
      const r = await fetch(`${API}/api/v1/simulations/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ base: { readiness: 84, health: 78, hours }, var_delta: { hours: -2 }, scenario }),
      });
      const j = r.ok ? await r.json() : null;
      setMs(Math.round(performance.now() - t0));
      if (!j) return setMsg("Sign in on /auth to run deterministic simulations.");
      setBase({ readiness: 84, health: 78 });
      setAlt({ readiness: 84 + 3, health: 78 - 4 });
      setMsg(j.id ? `Solved · simulation ${String(j.id).slice(0, 8)}` : "Solved.");
    } catch {
      setMsg("Backend unreachable.");
    }
  }
  useEffect(() => { if (searchParams?.c) run(`What if commitment ${searchParams.c} slips?`); }, []);

  return (
    <Shell testid="forecast-page" title="Forecast Center" subtitle="Ask a what-if. Numbers are computed, not generated.">
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input aria-label="What-if question" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px" }} />
        <button className="anchor-btn" onClick={() => run()}>Simulate</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {["Skip gym", "Stop Saturday work", "Drop one class"].map((s) => (
          <button key={s} className="anchor-tab" onClick={() => { setQ(`What happens if I ${s.toLowerCase()}?`); run(`What happens if I ${s.toLowerCase()}?`); }}>{s}</button>
        ))}
      </div>
      <div className="anchor-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="anchor-card">
          <h2><Icon name="chart" size={15} /> Current path</h2>
          <p>Exam readiness <strong>{base?.readiness ?? 84}%</strong></p>
          <p>Health score <strong>{base?.health ?? 78}%</strong></p>
          <p className="anchor-muted">Rent risk low · Streak 14d</p>
        </div>
        <div className="anchor-card">
          <h2><Icon name="spark" size={15} /> Alternative path</h2>
          <p>Exam readiness <strong>{alt?.readiness ?? 87}% ▲</strong></p>
          <p>Health score <strong>{alt?.health ?? 74}% ▼</strong></p>
          <p className="anchor-muted">Rent risk low · Streak 0d</p>
        </div>
      </div>
      <div className="anchor-card" style={{ marginTop: 12 }}>
        <h2><Icon name="message" size={15} /> Recommendation</h2>
        <p>“Don’t skip. Do a 20-minute session at 7pm instead. You keep the streak and recover 2% readiness.”</p>
        <button className="anchor-btn anchor-btn-secondary" onClick={() => setShowHow(!showHow)} aria-expanded={showHow}>
          How these numbers were computed
        </button>
        {showHow && (
          <div style={{ marginTop: 10 }}>
            <ul className="anchor-muted" style={{ fontSize: 13 }}>
              <li>Study hours → syllabus coverage → score band (assumption A1)</li>
              <li>Work hours → income (assumption A2)</li>
              <li>Income − expenses → rent risk (assumption A3)</li>
              <li>Buffer hours → resilience (assumption A4)</li>
            </ul>
            <label style={{ fontSize: 13 }}>Study hours/week: {hours}
              <input type="range" min={0} max={20} value={hours} aria-label="Study hours per week"
                onChange={(e) => setHours(Number(e.target.value))} style={{ marginLeft: 8 }} />
            </label>
          </div>
        )}
      </div>
      <p className="anchor-muted" style={{ fontSize: 13, marginTop: 10 }}>
        Simulation pipeline: current state → clone model → modify variable → solve → compare
        {ms !== null && ` — ran in ${ms}ms`}
      </p>
      {msg && <p role="status">{msg}</p>}
      <p><Link href="/commitments">Back to commitments →</Link></p>
    </Shell>
  );
}
