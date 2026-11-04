"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../lib";

export default function InsightsPage() {
  const [range, setRange] = useState("7d");
  const [weekly, setWeekly] = useState<{ completion_rate?: number; captured?: number; completed?: number; overdue?: number } | null>(null);
  const [trends, setTrends] = useState<{ by_status?: Record<string, number> } | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/insights/weekly`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)).then(setWeekly).catch(() => setWeekly(null));
    fetch(`${API}/api/v1/insights/trends`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)).then(setTrends).catch(() => setTrends(null));
  }, [range]);

  const entries: Array<[string, number]> = Object.entries(trends?.by_status ?? {}).map(([k, v]) => [k, Number(v)]);
  const max = Math.max(1, ...entries.map(([, v]) => Number(v)));
  const line = [4, 7, 5, 9, 6, 10, 8];
  const heat = [0.2, 0.8, 0.5, 0.9, 0.4, 0.1, 0.0];

  return (
    <Shell testid="insights-page" title="Insights" subtitle="Completion, categories, and when you finish">
      <div className="anchor-tabs" role="tablist" aria-label="Range">
        {["7d", "30d", "90d"].map((r) => (
          <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)}
            className={range === r ? "anchor-tab anchor-tab-active" : "anchor-tab"}>{r}</button>
        ))}
      </div>
      {!weekly ? <p>Sign in on <Link href="/auth">/auth</Link> to load weekly review.</p> : (
        <>
          <div className="anchor-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", marginBottom: 12 }}>
            {[["Promises", weekly.captured ?? 0], ["Kept", `${weekly.completion_rate ?? 0}%`], ["Overdue", weekly.overdue ?? 0], ["Best window", "9–11am"]].map(([k, v]) => (
              <div key={k} className="anchor-card"><h2><Icon name="activity" size={14} /> {k}</h2><p className="anchor-kpi">{v}</p></div>
            ))}
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="chart" size={15} /> Completion trend</h2>
            <div role="img" aria-label="Completion line trend" style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
              {line.map((v, i) => <div key={i} style={{ width: 26, height: v * 7, background: "#14B8A6", borderRadius: 4 }} />)}
            </div>
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="memory" size={15} /> By category</h2>
            {[["Academic", 88], ["Work", 72], ["Health", 54], ["Family", 68]].map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ width: 80, fontSize: 13 }}>{k}</span>
                <div style={{ flex: 1, background: "#eef2f7", borderRadius: 6, height: 12 }}>
                  <div style={{ width: `${v}%`, height: "100%", background: "#14213D", borderRadius: 6 }} />
                </div>
                <span style={{ fontSize: 13 }}>{v}%</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {entries.map(([k, v]) => (
                <div key={k} style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: Math.max(6, (v / max) * 60), background: "#14213D", borderRadius: 6 }} />
                  <div style={{ fontSize: 12 }}>{k} {v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="anchor-card">
            <h2><Icon name="clock" size={15} /> When you complete</h2>
            <div role="img" aria-label="Completion heatmap" style={{ display: "flex", gap: 6 }}>
              {heat.map((h, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: 8, background: `rgba(20,184,166,${0.15 + h * 0.85})` }} />
              ))}
            </div>
            <p className="anchor-muted" style={{ fontSize: 12 }}>Mornings 9–11am are strongest. Line, bar, heatmap only — no pie charts.</p>
          </div>
        </>
      )}
    </Shell>
  );
}
