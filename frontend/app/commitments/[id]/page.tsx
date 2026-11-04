"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, Icon, Shell, authHeaders } from "../../lib";

type Detail = {
  commitment?: { id: string; action: string; status: string; person?: string | null; deadline?: string | null; deadline_text?: string | null; confidence?: number };
  source_message?: { text?: string } | null;
  extracted?: { action?: string; person?: string | null; deadline?: string | null; confidence?: number };
  explanation?: string;
  timeline?: Array<{ kind: string; at: string }>;
};

export default function CommitmentDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Detail | null>(null);
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch(`${API}/api/v1/commitments/${params.id}`, { headers: authHeaders() });
    const j = r.ok ? await r.json() : null;
    setData(j);
    if (j?.extracted) setJson(JSON.stringify(j.extracted, null, 2));
  }
  useEffect(() => { load(); }, [params.id]);

  async function defer() {
    await fetch(`${API}/api/v1/commitments/${params.id}/defer`, {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ until: "tomorrow" }),
    });
    setMsg("Deferred to tomorrow.");
    load();
  }
  async function complete() {
    const r = await fetch(`${API}/api/v1/commitments/${params.id}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ text: "DONE" }),
    });
    setMsg(r.ok ? "Marked complete." : "Could not complete.");
    load();
  }

  return (
    <Shell testid="commitment-detail-page" title="Commitment detail" subtitle="Raw message · extracted JSON · audit trail">
      <p><Link href="/commitments"><Icon name="back" size={14} /> Commitments</Link></p>
      {!data ? <p>Sign in on <Link href="/auth">/auth</Link>, then open a commitment from /commitments.</p> : (
        <>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="check" size={15} /> {data.commitment?.action} </h2>
            <p className="anchor-muted">Due {data.commitment?.deadline_text ?? data.commitment?.deadline ?? "—"} · status: {data.commitment?.status} · confidence {data.commitment?.confidence ?? data.extracted?.confidence ?? "—"}</p>
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="message" size={15} /> Original message</h2>
            <p>“{data.source_message?.text ?? data.commitment?.action}”</p>
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="memory" size={15} /> Extracted data</h2>
            <textarea aria-label="Extracted JSON" rows={7} value={json} onChange={(e) => setJson(e.target.value)}
              style={{ width: "100%", fontFamily: "monospace", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, padding: 10 }} />
            <p className="anchor-muted" style={{ fontSize: 12 }}>Editable for the demo — edits stay local.</p>
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="spark" size={15} /> AI explanation — why Anchor extracted this</h2>
            <p>{data.explanation ?? "—"}</p>
          </div>
          <div className="anchor-card" style={{ marginBottom: 12 }}>
            <h2><Icon name="clock" size={15} /> Timeline (append-only)</h2>
            <ul>{(data.timeline ?? []).map((t, i) => <li key={i}>{t.kind} · {t.at}</li>)}</ul>
          </div>
          {msg && <p role="status">{msg}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="anchor-btn" onClick={complete}>Mark complete</button>
            <button className="anchor-btn anchor-btn-secondary" onClick={defer}>Defer</button>
          </div>
        </>
      )}
    </Shell>
  );
}
