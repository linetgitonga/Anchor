"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export const NAVY = "#14213D";
export const TEAL = "#14B8A6";
export const BG = "#FAFAF7";
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function authHeaders(): HeadersInit {
  try {
    const t = localStorage.getItem("anchor_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

/* Inline SVG icon set — stroke icons only, no emojis. */
const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9z" />,
  memory: <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7zM5 7v10M9 9h6M9 13h6" />,
  check: <path d="M5 12l4 4L19 6" />,
  chart: <path d="M5 20V10M11 20V4M17 20v-7M3 20h18" />,
  activity: <path d="M4 12h4l2-6 4 12 2-6h4" />,
  users: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 8a3 3 0 0 1 0 6M18 14a6 6 0 0 1 3 5" />,
  gear: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4.4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2z" />,
  shield: <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />,
  search: <path d="M11 5a6 6 0 1 0 4.2 10.3L20 20l-1.4 1.4-4.8-4.7A6 6 0 0 0 11 5z" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
  bolt: <path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" />,
  alert: <path d="M12 3L2 20h20L12 3zM12 10v5M12 18v.5" />,
  clock: <path d="M12 7v5l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />,
  back: <path d="M15 6l-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  mic: <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4" />,
  message: <path d="M4 5h16v11H9l-5 4V5z" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] ?? PATHS.spark}
    </svg>
  );
}

export const NAV: Array<[string, string, string]> = [
  ["/dashboard", "Dashboard", "home"],
  ["/memory", "Memory", "memory"],
  ["/commitments", "Commitments", "check"],
  ["/forecast", "Forecast", "chart"],
  ["/insights", "Insights", "activity"],
  ["/workspaces", "Workspaces", "users"],
  ["/settings", "Settings", "gear"],
];

export function Shell({ testid, title, subtitle, children }: {
  testid: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [health, setHealth] = useState<string>("…");
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    fetch(`${API}/api/health`).then((r) => {
      setHealth(r.ok ? "ok" : String(r.status));
    }).catch(() => setHealth("offline"));
    try { setAuthed(!!localStorage.getItem("anchor_token")); } catch { setAuthed(false); }
  }, []);
  const bad = health !== "ok";
  return (
    <div className="anchor-shell">
      <aside className="anchor-rail" aria-label="Primary">
        <Link href="/" className="anchor-brand">Anchor</Link>
        <span className="anchor-brand-sub">Memory layer</span>
        <nav>
          {NAV.map(([href, label, icon]) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={active ? "anchor-navlink anchor-navlink-active" : "anchor-navlink"}>
                <Icon name={icon} />
                <span className="anchor-navlabel">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="anchor-main">
        <header className="anchor-topbar">
          <label className="anchor-search">
            <Icon name="search" size={16} />
            <input aria-label="Global search" placeholder="Search — what did I promise Brian?"
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/memory?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }} />
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span data-testid="api-status" title={`API ${health}`}
              className={bad ? "anchor-pill anchor-pill-bad" : "anchor-pill"}>
              <span aria-hidden="true" className={bad ? "anchor-dot anchor-dot-bad" : "anchor-dot"} />
              API {health}
            </span>
            <Link href={authed ? "/dashboard" : "/auth"} aria-label="Account"
              style={{ color: NAVY, display: "inline-flex" }}><Icon name="user" /></Link>
          </div>
        </header>
        <main className="anchor-content">
          <p className="anchor-eyebrow">{subtitle ?? "Student MVP"}</p>
          <h1 style={{ fontSize: 22, margin: "0 0 16px" }}>{title}</h1>
          <section data-testid={testid}>{children}</section>
        </main>
      </div>
    </div>
  );
}
