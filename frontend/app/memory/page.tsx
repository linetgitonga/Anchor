"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../lib";

type Mem = { id: string; text: string; person?: string | null; category?: string; confidence?: number; source?: string };

const FILTERS = ["All", "Academic", "Work", "Health", "Financial", "Family"];

export default function MemoryPage({ searchParams }: { searchParams?: { q?: string } }) {
  const [q, setQ] = useState(searchParams?.q ?? "");
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<Mem[] | null>(null);
  const [visible, setVisible] = useState(10);
  const [dismissed, setDismissed] = useState<string[]>([]);

  async function load(query = q) {
    setVisible(10);
    const cat = filter === "All" ? "" : `&category=${encodeURIComponent(filter.toLowerCase())}`;
    const r = await fetch(`${API}/api/v1/memories?q=${encodeURIComponent(query)}${cat}`, { headers: authHeaders() });
    setItems(r.ok ? await r.json() : []);
  }
  useEffect(() => { load(""); }, []);
  useEffect(() => { load(); }, [filter]);

  const shown = (items ?? []).filter((m) => !dismissed.includes(m.id)).slice(0, visible);

  return (
    <Shell testid="memory-page" title="Memory" subtitle="Every promise with its source and confidence">
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input aria-label="Search memory" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder='Search: "what did I promise Brian?"'
          onKeyDown={(e) => { if (e.key === "Enter") load(); }}
          style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px" }} />
        <button onClick={() => load()} className="anchor-btn">Search</button>
      </div>
      <div className="anchor-tabs" role="tablist" aria-label="Filters" style={{ position: "sticky", top: 56 }}>
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={filter === f ? "anchor-tab anchor-tab-active" : "anchor-tab"}>{f}</button>
        ))}
      </div>
      {!items ? <p>Sign in on <Link href="/auth">/auth</Link>, then search.</p>
        : shown.length === 0 ? <p>No memories yet — capture one from <Link href="/dashboard">dashboard</Link>.</p> : (
        <>
          <p className="anchor-muted" style={{ fontSize: 13 }}>Today</p>
          <div style={{ display: "grid", gap: 12 }}>
            {shown.map((m) => {
              const low = (m.confidence ?? 1) < 0.8;
              return (
                <article key={m.id} className="anchor-card">
                  <p className="anchor-muted" style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                    <Icon name={m.source === "voice" ? "mic" : "message"} size={14} />
                    {m.source ?? "Direct"} · confidence {m.confidence ?? "—"}
                    {low && <span className="anchor-chip anchor-chip-warn"><Icon name="alert" size={13} /> low confidence</span>}
                  </p>
                  <p style={{ fontSize: 15 }}>“{m.text}”</p>
                  <p className="anchor-muted" style={{ fontSize: 13 }}>
                    Extracted: {m.text} {m.person ? `→ ${m.person}` : ""} · {m.category ?? "general"}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link href="/commitments" style={{ fontSize: 13 }}>Open commitment</Link>
                    {low ? (
                      <>
                        <button className="anchor-btn anchor-btn-teal" style={{ padding: "6px 12px", fontSize: 13 }}
                          onClick={() => setDismissed((d) => d.filter((x) => x !== m.id))}>Confirm</button>
                        <button className="anchor-btn anchor-btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}
                          onClick={() => setDismissed((d) => [...d, m.id])}>Dismiss</button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {(items?.length ?? 0) > visible && (
            <button className="anchor-btn anchor-btn-secondary" style={{ marginTop: 12 }} onClick={() => setVisible(visible + 10)}>Load more</button>
          )}
        </>
      )}
    </Shell>
  );
}
