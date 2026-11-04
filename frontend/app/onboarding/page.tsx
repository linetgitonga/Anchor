"use client";

import { useState } from "react";
import { API, Shell, authHeaders } from "../lib";

const ROLES = ["Student", "Professional", "Freelancer", "Parent", "Other"];
const GOALS = ["Pass exams", "Grow career", "Fitness", "Save money", "Family", "Custom"];
const SOURCES = ["WhatsApp", "Groups", "Voice notes", "Direct"];
const POLICIES = [
  { id: "minimal", label: "Minimal", desc: "Only confirmed commitments are stored." },
  { id: "normal", label: "Normal", desc: "All extracted items; review the inbox." },
  { id: "extended", label: "Extended", desc: "Everything, including low-confidence drafts." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("Student");
  const [goals, setGoals] = useState<string[]>(["Pass exams"]);
  const [sources, setSources] = useState<string[]>(["Direct"]);
  const [policy, setPolicy] = useState("normal");
  const [msg, setMsg] = useState("");

  function toggle(list: string[], v: string, set: (x: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function finish() {
    setMsg("Saving…");
    try {
      await fetch(`${API}/api/v1/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ role, goals, sources, memory_policy: policy }),
      });
      const r = await fetch(`${API}/api/v1/onboarding/complete`, { method: "POST", headers: authHeaders() });
      if (!r.ok) return setMsg("Sign in on /auth first, then finish.");
      window.location.href = "/dashboard?first=1";
    } catch {
      setMsg("Backend unreachable.");
    }
  }

  return (
    <Shell testid="onboarding-page" title="Onboarding" subtitle={`Step ${step + 1} of 4`}>
      <div className="anchor-steps" aria-label="Progress">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? "anchor-step-dot anchor-step-dot-done" : "anchor-step-dot"} />
        ))}
        <span className="anchor-muted" style={{ fontSize: 12, marginLeft: 8 }}>Step {step + 1} of 4</span>
      </div>

      {step === 0 && (
        <div>
          <h2 style={{ fontSize: 16 }}>What best describes you?</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ROLES.map((r) => (
              <button key={r} onClick={() => setRole(r)} aria-pressed={role === r}
                className={role === r ? "anchor-tab anchor-tab-active" : "anchor-tab"}>{r}</button>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 16 }}>What are you working toward?</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GOALS.map((g) => (
              <button key={g} onClick={() => toggle(goals, g, setGoals)} aria-pressed={goals.includes(g)}
                className={goals.includes(g) ? "anchor-tab anchor-tab-active" : "anchor-tab"}>{g}</button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 16 }}>Where do promises come from?</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SOURCES.map((s) => (
              <button key={s} onClick={() => toggle(sources, s, setSources)} aria-pressed={sources.includes(s)}
                className={sources.includes(s) ? "anchor-tab anchor-tab-active" : "anchor-tab"}>{s}</button>
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 16 }}>Memory policy</h2>
          {POLICIES.map((p) => (
            <label key={p.id} style={{ display: "flex", gap: 10, padding: "10px 0", cursor: "pointer" }}>
              <input type="radio" name="policy" checked={policy === p.id} onChange={() => setPolicy(p.id)} />
              <span><strong>{p.label}</strong> — <span className="anchor-muted">{p.desc}</span></span>
            </label>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {step > 0 && <button className="anchor-btn anchor-btn-secondary" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 ? (
          <button className="anchor-btn" onClick={() => setStep(step + 1)}>Continue</button>
        ) : (
          <button className="anchor-btn anchor-btn-teal" onClick={finish}>Finish — capture first promise</button>
        )}
        {step > 0 && <button className="anchor-btn anchor-btn-secondary" onClick={() => setStep(3)}>Skip</button>}
      </div>
      {msg && <p role="status">{msg}</p>}
    </Shell>
  );
}
