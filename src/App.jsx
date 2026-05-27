import { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */

const MILESTONES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
const MILESTONE_MSGS = {
  1: "Day 1 Complete!",
  3: "3 Days Strong!",
  7: "One Full Week!",
  14: "Two Weeks Done!",
  21: "21-Day Habit!",
  30: "One Month!",
  60: "Two Months!",
  90: "90 Days!",
  180: "Half a Year!",
  365: "One Full Year!",
};
const MILESTONE_SUB = {
  1: "Every journey starts with a single step. This one's yours.",
  3: "Three days of choices for your health. Your liver thanks you.",
  7: "A full week! Your body is already showing real changes.",
  14: "Two weeks. Inflammation in your liver has measurably decreased.",
  21: "Scientists say 21 days builds a habit. You've built one.",
  30: "One month! Liver enzymes are normalizing. You look and feel better.",
  60: "Two months of commitment. Your risk of liver disease is dropping.",
  90: "90 days. This is a transformative milestone in your health journey.",
  180: "Half a year. Your body has undergone profound recovery.",
  365: "A full year. You've transformed your relationship with alcohol forever.",
};

const TIPS = [
  "Your liver starts healing within hours of stopping.",
  "Every sober day counts — you're doing great.",
  "Progress, not perfection.",
  "Hydration speeds up your liver recovery.",
  "Sleep is deeper and more restorative without alcohol.",
  "Your future self is proud of the choice you made today.",
  "One day at a time — that's all it takes.",
  "Small consistent wins build lasting, life-changing habits.",
];

const RECOVERY = [
  { days: 0, period: "24–72 hours", title: "Detox begins", detail: "Alcohol clears from your bloodstream. Stay hydrated and rest well. Your body is working hard.", color: "#059669", lightBg: "#d1fae5", darkBg: "#064e3b" },
  { days: 3, period: "Days 3–7", title: "Stabilization", detail: "Blood pressure drops. Sleep quality improves. The mental fog begins to lift.", color: "#3b82f6", lightBg: "#dbeafe", darkBg: "#1e3a5f" },
  { days: 7, period: "Week 1–2", title: "Liver fat reduces", detail: "Fatty deposits begin to clear from your liver. Skin starts to look healthier.", color: "#8b5cf6", lightBg: "#ede9fe", darkBg: "#3b1f6b" },
  { days: 14, period: "Weeks 2–4", title: "Inflammation eases", detail: "Liver inflammation decreases significantly. Energy levels improve. Weight may stabilize.", color: "#d97706", lightBg: "#fef3c7", darkBg: "#5a3000" },
  { days: 30, period: "Month 1–3", title: "Liver healing", detail: "Enzymes normalize. Immune function strengthens. Mental clarity is noticeably better.", color: "#db2777", lightBg: "#fce7f3", darkBg: "#5b1038" },
  { days: 90, period: "3–12 months", title: "Deep recovery", detail: "Significant liver tissue repair. Cognitive function and mood improve substantially.", color: "#0891b2", lightBg: "#cffafe", darkBg: "#083344" },
  { days: 365, period: "1+ years", title: "Long-term health", detail: "Liver near-fully recovered in most cases. Heart health improved. Cancer risk meaningfully reduced.", color: "#16a34a", lightBg: "#dcfce7", darkBg: "#14532d" },
];

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/* ═══════════════════════════════════════════════════════════════
   STORAGE (window.storage API with in-memory fallback)
═══════════════════════════════════════════════════════════════ */

const memCache = {};
const store = {
  async get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

const toStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => toStr(new Date());
const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

const calcStreaks = (days) => {
  const today = todayStr();
  let current = 0;
  if (days[today] !== "alcohol") {
    const startDate = new Date();
    if (days[today] !== "sober") startDate.setDate(startDate.getDate() - 1);
    const d = new Date(startDate);
    for (let i = 0; i < 1000; i++) {
      if (days[toStr(d)] === "sober") { current++; d.setDate(d.getDate() - 1); }
      else break;
    }
  }
  const soberDays = Object.entries(days).filter(([, v]) => v === "sober").map(([k]) => k).sort();
  if (!soberDays.length) return { current, longest: 0 };
  let longest = 1, run = 1;
  for (let i = 1; i < soberDays.length; i++) {
    const diff = Math.round((parseDate(soberDays[i]) - parseDate(soberDays[i - 1])) / 86400000);
    if (diff === 1) { run++; if (run > longest) longest = run; } else run = 1;
  }
  return { current, longest };
};

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"; };

/* ═══════════════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════════════ */

const T = {
  light: {
    bg: "#f0fdf9", card: "#ffffff", cardBorder: "#e2e8f0",
    text: "#0f172a", textSec: "#64748b", textTer: "#94a3b8",
    nav: "#ffffff", navBorder: "#e2e8f0",
    accent: "#059669", accentFg: "#ffffff",
    accentMuted: "#d1fae5", accentStrong: "#047857",
    sober: "#22c55e", soberBg: "#dcfce7", soberBorder: "#86efac", soberText: "#14532d",
    alcohol: "#ef4444", alcoholBg: "#fee2e2", alcoholBorder: "#fca5a5", alcoholText: "#7f1d1d",
    empty: "#f1f5f9", emptyText: "#cbd5e1",
    btnBorder: "#e2e8f0",
    shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  },
  dark: {
    bg: "#0a1628", card: "#1e293b", cardBorder: "#334155",
    text: "#f1f5f9", textSec: "#94a3b8", textTer: "#64748b",
    nav: "#1e293b", navBorder: "#334155",
    accent: "#10b981", accentFg: "#ffffff",
    accentMuted: "#064e3b", accentStrong: "#34d399",
    sober: "#4ade80", soberBg: "#14532d", soberBorder: "#166534", soberText: "#bbf7d0",
    alcohol: "#f87171", alcoholBg: "#7f1d1d", alcoholBorder: "#991b1b", alcoholText: "#fecaca",
    empty: "#0f172a", emptyText: "#334155",
    btnBorder: "#334155",
    shadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
};

/* ═══════════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════════ */

function Card({ t, children, style = {} }) {
  return (
    <div style={{ background: t.card, borderRadius: 20, border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, ...style }}>
      {children}
    </div>
  );
}

function ProgressRing({ value, max, size = 128, stroke = 10, color, bg, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function StatBadge({ label, value, unit = "", icon, color, bg, t }) {
  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "14px 12px", border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow }}>
      <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 13, color: t.textSec, fontWeight: 500 }}> {unit}</span>
      </div>
      <div style={{ fontSize: 11, color: t.textSec, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MILESTONE MODAL
═══════════════════════════════════════════════════════════════ */

function MilestoneModal({ milestone, onClose, t }) {
  if (!milestone) return null;
  const emojis = { 1: "🌱", 3: "💪", 7: "⭐", 14: "✨", 21: "🔥", 30: "🏆", 60: "💎", 90: "🎖️", 180: "🌙", 365: "👑" };
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: t.card, borderRadius: 28, padding: "40px 28px 32px",
        textAlign: "center", maxWidth: 320, width: "100%",
        border: `1px solid ${t.cardBorder}`, boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        animation: "popIn .35s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>{emojis[milestone]}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: t.accent, marginBottom: 10, letterSpacing: "-0.5px" }}>
          {MILESTONE_MSGS[milestone]}
        </div>
        <div style={{ fontSize: 14, color: t.textSec, lineHeight: 1.65, marginBottom: 28 }}>
          {MILESTONE_SUB[milestone]}
        </div>
        <button onClick={onClose} style={{
          background: t.accent, color: "#fff", border: "none", borderRadius: 14,
          padding: "14px 0", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%",
          letterSpacing: "0.2px",
        }}>
          Keep going! 💪
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TREE VISUALIZATION
═══════════════════════════════════════════════════════════════ */

function RecoveryTree({ streak }) {
  const p = Math.min(streak / 60, 1);
  const trunkH = 16 + p * 44;
  const layers = Math.max(1, Math.min(4, Math.ceil(p * 4)));
  const spread = 18 + p * 52;
  const green = streak < 7 ? "#86efac" : streak < 30 ? "#4ade80" : "#22c55e";
  const darkGreen = streak < 7 ? "#4ade80" : streak < 30 ? "#16a34a" : "#166534";
  const cx = 80, baseY = 108;

  return (
    <svg width={160} height={120} viewBox="0 0 160 120" style={{ display: "block", margin: "0 auto" }}>
      {/* Ground */}
      <ellipse cx={cx} cy={baseY + 2} rx={18} ry={4} fill="#92400e" opacity={0.25} />
      {/* Trunk */}
      <rect x={cx - 3} y={baseY - trunkH} width={6} height={trunkH} rx={3} fill="#92400e" />
      {/* Tree layers */}
      {Array.from({ length: layers }, (_, i) => {
        const li = layers - 1 - i;
        const lw = spread * (0.45 + li * 0.18);
        const ly = baseY - trunkH - i * (trunkH * 0.3);
        return (
          <ellipse key={i} cx={cx} cy={ly} rx={lw / 2} ry={Math.max(8, trunkH * 0.18)}
            fill={i === layers - 1 ? darkGreen : green} opacity={0.85 + i * 0.04} />
        );
      })}
      {/* Fruits/stars at milestone */}
      {streak >= 30 && (
        <>
          <circle cx={cx - 16} cy={baseY - trunkH - 8} r={4} fill="#fbbf24" />
          <circle cx={cx + 18} cy={baseY - trunkH - 14} r={3} fill="#fbbf24" />
          <circle cx={cx + 4} cy={baseY - trunkH - 28} r={4} fill="#fbbf24" />
        </>
      )}
      {streak >= 90 && (
        <>
          <circle cx={cx - 26} cy={baseY - trunkH - 20} r={3} fill="#fbbf24" />
          <circle cx={cx + 28} cy={baseY - trunkH - 8} r={3} fill="#fbbf24" />
        </>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME VIEW
═══════════════════════════════════════════════════════════════ */

function HomeView({ days, onToggle, t }) {
  const today = todayStr();
  const status = days[today];
  const { current, longest } = useMemo(() => calcStreaks(days), [days]);
  const totalSober = useMemo(() => Object.values(days).filter((v) => v === "sober").length, [days]);
  const totalTracked = Object.keys(days).length;
  const soberPct = totalTracked > 0 ? Math.round((totalSober / totalTracked) * 100) : 0;
  const tip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);
  const nextMs = MILESTONES.find((m) => m > current) || 365;

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const cardBg = status === "sober" ? t.soberBg : status === "alcohol" ? t.alcoholBg : t.card;
  const cardBorder = status === "sober" ? t.soberBorder : status === "alcohol" ? t.alcoholBorder : t.cardBorder;

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Greeting */}
      <div style={{ padding: "20px 20px 8px" }}>
        <div style={{ fontSize: 12, color: t.textSec, marginBottom: 3, letterSpacing: "0.3px" }}>{dateLabel}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Good {greeting()} 👋</div>
      </div>

      {/* Today card */}
      <div style={{ padding: "10px 20px" }}>
        <div style={{ background: cardBg, borderRadius: 22, padding: "22px 18px", border: `1px solid ${cardBorder}`, transition: "background 0.3s, border-color 0.3s", boxShadow: t.shadow }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>
              {status === "sober" ? "✅" : status === "alcohol" ? "🚫" : "❓"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: status === "sober" ? t.soberText : status === "alcohol" ? t.alcoholText : t.text, marginBottom: 3 }}>
              {status === "sober" ? "Alcohol-Free Today" : status === "alcohol" ? "Logged Consumption" : "How was today?"}
            </div>
            <div style={{ fontSize: 12, color: t.textSec }}>{status ? "Tap to change" : "Mark your status below"}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "✓  No Alcohol", s: "sober", active: status === "sober", activeBg: t.sober, activeBorder: t.sober, activeColor: "#fff" },
              { label: "✗  Had a Drink", s: "alcohol", active: status === "alcohol", activeBg: t.alcohol, activeBorder: t.alcohol, activeColor: "#fff" },
            ].map(({ label, s, active, activeBg, activeBorder, activeColor }) => (
              <button key={s} onClick={() => onToggle(today, status === s ? null : s)} style={{
                flex: 1, padding: "13px 8px", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer",
                border: `2px solid ${active ? activeBorder : t.btnBorder}`,
                background: active ? activeBg : t.card, color: active ? activeColor : t.textSec,
                transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                WebkitTapHighlightColor: "transparent",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Streak + Stats */}
      <div style={{ padding: "0 20px 10px" }}>
        <Card t={t} style={{ padding: "22px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <ProgressRing value={current} max={nextMs} size={120} stroke={10} color={t.accent} bg={t.accentMuted}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: t.accent, lineHeight: 1 }}>{current}</div>
                <div style={{ fontSize: 10, color: t.textSec, marginTop: 3, letterSpacing: "0.3px" }}>day streak</div>
              </div>
            </ProgressRing>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "🏆", label: "Longest streak", value: longest, unit: "days", color: "#d97706" },
                { icon: "🍃", label: "Total sober", value: totalSober, unit: "days", color: t.sober },
                { icon: "📊", label: "Sober rate", value: soberPct, unit: "%", color: "#8b5cf6" },
              ].map(({ icon, label, value, unit, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: t.textSec, marginBottom: 1 }}>{icon} {label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>
                    {value}<span style={{ fontSize: 12, color: t.textSec, fontWeight: 500 }}> {unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Next milestone bar */}
          {current > 0 && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${t.cardBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: t.textSec }}>Next milestone: {nextMs} days</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>{current} / {nextMs}</span>
              </div>
              <div style={{ background: t.accentMuted, borderRadius: 8, height: 7, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: t.accent, borderRadius: 8,
                  width: `${Math.min((current / nextMs) * 100, 100)}%`,
                  transition: "width 1s cubic-bezier(.4,0,.2,1)",
                }} />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tip */}
      <div style={{ padding: "0 20px" }}>
        <div style={{
          background: t.accentMuted, borderRadius: 16, padding: "14px 16px",
          border: `1px solid ${t.accent}33`, display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>💡</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: t.accent, letterSpacing: "0.8px", marginBottom: 5 }}>DAILY TIP</div>
            <div style={{ fontSize: 13, color: t.text, lineHeight: 1.55 }}>{tip}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR VIEW
═══════════════════════════════════════════════════════════════ */

function CalendarView({ days, onToggle, t }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = todayStr();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const mkKey = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const { soberCount, alcoholCount } = useMemo(() => {
    let s = 0, a = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const v = days[mkKey(d)];
      if (v === "sober") s++;
      if (v === "alcohol") a++;
    }
    return { soberCount: s, alcoholCount: a };
  }, [days, year, month, daysInMonth]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const navMonth = (dir) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + dir);
    setViewDate(d);
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Month nav */}
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navMonth(-1)} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", color: t.text, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: "-0.3px" }}>
            {viewDate.toLocaleString("default", { month: "long" })}
          </div>
          <div style={{ fontSize: 13, color: t.textSec }}>{year}</div>
        </div>
        <button onClick={() => navMonth(1)} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, width: 42, height: 42, cursor: "pointer", color: t.text, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
      </div>

      {/* Summary chips */}
      <div style={{ padding: "0 20px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { val: soberCount, label: "Sober", bg: t.soberBg, color: t.sober, border: t.soberBorder },
          { val: alcoholCount, label: "Drink", bg: t.alcoholBg, color: t.alcohol, border: t.alcoholBorder },
          { val: (soberCount + alcoholCount) > 0 ? Math.round(soberCount / (soberCount + alcoholCount) * 100) + "%" : "—", label: "Rate", bg: t.accentMuted, color: t.accent, border: t.accent + "44" },
        ].map(({ val, label, bg, color, border }) => (
          <div key={label} style={{ background: bg, borderRadius: 14, padding: "12px 8px", textAlign: "center", border: `1px solid ${border}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: t.textSec }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, color: t.textTer, fontWeight: 700, padding: "4px 0", letterSpacing: "0.3px" }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = mkKey(day);
          const status = days[key];
          const isToday = key === today;
          const isFuture = key > today;
          const nextStatus = status === "sober" ? "alcohol" : status === "alcohol" ? null : "sober";

          return (
            <button key={i}
              onClick={() => !isFuture && onToggle(key, nextStatus)}
              style={{
                aspectRatio: "1", borderRadius: 11, border: isToday ? `2px solid ${t.accent}` : `1px solid ${status === "sober" ? t.soberBorder : status === "alcohol" ? t.alcoholBorder : t.cardBorder}`,
                background: status === "sober" ? t.soberBg : status === "alcohol" ? t.alcoholBg : isFuture ? t.empty : t.card,
                color: status === "sober" ? t.soberText : status === "alcohol" ? t.alcoholText : isFuture ? t.emptyText : t.text,
                fontSize: 13, fontWeight: isToday ? 800 : 500, cursor: isFuture ? "default" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", opacity: isFuture ? 0.35 : 1, gap: 2,
                WebkitTapHighlightColor: "transparent",
              }}>
              <span>{day}</span>
              {status && <span style={{ fontSize: 5, lineHeight: 1 }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: "16px 20px", display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { color: t.sober, label: "No alcohol" },
          { color: t.alcohol, label: "Had drink" },
          { color: t.emptyText, label: "Untracked" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 12, color: t.textSec }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INSIGHTS VIEW
═══════════════════════════════════════════════════════════════ */

function InsightsView({ days, t }) {
  const { current, longest } = useMemo(() => calcStreaks(days), [days]);
  const totalSober = useMemo(() => Object.values(days).filter((v) => v === "sober").length, [days]);
  const totalAlcohol = useMemo(() => Object.values(days).filter((v) => v === "alcohol").length, [days]);
  const totalTracked = totalSober + totalAlcohol;

  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const key = toStr(d), status = days[key];
      return { key, status, label: d.getDate() };
    });
  }, [days]);

  const weeklyPattern = useMemo(() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(null).map(() => ({ s: 0, a: 0 }));
    Object.entries(days).forEach(([k, v]) => {
      const dow = parseDate(k).getDay();
      if (v === "sober") counts[dow].s++;
      else if (v === "alcohol") counts[dow].a++;
    });
    return names.map((name, i) => {
      const total = counts[i].s + counts[i].a;
      return { name, rate: total > 0 ? Math.round((counts[i].s / total) * 100) : null };
    });
  }, [days]);

  const exportData = () => {
    const json = JSON.stringify({ days, exported: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "sober-days-data.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ padding: "20px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Insights</div>
        <div style={{ fontSize: 13, color: t.textSec }}>Your health journey at a glance</div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "0 20px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBadge label="Current streak" value={current} unit="days" icon="🔥" color={t.accent} bg={t.accentMuted} t={t} />
        <StatBadge label="Longest streak" value={longest} unit="days" icon="🏆" color="#d97706" bg="#fef3c7" t={t} />
        <StatBadge label="Total sober" value={totalSober} unit="days" icon="🍃" color={t.sober} bg={t.soberBg} t={t} />
        <StatBadge label="Sober rate" value={totalTracked > 0 ? Math.round((totalSober / totalTracked) * 100) : 0} unit="%" icon="📊" color="#8b5cf6" bg="#ede9fe" t={t} />
      </div>

      {/* 30-day bar chart */}
      <div style={{ padding: "0 20px 14px" }}>
        <Card t={t} style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>Last 30 days</div>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 56 }}>
            {last30.map(({ key, status }, i) => (
              <div key={i} style={{
                flex: 1, minHeight: 4,
                height: status === "sober" ? "100%" : status === "alcohol" ? "55%" : "12%",
                background: status === "sober" ? t.sober : status === "alcohol" ? t.alcohol : t.empty,
                borderRadius: "3px 3px 0 0", opacity: status ? 1 : 0.4,
                transition: "height 0.4s ease",
              }} />
            ))}
          </div>
          <div style={{ height: 1, background: t.cardBorder, margin: "0 0 6px" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: t.textTer }}>30 days ago</span>
            <span style={{ fontSize: 10, color: t.textTer }}>Today</span>
          </div>
        </Card>
      </div>

      {/* Weekly pattern */}
      <div style={{ padding: "0 20px 14px" }}>
        <Card t={t} style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>Weekly pattern</div>
          <div style={{ fontSize: 12, color: t.textSec, marginBottom: 16 }}>Sober rate by day of week</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {weeklyPattern.map(({ name, rate }) => (
              <div key={name} style={{ textAlign: "center" }}>
                <div style={{ height: 60, background: t.empty, borderRadius: 6, marginBottom: 6, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  {rate !== null && (
                    <div style={{
                      height: `${rate}%`, minHeight: 3, borderRadius: 6,
                      background: rate >= 70 ? t.sober : rate >= 40 ? "#f59e0b" : t.alcohol,
                      transition: "height 0.6s ease",
                    }} />
                  )}
                </div>
                <div style={{ fontSize: 10, color: t.textSec }}>{name.slice(0, 2)}</div>
                {rate !== null && <div style={{ fontSize: 9, color: t.textTer }}>{rate}%</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Milestones earned */}
      <div style={{ padding: "0 20px 14px" }}>
        <Card t={t} style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>Milestones</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MILESTONES.map((m) => {
              const earned = longest >= m;
              return (
                <div key={m} style={{
                  padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: earned ? t.accentMuted : t.empty,
                  color: earned ? t.accent : t.emptyText,
                  border: `1px solid ${earned ? t.accent + "55" : t.cardBorder}`,
                  transition: "all 0.3s",
                }}>
                  {earned ? "✓ " : ""}{m} days
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Export */}
      <div style={{ padding: "0 20px" }}>
        <button onClick={exportData} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          📤 Export Data as JSON
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECOVERY VIEW
═══════════════════════════════════════════════════════════════ */

function RecoveryView({ days, t }) {
  const { current } = useMemo(() => calcStreaks(days), [days]);
  const dark = t === T.dark;

  const currentStageIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < RECOVERY.length; i++) {
      if (current >= RECOVERY[i].days) idx = i;
    }
    return idx;
  }, [current]);

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ padding: "20px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Recovery</div>
        <div style={{ fontSize: 13, color: t.textSec }}>Educational liver health timeline</div>
      </div>

      {/* Tree card */}
      <div style={{ padding: "0 20px 14px" }}>
        <Card t={t} style={{ padding: "24px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: t.textSec, marginBottom: 12, letterSpacing: "0.3px" }}>YOUR RECOVERY TREE</div>
          <RecoveryTree streak={current} />
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.accent, letterSpacing: "-0.5px" }}>{current} {current === 1 ? "day" : "days"} sober</div>
            <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>
              Stage {currentStageIdx + 1} of {RECOVERY.length}: {RECOVERY[currentStageIdx].title}
            </div>
          </div>
          {current === 0 && (
            <div style={{ marginTop: 12, fontSize: 13, color: t.textSec, lineHeight: 1.55 }}>
              Mark today as a sober day to start growing your tree 🌱
            </div>
          )}
        </Card>
      </div>

      {/* Timeline */}
      <div style={{ padding: "0 20px 14px" }}>
        <Card t={t} style={{ padding: "20px 18px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 20 }}>Recovery timeline</div>
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: t.cardBorder, borderRadius: 2 }} />

            {RECOVERY.map((stage, i) => {
              const reached = current >= stage.days;
              const isCurrent = i === currentStageIdx;
              const stageBg = dark ? stage.darkBg : stage.lightBg;

              return (
                <div key={i} style={{ display: "flex", gap: 16, marginBottom: i < RECOVERY.length - 1 ? 26 : 0, position: "relative" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                    background: reached ? stage.color : t.empty,
                    border: `3px solid ${reached ? stage.color : t.cardBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: reached ? "#fff" : t.textTer, fontWeight: 800,
                    boxShadow: isCurrent ? `0 0 0 5px ${stage.color}33` : "none",
                    transition: "all 0.4s",
                  }}>
                    {reached ? "✓" : "·"}
                  </div>
                  <div style={{ paddingTop: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: reached ? t.text : t.textSec }}>
                        {stage.title}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: stage.color, background: stageBg, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.5px" }}>
                          YOU ARE HERE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: stage.color, fontWeight: 700, marginBottom: 4, letterSpacing: "0.2px" }}>{stage.period}</div>
                    <div style={{ fontSize: 12, color: t.textSec, lineHeight: 1.55 }}>{stage.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ padding: "0 20px 10px", fontSize: 11, color: t.textTer, lineHeight: 1.65, textAlign: "center" }}>
        ⚠️ Educational information only. Recovery varies by individual. Consult a healthcare professional for personal medical advice.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOTTOM NAV
═══════════════════════════════════════════════════════════════ */

const TABS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "calendar", icon: "📅", label: "Calendar" },
  { id: "insights", icon: "📊", label: "Insights" },
  { id: "recovery", icon: "🌿", label: "Recovery" },
];

function BottomNav({ active, onChange, t }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: t.nav, borderTop: `1px solid ${t.navBorder}`,
      display: "flex", paddingBottom: "env(safe-area-inset-bottom, 8px)",
    }}>
      {TABS.map(({ id, icon, label }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, padding: "10px 0 8px", border: "none", background: "transparent", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          color: active === id ? t.accent : t.textTer,
          transition: "color 0.2s",
          WebkitTapHighlightColor: "transparent",
        }}>
          <span style={{ fontSize: 22, transform: active === id ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1)" }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: active === id ? 700 : 400, letterSpacing: "0.2px" }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */

export default function SoberTracker() {
  const [days, setDays] = useState({});
  const [view, setView] = useState("home");
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [milestone, setMilestone] = useState(null);
  const prevStreakRef = useRef(0);

  const t = dark ? T.dark : T.light;

  useEffect(() => {
    (async () => {
      const savedDays = await store.get("sd-days");
      const savedTheme = await store.get("sd-theme");
      const d = savedDays || {};
      const isDark = savedTheme?.dark ?? false;
      if (savedDays) {
        setDays(d);
        prevStreakRef.current = calcStreaks(d).current;
      }
      setDark(isDark);
      setLoading(false);
    })();
  }, []);

  const handleToggle = useCallback((key, newStatus) => {
    setDays((prev) => {
      const next = { ...prev };
      if (newStatus === null) delete next[key];
      else next[key] = newStatus;
      store.set("sd-days", next);
      // Milestone check
      const prevStreak = prevStreakRef.current;
      const { current } = calcStreaks(next);
      if (current > prevStreak && MILESTONES.includes(current)) {
        setTimeout(() => setMilestone(current), 400);
      }
      prevStreakRef.current = current;
      return next;
    });
  }, []);

  const handleTheme = useCallback(() => {
    setDark((d) => {
      const next = !d;
      store.set("sd-theme", { dark: next });
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f0fdf9", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 48, animation: "pulse 1.5s ease-in-out infinite" }}>🌿</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>Loading your journey…</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: t.bg,
      fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      color: t.text, transition: "background 0.3s, color 0.3s",
      WebkitTextSizeAdjust: "100%", overflowX: "hidden",
      paddingTop: "env(safe-area-inset-top, 0px)",
    }}>
      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: `${t.nav}dd`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${t.navBorder}`,
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: t.text, letterSpacing: "-0.3px" }}>Sober Days</span>
        </div>
        <button onClick={handleTheme} style={{
          background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 20,
          padding: "7px 14px", cursor: "pointer", fontSize: 16, lineHeight: 1,
          display: "flex", alignItems: "center", gap: 4,
          WebkitTapHighlightColor: "transparent",
        }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Main scrollable content */}
      <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 80 }}>
        {view === "home" && <HomeView days={days} onToggle={handleToggle} t={t} />}
        {view === "calendar" && <CalendarView days={days} onToggle={handleToggle} t={t} />}
        {view === "insights" && <InsightsView days={days} t={t} />}
        {view === "recovery" && <RecoveryView days={days} t={t} />}
      </div>

      <BottomNav active={view} onChange={setView} t={t} />
      <MilestoneModal milestone={milestone} onClose={() => setMilestone(null)} t={t} />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        button { font-family: inherit; }
        @keyframes popIn {
          0% { transform: scale(0.7) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  );
}