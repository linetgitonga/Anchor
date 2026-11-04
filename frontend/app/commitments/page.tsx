"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API, Icon, Shell, authHeaders } from "../lib";

type C = { id: string; action: string; status: string; person?: string | null; deadline_text?: string | null; confidence?: number };
const VIEWS = ["inbox", "active", "completed", "overdue", "recurring", "archived"] as const;

export default function CommitmentsPage() {
  const [view, setView] = useState<string>("active");
  const [items, setItems] = useState<C[] | null>(null);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function load(v = view) {
    setItems(null);
    const r = await fetch(`${API}/api/v1/commitments?view=${v}`, { headers: authHeaders() });
    setItems(r.ok ? await r.json() : []);
  }
  useEffect(() => { load(view); }, [view]);

  async function complete(id: string) {
    const r = await fetch(`${API}/api/v1/commitments/${id}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ text: "DONE" }),
    });
    setMsg(r.ok ? "Marked complete." : "Could not complete — sign in on /auth?");
    load();
  }
  async function defer(id: string) {
    await fetch(`${API}/api/v1/commitments/${id}/defer`, {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ until: "tomorrow" }),
    });
    setMsg("Deferred to tomorrow.");
    load();
  }

  const counts: Record<string, number> = {};
  (items ?? []).forEach((c) => { counts[c.status] = (counts[c.status] ?? 0) + 1; });

  return (
    <Shell testid="commitments-page" title="Commitments" subtitle="Inbox triage → confirmed work">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="anchor-btn" onClick={() => router.push("/dashboard?first=1")}>
          <Icon name="plus" size={15} /> New
        </button>
      </div>
      <div className="anchor-tabs" role="tablist" aria-label="Commitment views">
        {VIEWS.map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={view === v ? "anchor-tab anchor-tab-active" : "anchor-tab"}>
            {v === "inbox" ? `Inbox · ${(items ?? []).length}` : v}
          </button>
        ))}
      </div>
      {msg && <p role="status">{msg}</p>}
      {!items ? <p>Loading…</p> : items.length === 0 ? <p>Nothing in {view}. Sign in on /auth if empty.</p> : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {items.map((c) => (
            <li key={c.id} className="anchor-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Icon name={c.status === "done" ? "check" : "clock"} size={16} />
                <strong>{c.action}</strong>
              </div>
              <p className="anchor-muted" style={{ fontSize: 13, margin: "6px 0" }}>
                Due {c.deadline_text ?? "—"} · from memory
                {(c.confidence ?? 1) < 0.8 && <span className="anchor-chip anchor-chip-warn" style={{ marginLeft: 6 }}>high risk</span>}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="anchor-btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => complete(c.id)}>Done</button>
                <button className="anchor-btn anchor-btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => defer(c.id)}>Defer</button>
                <button className="anchor-btn anchor-btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => defer(c.id)}>Snooze</button>
                <Link href={`/commitments/${c.id}`} style={{ fontSize: 13, alignSelf: "center" }}>Detail →</Link>
                <Link href={`/forecast?c=${c.id}`} style={{ fontSize: 13, alignSelf: "center" }}>What if?</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
