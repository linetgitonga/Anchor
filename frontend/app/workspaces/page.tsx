"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../lib";

export default function WorkspacesPage() {
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [name, setName] = useState("Study group");
  const [msg, setMsg] = useState("");
  async function load() {
    const r = await fetch(`${API}/api/v1/workspaces`, { headers: authHeaders() });
    setItems(r.ok ? await r.json() : []);
  }
  useEffect(() => { load(); }, []);
  async function create() {
    const r = await fetch(`${API}/api/v1/workspaces`, {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ name }),
    });
    setMsg(r.ok ? "Workspace created." : "Sign in on /auth first.");
    load();
  }
  return (
    <Shell testid="workspaces-page" title="Workspaces" subtitle="Team accountability — one live workspace for the demo">
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input aria-label="Workspace name" value={name} onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px" }} />
        <button onClick={create} className="anchor-btn"><Icon name="plus" size={15} /> New workspace</button>
      </div>
      {msg && <p role="status">{msg}</p>}
      {items.length === 0 ? (
        <div className="anchor-card">
          <h2><Icon name="users" size={15} /> IEEE KU (live demo)</h2>
          <p className="anchor-muted">Sign in and create a workspace to see the responsibility matrix. Forward a group message to populate it.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginTop: 8 }}>
            {[["IEEE KU", "6 members · 12 commitments"], ["Hackathon team", "4 members · 8 commitments"], ["Personal", "Empty state"]].map(([t, s]) => (
              <div key={t} className="anchor-card"><strong>{t}</strong><p className="anchor-muted">{s}</p><Link href="/commitments">Open →</Link></div>
            ))}
          </div>
        </div>
      ) : (
        <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0 }}>
          {items.map((w) => (
            <li key={w.id} className="anchor-card"><strong>{w.name}</strong><p className="anchor-muted">Responsibility matrix stub — invite + settings deferred.</p></li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
