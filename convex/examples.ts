import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Seed data from the prototype + real PDF/Excel data
const VEN = {
  arena:  { n: "Beach Sports Arena", s: "ARENA", c: "#C9B98F" },
  hub:    { n: "Learn & Connect Hub", s: "HUB", c: "#4FB39A" },
  tent:   { n: "Film Screening Tent", s: "TENT", c: "#EFA33C" },
  theatre: { n: "Theatre & Spoken Word Stage", s: "THTR", c: "#D98E7A" },
  main:   { n: "Main Stage", s: "MAIN", c: "#C77DA8" },
  dj:     { n: "DJ Lounge / Sundowner Deck", s: "DJ", c: "#8FA3B8" },
  bonfire: { n: "Beach & Bonfire", s: "FIRE", c: "#E4795B" },
};

const PIL = {
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

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Crew
    const crew = [
      { name: "Grace Banda", role: "LEAD", venue: "arena", telegramHandle: "@grace_banda", linked: false, token: "cmiff-grace" },
      { name: "Timothy Mvula", role: "LEAD", venue: "hub", telegramHandle: "@t_mvula", linked: false, token: "cmiff-timothy" },
      { name: "Alinafe Chirwa", role: "LEAD", venue: "tent", telegramHandle: "@alinafe.c", linked: false, token: "cmiff-alinafe" },
      { name: "Dalitso Nkhoma", role: "LEAD", venue: "theatre", telegramHandle: "@dalitso_n", linked: false, token: "cmiff-dalitso" },
      { name: "Chisomo Phiri", role: "LEAD", venue: "main", telegramHandle: "@chisomo_p", linked: false, token: "cmiff-chisomo" },
      { name: "Yamikani Jere", role: "LEAD", venue: "dj", telegramHandle: "@yamijere", linked: false, token: "cmiff-yamikani" },
      { name: "Tiwonge Kasonda", role: "LEAD", venue: "bonfire", telegramHandle: "@tiwonge.k", linked: false, token: "cmiff-tiwonge" },
      { name: "Peter Gondwe", role: "TECH", venue: "arena", telegramHandle: "@pgondwe", linked: false, token: "cmiff-peter" },
      { name: "Memory Kaunda", role: "TECH", venue: "hub", telegramHandle: "@memory.k", linked: false, token: "cmiff-memory" },
      { name: "Fletcher Mwale", role: "TECH", venue: "tent", telegramHandle: "@fletch.mw", linked: false, token: "cmiff-fletcher" },
      { name: "Hillary Nyondo", role: "TECH", venue: "tent", telegramHandle: "@hillaryn", linked: false, token: "cmiff-hillary" },
      { name: "Tapiwa Msowoya", role: "TECH", venue: "theatre", telegramHandle: "@tapiwa.s", linked: false, token: "cmiff-tapiwa" },
      { name: "Blessings Chavula", role: "TECH", venue: "main", telegramHandle: "@blessc", linked: false, token: "cmiff-blessings" },
      { name: "Ernest Kalonga", role: "TECH", venue: "main", telegramHandle: "@ernestk", linked: false, token: "cmiff-ernest" },
      { name: "Kingston Mbewe", role: "TECH", venue: "dj", telegramHandle: "@kingston.mb", linked: false, token: "cmiff-kingston" },
      { name: "Lameck Zimba", role: "TECH", venue: "bonfire", telegramHandle: "@lameck.z", linked: false, token: "cmiff-lameck" },
      { name: "Lucky Njala", role: "VOL", venue: "arena", telegramHandle: "@luckynjala", linked: false, token: "cmiff-lucky" },
      { name: "Sabrina Otto", role: "VOL", venue: "arena", telegramHandle: "@sabrinaotto", linked: false, token: "cmiff-sabrina" },
      { name: "Dex Mtambo", role: "VOL", venue: "arena", telegramHandle: "@dexmtambo", linked: false, token: "cmiff-dex" },
      { name: "Wongani Simbi", role: "VOL", venue: "hub", telegramHandle: "@wongani", linked: false, token: "cmiff-wongani" },
      { name: "Faith Kondowe", role: "VOL", venue: "hub", telegramHandle: "@faithk", linked: false, token: "cmiff-faith" },
      { name: "Stella Kachala", role: "VOL", venue: "tent", telegramHandle: "@stellak", linked: false, token: "cmiff-stella" },
      { name: "Moses Kamanga", role: "VOL", venue: "tent", telegramHandle: "@moseskam", linked: false, token: "cmiff-moses" },
      { name: "Chikondi Namanja", role: "VOL", venue: "theatre", telegramHandle: "@chikondin", linked: false, token: "cmiff-chikondi" },
      { name: "Praise Nyasulu", role: "VOL", venue: "theatre", telegramHandle: "@praisen", linked: false, token: "cmiff-praise" },
      { name: "Gift Zamadenga", role: "VOL", venue: "main", telegramHandle: "@giftz", linked: false, token: "cmiff-gift" },
      { name: "Esnat Maulidi", role: "VOL", venue: "main", telegramHandle: "@esnatm", linked: false, token: "cmiff-esnat" },
      { name: "Bright Chilenje", role: "VOL", venue: "main", telegramHandle: "@brightc", linked: false, token: "cmiff-bright" },
      { name: "Kettie Mwalabu", role: "VOL", venue: "dj", telegramHandle: "@kettie.m", linked: false, token: "cmiff-kettie" },
      { name: "Zione Kalenga", role: "VOL", venue: "bonfire", telegramHandle: "@zione", linked: false, token: "cmiff-zione" },
      { name: "Madalo Chirwa", role: "VOL", venue: "bonfire", telegramHandle: "@madalo", linked: false, token: "cmiff-madalo" },
    ];

    for (const c of crew) {
      const id = await ctx.db.generateId();
      await ctx.db.insert("crew_members", { ...c, linked: false, telegramChatId: undefined });
    }

    // Activities
    const activities = [
      // DAY 1
      { day: 1, start: 360, end: 380, title: "Registration & Participant Check-in", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
      { day: 1, start: 380, end: 395, title: "Warm-up & Safety Briefing", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
      { day: 1, start: 395, end: 435, title: "Beach Volleyball · Soccer (heats) · Canoeing · Kayaking · Swimming · Pool Billiards", venue: "arena", pillar: "sports", status: "TBC", details: "Team & individual activities run concurrently", gear: "", quiet: false },
      { day: 1, start: 435, end: 445, title: "Transition / Hydration Break", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: true },
      { day: 1, start: 445, end: 485, title: "Beach Soccer · Tug-of-War · Sack Race · Arm Wrestling · Darts · Chess · Draughts", venue: "arena", pillar: "sports", status: "TBC", details: "Team & individual activities run concurrently", gear: "", quiet: false },
      { day: 1, start: 510, end: 540, title: "Registration & Orientation", venue: "hub", pillar: "learn", status: "CONF", details: "Welcome, participant registration, programme overview & grouping", gear: "", quiet: false },
      { day: 1, start: 570, end: 630, title: "Training Workshop: Storytelling & Scriptwriting", venue: "hub", pillar: "learn", status: "TBC", details: "From idea to script: story structure, character development, writing for the screen — Facilitator: Mr Moyo (FAMA)", gear: "", quiet: false },
      { day: 1, start: 630, end: 650, title: "Film Screening — Opening Shorts, Slot 1", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
      { day: 1, start: 650, end: 670, title: "Film Screening — Opening Shorts, Slot 2", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
      { day: 1, start: 670, end: 730, title: "Connect: Meet the Industry", venue: "hub", pillar: "connect", status: "PEND", details: "Selected industry practitioners share career journeys and practical advice", gear: "", quiet: false },
      { day: 1, start: 735, end: 750, title: "Lunch Break", venue: "hub", pillar: "general", status: "CONF", details: "", gear: "", quiet: true },
      { day: 1, start: 750, end: 810, title: "Panel Discussion: Cultural Authenticity as Competitive Edge", venue: "hub", pillar: "learn", status: "TBC", details: "Facilitator: Mr Odala Banda", gear: "", quiet: false },
      { day: 1, start: 960, end: 1020, title: "DJ Set: DJ Vee", venue: "dj", pillar: "music", status: "TBC", details: "2 hours", gear: "", quiet: false },
      { day: 1, start: 1020, end: 1080, title: "Live Performance: The Black Missionaries", venue: "main", pillar: "music", status: "CONF", details: "1 hour · 3 + band", gear: "", quiet: false },
      { day: 1, start: 1080, end: 1140, title: "Film Screening — Evening Feature, Slot 1", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
      { day: 1, start: 1200, end: 1320, title: "DJ Set: DJ HashTag", venue: "dj", pillar: "music", status: "TBC", details: "2 hours", gear: "", quiet: false },

      // DAY 2
      { day: 2, start: 360, end: 380, title: "Registration & Participant Check-in", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
      { day: 2, start: 380, end: 395, title: "Warm-up & Safety Briefing", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
      { day: 2, start: 600, end: 720, title: "Training Workshop: Camera", venue: "hub", pillar: "learn", status: "TBC", details: "Camera handling, framing & composition — Facilitator: Mr Laluh", gear: "", quiet: false },
      { day: 2, start: 975, end: 1025, title: "Live Performance: Driemo", venue: "main", pillar: "music", status: "TBC", details: "1 hour · 1 + band", gear: "", quiet: false },
      { day: 2, start: 1200, end: 1380, title: "DJ Set: DJ Flame", venue: "dj", pillar: "music", status: "CONF", details: "3 hours", gear: "", quiet: false },

      // DAY 3
      { day: 3, start: 360, end: 380, title: "Registration & Participant Check-in", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
      { day: 3, start: 380, end: 395, title: "Warm-up & Safety Briefing", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
      { day: 3, start: 540, end: 630, title: "Panel Discussion: Future of African Film — AI, Mobile Filmmaking", venue: "hub", pillar: "learn", status: "TBC", details: "Facilitator: Mr Laluh", gear: "", quiet: false },
      { day: 3, start: 1140, end: 1230, title: "Masterclass: Professional Pathways in Film & TV", venue: "hub", pillar: "learn", status: "PEND", details: "Proposed partner: MultiChoice", gear: "", quiet: false },
      { day: 3, start: 1140, end: 1200, title: "Film Screening — Morning Shorts", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
      { day: 3, start: 1200, end: 1260, title: "Film Screening — Afternoon Feature", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
      { day: 3, start: 1140, end: 1260, title: "DJ Set: DJ Clame", venue: "dj", pillar: "music", status: "TBC", details: "3 hours", gear: "", quiet: false },
      { day: 3, start: 1200, end: 1290, title: "Live Performance: Keturah", venue: "main", pillar: "music", status: "CONF", details: "45 minutes", gear: "", quiet: false },
      { day: 3, start: 1290, end: 1350, title: "Live Performance: Lucky Stars Band", venue: "main", pillar: "music", status: "CONF", details: "35 minutes", gear: "", quiet: false },
      { day: 3, start: 1350, end: 1410, title: "Live Performance: King Bandana", venue: "main", pillar: "music", status: "TBC", details: "30 minutes", gear: "", quiet: false },
      { day: 3, start: 1410, end: 1470, title: "Live Performance: CeeBee265", venue: "main", pillar: "music", status: "TBC", details: "35 minutes", gear: "", quiet: false },
      { day: 3, start: 1470, end: 1530, title: "Live Performance: Evans Mapfumo (Zimbabwe)", venue: "main", pillar: "music", status: "CONF", details: "50 minutes", gear: "", quiet: false },
      { day: 3, start: 1530, end: 1620, title: "DJ Set: DJ West", venue: "dj", pillar: "music", status: "TBC", details: "3 hours — runs into the early hours of 18 Oct", gear: "", quiet: false },
      { day: 3, start: 1140, end: 1200, title: "Certificates & Closing Ceremony", venue: "hub", pillar: "learn", status: "CONF", details: "Certificate of Completion awards, participant feedback, group photo", gear: "", quiet: false },
    ];

    for (const a of activities) {
      const id = await ctx.db.generateId();
      await ctx.db.insert("activities", { ...a, _id: id });
    }

    return { crew: crew.length, activities: activities.length };
  },
});

export const getCrew = query({
  handler: async (ctx) => {
    return await ctx.db.query("crew_members").collect();
  },
});

export const getActivities = query({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("activities")
      .filter((q) => q.eq(q.field("day"), args.day))
      .collect();
  },
});

export const getAllActivities = query({
  handler: async (ctx) => {
    return await ctx.db.query("activities").order((a) => a.asc(a.field("day"))).order((a) => a.asc(a.field("start"))).collect();
  },
});

export const addWireMessage = mutation({
  args: {
    time: v.string(),
    day: v.number(),
    team: v.string(),
    kind: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.generateId();
    await ctx.db.insert("wire_messages", { id, ...args });
  },
});

export const getWireMessages = query({
  args: { day: v.number(), filter: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("wire_messages").filter((q) => q.eq(q.field("day"), args.day));
    if (args.filter) {
      q = q.filter((q) => q.eq(q.field("kind"), args.filter));
    }
    return await q.collect();
  },
});

export const addIncident = mutation({
  args: {
    cat: v.string(),
    sev: v.string(),
    note: v.string(),
    actId: v.optional(v.string()),
    day: v.number(),
    tm: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.generateId();
    await ctx.db.insert("incidents", {
      id,
      ...args,
      status: "open",
    });
  },
});

export const resolveIncident = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (doc) {
      await ctx.db.patch(args.id, { status: "resolved" });
    }
  },
});

export const getIncidents = query({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("incidents")
      .filter((q) => q.eq(q.field("day"), args.day))
      .collect();
  },
});

export const getBotMessages = query({
  handler: async (ctx) => {
    return await ctx.db.query("bot_messages").order((a) => a.desc(a.field("seq"))).take(50);
  },
});

export const addBotMessage = mutation({
  args: {
    id: v.string(),
    seq: v.number(),
    day: v.number(),
    tm: v.string(),
    toId: v.string(),
    kind: v.string(),
    text: v.string(),
    acked: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bot_messages", args);
  },
});

export const ackBotMessage = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { acked: true });
  },
});

export const addBroadcastLog = mutation({
  args: {
    id: v.string(),
    tm: v.string(),
    day: v.number(),
    scope: v.string(),
    n: v.number(),
    prio: v.string(),
    txt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("broadcast_logs", args);
  },
});

export const getBroadcastLogs = query({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("broadcast_logs")
      .filter((q) => q.eq(q.field("day"), args.day))
      .order((a) => a.desc(a.field("tm")))
      .collect();
  },
});
