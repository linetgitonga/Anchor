"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../lib";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState("normal");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch(`${API}/api/v1/settings`, { headers: authHeaders() });
    const j = r.ok ? await r.json() : {};
    setPrefs(j);
    if (j.memory_policy) setPolicy(j.memory_policy);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const r = await fetch(`${API}/api/v1/settings`, {
      method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...prefs, memory_policy: policy }),
    });
    setMsg(r.ok ? "Saved." : "Sign in on /auth first.");
    load();
  }

  return (
    <Shell testid="settings-page" title="Settings" subtitle="Memory policy and quiet hours">
      <div className="anchor-grid" style={{ gridTemplateColumns: "200px 1fr" }}>
        <nav aria-label="Settings sections" style={{ display: "grid", gap: 4, alignContent: "start" }}>
          {["Profile", "Notifications", "Memory", "Privacy", "Integrations", "Data export", "Billing"].map((s) => (
            <span key={s} className="anchor-tab" style={{ justifyContent: "flex-start" }}>{s === "Memory" ? <strong>{s}</strong> : s}</span>
          ))}
        </nav>
        <div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="memory" size={15} /> Memory policy</h2>
            {[["minimal", "Minimal — only confirmed commitments"], ["normal", "Normal — all extracted, review inbox"], ["extended", "Extended — everything, including low confidence"]].map(([id, label]) => (
              <label key={id} style={{ display: "flex", gap: 8, padding: "6px 0" }}>
                <input type="radio" name="policy" checked={policy === id} onChange={() => setPolicy(id)} /> {label}
              </label>
            ))}
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="clock" size={15} /> Quiet hours & channels</h2>
            <p className="anchor-muted">22:00 to 07:00 · WhatsApp on · Email/SMS stubs</p>
            <button className="anchor-btn anchor-btn-secondary" onClick={save}>Save</button>
            {msg && <p role="status">{msg}</p>}
          </div>
          <div className="anchor-card">
            <h2><Icon name="alert" size={15} /> Danger zone</h2>
            <p className="anchor-muted">Delete all memory — typed confirmation, stubbed for demo.</p>
            <button className="anchor-btn anchor-btn-secondary" onClick={() => setMsg("Delete-all is disabled in the demo.")}>Delete all memory</button>
          </div>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontSize: 13 }}>Raw prefs (debug)</summary>
            <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 8 }}>{JSON.stringify(prefs, null, 2)}</pre>
          </details>
          <p><Link href="/dashboard">Back to dashboard →</Link></p>
        </div>
      </div>
    </Shell>
  );
}
