import { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const MILESTONES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
const MILESTONE_MSGS = { 1:"Day 1 Complete!", 3:"3 Days Strong!", 7:"One Full Week!", 14:"Two Weeks Done!", 21:"21-Day Habit!", 30:"One Month!", 60:"Two Months!", 90:"90 Days!", 180:"Half a Year!", 365:"One Full Year!" };
const MILESTONE_SUB = { 1:"Every journey starts with a single step. This one's yours.", 3:"Three days of choices for your health. Your liver thanks you.", 7:"A full week! Your body is already showing real changes.", 14:"Two weeks. Inflammation in your liver has measurably decreased.", 21:"Scientists say 21 days builds a habit. You've built one.", 30:"One month! Liver enzymes are normalizing. You look and feel better.", 60:"Two months of commitment. Your risk of liver disease is dropping.", 90:"90 days. A transformative milestone in your health journey.", 180:"Half a year. Your body has undergone profound recovery.", 365:"A full year. You've transformed your relationship with alcohol forever." };
const TIPS = ["Your liver starts healing within hours of stopping.", "Every sober day counts — you're doing great.", "Progress, not perfection.", "Hydration speeds up your liver recovery.", "Sleep is deeper and more restorative without alcohol.", "Your future self is proud of the choice you made today.", "One day at a time — that's all it takes.", "Small consistent wins build lasting, life-changing habits."];
const RECOVERY = [
  { days:0,  period:"24–72 hours",   title:"Detox begins",       detail:"Alcohol clears from your bloodstream. Stay hydrated and rest well.",                       color:"#059669", lightBg:"#d1fae5", darkBg:"#064e3b" },
  { days:3,  period:"Days 3–7",      title:"Stabilization",      detail:"Blood pressure drops. Sleep quality improves. The mental fog begins to lift.",               color:"#3b82f6", lightBg:"#dbeafe", darkBg:"#1e3a5f" },
  { days:7,  period:"Week 1–2",      title:"Liver fat reduces",  detail:"Fatty deposits begin to clear. Skin starts to look healthier and clearer.",                  color:"#8b5cf6", lightBg:"#ede9fe", darkBg:"#3b1f6b" },
  { days:14, period:"Weeks 2–4",     title:"Inflammation eases", detail:"Liver inflammation decreases significantly. Energy levels improve noticeably.",               color:"#d97706", lightBg:"#fef3c7", darkBg:"#5a3000" },
  { days:30, period:"Month 1–3",     title:"Liver healing",      detail:"Enzymes normalize. Immune function strengthens. Mental clarity is noticeably better.",       color:"#db2777", lightBg:"#fce7f3", darkBg:"#5b1038" },
  { days:90, period:"3–12 months",   title:"Deep recovery",      detail:"Significant liver tissue repair. Cognitive function and mood improve substantially.",        color:"#0891b2", lightBg:"#cffafe", darkBg:"#083344" },
  { days:365,period:"1+ years",      title:"Long-term health",   detail:"Liver near-fully recovered. Heart health improved. Cancer risk meaningfully reduced.",       color:"#16a34a", lightBg:"#dcfce7", darkBg:"#14532d" },
];
const DOW = ["S","M","T","W","T","F","S"];

/* ═══════════════════════════════════════════════════════════════
   STORAGE  (window.storage → localStorage → in-memory fallback)
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
const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const todayStr = () => toStr(new Date());
const parseDate = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); };
const calcStreaks = (days) => {
  const today = todayStr();
  let current = 0;
  if (days[today] !== "alcohol") {
    const d = new Date();
    if (days[today] !== "sober") d.setDate(d.getDate()-1);
    for (let i = 0; i < 1000; i++) { if (days[toStr(d)] === "sober") { current++; d.setDate(d.getDate()-1); } else break; }
  }
  const sd = Object.entries(days).filter(([,v])=>v==="sober").map(([k])=>k).sort();
  if (!sd.length) return { current, longest: 0 };
  let longest = 1, run = 1;
  for (let i = 1; i < sd.length; i++) {
    const diff = Math.round((parseDate(sd[i])-parseDate(sd[i-1]))/86400000);
    if (diff===1) { run++; if (run>longest) longest=run; } else run=1;
  }
  return { current, longest };
};
const greeting = () => { const h = new Date().getHours(); return h<12?"morning":h<17?"afternoon":"evening"; };

/* ═══════════════════════════════════════════════════════════════
   COUNT-UP HOOK
═══════════════════════════════════════════════════════════════ */
function useCountUp(target, dur=900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = Date.now();
    let raf;
    const tick = () => {
      const p = Math.min((Date.now()-start)/dur,1);
      const e = 1-Math.pow(1-p,3);
      setVal(Math.round(target*e));
      if (p<1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

/* ═══════════════════════════════════════════════════════════════
   INTERACTION HOOK  (hover + active for inline-style micro fx)
═══════════════════════════════════════════════════════════════ */
function useIx() {
  const [s, set] = useState({ h:false, a:false });
  return [s, {
    onMouseEnter:()=>set({h:true,a:false}),
    onMouseLeave:()=>set({h:false,a:false}),
    onMouseDown:()=>set({h:true,a:true}),
    onMouseUp:()=>set({h:true,a:false}),
    onTouchStart:()=>set({h:false,a:true}),
    onTouchEnd:()=>set({h:false,a:false}),
  }];
}

/* ═══════════════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════════════ */
const T = {
  light: { bg:"#f0fdf9", card:"#ffffff", cardBorder:"#e2e8f0", text:"#0f172a", textSec:"#64748b", textTer:"#94a3b8", nav:"#ffffff", navBorder:"#e2e8f0", accent:"#059669", accentFg:"#ffffff", accentMuted:"#d1fae5", accentStrong:"#047857", sober:"#22c55e", soberBg:"#dcfce7", soberBorder:"#86efac", soberText:"#14532d", alcohol:"#ef4444", alcoholBg:"#fee2e2", alcoholBorder:"#fca5a5", alcoholText:"#7f1d1d", empty:"#f1f5f9", emptyText:"#cbd5e1", shadow:"0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)" },
  dark:  { bg:"#0a1628", card:"#1e293b", cardBorder:"#334155", text:"#f1f5f9", textSec:"#94a3b8", textTer:"#64748b", nav:"#1e293b", navBorder:"#334155", accent:"#10b981", accentFg:"#ffffff", accentMuted:"#064e3b", accentStrong:"#34d399", sober:"#4ade80", soberBg:"#14532d", soberBorder:"#166534", soberText:"#bbf7d0", alcohol:"#f87171", alcoholBg:"#7f1d1d", alcoholBorder:"#991b1b", alcoholText:"#fecaca", empty:"#0f172a", emptyText:"#334155", shadow:"0 1px 3px rgba(0,0,0,0.3)" },
};

/* ═══════════════════════════════════════════════════════════════
   ICON SYSTEM — custom SVG icons, consistent 24×24 viewBox
═══════════════════════════════════════════════════════════════ */
const Ic = {
  Home: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12L12 4l9 8"/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg>,
  Calendar: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/></svg>,
  BarChart: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="13" width="4.5" height="8" rx="1.5"/><rect x="9.75" y="8" width="4.5" height="13" rx="1.5"/><rect x="16.5" y="4" width="4.5" height="17" rx="1.5"/></svg>,
  Seedling: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22v-9"/><path d="M12 13C9 13 6.5 10.5 6.5 7.5 6.5 4.5 9 2 12 2s5.5 2.5 5.5 5.5S15 13 12 13z"/></svg>,
  Fire: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2c0 0-6.5 7-6.5 12a6.5 6.5 0 0013 0C18.5 9 12 2 12 2z"/><path d="M12 22c0 0 3-2 3-4.5a3 3 0 00-6 0C9 20 12 22 12 22z"/></svg>,
  Trophy: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 21h8M12 21v-3"/><path d="M5 5H3a1 1 0 00-1 1v1.5C2 10.5 4 13 7 13"/><path d="M19 5h2a1 1 0 011 1v1.5C22 10.5 20 13 17 13"/><path d="M5 5h14c0 5.5-3 9-7 9S5 10.5 5 5z"/></svg>,
  Leaf: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 20A7 7 0 014 13c0-5 7-11 7-11s7 6 7 11a7 7 0 01-7 7z"/><path d="M11 20v-9M8 14l3-3"/></svg>,
  Bulb: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21h6M10 17.5h4M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 5.5H9C7.5 13.5 6 11.5 6 9a6 6 0 016-6z"/></svg>,
  Sun: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  Moon: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>,
  CheckCircle: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>,
  XCircle: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>,
  HelpCircle: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 015.12 2.12C14 12 12 13 12 14M12 17v.5"/></svg>,
  ChevronLeft: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6"/></svg>,
  ChevronRight: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18l6-6-6-6"/></svg>,
  Download: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  Star: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Sparkle: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/><circle cx="12" cy="12" r="3"/></svg>,
  ArrowRight: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  User: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0114 0"/></svg>,
  Hash: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"/></svg>,
  Plant: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22v-8"/><path d="M12 14C9.5 14 7 11.5 7 9S9 4 12 4s5 2.5 5 5-2.5 5-5 5z"/><path d="M7 17c-3 0-5-2-5-5 3 0 5 2 5 5z"/></svg>,
  Check: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6L9 17l-5-5"/></svg>,
  X: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Celebrate: ({sz=24,...p})=><svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/><path d="M9 12h.01M12 12h.01M15 12h.01"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════
   BUTTON COMPONENT — Apple / Linear style
═══════════════════════════════════════════════════════════════ */
function Btn({ children, onClick, variant="primary", size="md", fullWidth, icon: Icon, disabled, t, style={} }) {
  const [ix, ixProps] = useIx();
  const pad = size==="lg"?"15px 22px":size==="sm"?"8px 14px":"12px 18px";
  const fz  = size==="lg"?15:size==="sm"?12:14;
  const base = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
    padding:pad, borderRadius:14, fontSize:fz, fontWeight:650, cursor:disabled?"not-allowed":"pointer",
    border:"none", outline:"none", WebkitTapHighlightColor:"transparent",
    transition:"all 0.18s cubic-bezier(.4,0,.2,1)",
    userSelect:"none", letterSpacing:"0.1px",
    transform: ix.a ? "scale(0.96)" : ix.h ? "translateY(-1px)" : "none",
    opacity: disabled ? 0.5 : 1,
    fontFamily:"inherit",
    ...(fullWidth && { width:"100%" }),
    ...style,
  };
  const variants = {
    primary: { background: t?.accent||"#059669", color:"#fff", boxShadow: ix.h&&!ix.a ? `0 4px 14px ${(t?.accent||"#059669")}44, 0 2px 6px ${(t?.accent||"#059669")}22` : ix.a ? "none" : `0 1px 3px ${(t?.accent||"#059669")}33` },
    secondary: { background: t ? (ix.h ? t.accentMuted : "transparent") : (ix.h?"rgba(5,150,105,.08)":"transparent"), color:t?.accent||"#059669", boxShadow:"none", border:`1.5px solid ${t?.accent||"#059669"}55` },
    ghost: { background: t ? (ix.h ? t.empty : "transparent") : (ix.h?"rgba(0,0,0,.04)":"transparent"), color:t?.text||"#0f172a", boxShadow:"none", border:`1.5px solid ${t?.cardBorder||"#e2e8f0"}` },
    danger: { background:"#ef4444", color:"#fff", boxShadow: ix.h&&!ix.a ? "0 4px 14px #ef444444" : "none" },
    sober: { background: t?.soberBg||"#dcfce7", color: t?.soberText||"#14532d", border:`1.5px solid ${t?.soberBorder||"#86efac"}`, boxShadow: ix.h&&!ix.a ? `0 4px 12px ${t?.sober||"#22c55e"}22` : "none" },
    alcohol: { background: t?.alcoholBg||"#fee2e2", color: t?.alcoholText||"#7f1d1d", border:`1.5px solid ${t?.alcoholBorder||"#fca5a5"}`, boxShadow: ix.h&&!ix.a ? `0 4px 12px ${t?.alcohol||"#ef4444"}22` : "none" },
  };
  return (
    <button disabled={disabled} onClick={onClick} {...ixProps} style={{ ...base, ...variants[variant] }}>
      {Icon && <Icon sz={fz+4} />}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD PRIMITIVE
═══════════════════════════════════════════════════════════════ */
function Card({ t, children, style={} }) {
  return <div style={{ background:t.card, borderRadius:20, border:`1px solid ${t.cardBorder}`, boxShadow:t.shadow, ...style }}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS RING
═══════════════════════════════════════════════════════════════ */
function ProgressRing({ value, max, size=128, stroke=10, color, bg, children }) {
  const r = (size-stroke)/2, circ = 2*Math.PI*r;
  const pct = max>0 ? Math.min(value/max,1) : 0;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${pct*circ} ${circ}`}
          style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ONBOARDING — full-screen conversational multi-step experience
═══════════════════════════════════════════════════════════════ */
function OnboardingOrbs() {
  const orbs = [
    { w:320, h:320, l:"5%",  t:"15%", dur:10 },
    { w:200, h:200, l:"65%", t:"8%",  dur:14 },
    { w:160, h:160, l:"80%", t:"55%", dur:9  },
    { w:280, h:280, l:"-5%", t:"65%", dur:12 },
    { w:120, h:120, l:"45%", t:"78%", dur:8  },
  ];
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {orbs.map((o,i)=>(
        <div key={i} style={{
          position:"absolute", borderRadius:"50%",
          width:o.w, height:o.h, left:o.l, top:o.t,
          background:"radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          animation:`orbFloat${i} ${o.dur}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [stepKey, setStepKey] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const nameRef = useRef(null);
  const ageRef  = useRef(null);

  useEffect(() => {
    if (step===1) setTimeout(()=>nameRef.current?.focus(), 600);
    if (step===2) {
      if (document.activeElement) document.activeElement.blur();
      setTimeout(()=>ageRef.current?.focus(), 600);
    }
    if (step===3) setTimeout(()=>onComplete({ name:name.trim(), age:parseInt(age)||0 }), 2200);
  }, [step]);

  const advance = () => {
    setError("");
    if (step===1 && name.trim().length < 2) { setError("Please enter at least 2 characters"); return; }
    if (step===2) { const a=parseInt(age); if (!a||a<13||a>120) { setError("Please enter a valid age (13–120)"); return; } }
    setLeaving(true);
    setTimeout(()=>{ setStep(s=>s+1); setStepKey(k=>k+1); setLeaving(false); }, 280);
  };

  const steps = [
    /* Step 0 — Welcome */
    <div key={0} style={{ textAlign:"center" }}>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
        <div style={{ width:80, height:80, borderRadius:24, background:"rgba(16,185,129,0.15)", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(16,185,129,0.25)" }}>
          <Ic.Plant sz={40} style={{ color:"#10b981" }}/>
        </div>
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:"#f1f5f9", marginBottom:10, letterSpacing:"-0.5px", lineHeight:1.2 }}>Track your<br/>sober journey.</div>
      <div style={{ fontSize:15, color:"#94a3b8", marginBottom:36, lineHeight:1.6 }}>A mindful companion for<br/>healthier living, one day at a time.</div>
      <Btn onClick={advance} t={null} size="lg" fullWidth style={{ background:"#10b981", color:"#fff", boxShadow:"0 4px 20px rgba(16,185,129,0.35)" }}>
        Get started <Ic.ArrowRight sz={18}/>
      </Btn>
      <div style={{ marginTop:16, fontSize:12, color:"#475569" }}>No account needed · Data stays on your device</div>
    </div>,

    /* Step 1 — Name */
    <div key={1}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"rgba(16,185,129,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic.User sz={20} style={{ color:"#10b981" }}/>
        </div>
        <div>
          <div style={{ fontSize:11, color:"#64748b", letterSpacing:"0.5px", fontWeight:600 }}>STEP 1 OF 2</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>What's your name?</div>
        </div>
      </div>
      <input
        ref={nameRef}
        value={name}
        type="text"
        autoComplete="given-name"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        placeholder="Enter your name"
        onChange={e=>{setName(e.target.value);setError("");}}
        onKeyDown={e=>e.key==="Enter"&&advance()}
        style={{ display:"block", width:"100%", boxSizing:"border-box", WebkitAppearance:"none", appearance:"none", background:"rgba(255,255,255,0.07)", border:`1.5px solid ${error?"#f87171":"rgba(16,185,129,0.3)"}`, borderRadius:14, padding:"14px 16px", fontSize:16, color:"#f1f5f9", WebkitTextFillColor:"#f1f5f9", outline:"none", transition:"border-color 0.2s", marginBottom:error?8:24, fontFamily:"inherit", minWidth:0 }}
      />
      {error && <div style={{ color:"#f87171", fontSize:13, marginBottom:16 }}>{error}</div>}
      <Btn onClick={advance} t={null} size="lg" fullWidth style={{ background:"#10b981", color:"#fff", boxShadow:"0 4px 20px rgba(16,185,129,0.3)" }}>
        Continue <Ic.ArrowRight sz={18}/>
      </Btn>
    </div>,

    /* Step 2 — Age */
    <div key={2}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"rgba(16,185,129,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic.Hash sz={20} style={{ color:"#10b981" }}/>
        </div>
        <div>
          <div style={{ fontSize:11, color:"#64748b", letterSpacing:"0.5px", fontWeight:600 }}>STEP 2 OF 2</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>Nice to meet you, {name}!</div>
        </div>
      </div>
      <div style={{ fontSize:14, color:"#94a3b8", marginBottom:20, lineHeight:1.6 }}>Your age helps us tailor recovery insights to your health profile.</div>
      <input
        ref={ageRef}
        value={age}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Your age"
        onChange={e=>{
          const v = e.target.value.replace(/[^0-9]/g,"");
          setAge(v); setError("");
        }}
        onKeyDown={e=>e.key==="Enter"&&advance()}
        style={{ display:"block", width:"100%", boxSizing:"border-box", WebkitAppearance:"none", appearance:"none", background:"rgba(255,255,255,0.07)", border:`1.5px solid ${error?"#f87171":"rgba(16,185,129,0.3)"}`, borderRadius:14, padding:"14px 16px", fontSize:16, color:"#f1f5f9", WebkitTextFillColor:"#f1f5f9", outline:"none", transition:"border-color 0.2s", marginBottom:error?8:24, fontFamily:"inherit", minWidth:0 }}
      />
      {error && <div style={{ color:"#f87171", fontSize:13, marginBottom:16 }}>{error}</div>}
      <Btn onClick={advance} t={null} size="lg" fullWidth style={{ background:"#10b981", color:"#fff", boxShadow:"0 4px 20px rgba(16,185,129,0.3)" }}>
        Let's begin <Ic.ArrowRight sz={18}/>
      </Btn>
    </div>,

    /* Step 3 — Done */
    <div key={3} style={{ textAlign:"center" }}>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:50, background:"rgba(16,185,129,0.2)", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(16,185,129,0.4)", animation:"ringPop 0.5s cubic-bezier(.34,1.56,.64,1)" }}>
          <Ic.Check sz={36} style={{ color:"#10b981" }}/>
        </div>
      </div>
      <div style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", marginBottom:10, letterSpacing:"-0.5px" }}>Welcome, {name}!</div>
      <div style={{ fontSize:15, color:"#94a3b8", lineHeight:1.65 }}>Your journey to better health starts today. We'll track every step with you.</div>
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:32 }}>
        {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", animation:`dotPulse 1s ease ${i*0.2}s infinite alternate` }}/>)}
      </div>
    </div>,
  ];

  const progress = [0.25, 0.5, 0.75, 1.0][step] || 1;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#0a1628", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", paddingTop:"max(20px, env(safe-area-inset-top))", paddingBottom:"max(20px, env(safe-area-inset-bottom))", boxSizing:"border-box", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <OnboardingOrbs/>
      <div style={{ width:"100%", maxWidth:360, position:"relative", zIndex:1, boxSizing:"border-box" }}>
        {/* Progress bar */}
        <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:3, marginBottom:32, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"#10b981", borderRadius:3, width:`${progress*100}%`, transition:"width 0.5s cubic-bezier(.4,0,.2,1)" }}/>
        </div>
        {/* Card */}
        <div style={{ background:"#1e293b", borderRadius:24, padding:"28px 24px", border:"1px solid rgba(16,185,129,0.15)", boxShadow:"0 25px 60px rgba(0,0,0,0.5)", overflow:"hidden", boxSizing:"border-box", width:"100%" }}>
          <div key={stepKey} style={{ animation: leaving ? "slideOutLeft 0.28s ease forwards" : "slideInRight 0.35s cubic-bezier(.4,0,.2,1)" }}>
            {steps[step]}
          </div>
        </div>
        {step > 0 && step < 3 && (
          <button onClick={()=>{ setLeaving(true); setTimeout(()=>{ setStep(s=>s-1); setStepKey(k=>k+1); setLeaving(false); setError(""); },280); }}
            style={{ display:"flex", alignItems:"center", gap:5, margin:"20px auto 0", background:"transparent", border:"none", color:"#64748b", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            <Ic.ChevronLeft sz={16}/> Back
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MILESTONE MODAL
═══════════════════════════════════════════════════════════════ */
function MilestoneModal({ milestone, onClose, t, name }) {
  const [ix, ixProps] = useIx();
  if (!milestone) return null;
  const icons = { 1:Ic.Seedling, 3:Ic.Fire, 7:Ic.Star, 14:Ic.Star, 21:Ic.Fire, 30:Ic.Trophy, 60:Ic.Trophy, 90:Ic.Sparkle, 180:Ic.Moon, 365:Ic.Sparkle };
  const MIcon = icons[milestone] || Ic.Star;
  const colors = { 1:"#22c55e", 3:"#f97316", 7:"#f59e0b", 14:"#f59e0b", 21:"#ef4444", 30:"#d97706", 60:"#8b5cf6", 90:"#10b981", 180:"#6366f1", 365:"#ec4899" };
  const color = colors[milestone] || t.accent;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:t.card, borderRadius:28, padding:"40px 28px 32px", textAlign:"center", maxWidth:320, width:"100%", border:`1px solid ${t.cardBorder}`, boxShadow:"0 30px 70px rgba(0,0,0,0.35)", animation:"popIn .4s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:80, height:80, borderRadius:50, background:`${color}1a`, border:`2px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <MIcon sz={36} style={{ color }}/>
        </div>
        {name && <div style={{ fontSize:13, color:t.textSec, marginBottom:4 }}>Congratulations, {name}!</div>}
        <div style={{ fontSize:26, fontWeight:800, color, marginBottom:10, letterSpacing:"-0.5px" }}>{MILESTONE_MSGS[milestone]}</div>
        <div style={{ fontSize:14, color:t.textSec, lineHeight:1.65, marginBottom:28 }}>{MILESTONE_SUB[milestone]}</div>
        <button {...ixProps} onClick={onClose} style={{
          background: color, color:"#fff", border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:700, cursor:"pointer", width:"100%", fontFamily:"inherit",
          transform: ix.a?"scale(0.96)":ix.h?"translateY(-1px)":"none",
          boxShadow: ix.h&&!ix.a ? `0 6px 20px ${color}44` : "none",
          transition:"all 0.18s cubic-bezier(.4,0,.2,1)",
        }}>
          Keep going!
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECOVERY TREE (SVG)
═══════════════════════════════════════════════════════════════ */
function RecoveryTree({ streak }) {
  const p = Math.min(streak/60, 1);
  const trunkH = 14+p*46;
  const layers = Math.max(1, Math.min(4, Math.ceil(p*4)));
  const spread = 16+p*56;
  const green = streak<7?"#86efac":streak<30?"#4ade80":"#22c55e";
  const dark  = streak<7?"#4ade80":streak<30?"#16a34a":"#166534";
  const cx = 80, baseY = 110;
  return (
    <svg width={160} height={120} viewBox="0 0 160 120" style={{ display:"block", margin:"0 auto" }}>
      <ellipse cx={cx} cy={baseY+3} rx={16} ry={4} fill="#92400e" opacity={0.2}/>
      <rect x={cx-3} y={baseY-trunkH} width={6} height={trunkH} rx={3} fill="#92400e"/>
      {Array.from({length:layers},(_,i)=>{
        const lw = spread*(0.45+(layers-1-i)*0.18);
        const ly = baseY-trunkH-i*(trunkH*0.3);
        return <ellipse key={i} cx={cx} cy={ly} rx={lw/2} ry={Math.max(8,trunkH*0.18)} fill={i===layers-1?dark:green} opacity={0.85+i*0.04}/>;
      })}
      {streak>=30 && <><circle cx={cx-16} cy={baseY-trunkH-8}  r={4} fill="#fbbf24"/><circle cx={cx+18} cy={baseY-trunkH-14} r={3} fill="#fbbf24"/><circle cx={cx+4}  cy={baseY-trunkH-30} r={4} fill="#fbbf24"/></>}
      {streak>=90 && <><circle cx={cx-26} cy={baseY-trunkH-22} r={3} fill="#fbbf24"/><circle cx={cx+28} cy={baseY-trunkH-8}  r={3} fill="#fbbf24"/></>}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME VIEW
═══════════════════════════════════════════════════════════════ */
function HomeView({ days, onToggle, t, profile }) {
  const today = todayStr();
  const status = days[today];
  const { current, longest } = useMemo(()=>calcStreaks(days),[days]);
  const totalSober   = useMemo(()=>Object.values(days).filter(v=>v==="sober").length,[days]);
  const totalTracked = Object.keys(days).length;
  const soberPct     = totalTracked>0 ? Math.round(totalSober/totalTracked*100) : 0;
  const tip = useMemo(()=>TIPS[new Date().getDate()%TIPS.length],[]);
  const nextMs = MILESTONES.find(m=>m>current)||365;
  const cStreak = useCountUp(current);
  const cLongest = useCountUp(longest);
  const cTotal = useCountUp(totalSober);
  const userName = profile?.name ? `, ${profile.name}` : "";
  const dateLabel = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  const cardBg     = status==="sober"?t.soberBg:status==="alcohol"?t.alcoholBg:t.card;
  const cardBorder = status==="sober"?t.soberBorder:status==="alcohol"?t.alcoholBorder:t.cardBorder;

  return (
    <div style={{ paddingBottom:96 }}>
      <div style={{ padding:"20px 20px 8px" }}>
        <div style={{ fontSize:12, color:t.textSec, marginBottom:3, letterSpacing:"0.3px" }}>{dateLabel}</div>
        <div style={{ fontSize:24, fontWeight:800, color:t.text, letterSpacing:"-0.5px" }}>Good {greeting()}{userName}</div>
      </div>

      {/* Today card */}
      <div style={{ padding:"10px 20px" }}>
        <div style={{ background:cardBg, borderRadius:22, padding:"22px 18px", border:`1px solid ${cardBorder}`, transition:"background 0.3s, border-color 0.3s", boxShadow:t.shadow }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
              {status==="sober" ? <Ic.CheckCircle sz={52} style={{ color:t.sober }}/>
               : status==="alcohol" ? <Ic.XCircle sz={52} style={{ color:t.alcohol }}/>
               : <Ic.HelpCircle sz={52} style={{ color:t.textTer }}/>}
            </div>
            <div style={{ fontSize:17, fontWeight:700, color:status==="sober"?t.soberText:status==="alcohol"?t.alcoholText:t.text, marginBottom:3 }}>
              {status==="sober"?"Alcohol-Free Today":status==="alcohol"?"Logged Consumption":"How was today?"}
            </div>
            <div style={{ fontSize:12, color:t.textSec }}>{status?"Tap to change":"Mark your status below"}</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={()=>onToggle(today,status==="sober"?null:"sober")} variant={status==="sober"?"sober":"ghost"} size="md" fullWidth t={t} icon={Ic.Check}>
              No Alcohol
            </Btn>
            <Btn onClick={()=>onToggle(today,status==="alcohol"?null:"alcohol")} variant={status==="alcohol"?"alcohol":"ghost"} size="md" fullWidth t={t} icon={Ic.X}>
              Had Drink
            </Btn>
          </div>
        </div>
      </div>

      {/* Streak ring + stats */}
      <div style={{ padding:"0 20px 10px" }}>
        <Card t={t} style={{ padding:"22px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:18 }}>
            <ProgressRing value={current} max={Math.max(nextMs,current)} size={120} stroke={10} color={t.accent} bg={t.accentMuted}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:30, fontWeight:800, color:t.accent, lineHeight:1 }}>{cStreak}</div>
                <div style={{ fontSize:10, color:t.textSec, marginTop:3, letterSpacing:"0.3px" }}>day streak</div>
              </div>
            </ProgressRing>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { Ico:Ic.Trophy,   label:"Longest streak", val:cLongest,  unit:"days", color:"#d97706" },
                { Ico:Ic.Leaf,     label:"Total sober",    val:cTotal,    unit:"days", color:t.sober   },
                { Ico:Ic.BarChart, label:"Sober rate",     val:soberPct,  unit:"%",    color:"#8b5cf6" },
              ].map(({Ico,label,val,unit,color})=>(
                <div key={label}>
                  <div style={{ fontSize:11, color:t.textSec, marginBottom:1, display:"flex", alignItems:"center", gap:4 }}><Ico sz={12}/> {label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color, lineHeight:1 }}>{val}<span style={{ fontSize:12, color:t.textSec, fontWeight:500 }}> {unit}</span></div>
                </div>
              ))}
            </div>
          </div>
          {current>0 && (
            <div style={{ marginTop:20, paddingTop:18, borderTop:`1px solid ${t.cardBorder}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:t.textSec }}>Next milestone: {nextMs} days</span>
                <span style={{ fontSize:12, fontWeight:600, color:t.accent }}>{current} / {nextMs}</span>
              </div>
              <div style={{ background:t.accentMuted, borderRadius:8, height:7, overflow:"hidden" }}>
                <div style={{ height:"100%", background:t.accent, borderRadius:8, width:`${Math.min((current/nextMs)*100,100)}%`, transition:"width 1.2s cubic-bezier(.4,0,.2,1)" }}/>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tip card */}
      <div style={{ padding:"0 20px" }}>
        <div style={{ background:t.accentMuted, borderRadius:16, padding:"14px 16px", border:`1px solid ${t.accent}33`, display:"flex", gap:12, alignItems:"flex-start" }}>
          <Ic.Bulb sz={20} style={{ color:t.accent, flexShrink:0, marginTop:1 }}/>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:t.accent, letterSpacing:"0.8px", marginBottom:5 }}>DAILY TIP</div>
            <div style={{ fontSize:13, color:t.text, lineHeight:1.55 }}>{tip}</div>
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
  const yr = viewDate.getFullYear(), mo = viewDate.getMonth();
  const dim = new Date(yr,mo+1,0).getDate();
  const fd  = new Date(yr,mo,1).getDay();
  const mk  = (d) => `${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const { s:soberCount, a:alcoholCount } = useMemo(()=>{
    let s=0, a=0;
    for (let d=1;d<=dim;d++){const v=days[mk(d)]; if(v==="sober")s++; if(v==="alcohol")a++;}
    return {s,a};
  },[days,yr,mo,dim]);
  const cells=[];
  for(let i=0;i<fd;i++) cells.push(null);
  for(let d=1;d<=dim;d++) cells.push(d);
  const navMo=(dir)=>{const d=new Date(viewDate);d.setMonth(d.getMonth()+dir);setViewDate(d);};
  return (
    <div style={{ paddingBottom:96 }}>
      <div style={{ padding:"20px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <NavIconBtn onClick={()=>navMo(-1)} t={t}><Ic.ChevronLeft sz={20}/></NavIconBtn>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:20, fontWeight:800, color:t.text, letterSpacing:"-0.3px" }}>{viewDate.toLocaleString("default",{month:"long"})}</div>
          <div style={{ fontSize:13, color:t.textSec }}>{yr}</div>
        </div>
        <NavIconBtn onClick={()=>navMo(1)} t={t}><Ic.ChevronRight sz={20}/></NavIconBtn>
      </div>
      <div style={{ padding:"0 20px 14px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {[
          { val:soberCount, label:"Sober",  bg:t.soberBg,    color:t.sober,    border:t.soberBorder },
          { val:alcoholCount, label:"Drink", bg:t.alcoholBg, color:t.alcohol,  border:t.alcoholBorder },
          { val:(soberCount+alcoholCount)>0?Math.round(soberCount/(soberCount+alcoholCount)*100)+"%":"—", label:"Rate", bg:t.accentMuted, color:t.accent, border:t.accent+"44" },
        ].map(({val,label,bg,color,border})=>(
          <div key={label} style={{ background:bg, borderRadius:14, padding:"12px 8px", textAlign:"center", border:`1px solid ${border}` }}>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
            <div style={{ fontSize:11, color:t.textSec }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
        {DOW.map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:11, color:t.textTer, fontWeight:700, padding:"4px 0", letterSpacing:"0.3px" }}>{d}</div>)}
      </div>
      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((day,i)=>{
          if (!day) return <div key={i}/>;
          const key=mk(day), status=days[key], isToday=key===today, isFuture=key>today;
          const next=status==="sober"?"alcohol":status==="alcohol"?null:"sober";
          return (
            <CalDayCell key={i} day={day} status={status} isToday={isToday} isFuture={isFuture} t={t}
              onClick={()=>!isFuture&&onToggle(key,next)}/>
          );
        })}
      </div>
      <div style={{ padding:"16px 20px", display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
        {[{color:t.sober,label:"No alcohol"},{color:t.alcohol,label:"Had drink"},{color:t.emptyText,label:"Untracked"}].map(({color,label})=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:color }}/>
            <span style={{ fontSize:12, color:t.textSec }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavIconBtn({ onClick, t, children }) {
  const [ix, ixProps] = useIx();
  return (
    <button {...ixProps} onClick={onClick} style={{ background:t.card, border:`1px solid ${t.cardBorder}`, borderRadius:12, width:42, height:42, cursor:"pointer", color:t.text, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s cubic-bezier(.4,0,.2,1)", transform:ix.a?"scale(0.93)":ix.h?"translateY(-1px)":"none", boxShadow:ix.h&&!ix.a?t.shadow:"none", WebkitTapHighlightColor:"transparent", fontFamily:"inherit" }}>
      {children}
    </button>
  );
}

function CalDayCell({ day, status, isToday, isFuture, t, onClick }) {
  const [ix, ixProps] = useIx();
  return (
    <button {...ixProps} onClick={onClick} style={{
      aspectRatio:"1", borderRadius:11,
      border: isToday ? `2px solid ${t.accent}` : `1px solid ${status==="sober"?t.soberBorder:status==="alcohol"?t.alcoholBorder:t.cardBorder}`,
      background: status==="sober"?t.soberBg:status==="alcohol"?t.alcoholBg:isFuture?t.empty:t.card,
      color: status==="sober"?t.soberText:status==="alcohol"?t.alcoholText:isFuture?t.emptyText:t.text,
      fontSize:13, fontWeight:isToday?800:500, cursor:isFuture?"default":"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      transition:"all 0.15s cubic-bezier(.4,0,.2,1)", opacity:isFuture?0.35:1, gap:2,
      transform: !isFuture&&ix.a?"scale(0.9)":!isFuture&&ix.h?"scale(1.05)":"none",
      WebkitTapHighlightColor:"transparent",
    }}>
      <span>{day}</span>
      {status && <span style={{ fontSize:5, lineHeight:1 }}>●</span>}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INSIGHTS VIEW
═══════════════════════════════════════════════════════════════ */
function InsightsView({ days, t }) {
  const { current, longest } = useMemo(()=>calcStreaks(days),[days]);
  const totalSober   = useMemo(()=>Object.values(days).filter(v=>v==="sober").length,[days]);
  const totalAlcohol = useMemo(()=>Object.values(days).filter(v=>v==="alcohol").length,[days]);
  const totalTracked = totalSober+totalAlcohol;
  const cCurrent = useCountUp(current);
  const cLongest = useCountUp(longest);
  const cSober   = useCountUp(totalSober);
  const cRate    = useCountUp(totalTracked>0?Math.round(totalSober/totalTracked*100):0);
  const last30 = useMemo(()=>Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));const key=toStr(d);return {key,status:days[key],label:d.getDate()};}), [days]);
  const weeklyPattern = useMemo(()=>{
    const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts=Array(7).fill(null).map(()=>({s:0,a:0}));
    Object.entries(days).forEach(([k,v])=>{ const dow=parseDate(k).getDay(); if(v==="sober")counts[dow].s++; else if(v==="alcohol")counts[dow].a++; });
    return names.map((name,i)=>({ name, rate:(counts[i].s+counts[i].a)>0?Math.round(counts[i].s/(counts[i].s+counts[i].a)*100):null }));
  },[days]);

  const exportData=()=>{
    const json=JSON.stringify({days,exported:new Date().toISOString()},null,2);
    const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
    const a=document.createElement("a"); a.href=url; a.download="sober-days-data.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom:96 }}>
      <div style={{ padding:"20px 20px 14px" }}>
        <div style={{ fontSize:24, fontWeight:800, color:t.text, letterSpacing:"-0.5px" }}>Insights</div>
        <div style={{ fontSize:13, color:t.textSec }}>Your health journey at a glance</div>
      </div>
      <div style={{ padding:"0 20px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {[
          { Ico:Ic.Fire,     label:"Current streak",  val:cCurrent, unit:"days", color:t.accent    },
          { Ico:Ic.Trophy,   label:"Longest streak",  val:cLongest, unit:"days", color:"#d97706"   },
          { Ico:Ic.Leaf,     label:"Total sober",     val:cSober,   unit:"days", color:t.sober     },
          { Ico:Ic.BarChart, label:"Sober rate",      val:cRate,    unit:"%",    color:"#8b5cf6"   },
        ].map(({Ico,label,val,unit,color})=>(
          <div key={label} style={{ background:t.card, borderRadius:16, padding:"16px 14px", border:`1px solid ${t.cardBorder}`, boxShadow:t.shadow }}>
            <Ico sz={20} style={{ color, marginBottom:8, display:"block" }}/>
            <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1 }}>{val}<span style={{ fontSize:13, color:t.textSec, fontWeight:500 }}> {unit}</span></div>
            <div style={{ fontSize:11, color:t.textSec, marginTop:5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 30-day chart */}
      <div style={{ padding:"0 20px 14px" }}>
        <Card t={t} style={{ padding:"18px 16px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:14 }}>Last 30 days</div>
          <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:56 }}>
            {last30.map(({status},i)=>(
              <div key={i} style={{ flex:1, minHeight:4, height:status==="sober"?"100%":status==="alcohol"?"55%":"12%", background:status==="sober"?t.sober:status==="alcohol"?t.alcohol:t.empty, borderRadius:"3px 3px 0 0", opacity:status?1:0.4, transition:"height 0.4s ease" }}/>
            ))}
          </div>
          <div style={{ height:1, background:t.cardBorder, margin:"0 0 6px" }}/>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:10, color:t.textTer }}>30 days ago</span>
            <span style={{ fontSize:10, color:t.textTer }}>Today</span>
          </div>
        </Card>
      </div>

      {/* Weekly pattern */}
      <div style={{ padding:"0 20px 14px" }}>
        <Card t={t} style={{ padding:"18px 16px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:4 }}>Weekly pattern</div>
          <div style={{ fontSize:12, color:t.textSec, marginBottom:16 }}>Sober rate by day of week</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
            {weeklyPattern.map(({name,rate})=>(
              <div key={name} style={{ textAlign:"center" }}>
                <div style={{ height:60, background:t.empty, borderRadius:6, marginBottom:6, overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                  {rate!==null && <div style={{ height:`${rate}%`, minHeight:3, borderRadius:6, background:rate>=70?t.sober:rate>=40?"#f59e0b":t.alcohol, transition:"height 0.7s ease" }}/>}
                </div>
                <div style={{ fontSize:10, color:t.textSec }}>{name.slice(0,2)}</div>
                {rate!==null && <div style={{ fontSize:9, color:t.textTer }}>{rate}%</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Milestones */}
      <div style={{ padding:"0 20px 14px" }}>
        <Card t={t} style={{ padding:"18px 16px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:14 }}>Milestones earned</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {MILESTONES.map(m=>{
              const earned=longest>=m;
              return (
                <div key={m} style={{ padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5, background:earned?t.accentMuted:t.empty, color:earned?t.accent:t.emptyText, border:`1px solid ${earned?t.accent+"55":t.cardBorder}`, transition:"all 0.3s" }}>
                  {earned && <Ic.Check sz={11}/>} {m}d
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ padding:"0 20px" }}>
        <Btn onClick={exportData} variant="ghost" size="lg" fullWidth icon={Ic.Download} t={t}>Export Data as JSON</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECOVERY VIEW
═══════════════════════════════════════════════════════════════ */
function RecoveryView({ days, t, profile }) {
  const { current } = useMemo(()=>calcStreaks(days),[days]);
  const dark = t===T.dark;
  const curIdx = useMemo(()=>{ let idx=0; for(let i=0;i<RECOVERY.length;i++) if(current>=RECOVERY[i].days) idx=i; return idx; },[current]);
  return (
    <div style={{ paddingBottom:96 }}>
      <div style={{ padding:"20px 20px 14px" }}>
        <div style={{ fontSize:24, fontWeight:800, color:t.text, letterSpacing:"-0.5px" }}>Recovery</div>
        <div style={{ fontSize:13, color:t.textSec }}>Educational liver health timeline</div>
      </div>
      <div style={{ padding:"0 20px 14px" }}>
        <Card t={t} style={{ padding:"24px 18px", textAlign:"center" }}>
          <div style={{ fontSize:11, color:t.textSec, marginBottom:12, letterSpacing:"0.5px", fontWeight:600 }}>
            {profile?.name ? `${profile.name.toUpperCase()}'S ` : ""}RECOVERY TREE
          </div>
          <RecoveryTree streak={current}/>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:t.accent, letterSpacing:"-0.5px" }}>{current} {current===1?"day":"days"} sober</div>
            <div style={{ fontSize:13, color:t.textSec, marginTop:4 }}>Stage {curIdx+1} of {RECOVERY.length}: {RECOVERY[curIdx].title}</div>
          </div>
          {current===0 && <div style={{ marginTop:12, fontSize:13, color:t.textSec, lineHeight:1.55 }}>Mark today as a sober day to start growing your tree</div>}
        </Card>
      </div>
      <div style={{ padding:"0 20px 14px" }}>
        <Card t={t} style={{ padding:"20px 18px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:20 }}>Recovery timeline</div>
          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:19, top:20, bottom:20, width:2, background:t.cardBorder, borderRadius:2 }}/>
            {RECOVERY.map((stage,i)=>{
              const reached=current>=stage.days, isCurrent=i===curIdx;
              const stageBg=dark?stage.darkBg:stage.lightBg;
              return (
                <div key={i} style={{ display:"flex", gap:16, marginBottom:i<RECOVERY.length-1?26:0, position:"relative" }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, zIndex:1, background:reached?stage.color:t.empty, border:`3px solid ${reached?stage.color:t.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:reached?"#fff":t.textTer, boxShadow:isCurrent?`0 0 0 5px ${stage.color}33`:"none", transition:"all 0.4s" }}>
                    {reached ? <Ic.Check sz={16}/> : <span style={{ fontSize:10, color:t.textTer }}>·</span>}
                  </div>
                  <div style={{ paddingTop:8, flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:reached?t.text:t.textSec }}>{stage.title}</span>
                      {isCurrent && <span style={{ fontSize:9, fontWeight:800, color:stage.color, background:stageBg, padding:"2px 8px", borderRadius:20, letterSpacing:"0.5px" }}>YOU ARE HERE</span>}
                    </div>
                    <div style={{ fontSize:11, color:stage.color, fontWeight:700, marginBottom:4, letterSpacing:"0.2px" }}>{stage.period}</div>
                    <div style={{ fontSize:12, color:t.textSec, lineHeight:1.55 }}>{stage.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div style={{ padding:"0 20px 10px", fontSize:11, color:t.textTer, lineHeight:1.65, textAlign:"center" }}>
        Educational information only. Consult a healthcare professional for personal medical advice.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOTTOM NAV — custom icon set, active fill states
═══════════════════════════════════════════════════════════════ */
function BottomNav({ active, onChange, t }) {
  const tabs = [
    { id:"home",     Ico:Ic.Home,     label:"Home"     },
    { id:"calendar", Ico:Ic.Calendar, label:"Calendar" },
    { id:"insights", Ico:Ic.BarChart, label:"Insights" },
    { id:"recovery", Ico:Ic.Seedling, label:"Recovery" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:50, background:t.nav, borderTop:`1px solid ${t.navBorder}`, display:"flex", paddingBottom:"env(safe-area-inset-bottom,8px)" }}>
      {tabs.map(({id,Ico,label})=>{
        const isActive=active===id;
        return <NavTab key={id} id={id} Ico={Ico} label={label} isActive={isActive} t={t} onChange={onChange}/>;
      })}
    </div>
  );
}

function NavTab({ id, Ico, label, isActive, t, onChange }) {
  const [ix, ixProps] = useIx();
  return (
    <button {...ixProps} onClick={()=>onChange(id)} style={{
      flex:1, padding:"10px 0 8px", border:"none", background:"transparent", cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
      color:isActive?t.accent:t.textTer, transition:"color 0.2s", fontFamily:"inherit",
      WebkitTapHighlightColor:"transparent",
    }}>
      <div style={{ transform:isActive||(ix.h||ix.a)?"scale(1.12)":"scale(1)", transition:"transform 0.25s cubic-bezier(.34,1.56,.64,1)" }}>
        <Ico sz={22}/>
      </div>
      <span style={{ fontSize:10, fontWeight:isActive?700:400, letterSpacing:"0.2px" }}>{label}</span>
      {isActive && <div style={{ width:4, height:4, borderRadius:"50%", background:t.accent, marginTop:-2, transition:"all 0.3s" }}/>}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
export default function SoberTracker() {
  const [days, setDays]             = useState({});
  const [view, setView]             = useState("home");
  const [dark, setDark]             = useState(false);
  const [loading, setLoading]       = useState(true);
  const [milestone, setMilestone]   = useState(null);
  const [profile, setProfile]       = useState(null);
  const [needsOnboard, setNeedsOnboard] = useState(false);
  const prevStreakRef = useRef(0);
  const t = dark ? T.dark : T.light;

  useEffect(()=>{
    (async()=>{
      const [prof, savedDays, savedTheme] = await Promise.all([
        store.get("sd-profile"), store.get("sd-days"), store.get("sd-theme"),
      ]);
      if (!prof) { setNeedsOnboard(true); } else { setProfile(prof); }
      if (savedDays) { setDays(savedDays); prevStreakRef.current=calcStreaks(savedDays).current; }
      setDark(savedTheme?.dark ?? false);
      setLoading(false);
    })();
  },[]);

  const handleOnboardComplete = useCallback(async(data)=>{
    const prof = { ...data, onboardedAt:new Date().toISOString() };
    await store.set("sd-profile", prof);
    setProfile(prof);
    setNeedsOnboard(false);
  },[]);

  const handleToggle = useCallback((key, newStatus)=>{
    setDays(prev=>{
      const next={...prev};
      if (newStatus===null) delete next[key]; else next[key]=newStatus;
      store.set("sd-days",next);
      const prevStreak=prevStreakRef.current;
      const { current }=calcStreaks(next);
      if (current>prevStreak && MILESTONES.includes(current)) setTimeout(()=>setMilestone(current),400);
      prevStreakRef.current=current;
      return next;
    });
  },[]);

  const handleTheme = useCallback(()=>{
    setDark(d=>{ const next=!d; store.set("sd-theme",{dark:next}); return next; });
  },[]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#f0fdf9", flexDirection:"column", gap:12 }}>
      <div style={{ animation:"pulse 1.5s ease-in-out infinite" }}><Ic.Plant sz={48} style={{ color:"#059669" }}/></div>
      <div style={{ fontSize:14, color:"#64748b" }}>Loading your journey…</div>
    </div>
  );

  if (needsOnboard) return <Onboarding onComplete={handleOnboardComplete}/>;

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif", color:t.text, transition:"background 0.3s,color 0.3s", WebkitTextSizeAdjust:"100%", overflowX:"hidden", paddingTop:"env(safe-area-inset-top,0px)" }}>
      {/* Top bar */}
      <div style={{ position:"sticky", top:0, zIndex:40, background:`${t.nav}dd`, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:`1px solid ${t.navBorder}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Ic.Plant sz={22} style={{ color:t.accent }}/>
          <span style={{ fontWeight:800, fontSize:18, color:t.text, letterSpacing:"-0.3px" }}>Sober Days</span>
        </div>
        <ThemeToggle dark={dark} onToggle={handleTheme} t={t}/>
      </div>
      <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        {view==="home"     && <HomeView     days={days} onToggle={handleToggle} t={t} profile={profile}/>}
        {view==="calendar" && <CalendarView days={days} onToggle={handleToggle} t={t}/>}
        {view==="insights" && <InsightsView days={days} t={t}/>}
        {view==="recovery" && <RecoveryView days={days} t={t} profile={profile}/>}
      </div>
      <BottomNav active={view} onChange={setView} t={t}/>
      <MilestoneModal milestone={milestone} onClose={()=>setMilestone(null)} t={t} name={profile?.name}/>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        button { font-family: inherit; }
        input, textarea, select {
          -webkit-appearance: none;
          appearance: none;
          border-radius: 0;
          font-size: 16px;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input::placeholder { color: rgba(148,163,184,0.55); -webkit-text-fill-color: rgba(148,163,184,0.55); }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }

        @keyframes popIn      { 0%{transform:scale(0.7) translateY(20px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes pulse      { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.7} }
        @keyframes ringPop    { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes slideInRight  { from{transform:translateX(32px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideOutLeft  { from{transform:translateX(0);opacity:1} to{transform:translateX(-32px);opacity:0} }
        @keyframes dotPulse   { from{transform:scale(0.7);opacity:0.4} to{transform:scale(1.2);opacity:1} }
        @keyframes orbFloat0  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,30px)} }
        @keyframes orbFloat1  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,20px)} }
        @keyframes orbFloat2  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-25px)} }
        @keyframes orbFloat3  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-15px)} }
        @keyframes orbFloat4  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,25px)} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THEME TOGGLE BUTTON — pill with icon swap
═══════════════════════════════════════════════════════════════ */
function ThemeToggle({ dark, onToggle, t }) {
  const [ix, ixProps] = useIx();
  return (
    <button {...ixProps} onClick={onToggle} style={{
      display:"flex", alignItems:"center", gap:6, background:t.card, border:`1px solid ${t.cardBorder}`, borderRadius:20, padding:"7px 14px", cursor:"pointer", color:t.text,
      transition:"all 0.18s cubic-bezier(.4,0,.2,1)",
      transform:ix.a?"scale(0.94)":ix.h?"translateY(-1px)":"none",
      boxShadow:ix.h&&!ix.a?t.shadow:"none",
      WebkitTapHighlightColor:"transparent", fontFamily:"inherit",
    }}>
      {dark ? <Ic.Sun sz={16}/> : <Ic.Moon sz={16}/>}
    </button>
  );
}