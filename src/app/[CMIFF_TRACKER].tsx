"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays, LayoutDashboard, Users, Send, Shield,
  Flag, X, Check, CheckCheck, Play, Square, AlertTriangle,
  RotateCw, Film, Radio, HardDrive, Clock, Printer,
  Sparkles, SlidersHorizontal, Megaphone, UserCheck,
  Zap, Volume2, FileWarning, UsersRound, Sailboat,
  Sunrise, ClipboardList, Crosshair, Timer,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
// @ts-ignore
interface Activity {
  _id: string;
  day: number;
  start: number;
  end: number;
  title: string;
  venue: string;
  pillar: string;
  status: string;
  details?: string;
  gear?: string;
  quiet?: boolean;
  checks?: { dcp: boolean; subs: boolean; bak: boolean };
  delay?: number;
  manual?: string | null;
  crewLead?: string | null;
  crewTechs?: string[];
  crewVols?: string[];
}

interface CrewMember {
  _id: string;
  name: string;
  role: "LEAD" | "TECH" | "VOL";
  venue: string;
  telegramHandle: string;
  linked: boolean;
  token: string;
  telegramChatId?: string;
}

interface WireMessage {
  _id: string;
  id: string;
  time: string;
  day: number;
  team: string;
  kind: string;
  text: string;
  sev?: string;
  cat?: string;
  incId?: string;
  status?: string;
}

interface Incident {
  _id: string;
  id: number;
  cat: string;
  sev: string;
  note: string;
  actId?: string;
  day: number;
  tm: string;
  status: string;
}

interface BotMessage {
  _id: string;
  id: string;
  seq: number;
  day: number;
  tm: string;
  toId: string;
  kind: string;
  text: string;
  actId?: string;
  ruleId?: string;
  acked: boolean;
}

interface BroadcastLog {
  _id: string;
  id: string;
  tm: string;
  day: number;
  scope: string;
  n: number;
  prio: string;
  txt: string;
}

// ─── Constants (from prototype) ──────────────────────────────────────
const VEN: Record<string, { n: string; s: string; c: string }> = {
  arena: { n: "Beach Sports Arena", s: "ARENA", c: "#C9B98F" },
  hub: { n: "Learn & Connect Hub", s: "HUB", c: "#4FB39A" },
  tent: { n: "Film Screening Tent", s: "TENT", c: "#EFA33C" },
  theatre: { n: "Theatre & Spoken Word Stage", s: "THTR", c: "#D98E7A" },
  main: { n: "Main Stage", s: "MAIN", c: "#C77DA8" },
  dj: { n: "DJ Lounge / Sundowner Deck", s: "DJ", c: "#8FA3B8" },
  bonfire: { n: "Beach & Bonfire", s: "FIRE", c: "#E4795B" },
};

const PIL: Record<string, [string, string]> = {
  sports: ["Beach Sports", "#C9B98F"],
  learn: ["Learn", "#4FB39A"],
  connect: ["Connect", "#8FA3B8"],
  film: ["Film", "#EFA33C"],
  theatre: ["Theatre & Spoken Word", "#D98E7A"],
  music: ["Music · DJs · Dance", "#C77DA8"],
  general: ["General", "#6E6353"],
};

const STS: Record<string, [string, string]> = {
  CONF: ["CONFIRMED", "teal"],
  TBC: ["TBC", "amber"],
  PEND: ["PENDING", "slate"],
  PROG: ["TITLE TBC", "rose"],
};

const DAYS = [{ n: 1, d: "THU 15 OCT" }, { n: 2, d: "FRI 16 OCT" }, { n: 3, d: "SAT 17 OCT" }];

const RULES = [
  { id: "digest", off: -2, label: "MORNING DIGEST 05:30", icon: "sunrise", blurb: "A personal AI summary per person: today's duties, first call, gear watch and open risks." },
  { id: "pre", off: 45, label: "T-45 PRE-BRIEF", icon: "clipboard-list", blurb: "To leads + technicians: gear list, content status, risks — time to fix problems, not suffer them." },
  { id: "call", off: 25, label: "T-25 STAGE CALL", icon: "megaphone", blurb: "Full crew call — report to your venue lead." },
  { id: "pos", off: 10, label: "T-10 POSITIONS", icon: "crosshair", blurb: "Final positions check ten minutes before start." },
  { id: "run", off: 0, label: "ON START", icon: "play", blurb: "Confirmation the activity is running, incl. concurrent slates elsewhere." },
  { id: "shift", off: -1, label: "DELAY PROPAGATION", icon: "timer", blurb: "When a slate runs late, every downstream crew in that venue is re-timed instantly." },
];

const CATS: Record<string, { label: string; icon: string; team: string }> = {
  PROJECTION: { label: "Projection", icon: "projector", team: "PROJ" },
  AUDIO: { label: "Audio", icon: "volume-2", team: "AV" },
  FILE: { label: "File / DCP", icon: "file-warning", team: "AV" },
  POWER: { label: "Power", icon: "zap", team: "AV" },
  GUEST: { label: "Guests", icon: "users", team: "GUEST" },
  TRANSPORT: { label: "Transport", icon: "sailboat", team: "TRANS" },
  CROWD: { label: "Crowd", icon: "users-round", team: "FOH" },
  OTHER: { label: "Other", icon: "flag", team: "PROG" },
};

const SEV_COLORS: Record<string, string> = { LOW: "#C9B98F", HIGH: "#EFA33C", CRITICAL: "#E44D33" };
const CHECKS = { dcp: "DCP UNVERIFIED", subs: "SUBS PENDING", bak: "NO BACKUP COPY" };
const CHECK_LABEL = { dcp: "DCP", subs: "SUBS", bak: "BACKUP" };

// ─── Utils ───────────────────────────────────────────────────────────
const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const fmt = (m: number) => {
  m = ((Math.round(m) % 1440) + 1440) % 1440;
  return pad(m / 60) + ":" + pad(m % 60);
};
const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] || c));
const first = (name: string) => name.split(" ")[0];
const short = (n: string) => n.split(" ").map((w, i) => (i ? w[0] + "." : w)).join("");

