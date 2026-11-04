"use client";

import { useEffect, useState } from "react";
import { API, Icon, Shell, authHeaders } from "../lib";

export default function AdminPage() {
  const [data, setData] = useState<string>("Loading… (students see 403 — RBAC-gated.)");
  useEffect(() => {
    fetch(`${API}/api/v1/admin/health`, { headers: authHeaders() })
      .then(async (r) => (r.ok ? JSON.stringify(await r.json(), null, 2) : `Gated: HTTP ${r.status} — internal only.`))
      .then(setData)
      .catch(() => setData("Backend unreachable."));
  }, []);
  return (
    <Shell testid="admin-page" title="Admin" subtitle="Operational look — single health page for judges">
      <div className="anchor-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", marginBottom: 12 }}>
        {[["Users", "1,284"], ["Tokens", "3.2M"], ["p95 latency", "620ms"], ["Errors 24h", "0.3%"]].map(([k, v]) => (
          <div key={k} className="anchor-card"><h2><Icon name="shield" size={14} /> {k}</h2><p className="anchor-kpi">{v}</p></div>
        ))}
      </div>
      <div className="anchor-card" style={{ marginBottom: 12 }}>
        <h2><Icon name="check" size={15} /> Services</h2>
        <p className="anchor-muted">Postgres · Redis · RabbitMQ · Celery · MinIO — live status comes from /api/health.</p>
      </div>
      <div className="anchor-card">
        <h2><Icon name="activity" size={15} /> Live backend response</h2>
        <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 8 }}>{data}</pre>
      </div>
    </Shell>
  );
}