// ─── Main Component ─────────────────────────────────────────────────
export default function CMIFFTracker() {
  // State
  const [day, setDay] = useState(3);
  const [simMin, setSimMin] = useState(9 * 60 + 5);
  const [mode, setMode] = useState<"sim" | "live">("sim");
  const [speed, setSpeed] = useState(1);
  const [activeView, setActiveView] = useState("prog");
  const [venueF, setVenueF] = useState("all");
  const [roleF, setRoleF] = useState("ALL");
  const [botF, setBotF] = useState("ALL");
  const [crewQ, setCrewQ] = useState("");
  const [pV, setPV] = useState("all");
  const [pP, setPP] = useState("all");
  const [pS, setPS] = useState("all");
  const [pQ, setPQ] = useState("");
  const [wireFilter, setWireFilter] = useState("all");

  // Data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [wire, setWire] = useState<WireMessage[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastLog[]>([]);
  
  // Bot connection test
  const [botStatus, setBotStatus] = useState<{ connected: boolean; info?: any; error?: string } | null>(null);

  // UI state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showFlagsDrawer, setShowFlagsDrawer] = useState(false);
  const [showActDrawer, setShowActDrawer] = useState(false);
  const [showPersonDrawer, setShowPersonDrawer] = useState(false);
  const [flagActId, setFlagActId] = useState<string | null>(null);
  const [flagSev, setFlagSev] = useState("HIGH");
  const [flagNote, setFlagNote] = useState("");
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<CrewMember | null>(null);
  const [adminText, setAdminText] = useState("");
  const [adminScope, setAdminScope] = useState("all");
  const [adminTarget, setAdminTarget] = useState("");
  const [adminPrio, setAdminPrio] = useState("INFO");
  const [aiDraft, setAiDraft] = useState("");
  const [showAiDraft, setShowAiDraft] = useState(false);

  // AI Upload state
  const [uploadDay, setUploadDay] = useState(1);
  const [uploadVenue, setUploadVenue] = useState("");
  const [uploadPillar, setUploadPillar] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<any[]>([]);
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    Object.fromEntries(RULES.map((r) => [r.id, true]))
  );
  const [ruleCounts, setRuleCounts] = useState<Record<string, number>>(
    Object.fromEntries(RULES.map((r) => [r.id, 0]))
  );

  // Refs
  const heroRefs = useRef<Array<{ el: HTMLDivElement; bar: HTMLSpanElement; tc: HTMLSpanElement }>>([]);
  const lastSig = useRef("");
  const lastNextKey = useRef("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const incSeqRef = useRef(0);
  const uidRef = useRef(0);

  // ─── Fetch data from Convex ───────────────────────────────────────
  useEffect(() => {
    const loadSeedData = async () => {
      try {
        const res = await fetch("/api/seed");
        if (res.ok) {
          const data = await res.json();
          if (data.crew?.length) setCrew(data.crew);
          if (data.activities?.length) setActivities(data.activities);
        }
      } catch (e) {
        console.error("Failed to load seed data:", e);
      }
    };
    loadSeedData();

    // Poll crew links every 10 seconds to pick up Telegram /connect updates
    const pollCrew = async () => {
      try {
        const res = await fetch("/api/crew");
        if (res.ok) {
          const data = await res.json();
          if (data.crew?.length > 0) {
            setCrew((prev) => {
              const updated = prev.map((p) => {
                const linked = data.crew.find((c: any) => c.token === p.token);
                return linked ? { ...p, linked: linked.linked, telegramChatId: linked.telegramChatId } : p;
              });
              return updated;
            });
          }
        }
      } catch (e) {
        // Silently ignore poll errors
      }
    };
    pollCrew();
    const interval = setInterval(pollCrew, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Simulation clock ─────────────────────────────────────────────
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (mode === "live") {
        const d = new Date();
        setSimMin(d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60);
      } else if (speed > 1) {
        setSimMin((prev) => Math.min(1560, prev + 0.25 * speed / 4));
      }
    }, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [mode, speed, day]);

  // ─── Derived data ─────────────────────────────────────────────────
  const dayActivities = activities
    .filter((a) => a.day === day)
    .sort((a, b) => a.start - b.start || a.venue.localeCompare(b.venue));

  const shifts = useCallback(() => {
    const map: Record<string, number> = {};
    for (const v of Object.keys(VEN)) {
      let acc = 0;
      for (const a of dayActivities.filter((x) => x.venue === v).sort((a, b) => a.start - b.start)) {
        acc += a.delay || 0;
        map[a._id] = acc;
      }
    }
    return map;
  }, [dayActivities]);

  const eff = (a: Activity, sh: Record<string, number>) => a.start + (sh[a._id] || 0);

  const statusOf = (a: Activity, T: number, sh: Record<string, number>) => {
    const es = eff(a, sh);
    const dur = a.end - a.start;
    const ee = es + dur;
    if (a.manual === "done") return "done";
    if (a.manual === "live") return "live";
    if (T >= ee) return "past";
    if (T >= es) return "live";
    return "future";
  };

  const liveCount = dayActivities.filter((a) => statusOf(a, simMin, shifts()) === "live").length;
  const delayCount = dayActivities.filter((a) => (a.delay || 0) > 0).length;
  const openFlags = incidents.filter((i) => i.status !== "resolved").length;

  // ─── Actions ──────────────────────────────────────────────────────
  const handleStart = (a: Activity) => {
    const sh = shifts();
    a.manual = "live";
    // In real app: await updateActivity(a._id, "manual", "live");
    toast("var(--red)", "play", "ON NOW", `${VEN[a.venue]?.s} · "${a.title}"`);
  };

  const handleWrap = (a: Activity) => {
    a.manual = "done";
    toast("var(--teal)", "square", "WRAPPED", `${VEN[a.venue]?.s} · "${a.title}"`);
  };

  const handleLate = (a: Activity, mins: number) => {
    a.delay = (a.delay || 0) + mins;
    toast("var(--amber)", "alert-triangle", `DELAY +${mins}′`, `"${a.title}" shifted`);
  };

  const handleReset = (a: Activity) => {
    a.delay = 0;
    toast("var(--teal)", "rotate-ccw", "DELAY CLEARED", `${VEN[a.venue]?.s} · back on schedule`);
  };

  const handleFlag = (actId?: string) => {
    setFlagActId(actId || null);
    setShowFlagModal(true);
  };

  const submitFlag = () => {
    if (!flagNote.trim()) return;
    const newInc: Incident = {
      _id: `inc_${++incSeqRef.current}`,
      id: incSeqRef.current,
      cat: "OTHER",
      sev: flagSev,
      note: flagNote,
      actId: flagActId || undefined,
      day,
      tm: fmt(simMin),
      status: "open",
    };
    setIncidents((prev) => [newInc, ...prev]);
    setFlagNote("");
    setShowFlagModal(false);
    toast(flagSev === "CRITICAL" ? "var(--red)" : "var(--amber)", "flag", `${flagSev} FLAG RAISED`, flagActId ? `"${activities.find((a) => a._id === flagActId)?.title}"` : "General");
  };

  const resolveFlag = (id: number) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status: "resolved" } : i)));
    toast("var(--teal)", "check-check", "FLAG RESOLVED", "Incident marked resolved");
  };

  const handleBroadcast = async () => {
    if (!adminText.trim()) return;
    const recipients = crew.filter((p) =>
      adminScope === "all" ? true :
      adminScope === "venue" ? p.venue === adminTarget :
      p.role === adminTarget
    );
    const linkedRecipients = recipients.filter((p) => p.linked && p.telegramChatId);
    const unlinkedCount = recipients.length - linkedRecipients.length;

    const log: BroadcastLog = {
      _id: `bl_${Date.now()}`,
      id: `bl_${Date.now()}`,
      tm: fmt(simMin),
      day,
      scope: adminScope,
      n: linkedRecipients.length,
      prio: adminPrio,
      txt: adminText,
    };
    setBroadcasts((prev) => [log, ...prev]);
    setAdminText("");
    setShowAiDraft(false);

    // Send to each linked recipient
    let sent = 0;
    for (const p of linkedRecipients) {
      try {
        const res = await fetch("/api/telegram/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: p.telegramChatId,
            text: `${adminPrio === "CRITICAL" ? "🚨" : adminPrio === "ALERT" ? "⚠️" : "📢"} *CMIFF OPS*

${adminText}`,
          }),
        });
        const data = await res.json();
        if (data.ok) sent++;
      } catch (e) {
        console.error("Send failed:", e);
      }
    }

    if (sent > 0) {
      toast("var(--teal)", "send", "SENT", `${sent} crew member(s) notified`);
    } else if (unlinkedCount > 0) {
      toast("var(--amber)", "alert-triangle", "NO LINKED ACCOUNTS", `${unlinkedCount} selected crew not linked to bot`);
    } else {
      toast("var(--red)", "alert-triangle", "SEND FAILED", "Check bot token and network");
    }
  };

  const handleAiDraft = async () => {
    const q = adminText.trim() || "general ops update";
    // In real app: const result = await aiDraft(q);
    const mockDraft = `📢 OPS UPDATE — ${q}.\n\nLeads: confirm receipt, brief your crew at next changeover.`;
    setAiDraft(mockDraft);
    setShowAiDraft(true);
  };

  // AI file / text parser
  const handleAiParse = async () => {
    if (!uploadText.trim()) { toast("var(--red)", "alert-triangle", "EMPTY", "Paste or type schedule text first."); return; }
    setUploadStatus("loading");
    setUploadResult([]);
    // Simulate AI call with fallback parsing
    setTimeout(() => {
      const lines = uploadText.split("\n").filter((l) => l.trim());
      const parsed: any[] = [];
      const VEN_KEYS = Object.keys(VEN);
      const PIL_KEYS = Object.keys(PIL);
      for (const line of lines) {
        const trimmed = line.trim();
        const m = trimmed.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*(.+)$/);
        if (m) {
          const [, s, e, title] = m;
          const lower = trimmed.toLowerCase();
          let venue = uploadVenue || "general";
          let pillar = uploadPillar || "general";
          for (const v of VEN_KEYS) { if (lower.includes(v)) { venue = v; break; } }
          for (const p of PIL_KEYS) { if (lower.includes(p)) { pillar = p; break; } }
          const isFilm = lower.includes("film") || lower.includes("screening");
          const hasPerformer = /\b(dj|band|perform|theatre|spoke|film|panel|workshop|masterclass)\b/i.test(trimmed);
          parsed.push({
            title: title.trim(),
            start: s,
            end: e,
            venue,
            pillar,
            status: hasPerformer ? "CONF" : isFilm ? "PROG" : "PEND",
            details: null,
            gear: null,
          });
        }
      }
      setUploadResult(parsed);
      setUploadStatus(parsed.length ? "done" : "error");
      if (!parsed.length) toast("var(--red)", "file-warning", "NO ACTIVITIES", "Could not parse any time slots. Check format: HH:MM – HH:MM Title");
      else toast("var(--teal)", "check", "PARSED", `${parsed.length} activities found — review below`);
    }, 600);
  };

  const handleUploadSave = () => {
    const newActs = uploadResult.map((a) => ({
      ...a,
      _id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      day: uploadDay,
      start: parseInt(a.start.split(":")[0]) * 60 + parseInt(a.start.split(":")[1]),
      end: parseInt(a.end.split(":")[0]) * 60 + parseInt(a.end.split(":")[1]),
      quiet: /^(lunch|dinner|break|transition)/i.test(a.title),
      checks: undefined,
      delay: 0,
      manual: null,
      crewLead: null,
      crewTechs: [],
      crewVols: [],
    }));
    setActivities((prev) => [...prev, ...newActs].sort((a, b) => a.day - b.day || a.start - b.start));
    setUploadStatus("idle");
    setUploadText("");
    setUploadResult([]);
    toast("var(--teal)", "play", "IMPORTED", `${newActs.length} activities added to Day ${uploadDay}`);
  };

  const handleAckBot = (id: string) => {
    setBotMessages((prev) => prev.map((m) => (m.id === id ? { ...m, acked: true } : m)));
  };

  const testBotConnection = async () => {
    try {
      const res = await fetch("/api/telegram/status");
      const data = await res.json();
      if (data.ok) {
        setBotStatus({ connected: true, info: data.bot });
        toast("var(--teal)", "check", "BOT CONNECTED", `@${data.bot.username} is ready`);
      } else {
        setBotStatus({ connected: false, error: data.error });
        toast("var(--red)", "alert-triangle", "BOT ERROR", data.error);
      }
    } catch (e) {
      setBotStatus({ connected: false, error: String(e) });
      toast("var(--red)", "alert-triangle", "CONNECTION FAILED", String(e));
    }
  };

  const testSendMessage = async (chatId: string) => {
    if (!chatId) {
      toast("var(--amber)", "alert-triangle", "NO CHAT ID", "Cannot send without a Telegram chat ID");
      return;
    }
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId,
          text: `🧪 *Test message from CMIFF Tracker*\n\nYour Telegram integration is working! 🎉`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast("var(--teal)", "send", "MESSAGE SENT", `Test message sent to chat ${chatId}`);
      } else {
        toast("var(--red)", "alert-triangle", "SEND FAILED", data.error);
      }
    } catch (e) {
      toast("var(--red)", "alert-triangle", "ERROR", String(e));
    }
  };

  // ─── Toast ────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Array<{ id: string; col: string; ic: string; title: string; msg: string }>>([]);
  const toast = (col: string, ic: string, title: string, msg: string) => {
    const id = `t_${Date.now()}`;
    setToasts((prev) => [...prev, { id, col, ic, title, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="cmiff-app">
      <style>{CSS}</style>

      {/* Top bar */}
      <header id="topbar">
        <div className="brand">
          <span className="brand-cmiff">CMIFF<b>.</b></span>
          <span className="brand-rule"></span>
          <div className="brand-stack">
            <b>MASTER PROGRAM & CONTROL ROOM</b>
            <i>Cape Maclear Int&apos;l Film Festival · Mangochi · 15–17 October 2026</i>
          </div>
        </div>
        <div className="topbar-right">
          <div className="sim">
            <span className="sim-label">SIM</span>
            <input
              type="range"
              id="simRange"
              min={330}
              max={1560}
              step={1}
              value={simMin}
              onChange={(e) => { setSimMin(+e.target.value); setMode("sim"); }}
            />
            <button
              className="ghost-btn"
              onClick={() => {
                const newSpeed = speed === 1 ? 60 : 1;
                setSpeed(newSpeed);
                setMode("sim");
                toast("var(--amber)", "fast-forward", newSpeed === 60 ? "60× DEMO" : "1× SPEED", "Simulation speed changed");
              }}
            >
              {speed}×
            </button>
            <button className="ghost-btn" onClick={() => { setMode("live"); setSimMin(new Date().getHours() * 60 + new Date().getMinutes()); }}>
              LIVE
            </button>
            <span className={`mode-chip ${mode === "live" ? "live" : "sim"}`}>
              {mode === "live" ? "LIVE" : `SIM ${speed}×`}
            </span>
          </div>
          <div className="clock" id="clock">
            {pad(Math.floor(simMin / 60))}<span className="colon">:</span>{pad(Math.floor(simMin % 60))}<span className="colon">:</span>{pad(Math.floor((simMin % 1) * 60))}<small>D{day}</small>
          </div>
          <button className="flags-btn" onClick={() => setShowFlagsDrawer(true)}>
            <Flag size={14} />FLAGS <span className={`badge ${openFlags === 0 ? "zero" : ""}`}>{openFlags}</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs" id="tabs">
        {[
          { id: "prog", icon: CalendarDays, label: "PROGRAM" },
          { id: "ops", icon: LayoutDashboard, label: "OPS BOARD" },
          { id: "crew", icon: Users, label: "CREW" },
          { id: "bot", icon: Send, label: "TELEGRAM BOT" },
          { id: "admin", icon: Shield, label: "ADMIN" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`tab ${activeView === id ? "on" : ""}`}
            onClick={() => setActiveView(id)}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </nav>

      {/* ─── PROGRAM VIEW ───────────────────────────────────────── */}
      {activeView === "prog" && (
        <section className="view on" id="view-prog">
          <div className="card overview">
            <div className="ov-grid">
              <div>
                <span className="ovk">FESTIVAL</span>
                <b>Cape Maclear International Film Festival (CMIFF) 2026</b>
                <span className="ovs">Master Programme · 15–17 October 2026 · Mangochi, Lake Malawi</span>
              </div>
              <div>
                <span className="ovk">DATES</span>
                <b>15 – 17 October 2026</b>
                <span className="ovs">Cape Maclear, Mangochi</span>
              </div>
              <div>
                <span className="ovk">PILLARS</span>
                <b>Learn · Connect · Showcase</b>
                <span className="ovs">Beach Sports, Film, Music/DJs/Dancers, Theatre & Spoken Word</span>
              </div>
              <div>
                <span className="ovk">VENUES</span>
                <div className="ovv">
                  {Object.values(VEN).map((v) => (
                    <span key={v.s} className="vchip" style={{ "--vc": v.c } as any}>{v.s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="prog-head">
            <h2 id="progDayTitle">DAY {day} — {DAYS[day - 1].d} · 2026</h2>
            <span className="cnt">{dayActivities.filter((a) => !a.quiet).length} ACTIVITIES · {dayActivities.filter((a) => a.status === "CONF").length} CONFIRMED</span>
          </div>

          <div className="prog-controls">
            <div className="daychips" id="dayTabsProg">
              {DAYS.map((d) => (
                <button key={d.n} className={`dchip ${d.n === day ? "on" : ""}`} onClick={() => setDay(d.n)}>
                  DAY {d.n} · {d.d}
                </button>
              ))}
            </div>
            <input
              className="searchbox"
              id="progSearch"
              placeholder="Search activity, performer, facilitator…"
              value={pQ}
              onChange={(e) => setPQ(e.target.value)}
            />
            <select className="psel" id="pPil" value={pP} onChange={(e) => setPP(e.target.value)}>
              <option value="all">ALL PILLARS</option>
              {Object.entries(PIL).map(([k, [label]]) => (
                <option key={k} value={k}>{label.toUpperCase()}</option>
              ))}
            </select>
            <button className="ghost-btn" onClick={() => window.print()}>
              <Printer size={12} />PRINT
            </button>
          </div>

          <div className="ptable">
            <div className="phead">
              <span>TIME</span><span>ACTIVITY / DETAILS</span><span>VENUE</span><span>PILLAR</span><span>STATUS</span><span>CREW</span>
            </div>
            <div id="progRows">
              {dayActivities
                .filter((a) => {
                  if (pV !== "all" && a.venue !== pV) return false;
                  if (pP !== "all" && a.pillar !== pP) return false;
                  if (pS !== "all" && a.status !== pS) return false;
                  if (pQ && !(a.title + " " + (a.details || "")).toLowerCase().includes(pQ.toLowerCase())) return false;
                  return true;
                })
                .map((a) => {
                  const st = statusOf(a, simMin, shifts());
                  const lead = crew.find((p) => p._id === a.crewLead);
                  return (
                    <div
                      key={a._id}
                      className={`prow ${st === "live" ? "st-live" : ""} ${a.quiet ? "quiet" : ""}`}
                      onClick={() => { setSelectedAct(a); setShowActDrawer(true); }}
                    >
                      <div className="pc-time">
                        {fmt(a.start)}<span>– {fmt(a.end)}</span>
                        {a.delay ? <em>+{a.delay}′ SHIFTED</em> : null}
                        {st === "live" ? <span className="ld"></span> : null}
                      </div>
                      <div className="pc-act">
                        <div className="pt">{esc(a.title)}</div>
                        {a.details ? <div className="pd">{esc(a.details.slice(0, 80))}{a.details.length > 80 ? "…" : ""}</div> : null}
                        {a.gear ? <div className="pg">
                          {a.gear.split("·").map((g, i) => (
                            <span key={i} className="gear"><Zap size={9} />{esc(g.trim())}</span>
                          ))}
                        </div> : null}
                      </div>
                      <div className="pc-venue">
                        <span className="vchip" style={{ "--vc": VEN[a.venue]?.c as any }}>{VEN[a.venue]?.s}</span>
                      </div>
                      <div className="pc-pill">
                        <span className="vchip" style={{ "--vc": PIL[a.pillar]?.[1] as any }}>{PIL[a.pillar]?.[0]}</span>
                      </div>
                      <div className="pc-stat">
                        <span className={`pill st-${a.status}`}>{STS[a.status]?.[0]}</span>
                      </div>
                      <div className="pc-crew">
                        {lead ? <><b style={{ color: "var(--amber)" }}>L</b> {esc(short(lead.name))}</> : "—"}
                        {a.crewTechs?.length ? <><span className="tN">+{a.crewTechs.length}T</span></> : null}
                        {a.crewVols?.length ? <><span className="vN">+{a.crewVols.length}V</span></> : null}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="keyline">
            <span><span className="pill st-CONF">CONFIRMED</span> Confirmed</span>
            <span><span className="pill st-PEND">PENDING</span> Pending / invited / assigned</span>
            <span><span className="pill st-TBC">TBC</span> To be confirmed</span>
            <span><span className="pill st-PROG">TITLE TBC</span> Film title / director / country to be programmed</span>
          </div>
        </section>
      )}

      {/* ─── OPS VIEW ───────────────────────────────────────────── */}
      {activeView === "ops" && (
        <section className="view on" id="view-ops">
          <div className="prog-controls">
            <div className="daychips" id="dayTabsOps">
              {DAYS.map((d) => (
                <button key={d.n} className={`dchip ${d.n === day ? "on" : ""}`} onClick={() => setDay(d.n)}>
                  DAY {d.n} · {d.d}
                </button>
              ))}
            </div>
          </div>

          <div className="ops-grid">
            <div>
              <div className="col-head">
                <h2><Film size={17} color="var(--amber)" />Run of Show</h2>
                <span className="cnt" id="rosCount">{dayActivities.length} ACTIVITIES · {liveCount} LIVE</span>
                <div className="cnt" style={{ marginLeft: "auto" }} id="venueLegend">
                  {Object.entries(VEN).map(([k, v]) => (
                    <span key={k} className={`fchip ${venueF === k ? "on" : ""}`} onClick={() => setVenueF(venueF === k ? "all" : k)} style={{ cursor: "pointer" }}>{v.s}</span>
                  ))}
                </div>
              </div>

              <div className="slot-list" id="rundownList">
                {dayActivities
                  .filter((a) => venueF === "all" || a.venue === venueF)
                  .map((a) => {
                    const st = statusOf(a, simMin, shifts());
                    const es = eff(a, shifts());
                    const lead = crew.find((p) => p._id === a.crewLead);
                    return (
                      <div key={a._id} className={`slot st-${st}`}>
                        <div className="slot-time">
                          <span className="t">{fmt(a.start)}</span>
                          <span className="te">→ {fmt(a.end)}</span>
                          {a.delay ? <span className="t-shift">{fmt(es)} +{a.delay}′</span> : null}
                        </div>
                        <div>
                          <div className="slot-title">{esc(a.title)}</div>
                          <div className="slot-meta">
                            <span className="vchip" style={{ "--vc": VEN[a.venue]?.c as any }}>{VEN[a.venue]?.s}</span>
                            <span className="vchip" style={{ "--vc": PIL[a.pillar]?.[1] as any }}>{PIL[a.pillar]?.[0]}</span>
                            <span className={`pill st-${a.status}`}>{STS[a.status]?.[0]}</span>
                            {a.gear ? <span className="gear"><Zap size={9} />{esc(a.gear)}</span> : null}
                            {a.checks && Object.values(a.checks).includes(false)
                              ? Object.entries(a.checks)
                                  .filter(([, ok]) => !ok)
                                  .map(([k]) => <span key={k} className="pill st-PROG">{CHECK_LABEL[k as keyof typeof CHECK_LABEL]} PENDING</span>)
                              : null}
                          </div>
                          {a.details ? <div className="slot-detail">{esc(a.details.slice(0, 100))}{a.details.length > 100 ? "…" : ""}</div> : null}
                          <div className="slot-crew">
                            {lead ? <span className="cl"><b>L</b> {esc(lead.name)}</span> : null}
                            {a.crewTechs?.length ? <span className="ct"><b>T</b> ×{a.crewTechs.length}</span> : null}
                            {a.crewVols?.length ? <span className="cv"><b>V</b> ×{a.crewVols.length}</span> : null}
                          </div>
                        </div>
                        <div className="slot-side">
                          {st === "live" ? <span className="chip live"><span className="live-dot"></span>ON</span> :
                           st === "done" ? <span className="chip">WRAPPED</span> :
                           st === "past" ? <span className="chip">PLAYED</span> :
                           null}
                          <div className="slot-actions">
                            {st === "future" && <>
                              <button className="abtn" onClick={() => handleStart(a)}><Play size={11} />START</button>
                              <button className="abtn" onClick={() => handleLate(a, 5)}>+5′</button>
                              <button className="abtn" onClick={() => handleLate(a, 15)}>+15′</button>
                              {a.delay ? <button className="abtn" onClick={() => handleReset(a)}><RotateCw size={11} /></button> : null}
                              <button className="abtn" onClick={() => handleFlag(a._id)}><Flag size={11} /></button>
                            </>}
                            {st === "live" && <>
                              <button className="abtn" onClick={() => handleWrap(a)}><Square size={11} />WRAP</button>
                              <button className="abtn" onClick={() => handleFlag(a._id)}><Flag size={11} /></button>
                            </>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rail">
              <div className="card">
                <div className="card-label"><span className="live-dot"></span>ON NOW ACROSS SITES</div>
                <div id="nowList">
                  {dayActivities.filter((a) => statusOf(a, simMin, shifts()) === "live").slice(0, 3).map((a) => (
                    <div key={a._id} className="now-item">
                      <div className="ni-top">
                        <span className="vchip" style={{ "--vc": VEN[a.venue]?.c as any }}>{VEN[a.venue]?.s}</span>
                        <span className="ni-clock">{fmt(eff(a, shifts()))} → {fmt(eff(a, shifts()) + a.end - a.start)}</span>
                      </div>
                      <div className="ni-title">{esc(a.title)}</div>
                    </div>
                  ))}
                  {!dayActivities.some((a) => statusOf(a, simMin, shifts()) === "live") && (
                    <div className="now-empty">
                      <Clock size={18} color="var(--amber)" />
                      <b>{simMin < 360 ? "Pre-dawn — gates 06:00" : "Between slates"}</b>
                      <span>Next: {dayActivities.find((a) => statusOf(a, simMin, shifts()) === "future")?.title || "Day complete"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-label"><Clock size={14} color="var(--amber)" />NEXT ACTIVITY</div>
                <div className="leader-wrap">
                  <svg viewBox="0 0 200 200" aria-hidden="true">
                    <circle cx="100" cy="100" r="96" fill="none" stroke="#2C251B" strokeWidth="1" />
                    <circle cx="100" cy="100" r="86" fill="none" stroke="#3D3423" strokeWidth="5" strokeDasharray="2 43" />
                    <line x1="100" y1="10" x2="100" y2="190" stroke="#2C251B" strokeWidth="1" />
                    <line x1="10" y1="100" x2="190" y2="100" stroke="#2C251B" strokeWidth="1" />
                    <path id="wedge" fill="rgba(239,163,60,.13)" d="" />
                    <line id="sweep" x1="100" y1="100" x2="100" y2="12" stroke="#EFA33C" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="3" fill="#EFA33C" />
                  </svg>
                  <div className="leader-readout">
                    <b id="leaderNum">--:--</b>
                    <span id="leaderCap">TO NEXT</span>
                  </div>
                </div>
                <div className="next-meta" id="nextMeta">
                  <div className="nm-title">—</div>
                </div>
              </div>
            </div>
          </div>

          <div className="statline" id="statline">
            <span>DAY {day} · {DAYS[day - 1].d} 2026</span>
            <span className="sep">/</span>
            <span><b>{dayActivities.length}</b> ACTIVITIES</span>
            <span className="sep">/</span>
            <span><b>{liveCount}</b> ON NOW</span>
            <span className="sep">/</span>
            <span><b>{delayCount}</b> DELAYED</span>
            <span className="sep">/</span>
            <span><b>{openFlags}</b> FLAGS</span>
          </div>
        </section>
      )}

      {/* ─── CREW VIEW ──────────────────────────────────────────── */}
      {activeView === "crew" && (
        <section className="view on" id="view-crew">
          <div className="crew-filter" id="crewFilter">
            {["ALL", "LEAD", "TECH", "VOL"].map((r) => (
              <button key={r} className={`fchip ${roleF === r ? "on" : ""}`} onClick={() => setRoleF(r)}>
                {r === "ALL" ? "ALL ROLES" : r + "S"}
              </button>
            ))}
            <input className="searchbox" placeholder="Search people…" value={crewQ} onChange={(e) => setCrewQ(e.target.value)} />
          </div>
          <div className="crew-grid" id="crewGrid">
            {crew
              .filter((p) => roleF === "ALL" || p.role === roleF)
              .filter((p) => p.name.toLowerCase().includes(crewQ.toLowerCase()) || p.venue.includes(crewQ.toLowerCase()))
              .map((p) => {
                const duties = dayActivities.filter((a) => a.crewLead === p._id || a.crewTechs?.includes(p._id) || a.crewVols?.includes(p._id));
                const next = duties.find((a) => statusOf(a, simMin, shifts()) === "future");
                return (
                  <div key={p._id} className="pcard" onClick={() => { setSelectedPerson(p); setShowPersonDrawer(true); }}>
                    <div className="pc-top">
                      <span className={`avatar av-${p.role}`}>{p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="pc-name">{esc(p.name)}</div>
                        <div className="pc-sub">
                          <span className={`rchip rl-${p.role}`}>{p.role}</span>
                          <span>{VEN[p.venue]?.s}</span>
                          {p.linked ? <span className="tg-ok"><Check size={10} />LINKED</span> : <span className="tg-no"><UserCheck size={10} />PENDING</span>}
                        </div>
                      </div>
                    </div>
                    <div className="pc-duty">DUTIES: <b>{duties.filter((a) => !a.quiet).length}</b></div>
                    <div className="pc-next">
                      <span>NEXT</span>
                      <b>{next ? fmt(eff(next, shifts())) + " · " + next.title.slice(0, 20) : "—"}</b>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ─── BOT VIEW ───────────────────────────────────────────── */}
      {activeView === "bot" && (
        <section className="view on" id="view-bot">
          <div className="bot-grid">
            <div className="card">
              <div className="card-label"><SlidersHorizontal size={14} color="var(--amber)" />AUTOMATION RULES</div>
              <div id="ruleList">
                {RULES.map((r) => (
                  <div key={r.id} className="rule">
                    <button
                      className={`sw ${ruleStates[r.id] ? "on" : ""}`}
                      onClick={() => setRuleStates((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                    >
                      <i></i>
                    </button>
                    <div className="rl-main">
                      <div className="rl-name">
                        {r.icon === "sunrise" && <Sunrise size={12} color="var(--teal)" />}
                        {r.icon === "clipboard-list" && <ClipboardList size={12} color="var(--teal)" />}
                        {r.icon === "megaphone" && <Megaphone size={12} color="var(--teal)" />}
                        {r.icon === "crosshair" && <Crosshair size={12} color="var(--teal)" />}
                        {r.icon === "play" && <Play size={12} color="var(--teal)" />}
                        {r.icon === "timer" && <Timer size={12} color="var(--teal)" />}
                        {r.label}
                        <span className="rc" style={{ marginLeft: "auto", color: "var(--dim)", fontWeight: 500 }}>
                          {ruleCounts[r.id] ?? 0} sent
                        </span>
                      </div>
                      <div className="rl-blurb">{r.blurb}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ai-note">
                <b>How the assistant works:</b> it watches the master program and every live change (delays, manual starts, status flips),
                decides <i>who</i> needs to know (by role & activity), drafts the message in plain language, and delivers it to each
                person&apos;s Telegram chat. Acknowledgements flow back into this board.
              </div>
            </div>
            <div>
              <div className="col-head">
                <h2><Radio size={17} color="var(--amber)" />Bot Outbox</h2>
                <span className="cnt" id="botCount">{botMessages.length} MESSAGES</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                  {["ALL", "LEAD", "TECH", "VOL", "admin"].map((f) => (
                    <button key={f} className={`fchip ${botF === f ? "on" : ""}`} onClick={() => setBotF(f)}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div id="botList">
                {botMessages
                  .filter((b) => botF === "ALL" || (b.kind === "admin" ? botF === "admin" : crew.find((p) => p._id === b.toId)?.role === botF))
                  .map((b) => {
                    const person = crew.find((p) => p._id === b.toId);
                    return (
                      <div key={b._id} className={`bub k-${b.kind}`} style={{ "--bc": b.kind === "admin" ? "var(--amber)" : "var(--teal)" } as any}>
                        <span className={`bav ${b.kind === "admin" ? "adm" : "bot"}`}>
                          {b.kind === "admin" ? "OP" : "TG"}
                        </span>
                        <div className="bmain">
                          <div className="bhead">
                            <span className="who">{person?.name || b.toId}</span>
                            {person && <span className={`rchip rl-${person.role}`}>{person.role}</span>}
                            <span className="hdl">{person?.telegramHandle}</span>
                            <span className="bt">D{b.day} {b.tm}</span>
                          </div>
                          <div className="btext">{esc(b.text)}</div>
                          {b.ruleId && <div className="bfoot">⚡ AUTO · RULE {RULES.find((r) => r.id === b.ruleId)?.label}</div>}
                          {!b.acked && b.kind !== "admin" && (
                            <div className="bbtns">
                              <button className="abtn" onClick={() => handleAckBot(b.id)}>
                                <Check size={10} />ACK
                              </button>
                            </div>
                          )}
                          {b.acked && <span className="acked"><CheckCheck size={10} />ACKNOWLEDGED</span>}
                        </div>
                      </div>
                    );
                  })}
                {!botMessages.length && <div className="empty">NOTHING ON THE WIRE — YET.</div>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── ADMIN VIEW ─────────────────────────────────────────── */}
      {activeView === "admin" && (
        <section className="view on" id="view-admin">
          <div className="admin-grid">
            <div className="card">
              <div className="card-label"><Megaphone size={14} color="var(--amber)" />BROADCAST AN UPDATE</div>
              <div className="aud-row">
                <select className="psel" value={adminScope} onChange={(e) => setAdminScope(e.target.value)}>
                  <option value="all">EVERYONE</option>
                  <option value="venue">BY VENUE</option>
                  <option value="role">BY ROLE</option>
                </select>
                <select
                  className="psel"
                  value={adminTarget}
                  onChange={(e) => setAdminTarget(e.target.value)}
                  disabled={adminScope === "all"}
                >
                  {adminScope === "venue" && Object.entries(VEN).map(([k, v]) => (
                    <option key={k} value={k}>{v.n.toUpperCase()}</option>
                  ))}
                  {adminScope === "role" && ["LEAD", "TECH", "VOL"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="recip">
                  → {crew.filter((p) =>
                    adminScope === "all" ? true :
                    adminScope === "venue" ? p.venue === adminTarget :
                    p.role === adminTarget
                  ).length} RECIPIENTS
                </span>
              </div>
              <div className="m-row" style={{ marginTop: 12 }}>
                <span className="m-label" style={{ margin: 0 }}>PRIORITY</span>
                <div className="sev-row" style={{ flex: "0 1 320px" }}>
                  {["INFO", "ALERT", "CRITICAL"].map((s) => (
                    <button
                      key={s}
                      className={`abtn ${adminPrio === s ? `on-${s}` : ""}`}
                      onClick={() => setAdminPrio(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="adminText"
                value={adminText}
                onChange={(e) => setAdminText(e.target.value)}
                placeholder="Type an update — or describe it in plain words and let the AI draft it…"
              />
              <div id="adDraftBox">
                {showAiDraft && aiDraft && (
                  <div className="ai-drafted">
                    <span className="tag">✦ AI DRAFT — EDIT BEFORE SENDING</span>
                    {esc(aiDraft)}
                  </div>
                )}
              </div>
              <div className="m-row">
                <button className="abtn" onClick={handleAiDraft}>
                  <Sparkles size={11} />AI DRAFT (PREVIEW)
                </button>
                <button className="abtn primary" onClick={handleBroadcast}>
                  <Send size={11} />SEND VIA BOT
                </button>
                <span className="m-hint">Delivered to each recipient&apos;s Telegram chat and logged below.</span>
              </div>
              <div className="m-label" style={{ marginTop: 20 }}>RECENT BROADCASTS</div>
              <div className="sends" id="adLog">
                {broadcasts.length ? broadcasts.map((b) => (
                  <div key={b._id} className="send-item" style={{ "--pc": b.prio === "CRITICAL" ? "var(--red)" : b.prio === "ALERT" ? "var(--amber)" : "var(--slate)" } as any}>
                    <div className="sh">
                      <span>D{b.day} {b.tm}</span>
                      <span className="to">→ {b.n} RECIPIENTS ({b.scope.toUpperCase()})</span>
                      <span>{b.prio}</span>
                    </div>
                    <p>{esc(b.txt)}</p>
                  </div>
                )) : <div className="empty">NO BROADCASTS SENT YET.</div>}
              </div>
            </div>

            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <div className="card-label"><Sparkles size={14} color="var(--amber)" />AI SCHEDULE PARSER</div>
              <div style={{ font: "400 10.5px var(--ui); color: var(--mut); margin-bottom: 12px" }}>
                Paste a schedule (from PDF, email, or spreadsheet), pick a target day, and the AI will extract activities with times, venues & pillars.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px 12px", alignItems: "start" }}>
                <span className="m-label" style={{ margin: 0, textAlign: "right", paddingTop: 9 }}>DAY</span>
                <div className="daychips">
                  {[1, 2, 3].map((d) => (
                    <button key={d} className={`dchip ${uploadDay === d ? "on" : ""}`} onClick={() => setUploadDay(d)}>
                      DAY {d}
                    </button>
                  ))}
                </div>
                <span className="m-label" style={{ margin: 0, textAlign: "right", paddingTop: 9 }}>VENUE</span>
                <select className="psel" value={uploadVenue} onChange={(e) => setUploadVenue(e.target.value)} style={{ width: "100%" }}>
                  <option value="">AUTO-DETECT</option>
                  {Object.entries(VEN).map(([k, v]) => <option key={k} value={k}>{v.s}</option>)}
                </select>
                <span className="m-label" style={{ margin: 0, textAlign: "right", paddingTop: 9 }}>PILLAR</span>
                <select className="psel" value={uploadPillar} onChange={(e) => setUploadPillar(e.target.value)} style={{ width: "100%" }}>
                  <option value="">AUTO-DETECT</option>
                  {Object.entries(PIL).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
                </select>
              </div>
              <label className="m-label" style={{ marginTop: 14 }}>PASTE SCHEDULE TEXT</label>
              <textarea
                id="aiUploadText"
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder={"09:00 – 10:00  Panel: Cultural Authenticity\n10:30 – 11:30  Film Screening — Morning Shorts\n12:00 – 13:00  Lunch Break"}
                style={{ width: "100%", background: "var(--srf2)", border: "1px solid var(--line2)", borderRadius: 5, color: "var(--ink)", font: "400 13px/1.5 var(--ui)", padding: "11px 12px", resize: "vertical", minHeight: 120, marginTop: 6 }}
              />
              <div className="m-row" style={{ marginTop: 10 }}>
                <button className="abtn primary" onClick={handleAiParse} disabled={uploadStatus === "loading"}>
                  {uploadStatus === "loading" ? <><Clock size={11} />PARSING…</> : <><Sparkles size={11} />PARSE WITH AI</>}
                </button>
                {uploadResult.length > 0 && (
                  <button className="abtn primary" onClick={handleUploadSave}>
                    <Check size={11} />SAVE {uploadResult.length} TO DAY {uploadDay}
                  </button>
                )}
              </div>
              {uploadResult.length > 0 && (
                <div style={{ marginTop: 12, border: "1px solid var(--line)", borderRadius: 5, overflow: "hidden", background: "var(--srf)" }}>
                  <div style={{ font: "700 8.5px var(--mono); letter-spacing: .18em; color: var(--dim); padding: 8px 12px; background: var(--srf2); border-bottom: 1px solid var(--line2)" }}>
                    PREVIEW · {uploadResult.length} ACTIVITIES
                  </div>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {uploadResult.map((a, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr 70px 90px", gap: 8, alignItems: "center", padding: "7px 12px", borderBottom: i < uploadResult.length - 1 ? "1px solid var(--line)" : "none", font: "400 11px var(--ui)" }}>
                        <span style={{ font: "600 10px var(--mono); color: var(--sand)" }}>{a.start}–{a.end}</span>
                        <span style={{ minWidth: 0 }}>{esc(a.title)}</span>
                        <span className={`pill st-${a.status}`}>{a.status}</span>
                        <span className="vchip" style={{ "--vc": VEN[a.venue]?.c || "var(--sand)" as any }}>{VEN[a.venue]?.s || a.venue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-label"><UserCheck size={14} color="var(--amber)" />TELEGRAM ACCOUNTS</div>
              <div style={{ font: "500 10px var(--mono), monospace", letterSpacing: ".1em", color: "var(--mut)", marginBottom: 8 }}>
                <b style={{ color: "var(--teal)" }}>{crew.filter((p) => p.linked).length} LINKED</b> · {crew.filter((p) => !p.linked).length} PENDING
              </div>
              <div style={{ marginBottom: 12, padding: 10, background: "var(--srf2)", borderRadius: 5, border: "1px solid var(--line)" }}>
                <div style={{ font: "600 10px var(--mono); color: var(--sand); margin-bottom: 6px" }}>BOT CONNECTION TEST</div>
                <button className="abtn" onClick={testBotConnection} style={{ fontSize: 11, padding: "4px 10px" }}>
                  <Zap size={10} />TEST CONNECTION
                </button>
                {botStatus && (
                  <div style={{ marginTop: 8, font: "400 10px var(--ui)", color: botStatus.connected ? "var(--teal)" : "var(--red)" }}>
                    {botStatus.connected ? `✅ Connected as @${botStatus.info?.username}` : `❌ ${botStatus.error}`}
                  </div>
                )}
              </div>
              <div className="m-label" style={{ marginTop: 6 }}>PENDING LINK</div>
              <div id="acctPending">
                {crew.filter((p) => !p.linked).map((p) => (
                  <div key={p._id} className="acct">
                    <span className={`avatar av-${p.role}`} style={{ width: 28, height: 28, fontSize: 10 }}>{p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                    <div>
                      <div className="an">{esc(p.name)}</div>
                      <div className="ah">{esc(p.telegramHandle)} · t.me/cmiffBot?start={p.token}</div>
                    </div>
                    <button className="abtn" onClick={() => toast("var(--teal)", "send", "INVITE RESENT", `${p.name} — deep link re-sent.`)}>
                      <Send size={10} />RE-INVITE
                    </button>
                  </div>
                ))}
                {!crew.some((p) => !p.linked) && <div className="empty" style={{ padding: 12 }}>ALL ACCOUNTS LINKED ✓</div>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── ACTIVITY DRAWER ────────────────────────────────────── */}
      {showActDrawer && selectedAct && (
        <div className={`overlay ${showActDrawer ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setShowActDrawer(false); }}>
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="d-head">
              <div style={{ minWidth: 0 }}>
                <h3>{esc(selectedAct.title)}</h3>
                <div style={{ font: "500 9px var(--mono), monospace", letterSpacing: ".12em", color: "var(--dim)", marginTop: 4 }}>
                  DAY {selectedAct.day} · {fmt(selectedAct.start)}–{fmt(selectedAct.end)}
                </div>
              </div>
              <button className="xbtn" onClick={() => setShowActDrawer(false)}><X size={14} /></button>
            </div>
            <div className="d-list">
              <div className="kv"><b>TIME</b><div><span style={{ font: "600 12px var(--mono), monospace" }}>{fmt(selectedAct.start)} – {fmt(selectedAct.end)}</span></div></div>
              <div className="kv"><b>VENUE</b><div><span className="vchip" style={{ "--vc": VEN[selectedAct.venue]?.c as any }}>{VEN[selectedAct.venue]?.s}</span></div></div>
              <div className="kv"><b>PILLAR</b><div><span className="vchip" style={{ "--vc": PIL[selectedAct.pillar]?.[1] as any }}>{PIL[selectedAct.pillar]?.[0]}</span></div></div>
              <div className="kv"><b>STATUS</b><div><span className={`pill st-${selectedAct.status}`}>{STS[selectedAct.status]?.[0]}</span></div></div>
              {selectedAct.details && <div className="kv"><b>DETAILS</b><div style={{ display: "block" }}>{esc(selectedAct.details)}</div></div>}
              {selectedAct.gear && <div className="kv"><b>GEAR</b><div>{selectedAct.gear.split("·").map((g, i) => <span key={i} className="gear"><Zap size={9} />{esc(g.trim())}</span>)}</div></div>}
            </div>
            <div className="m-row" style={{ padding: "0 16px 16px" }}>
              <button className="abtn" onClick={() => { handleFlag(selectedAct._id); setShowActDrawer(false); }}>
                <Flag size={11} />FLAG ISSUE
              </button>
              <button className="abtn" onClick={() => { setShowActDrawer(false); setActiveView("ops"); }}>
                <LayoutDashboard size={11} />OPEN IN OPS
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── PERSON DRAWER ──────────────────────────────────────── */}
      {showPersonDrawer && selectedPerson && (
        <div className={`overlay ${showPersonDrawer ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setShowPersonDrawer(false); }}>
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="d-head">
              <span className={`avatar av-${selectedPerson.role}`}>{selectedPerson.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{esc(selectedPerson.name)}</h3>
                <div style={{ font: "500 9px var(--mono), monospace", letterSpacing: ".1em", color: "var(--dim)", marginTop: 3, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className={`rchip rl-${selectedPerson.role}`}>{selectedPerson.role}</span>
                  <span>{VEN[selectedPerson.venue]?.s.toUpperCase()}</span>
                  {selectedPerson.linked && <span className="tg-ok"><Check size={10} />{esc(selectedPerson.telegramHandle)}</span>}
                </div>
              </div>
              <button className="xbtn" onClick={() => setShowPersonDrawer(false)}><X size={14} /></button>
            </div>
            <div className="d-list">
              <div className="p-chat-head"><Clock size={11} />DUTIES — DAY {day}</div>
              <div id="pDuties">
                {dayActivities.filter((a) => a.crewLead === selectedPerson._id || a.crewTechs?.includes(selectedPerson._id) || a.crewVols?.includes(selectedPerson._id)).map((a) => (
                  <div key={a._id} className="duty">
                    <span className="dt">{fmt(a.start)}</span>
                    <span className="dn">{esc(a.title)}{a.gear ? <><br /><span className="gear" style={{ display: "inline-flex", marginTop: 3 }}>{esc(a.gear)}</span></> : null}</span>
                    <span className="dv">{VEN[a.venue]?.s} · {STS[a.status]?.[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ─── FLAG MODAL ─────────────────────────────────────────── */}
      {showFlagModal && (
        <div className="overlay center open" onClick={(e) => { if (e.target === e.currentTarget) setShowFlagModal(false); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="m-head">
              <h3>Raise a flag</h3>
              <button className="xbtn" onClick={() => setShowFlagModal(false)}><X size={14} /></button>
            </div>
            {flagActId && (() => {
              const a = activities.find((x) => x._id === flagActId);
              return a ? (
                <div className="m-context">
                  <Film size={14} />
                  <span>{VEN[a.venue]?.s} {fmt(a.start)} · &quot;{esc(a.title)}&quot;</span>
                </div>
              ) : null;
            })()}
            <label className="m-label">SEVERITY</label>
            <div className="sev-row" id="fSevRow">
              {["LOW", "HIGH", "CRITICAL"].map((s) => (
                <button key={s} className={`abtn ${flagSev === s ? `on-${s}` : ""}`} onClick={() => setFlagSev(s)}>{s}</button>
              ))}
            </div>
            <label className="m-label">NOTE</label>
            <textarea
              id="fNote"
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              placeholder="What&apos;s happening, where, and who&apos;s on it?"
            />
            <div className="m-foot">
              <span className="m-hint">Pings the owning venue team on Telegram instantly.</span>
              <button className="abtn primary" onClick={submitFlag}><Flag size={11} />RAISE FLAG</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLAGS DRAWER ───────────────────────────────────────── */}
      {showFlagsDrawer && (
        <div className="overlay right open" onClick={(e) => { if (e.target === e.currentTarget) setShowFlagsDrawer(false); }}>
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="d-head">
              <h3>Flags</h3>
              <span style={{ font: "600 10px var(--mono), monospace", letterSpacing: ".14em", color: "var(--amber)" }}>
                {openFlags} OPEN
              </span>
              <button className="xbtn" onClick={() => setShowFlagsDrawer(false)}><X size={14} /></button>
            </div>
            <div className="d-list" id="fdList">
              {incidents.map((i) => {
                const a = activities.find((x) => x._id === i.actId);
                return (
                  <div key={i._id} className="send-item" style={{ "--pc": i.sev === "CRITICAL" ? "var(--red)" : i.sev === "HIGH" ? "var(--amber)" : "var(--sand)", opacity: i.status === "resolved" ? 0.55 : 1, marginBottom: 8 } as any}>
                    <div className="sh">
                      <span>D{i.day} {i.tm}</span>
                      <span>{i.sev}</span>
                      <span style={{ marginLeft: "auto" }}>{i.status.toUpperCase()}</span>
                    </div>
                    <p>{esc(i.note)}</p>
                    {a && <div className="sh" style={{ marginTop: 6, color: "var(--sand)" }}>
                      ↳ {VEN[a.venue]?.s} · &quot;{esc(a.title)}&quot;
                    </div>}
                    {i.status !== "resolved" && (
                      <div style={{ marginTop: 8 }}>
                        <button className="abtn" onClick={() => resolveFlag(i.id)}>
                          <CheckCheck size={10} />RESOLVE
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!incidents.length && <div className="empty">NO FLAGS — CLEAN BOARD.</div>}
            </div>
          </aside>
        </div>
      )}

      {/* ─── TICKER ─────────────────────────────────────────────── */}
      <footer className="ticker">
        <div className="ticker-track">
          <span className="tk-item"><b>CMIFF OPS BOT</b> · connected · {crew.filter((p) => p.linked).length}/{crew.length} accounts linked · {activities.length} activities loaded</span>
          <span className="tk-sep">///</span>
          <span className="tk-item"><b>DAY {day}</b> · {DAYS[day - 1].d} · {dayActivities.length} slates · {liveCount} on screen</span>
          <span className="tk-sep">///</span>
          {broadcasts.slice(0, 2).map((b) => (
            <span key={b._id} className="tk-item"><b>{b.tm} BROADCAST</b> · {esc(b.txt.slice(0, 60))}</span>
          ))}
        </div>
      </footer>

      {/* ─── TOASTS ─────────────────────────────────────────────── */}
      <div id="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast" style={{ "--tcol": t.col } as any}>
            {t.ic === "play" && <Play size={14} color={t.col} />}
            {t.ic === "square" && <Square size={14} color={t.col} />}
            {t.ic === "flag" && <Flag size={14} color={t.col} />}
            {t.ic === "alert-triangle" && <AlertTriangle size={14} color={t.col} />}
            {t.ic === "rotate-ccw" && <RotateCw size={14} color={t.col} />}
            {t.ic === "check-check" && <CheckCheck size={14} color={t.col} />}
            {t.ic === "check" && <Check size={14} color={t.col} />}
            {t.ic === "megaphone" && <Megaphone size={14} color={t.col} />}
            {t.ic === "clock" && <Clock size={14} color={t.col} />}
            {t.ic === "send" && <Send size={14} color={t.col} />}
            {t.ic === "fast-forward" && <span style={{ fontSize: 10, fontWeight: 700, color: t.col }}>60×</span>}
            <div>
              <b style={{ color: t.col }}>{esc(t.title)}</b>
              <span>{esc(t.msg)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CSS (from prototype) ──────────────────────────────────────────────
const CSS = `
:root{
  --bg:#0F0D0A; --srf:#161310; --srf2:#1E1913; --srf3:#241E16;
  --line:#2C251B; --line2:#3D3423;
  --ink:#F0E8D8; --mut:#9C8F7B; --dim:#6E6353;
  --amber:#EFA33C; --red:#E44D33; --teal:#4FB39A; --sand:#C9B98F; --slate:#8FA3B8; --rose:#D98E7A;
  --mono:'JetBrains Mono',ui-monospace,monospace;
  --ui:'Archivo',sans-serif;
  --disp:'Fraunces',serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scrollbar-width:thin;scrollbar-color:var(--line2) transparent}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:var(--line2);border-radius:4px}
::selection{background:var(--amber);color:#14110B}
:focus-visible{outline:1px solid var(--amber);outline-offset:2px}
body{background:var(--bg);color:var(--ink);font:14px/1.45 var(--ui);padding-bottom:70px}
body::after{content:"";position:fixed;inset:0;z-index:200;pointer-events:none;opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")}
i[data-lucide],svg.lucide{width:14px;height:14px;flex:none}

/* topbar */
#topbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:0 22px;height:66px;background:var(--bg);border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:14px;min-width:0}
.brand-cmiff{font:800 25px/1 var(--disp);letter-spacing:.01em}
.brand-cmiff b{color:var(--amber)}
.brand-rule{width:1px;height:32px;background:var(--line2)}
.brand-stack{display:flex;flex-direction:column;gap:2px}
.brand-stack b{font:700 12px/1 var(--ui);letter-spacing:.22em}
.brand-stack i{font:500 9.5px/1.3 var(--mono);letter-spacing:.07em;color:var(--mut);text-transform:uppercase;white-space:nowrap}
.topbar-right{display:flex;align-items:center;gap:14px}
.sim{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--line);border-radius:4px;background:var(--srf)}
.sim-label{font:700 9px var(--mono);letter-spacing:.18em;color:var(--dim)}
.sim input[type=range]{width:130px;accent-color:var(--amber);height:14px;cursor:ew-resize}
.ghost-btn{font:600 9.5px var(--mono);letter-spacing:.12em;color:var(--mut);background:none;border:1px solid var(--line2);
  border-radius:3px;padding:4px 8px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:5px}
.ghost-btn:hover{color:var(--amber);border-color:var(--amber)}
.ghost-btn.hot{color:var(--red);border-color:var(--red)}
.mode-chip{font:700 9px var(--mono);letter-spacing:.12em;padding:3px 7px;border-radius:3px;border:1px solid;min-width:52px;text-align:center}
.mode-chip.live{color:var(--teal);border-color:var(--teal)}
.mode-chip.sim{color:var(--amber);border-color:var(--amber)}
.clock{font:500 20px/1 var(--mono);letter-spacing:.04em;display:flex;align-items:baseline;white-space:nowrap}
.clock .colon{animation:blink 1s steps(1) infinite;color:var(--amber)}
.clock small{font-size:10px;color:var(--dim);margin-left:6px}
@keyframes blink{50%{opacity:.25}}
.flags-btn{display:flex;align-items:center;gap:7px;font:700 10px var(--mono);letter-spacing:.14em;color:var(--ink);
  background:var(--srf);border:1px solid var(--line2);border-radius:4px;padding:9px 11px;cursor:pointer;transition:.15s}
.flags-btn:hover{border-color:var(--red)}
.flags-btn .badge{font:700 10px var(--mono);background:var(--red);color:#14110B;border-radius:3px;padding:2px 6px;min-width:20px;text-align:center}
.flags-btn .badge.zero{background:var(--line2);color:var(--mut)}

/* tabs */
.tabs{position:sticky;top:66px;z-index:35;display:flex;gap:6px;padding:9px 22px;background:var(--bg);border-bottom:1px solid var(--line);overflow-x:auto}
.tab{font:700 10.5px var(--mono);letter-spacing:.16em;padding:8px 14px;border:1px solid transparent;border-radius:4px;
  color:var(--mut);cursor:pointer;display:flex;gap:8px;align-items:center;transition:.15s;background:none;white-space:nowrap}
.tab:hover{color:var(--ink)}
.tab.on{color:var(--amber);border-color:var(--line2);background:var(--srf)}

/* view */
.view{display:none;padding:18px 22px 0}
.view.on{display:block}

/* generic */
.card{background:var(--srf);border:1px solid var(--line);border-radius:6px;padding:16px 18px}
.card-label{display:flex;align-items:center;gap:8px;font:700 10px var(--mono);letter-spacing:.2em;color:var(--mut);margin-bottom:12px}
.card-label svg{color:var(--amber)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--red);animation:pulse 1.6s ease infinite;flex:none}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(228,77,51,.5)}55%{box-shadow:0 0 0 6px rgba(228,77,51,0)}}
.pill{font:700 8.5px var(--mono);letter-spacing:.12em;padding:3px 7px;border-radius:3px;border:1px solid;white-space:nowrap}
.st-CONF{color:var(--teal);border-color:color-mix(in srgb,var(--teal) 55%,transparent);background:color-mix(in srgb,var(--teal) 8%,transparent)}
.st-TBC{color:var(--amber);border-color:color-mix(in srgb,var(--amber) 55%,transparent);background:color-mix(in srgb,var(--amber) 8%,transparent)}
.st-PEND{color:var(--slate);border-color:color-mix(in srgb,var(--slate) 55%,transparent);background:color-mix(in srgb,var(--slate) 8%,transparent)}
.st-PROG{color:var(--rose);border-color:color-mix(in srgb,var(--rose) 55%,transparent);background:color-mix(in srgb,var(--rose) 8%,transparent)}
.vchip{font:600 9px var(--mono);letter-spacing:.1em;color:var(--vc,var(--sand));border:1px solid color-mix(in srgb,var(--vc,var(--sand)) 45%,transparent);
  border-radius:3px;padding:2.5px 6px;white-space:nowrap}
.rchip{font:600 8.5px var(--mono);letter-spacing:.1em;padding:2.5px 6px;border-radius:3px;border:1px solid;white-space:nowrap}
.rl-LEAD{color:var(--amber);border-color:color-mix(in srgb,var(--amber) 55%,transparent)}
.rl-TECH{color:var(--teal);border-color:color-mix(in srgb,var(--teal) 55%,transparent)}
.rl-VOL{color:var(--sand);border-color:color-mix(in srgb,var(--sand) 50%,transparent)}
.gear{font:600 8.5px var(--mono);letter-spacing:.08em;color:var(--mut);border:1px dashed var(--line2);border-radius:3px;padding:2.5px 6px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
.gear svg{width:9px;height:9px}
.gear.warn{color:var(--rose);border-color:color-mix(in srgb,var(--rose) 50%,transparent)}
.statline{padding:12px 24px 2px;font:500 10px var(--mono);letter-spacing:.13em;color:var(--dim);display:flex;gap:8px;flex-wrap:wrap}
.statline b{color:var(--amber);font-weight:600}
.statline .sep{color:var(--line2)}
.abtn{display:inline-flex;align-items:center;gap:5px;font:600 9.5px var(--mono);letter-spacing:.1em;padding:5px 8px;
  border:1px solid var(--line2);background:transparent;color:var(--mut);border-radius:3px;cursor:pointer;text-transform:uppercase;transition:.15s;white-space:nowrap}
.abtn svg{width:11px;height:11px}
.abtn:hover{color:var(--amber);border-color:var(--amber)}
.abtn.primary{background:var(--amber);border-color:var(--amber);color:#14110B}
.abtn.primary:hover{background:#F7B558;color:#14110B}
.empty{color:var(--dim);font:500 10.5px var(--mono);letter-spacing:.12em;text-align:center;padding:26px 0}
.fchip{font:600 9px var(--mono);letter-spacing:.1em;padding:4px 9px;border-radius:20px;border:1px solid var(--line2);
  background:none;color:var(--dim);cursor:pointer;transition:.15s}
.fchip.on{color:var(--amber);border-color:var(--amber)}
.psel{background:var(--srf2);color:var(--sand);border:1px solid var(--line2);border-radius:4px;font:600 10px var(--mono);letter-spacing:.06em;padding:7px 8px;cursor:pointer}
input.searchbox{background:var(--srf);border:1px solid var(--line2);border-radius:4px;color:var(--ink);font:400 12px var(--ui);padding:7px 10px;width:210px}
input.searchbox:focus{border-color:var(--amber);outline:none}
.daychips{display:flex;gap:4px;flex-wrap:wrap}
.dchip{font:700 10px var(--mono);letter-spacing:.1em;padding:8px 12px;border:1px solid var(--line2);border-radius:4px;
  background:none;color:var(--mut);cursor:pointer;transition:.15s;white-space:nowrap}
.dchip:hover{color:var(--ink)}
.dchip.on{color:#14110B;background:var(--amber);border-color:var(--amber)}

/* program */
.overview{margin-bottom:14px}
.ov-grid{display:grid;grid-template-columns:1.5fr .8fr 1.3fr 1fr;gap:20px}
.ovk{display:block;font:700 8.5px var(--mono);letter-spacing:.2em;color:var(--dim);margin-bottom:6px}
.ov-grid b{display:block;font:550 15px/1.3 var(--disp)}
.ovs{display:block;font:400 10.5px/1.5 var(--ui);color:var(--mut);margin-top:3px}
.ovv{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
@media(max-width:1000px){.ov-grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.ov-grid{grid-template-columns:1fr}}
.prog-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px}
.prog-head{display:flex;align-items:baseline;gap:14px;margin:4px 0 12px;flex-wrap:wrap}
.prog-head h2{font:550 22px var(--disp)}
.prog-head .cnt{font:500 9.5px var(--mono);letter-spacing:.12em;color:var(--dim)}
.ptable{border:1px solid var(--line);border-radius:6px;background:var(--srf);overflow:hidden}
.phead,.prow{display:grid;grid-template-columns:112px minmax(0,1fr) 118px 158px 108px 128px;gap:12px;align-items:start;padding:10px 14px}
.phead{font:700 8.5px var(--mono);letter-spacing:.18em;color:var(--dim);border-bottom:1px solid var(--line2);background:var(--srf2)}
.prow{border-bottom:1px solid var(--line);cursor:pointer;transition:.12s}
.prow:last-child{border-bottom:none}
.prow:hover{background:var(--srf2)}
.prow.st-live{background:#1B1510;box-shadow:inset 3px 0 0 var(--red)}
.prow.quiet{opacity:.55}
.pc-time{font:600 11.5px var(--mono);color:var(--ink);display:flex;flex-direction:column;gap:1px;padding-top:2px}
.pc-time span{color:var(--dim);font-weight:500;font-size:9.5px}
.pc-time em{font:600 9px var(--mono);font-style:normal;color:var(--amber)}
.pc-time .ld{width:7px;height:7px;border-radius:50%;background:var(--red);display:inline-block;animation:pulse 1.6s infinite;margin-top:3px}
.pt{font:600 13px/1.35 var(--ui);display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.pd{font:400 11px/1.5 var(--ui);color:var(--mut);margin-top:3px}
.pg{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
.pc-venue,.pc-pill,.pc-stat{padding-top:3px}
.pc-crew{font:500 10px/1.5 var(--mono);color:var(--mut);padding-top:4px}
.pc-crew b{font-weight:700}
.pc-crew .tN{color:var(--teal)}
.pc-crew .vN{color:var(--sand)}
.keyline{display:flex;gap:16px;flex-wrap:wrap;padding:10px 2px 0;font:500 9px var(--mono);letter-spacing:.08em;color:var(--dim)}
.keyline span{display:inline-flex;gap:6px;align-items:center}
@media(max-width:1020px){.phead,.prow{grid-template-columns:100px minmax(0,1fr) 106px 104px}.pc-pill,.pc-crew{display:none}}
@media(max-width:660px){.phead{display:none}.prow{grid-template-columns:86px minmax(0,1fr)}.pc-venue,.pc-stat{display:none}}

/* ops */
.ops-grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:20px;align-items:start}
.rail{display:flex;flex-direction:column;gap:14px;position:sticky;top:126px}
.slot{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:13px;padding:11px 13px;border:1px solid var(--line);
  border-radius:5px;background:var(--srf);margin-bottom:6px;transition:.15s}
.slot:hover{background:var(--srf2);border-color:var(--line2)}
.slot.st-live{border-left:3px solid var(--red);background:#1B1510}
.slot.is-next{border-left:3px solid var(--amber)}
.slot.st-done,.slot.st-past{opacity:.6}
.slot.quiet{opacity:.5;background:transparent}
.slot-time{font:600 12px var(--mono);display:flex;flex-direction:column;gap:2px;padding-top:2px}
.slot-time .t{color:var(--ink)}
.slot-time .te{color:var(--dim);font-weight:500;font-size:10px}
.slot-time .t-shift{color:var(--amber);font-size:10px}
.slot-title{font:600 14px/1.3 var(--ui)}
.slot-meta{display:flex;flex-wrap:wrap;gap:5px 7px;align-items:center;margin-top:5px}
.slot-detail{font:400 11px/1.45 var(--ui);color:var(--mut);margin-top:5px}
.slot-crew{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:6px;font:500 9.5px var(--mono);letter-spacing:.04em;color:var(--mut)}
.slot-crew b{font-weight:700}
.slot-crew .cl b{color:var(--amber)}
.slot-crew .ct b{color:var(--teal)}
.slot-crew .cv b{color:var(--sand)}
.slot-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;justify-content:space-between}
.chip{font:600 9px var(--mono);letter-spacing:.12em;padding:4px 8px;border:1px solid var(--line2);border-radius:3px;color:var(--mut);text-transform:uppercase;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.chip .live-dot{width:6px;height:6px}
.chip.live{color:var(--red);border-color:var(--red)}
.chip.next{color:var(--amber);border-color:var(--amber)}
.slot-actions{display:flex;gap:6px;opacity:0;transition:.15s;flex-wrap:wrap;justify-content:flex-end}
.slot:hover .slot-actions,.slot:focus-within .slot-actions{opacity:1}
@media (hover:none){.slot-actions{opacity:1}}
.nowline{display:flex;align-items:center;gap:12px;padding:4px 2px;margin:2px 0}
.nowline .nl-tag{font:700 9px var(--mono);letter-spacing:.2em;color:var(--bg);background:var(--amber);padding:3px 7px;border-radius:2px}
.nowline .nl-line{flex:1;border-top:1px dashed color-mix(in srgb,var(--amber) 55%,transparent)}
.nowline .nl-t{font:600 10.5px var(--mono);color:var(--amber)}

/* hero / now */
.now-item{padding:10px 0;border-top:1px solid var(--line)}
.now-item:first-child{border-top:none;padding-top:2px}
.ni-top{display:flex;align-items:center;gap:9px;font:500 9.5px var(--mono);letter-spacing:.09em;color:var(--mut)}
.ni-clock{margin-left:auto;color:var(--sand)}
.ni-title{font:550 19px/1.2 var(--disp);margin:6px 0 3px}
.ni-prog{display:flex;align-items:center;gap:12px;margin-top:9px}
.bar{flex:1;height:3px;background:var(--line);border-radius:2px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--red);width:0%}
.tc{font:500 10px var(--mono);letter-spacing:.06em;color:var(--sand);white-space:nowrap}
.now-empty{display:flex;flex-direction:column;gap:7px;padding:14px 0 8px;color:var(--mut)}
.now-empty svg{width:18px;height:18px;color:var(--amber)}
.now-empty b{font:550 17px var(--disp);color:var(--ink)}
.now-empty span{font:500 10px var(--mono);letter-spacing:.06em}
.leader-wrap{position:relative;width:168px;height:168px;margin:0 auto 6px}
.leader-wrap svg{width:100%;height:100%;display:block}
.leader-readout{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:none}
.leader-readout b{font:600 33px/1 var(--disp);font-variant-numeric:tabular-nums}
.leader-readout span{font:600 8px var(--mono);letter-spacing:.26em;color:var(--dim)}
.next-meta{text-align:center;border-top:1px solid var(--line);padding-top:10px}
.nm-title{font:550 15px/1.3 var(--disp);font-style:italic}
.nm-sub{font:500 9.5px var(--mono);letter-spacing:.1em;color:var(--mut);margin-top:5px;display:flex;justify-content:center;gap:7px;flex-wrap:wrap}

/* crew */
.crew-filter{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.crew-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:10px}
.pcard{border:1px solid var(--line);border-radius:6px;background:var(--srf);padding:13px;cursor:pointer;display:flex;flex-direction:column;gap:9px;transition:.15s}
.pcard:hover{border-color:var(--line2);background:var(--srf2)}
.pc-top{display:flex;gap:10px;align-items:center}
.avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 12px var(--mono);
  border:1px solid var(--line2);flex:none}
.av-LEAD{color:var(--amber);background:color-mix(in srgb,var(--amber) 10%,var(--srf3))}
.av-TECH{color:var(--teal);background:color-mix(in srgb,var(--teal) 10%,var(--srf3))}
.av-VOL{color:var(--sand);background:color-mix(in srgb,var(--sand) 10%,var(--srf3))}
.pc-name{font:600 13.5px var(--ui)}
.pc-sub{font:500 9px var(--mono);letter-spacing:.08em;color:var(--dim);margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.tg-ok{color:var(--teal);display:inline-flex;align-items:center;gap:4px}
.tg-no{color:var(--amber);display:inline-flex;align-items:center;gap:4px}
.pc-next{border-top:1px solid var(--line);padding-top:8px;font:500 10px var(--mono);letter-spacing:.05em;color:var(--mut);display:flex;justify-content:space-between;gap:8px}
.pc-duty{font:500 9.5px var(--mono);color:var(--dim)}
.pc-duty b{color:var(--sand)}

/* bot */
.bot-grid{display:grid;grid-template-columns:330px minmax(0,1fr);gap:20px;align-items:start}
.rule{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)}
.rule:first-of-type{border-top:none;padding-top:2px}
.sw{width:32px;height:17px;border-radius:10px;border:1px solid var(--line2);position:relative;flex:none;margin-top:2px;cursor:pointer;background:none;transition:.15s}
.sw i{position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:var(--dim);transition:.15s}
.sw.on{border-color:var(--teal)}
.sw.on i{left:16px;background:var(--teal)}
.rl-main{flex:1;min-width:0}
.rl-name{font:700 10px var(--mono);letter-spacing:.12em;color:var(--ink);display:flex;align-items:center;gap:7px}
.rl-name svg{color:var(--teal);width:12px;height:12px}
.rl-name .rc{margin-left:auto;color:var(--dim);font-weight:500}
.rl-blurb{font:400 10.5px/1.5 var(--ui);color:var(--mut);margin-top:3px}
.ai-note{margin-top:12px;border-top:1px solid var(--line);padding-top:12px;font:400 10.5px/1.6 var(--ui);color:var(--mut)}
.ai-note b{color:var(--sand);font-weight:600}
#botList{display:flex;flex-direction:column;gap:9px;max-height:calc(100vh - 240px);overflow-y:auto;padding-right:4px}
.bub{display:flex;gap:10px;border:1px solid var(--line);border-left:3px solid var(--bc,var(--teal));border-radius:6px;background:var(--srf);padding:10px 12px;animation:tin .2s ease}
.bub.k-admin{--bc:var(--amber)}
.bav{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 10px var(--mono);flex:none;margin-top:2px;border:1px solid var(--line2)}
.bav.bot{color:var(--teal);background:color-mix(in srgb,var(--teal) 12%,var(--srf3))}
.bav.adm{color:var(--amber);background:color-mix(in srgb,var(--amber) 12%,var(--srf3))}
.bmain{flex:1;min-width:0}
.bhead{display:flex;align-items:center;gap:8px;font:700 10px var(--mono);letter-spacing:.06em;flex-wrap:wrap}
.bhead .who{color:var(--ink)}
.bhead .hdl{color:var(--dim);font-weight:500}
.bhead .bt{margin-left:auto;color:var(--dim);font-weight:500}
.btext{white-space:pre-line;font:400 12.5px/1.55 var(--ui);color:var(--ink);margin-top:5px}
.bctx{margin-top:7px;font:600 8.5px var(--mono);letter-spacing:.1em;color:var(--sand);display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.bbtns{display:flex;gap:6px;margin-top:9px}
.bub .acked{font:600 9px var(--mono);letter-spacing:.1em;color:var(--teal);display:inline-flex;gap:5px;align-items:center}
.bfoot{margin-top:7px;font:500 8px var(--mono);letter-spacing:.14em;color:var(--dim)}

/* admin */
.admin-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}
.ai-upload-card{grid-column:1 / -1}
#aiUploadText{width:100%;background:var(--srf2);border:1px solid var(--line2);border-radius:5px;color:var(--ink);
  font:400 13px/1.5 var(--ui);padding:11px 12px;resize:vertical;min-height:120px;margin-top:6px}
#aiUploadText:focus{border-color:var(--amber);outline:none}
.aud-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.aud-row .recip{font:600 9.5px var(--mono);letter-spacing:.1em;color:var(--teal);margin-left:auto}
#adminText{width:100%;background:var(--srf2);border:1px solid var(--line2);border-radius:5px;color:var(--ink);
  font:400 13px/1.5 var(--ui);padding:11px 12px;resize:vertical;min-height:88px;margin-top:12px}
#adminText:focus{border-color:var(--amber);outline:none}
.ai-drafted{border:1px dashed color-mix(in srgb,var(--teal) 55%,transparent);border-radius:5px;background:color-mix(in srgb,var(--teal) 6%,transparent);
  padding:10px 12px;margin-top:10px;font:400 12.5px/1.55 var(--ui);color:var(--ink);white-space:pre-line}
.ai-drafted .tag{font:700 8.5px var(--mono);letter-spacing:.16em;color:var(--teal);display:block;margin-bottom:5px}
.m-row{display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap}
.acct{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid var(--line)}
.acct:first-of-type{border-top:none}
.acct .an{font:600 12px var(--ui)}
.acct .ah{font:500 9px var(--mono);color:var(--dim);margin-top:2px}
.sends{display:flex;flex-direction:column;gap:8px;margin-top:12px;max-height:340px;overflow-y:auto}
.send-item{border:1px solid var(--line);border-left:3px solid var(--pc,var(--amber));border-radius:5px;background:var(--srf2);padding:9px 11px}
.send-item .sh{display:flex;gap:8px;align-items:center;font:700 9px var(--mono);letter-spacing:.1em;color:var(--dim);flex-wrap:wrap}
.send-item .sh .to{color:var(--sand)}
.send-item p{font:400 12px/1.5 var(--ui);margin-top:5px;white-space:pre-line}

/* overlays */
.overlay{position:fixed;inset:0;z-index:60;background:rgba(10,8,5,.6);backdrop-filter:blur(2px);display:none}
.overlay.open{display:flex}
.overlay.center{align-items:center;justify-content:center}
.overlay.right{justify-content:flex-end}
.modal{width:min(460px,94vw);background:var(--srf);border:1px solid var(--line2);border-radius:8px;padding:20px 22px;max-height:90vh;overflow-y:auto}
.m-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.m-head h3{font:550 21px var(--disp)}
.m-context{display:flex;align-items:center;gap:8px;font:500 10.5px var(--mono);letter-spacing:.05em;color:var(--sand);
  background:var(--srf2);border:1px solid var(--line);border-radius:4px;padding:8px 10px;margin-bottom:14px}
.m-label{display:block;font:700 9px var(--mono);letter-spacing:.2em;color:var(--dim);margin:14px 0 7px}
.sev-row{display:flex;gap:6px}
.sev-row .abtn{flex:1;justify-content:center;padding:8px}
.sev-row .abtn.on-LOW{color:var(--sand);border-color:var(--sand);background:color-mix(in srgb,var(--sand) 12%,transparent)}
.sev-row .abtn.on-HIGH{color:var(--amber);border-color:var(--amber);background:color-mix(in srgb,var(--amber) 12%,transparent)}
.sev-row .abtn.on-CRITICAL{color:var(--red);border-color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent)}
#fNote{width:100%;background:var(--srf2);border:1px solid var(--line2);border-radius:5px;color:var(--ink);
  font:400 13px/1.5 var(--ui);padding:10px 12px;resize:vertical;min-height:70px}
#fNote:focus{border-color:var(--amber);outline:none}
.m-foot{display:flex;align-items:center;gap:12px;margin-top:16px}
.m-hint{font:400 10.5px var(--ui);color:var(--dim);flex:1}
.drawer{width:min(440px,94vw);height:100%;background:var(--srf);border-left:1px solid var(--line2);display:flex;flex-direction:column;animation:slidein .22s ease}
@keyframes slidein{from{transform:translateX(30px);opacity:.4}}
.d-head{display:flex;align-items:flex-start;gap:12px;padding:15px 18px;border-bottom:1px solid var(--line)}
.d-head h3{font:550 18px/1.3 var(--disp)}
.d-head .xbtn{margin-left:auto}
.d-list{flex:1;overflow-y:auto;padding:14px 16px}
.kv{display:flex;gap:10px;padding:8px 0;border-top:1px solid var(--line);font:400 12px/1.5 var(--ui)}
.kv:first-of-type{border-top:none}
.kv b{flex:none;width:92px;font:700 8.5px var(--mono);letter-spacing:.14em;color:var(--dim);padding-top:3px}
.kv>div{flex:1;min-width:0;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.crewrow{display:flex;align-items:center;gap:9px;padding:6px 0;border-top:1px solid var(--line);cursor:pointer}
.crewrow:hover{background:var(--srf2)}
.crewrow .avatar{width:28px;height:28px;font-size:9.5px}
.crewrow .cn{font:600 12px var(--ui)}
.crewrow .ch{font:500 9px var(--mono);color:var(--dim)}
.am{font:400 11.5px/1.5 var(--ui);border-top:1px solid var(--line);padding:8px 0;color:var(--ink)}
.am b{font:700 9.5px var(--mono);color:var(--teal);margin-right:6px}
.p-chat-head{font:700 9px var(--mono);letter-spacing:.2em;color:var(--dim);margin:16px 0 8px;display:flex;align-items:center;gap:7px}
.p-chat-head:first-child{margin-top:0}
.duty{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-top:1px solid var(--line);font:400 12px var(--ui)}
.duty:first-child{border-top:none}
.duty .dt{font:600 10px var(--mono);color:var(--sand);flex:none;width:86px}
.duty .dn{flex:1;min-width:0}
.duty .dv{font:500 9px var(--mono);color:var(--dim);flex:none}

/* ticker */
.ticker{position:fixed;left:0;right:0;bottom:0;height:34px;background:#131009;border-top:1px solid var(--line);overflow:hidden;z-index:45;display:flex;align-items:center}
.ticker::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,#221C13 0 9px,transparent 9px 24px)}
.ticker-track{display:flex;white-space:nowrap;width:max-content;animation:tk 52s linear infinite;font:500 10px var(--mono);letter-spacing:.05em;color:var(--mut)}
.ticker:hover .ticker-track{animation-play-state:paused}
@keyframes tk{to{transform:translateX(-50%)}}
.tk-item{padding:0 10px}
.tk-item b{color:var(--sand);font-weight:600}
.tk-sep{color:var(--amber);opacity:.7;padding:0 4px}

/* toasts */
#toasts{position:fixed;right:16px;bottom:46px;z-index:80;display:flex;flex-direction:column;gap:8px;width:310px}
.toast{display:flex;gap:10px;align-items:flex-start;background:var(--srf3);border:1px solid var(--line2);
  border-left:3px solid var(--tcol,var(--amber));border-radius:5px;padding:10px 12px;animation:tin .22s ease;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.toast svg{color:var(--tcol,var(--amber));margin-top:1px}
.toast b{display:block;font:700 9.5px var(--mono);letter-spacing:.13em;color:var(--tcol,var(--amber))}
.toast span{font:400 12px/1.4 var(--ui);color:var(--ink)}
@keyframes tin{from{transform:translateY(8px);opacity:0}}
.toast.out{opacity:0;transform:translateY(6px);transition:.25s}

/* print */
@media print{
  #topbar,.tabs,.ticker,#toasts,.overlay,.statline,.prog-controls,.rail{display:none!important}
  body{background:#fff;color:#000;padding:0}
  body::after{display:none}
  .view{display:none!important}
  .view.on{display:block!important;padding:0}
  .card,.ptable,.prow{background:#fff!important;border-color:#bbb!important;color:#000!important;box-shadow:none!important}
  .phead{background:#eee!important;color:#000!important}
  .pt,.pd,.pc-time,.pc-crew,.ov-grid b,.ovs{color:#000!important}
  .vchip,.pill,.gear,.rchip{color:#222!important;border-color:#888!important;background:#fff!important}
  .prow.st-live,.prow.is-next{box-shadow:inset 3px 0 0 #000!important;background:#fff!important}
}

@media (max-width:1100px){
  .ops-grid,.bot-grid,.admin-grid{grid-template-columns:1fr}
  .rail{position:static}
  .brand-stack{display:none}
  .prog-controls input.searchbox{margin-left:0}
}
@media (max-width:900px){
  .ops-grid .rail{position:static}
}
@media (max-width:768px){
  /* ── Topbar ── */
  #topbar{padding:0 12px;height:56px;gap:10px}
  .brand-cmiff{font-size:20px}
  .brand-rule{display:none}
  .topbar-right{gap:8px}
  .sim{padding:4px 8px;gap:5px}
  .sim input[type=range]{width:80px}
  .ghost-btn{padding:3px 6px;font-size:9px}
  .flags-btn{padding:6px 8px;font-size:9px;gap:5px}
  .flags-btn svg{width:12px;height:12px}
  .clock{font-size:16px}
  .clock small{font-size:8px;margin-left:3px}

  /* ── Tabs ── */
  .tabs{top:56px;padding:7px 12px;gap:4px}
  .tab{padding:7px 10px;font-size:9.5px;letter-spacing:.1em;gap:5px}

  /* ── Views ── */
  .view{padding:12px 12px 0}

  /* ── Program table ── */
  .phead,.prow{grid-template-columns:80px minmax(0,1fr) 90px 90px}
  .pc-pill,.pc-stat{display:none}

  /* ── Ops slots ── */
  .slot{grid-template-columns:1fr;gap:8px}
  .slot-side{flex-direction:row;align-items:center;justify-content:space-between}
  .slot-actions{opacity:1}
  .leader-wrap{width:120px;height:120px}
  .leader-readout b{font-size:24px}

  /* ── Bot view ── */
  .bot-grid{grid-template-columns:1fr}
  #botList{max-height:calc(100vh - 280px)}

  /* ── Admin view ── */
  .admin-grid{grid-template-columns:1fr}

  /* ── Crew grid ── */
  .crew-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}

  /* ── Toasts ── */
  #toasts{right:8px;bottom:44px;width:calc(100vw - 16px);max-width:300px}
  .toast{padding:8px 10px}

  /* ── Statline ── */
  .statline{padding:8px 12px 2px;font-size:9px}
}
@media (max-width:480px){
  /* ── Topbar stacked ── */
  #topbar{flex-wrap:wrap;height:auto;padding:8px 10px;gap:6px}
  .brand{gap:8px}
  .brand-cmiff{font-size:18px}
  .topbar-right{width:100%;justify-content:space-between;flex-wrap:wrap;gap:6px}
  .sim{flex:1;min-width:0}
  .sim input[type=range]{flex:1;min-width:60px;max-width:100px}

  /* ── Tabs full-width chips ── */
  .tabs{top:unset;position:relative;padding:6px 10px}
  .tab{flex:1;justify-content:center;font-size:9px;padding:6px 6px}

  /* ── Views ── */
  .view{padding:10px 10px 0}
  .prog-head h2{font-size:16px}
  .prog-head .cnt{font-size:8px}

  /* ── Program table mobile cards ── */
  .phead{display:none}
  .prow{grid-template-columns:1fr;gap:4px;padding:10px 12px}
  .pc-time{font-size:11px}
  .pc-act{margin-top:2px}
  .pt{font-size:12px}
  .pd{font-size:10px}
  .pg{margin-top:4px}
  .pc-venue .vchip{margin-right:4px}
  .keyline{font-size:8px;gap:10px}

  /* ── Ops slot full block ── */
  .slot{padding:10px}
  .slot-title{font-size:13px}
  .slot-meta{gap:4px 6px}
  .slot-detail{font-size:10px}
  .slot-crew{font-size:9px}
  .slot-side{flex-wrap:wrap}

  /* ── Crew grid single column ── */
  .crew-grid{grid-template-columns:1fr}
  .pcard{padding:10px}
  .pc-name{font-size:12px}

  /* ── Bot bubbles stacked ── */
  .bub{flex-direction:column}
  .bav{margin-top:0}
  #botList{max-height:calc(100vh - 300px)}

  /* ── Admin selects full-width ── */
  .aud-row{flex-direction:column;align-items:stretch}
  .aud-row .psel{flex:1}
  .aud-row .recip{margin-left:0;text-align:center}

  /* ── Ticker smaller ── */
  .ticker{height:28px}
  .ticker-track{font-size:9px}
  .tk-item{padding:0 6px}

  /* ── Toasts full width ── */
  #toasts{right:6px;bottom:34px;width:calc(100vw - 12px);max-width:none}
  .toast{padding:8px 10px;gap:8px}
  .toast svg{width:14px;height:14px}
  .toast b{font-size:9px}
  .toast span{font-size:11px}

  /* ── Modal full screen on small phones ── */
  .modal{width:100vw;padding:16px;max-height:95vh}
  .m-head h3{font-size:18px}

  /* ── Drawer full screen ── */
  .drawer{width:100vw}

  /* ── Overview grid ── */
  .ov-grid{gap:12px}
  .ov-grid b{font-size:13px}
  .ovs{font-size:9px}
}
`;
