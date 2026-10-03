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
    const crew: Array<{ name: string; role: string; venue: string; telegramHandle: string; linked: boolean; token: string }> = [
      { name: "Grace Banda", role: "LEAD", venue: "arena", telegramHandle: "@grace_banda", linked: true, token: "cmiff-grace" },
      { name: "Timothy Mvula", role: "LEAD", venue: "hub", telegramHandle: "@t_mvula", linked: true, token: "cmiff-timothy" },
      { name: "Alinafe Chirwa", role: "LEAD", venue: "tent", telegramHandle: "@alinafe.c", linked: true, token: "cmiff-alinafe" },
      { name: "Dalitso Nkhoma", role: "LEAD", venue: "theatre", telegramHandle: "@dalitso_n", linked: true, token: "cmiff-dalitso" },
      { name: "Chisomo Phiri", role: "LEAD", venue: "main", telegramHandle: "@chisomo_p", linked: true, token: "cmiff-chisomo" },
      { name: "Yamikani Jere", role: "LEAD", venue: "dj", telegramHandle: "@yamijere", linked: true, token: "cmiff-yamikani" },
      { name: "Tiwonge Kasonda", role: "LEAD", venue: "bonfire", telegramHandle: "@tiwonge.k", linked: true, token: "cmiff-tiwonge" },
      { name: "Peter Gondwe", role: "TECH", venue: "arena", telegramHandle: "@pgondwe", linked: true, token: "cmiff-peter" },
      { name: "Memory Kaunda", role: "TECH", venue: "hub", telegramHandle: "@memory.k", linked: true, token: "cmiff-memory" },
      { name: "Fletcher Mwale", role: "TECH", venue: "tent", telegramHandle: "@fletch.mw", linked: true, token: "cmiff-fletcher" },
      { name: "Hillary Nyondo", role: "TECH", venue: "tent", telegramHandle: "@hillaryn", linked: true, token: "cmiff-hillary" },
      { name: "Tapiwa Msowoya", role: "TECH", venue: "theatre", telegramHandle: "@tapiwa.s", linked: true, token: "cmiff-tapiwa" },
      { name: "Blessings Chavula", role: "TECH", venue: "main", telegramHandle: "@blessc", linked: true, token: "cmiff-blessings" },
      { name: "Ernest Kalonga", role: "TECH", venue: "main", telegramHandle: "@ernestk", linked: true, token: "cmiff-ernest" },
      { name: "Kingston Mbewe", role: "TECH", venue: "dj", telegramHandle: "@kingston.mb", linked: true, token: "cmiff-kingston" },
      { name: "Lameck Zimba", role: "TECH", venue: "bonfire", telegramHandle: "@lameck.z", linked: false, token: "cmiff-lameck" },
      { name: "Lucky Njala", role: "VOL", venue: "arena", telegramHandle: "@luckynjala", linked: true, token: "cmiff-lucky" },
      { name: "Sabrina Otto", role: "VOL", venue: "arena", telegramHandle: "@sabrinaotto", linked: true, token: "cmiff-sabrina" },
      { name: "Dex Mtambo", role: "VOL", venue: "arena", telegramHandle: "@dexmtambo", linked: true, token: "cmiff-dex" },
      { name: "Wongani Simbi", role: "VOL", venue: "hub", telegramHandle: "@wongani", linked: true, token: "cmiff-wongani" },
      { name: "Faith Kondowe", role: "VOL", venue: "hub", telegramHandle: "@faithk", linked: true, token: "cmiff-faith" },
      { name: "Stella Kachala", role: "VOL", venue: "tent", telegramHandle: "@stellak", linked: true, token: "cmiff-stella" },
      { name: "Moses Kamanga", role: "VOL", venue: "tent", telegramHandle: "@moseskam", linked: false, token: "cmiff-moses" },
      { name: "Chikondi Namanja", role: "VOL", venue: "theatre", telegramHandle: "@chikondin", linked: true, token: "cmiff-chikondi" },
      { name: "Praise Nyasulu", role: "VOL", venue: "theatre", telegramHandle: "@praisen", linked: true, token: "cmiff-praise" },
      { name: "Gift Zamadenga", role: "VOL", venue: "main", telegramHandle: "@giftz", linked: true, token: "cmiff-gift" },
      { name: "Esnat Maulidi", role: "VOL", venue: "main", telegramHandle: "@esnatm", linked: true, token: "cmiff-esnat" },
      { name: "Bright Chilenje", role: "VOL", venue: "main", telegramHandle: "@brightc", linked: true, token: "cmiff-bright" },
      { name: "Kettie Mwalabu", role: "VOL", venue: "dj", telegramHandle: "@kettie.m", linked: true, token: "cmiff-kettie" },
      { name: "Zione Kalenga", role: "VOL", venue: "bonfire", telegramHandle: "@zione", linked: true, token: "cmiff-zione" },
      { name: "Madalo Chirwa", role: "VOL", venue: "bonfire", telegramHandle: "@madalo", linked: true, token: "cmiff-madalo" },
    ];

    for (const p of crew) {
      await ctx.db.insert("crew_members", p);
    }

    // Helper to parse time string like "06:00" → minutes
    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    // Activities from the real PDF + prototype
    const rawActivities: Array<{
      day: number; s: string; e: string; t: string; v: string; pil: string; st: string; d?: string; gear?: string; quiet?: boolean; checks?: any; pendChecks?: string[];
    }> = [
      // DAY 1
      { day: 1, s: "06:00", e: "06:20", t: "Registration & Participant Check-in", v: "arena", pil: "sports", st: "CONF" },
      { day: 1, s: "06:20", e: "06:35", t: "Warm-up & Safety Briefing", v: "arena", pil: "sports", st: "CONF" },
      { day: 1, s: "06:35", e: "07:15", t: "Beach Volleyball · Soccer (heats) · Canoeing · Kayaking · Swimming · Pool Billiards", v: "arena", pil: "sports", st: "TBC", d: "Team & individual activities run concurrently — see Beach Sports sheet" },
      { day: 1, s: "07:15", e: "07:25", t: "Transition / Hydration Break", v: "arena", pil: "sports", st: "CONF" },
      { day: 1, s: "07:25", e: "08:05", t: "Beach Soccer · Tug-of-War · Sack Race · Arm Wrestling · Darts · Chess · Draughts", v: "arena", pil: "sports", st: "TBC", d: "Team & individual activities run concurrently" },
      { day: 1, s: "08:05", e: "08:15", t: "Break / Equipment Reset", v: "arena", pil: "sports", st: "CONF" },
      { day: 1, s: "08:15", e: "09:00", t: "Pool Billiards · Arm Wrestling · Darts · Chess · Draughts (qualifiers)", v: "arena", pil: "sports", st: "TBC" },
      { day: 1, s: "08:30", e: "09:00", t: "Registration & Orientation", v: "hub", pil: "learn", st: "CONF", d: "Welcome, participant registration, programme overview & grouping — CMIFF Learn Team" },
      { day: 1, s: "09:00", e: "09:15", t: "Canoeing / Kayaking / Swimming (heats)", v: "arena", pil: "sports", st: "TBC" },
      { day: 1, s: "09:15", e: "09:40", t: "Beach Volleyball · Soccer · Pool Billiards · Arm Wrestling · Darts (finals/rounds)", v: "arena", pil: "sports", st: "TBC" },
      { day: 1, s: "09:30", e: "10:30", t: "Training Workshop: Storytelling & Scriptwriting", v: "hub", pil: "learn", st: "TBC", d: "From idea to script: story structure, character development, writing for the screen — Facilitator: Mr Moyo (FAMA)" },
      { day: 1, s: "09:40", e: "09:50", t: "Tug-of-War · Sack Race · Chess · Draughts (finals)", v: "arena", pil: "sports", st: "TBC" },
      { day: 1, s: "09:50", e: "10:00", t: "Results, Recognition & Close", v: "arena", pil: "sports", st: "CONF" },
      { day: 1, s: "10:30", e: "10:50", t: "Film Screening — Opening Shorts, Slot 1", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: false, subs: true, bak: true }, pendChecks: ["dcp"] },
      { day: 1, s: "10:50", e: "11:15", t: "Film Screening — Opening Shorts, Slot 2", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: true, subs: false, bak: true }, pendChecks: ["subs"] },
      { day: 1, s: "11:15", e: "12:15", t: "Connect: Meet the Industry", v: "hub", pil: "connect", st: "PEND", d: "Selected industry practitioners share career journeys and practical advice, followed by Q&A. Moderator & 3–5 guests needed." },
      { day: 1, s: "12:15", e: "13:30", t: "Lunch Break", v: "hub", pil: "general", st: "CONF" },
      { day: 1, s: "13:30", e: "14:30", t: "Panel Discussion: Cultural Authenticity as Competitive Edge to Global Audience", v: "hub", pil: "learn", st: "TBC", d: "Facilitator: Mr Odala Banda" },
      { day: 1, s: "14:30", e: "15:30", t: "Training Workshop: Film Rights, Royalties & the Blank Media Levy", v: "hub", pil: "learn", st: "TBC", d: "How the blank media levy, IP protection and monetisation/distribution work — Facilitator: Mr Shadreck (COSOMA). Moved from its original 14:00 slot to resolve a clash with the panel above." },
      { day: 1, s: "15:30", e: "16:00", t: "Break", v: "hub", pil: "general", st: "CONF" },
      { day: 1, s: "16:00", e: "16:20", t: "Theatre: Nzeka Arts", v: "theatre", pil: "theatre", st: "CONF", d: "7 performers" },
      { day: 1, s: "16:20", e: "16:35", t: "Spoken Word: Joshua Milos", v: "theatre", pil: "theatre", st: "TBC", d: "2 performers", gear: "mic · guitar" },
      { day: 1, s: "16:35", e: "16:45", t: "Spoken Word: Paul Shagant", v: "theatre", pil: "theatre", st: "TBC", d: "1 performer", gear: "mic · 3′ soundcheck" },
      { day: 1, s: "16:45", e: "16:50", t: "Spoken Word: The Poet's Diary", v: "theatre", pil: "theatre", st: "TBC", d: "1 performer", gear: "1 mic" },
      { day: 1, s: "17:00", e: "18:00", t: "Connect: Pitch & Connect", v: "hub", pil: "connect", st: "PEND", d: "Selected creatives pitch projects to industry guests, followed by direct conversations. Needs screen/projector, pitch guidelines, timer." },
      { day: 1, s: "18:00", e: "19:00", t: "Dinner Break", v: "hub", pil: "general", st: "CONF" },
      { day: 1, s: "18:00", e: "20:00", t: "DJ Set: DJ Vee", v: "dj", pil: "music", st: "TBC", d: "2 hours" },
      { day: 1, s: "19:00", e: "20:00", t: "Live Performance: The Black Missionaries", v: "main", pil: "music", st: "CONF", d: "1 hour · 3 + band" },
      { day: 1, s: "19:00", e: "20:00", t: "Film Screening — Evening Feature, Slot 1", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: true, subs: true, bak: false }, pendChecks: ["bak"] },
      { day: 1, s: "20:00", e: "20:20", t: "Live Performance: Scorti Samuel (Nigeria)", v: "main", pil: "music", st: "TBC", d: "10–25 minutes" },
      { day: 1, s: "20:00", e: "21:00", t: "Film Screening — Evening Feature, Slot 2", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 1, s: "20:00", e: "22:00", t: "DJ Set: DJ Spencer", v: "dj", pil: "music", st: "TBC", d: "2 hours" },
      { day: 1, s: "20:20", e: "20:50", t: "Dance Performance: Adobe Dance Crew", v: "main", pil: "music", st: "TBC", d: "30 minutes" },
      { day: 1, s: "22:00", e: "00:00", t: "DJ Set: DJ HashTag", v: "dj", pil: "music", st: "TBC", d: "2 hours" },

      // DAY 2
      { day: 2, s: "06:00", e: "06:20", t: "Registration & Participant Check-in", v: "arena", pil: "sports", st: "CONF" },
      { day: 2, s: "06:20", e: "06:35", t: "Warm-up & Safety Briefing", v: "arena", pil: "sports", st: "CONF" },
      { day: 2, s: "06:35", e: "07:15", t: "Beach Volleyball · Soccer (heats) · Canoeing · Kayaking · Swimming · Pool Billiards", v: "arena", pil: "sports", st: "TBC", d: "Team & individual activities run concurrently — see Beach Sports sheet" },
      { day: 2, s: "07:15", e: "07:25", t: "Transition / Hydration Break", v: "arena", pil: "sports", st: "CONF" },
      { day: 2, s: "07:25", e: "08:05", t: "Beach Soccer · Tug-of-War · Sack Race · Arm Wrestling · Darts · Chess · Draughts", v: "arena", pil: "sports", st: "TBC" },
      { day: 2, s: "08:05", e: "08:15", t: "Break / Equipment Reset", v: "arena", pil: "sports", st: "CONF" },
      { day: 2, s: "08:15", e: "09:00", t: "Pool Billiards · Arm Wrestling · Darts · Chess · Draughts (qualifiers)", v: "arena", pil: "sports", st: "TBC" },
      { day: 2, s: "08:30", e: "09:30", t: "Masterclass: Acting for Film", v: "hub", pil: "learn", st: "TBC", d: "Facilitator: Mr Moyo (FAMA)" },
      { day: 2, s: "09:00", e: "09:15", t: "Canoeing / Kayaking / Swimming (heats)", v: "arena", pil: "sports", st: "TBC" },
      { day: 2, s: "09:15", e: "09:40", t: "Beach Volleyball · Soccer · Pool Billiards · Arm Wrestling · Darts (finals/rounds)", v: "arena", pil: "sports", st: "TBC" },
      { day: 2, s: "09:40", e: "09:50", t: "Tug-of-War · Sack Race · Chess · Draughts (finals)", v: "arena", pil: "sports", st: "TBC" },
      { day: 2, s: "09:50", e: "10:00", t: "Results, Recognition & Close", v: "arena", pil: "sports", st: "CONF" },
      { day: 2, s: "10:00", e: "12:00", t: "Training Workshop: Camera", v: "hub", pil: "learn", st: "TBC", d: "Camera handling, framing & composition, shooting with natural light on a low budget — Facilitator: Mr Laluh" },
      { day: 2, s: "10:00", e: "10:30", t: "Film Screening — Morning Shorts, Slot 1", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 2, s: "10:30", e: "11:00", t: "Film Screening — Morning Shorts, Slot 2", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: true, subs: false, bak: true }, pendChecks: ["subs"] },
      { day: 2, s: "12:00", e: "13:00", t: "Connect: International Connections & Matchmaking", v: "hub", pil: "connect", st: "PEND", d: "Targeted introductions between Malawian creatives & visiting festivals/producers/organisations. Needs guest & participant profiles, coordinator, meeting space." },
      { day: 2, s: "13:00", e: "14:00", t: "Panel Discussion: Cultural Authenticity as Competitive Edge to Global Audience", v: "hub", pil: "learn", st: "TBC", d: "Facilitator: Mr Odala Banda" },
      { day: 2, s: "14:00", e: "16:00", t: "CMIFF Industry Mixer (joint with Connect Pillar)", v: "hub", pil: "learn", st: "PEND", d: "Informal networking: Learn participants meet industry guests, festival representatives and partners" },
      { day: 2, s: "16:15", e: "17:05", t: "Theatre: Raise The Level Arts", v: "theatre", pil: "theatre", st: "CONF", d: "12 performers (can be trimmed)", gear: "mic · backing music" },
      { day: 2, s: "17:05", e: "17:35", t: "Theatre: Hephzibah Arts", v: "theatre", pil: "theatre", st: "CONF", d: "10 performers", gear: "8× lapel mics · stage light" },
      { day: 2, s: "17:35", e: "18:00", t: "Spoken Word: Rudy Ruhigita", v: "theatre", pil: "theatre", st: "TBC", d: "2 performers", gear: "stand mic · keys/guitar" },
      { day: 2, s: "18:00", e: "18:50", t: "DJ Set: DJ Nyenyezi", v: "dj", pil: "music", st: "TBC", d: "50 minutes" },
      { day: 2, s: "18:15", e: "19:00", t: "Dinner Break", v: "hub", pil: "general", st: "CONF" },
      { day: 2, s: "19:00", e: "20:00", t: "DJ Set: DJ Karibs", v: "dj", pil: "music", st: "TBC", d: "1 hour" },
      { day: 2, s: "19:00", e: "20:00", t: "Live Performance: Driemo", v: "main", pil: "music", st: "TBC", d: "1 hour · 1 + band" },
      { day: 2, s: "20:00", e: "20:25", t: "Live Performance: Banie Michael", v: "main", pil: "music", st: "TBC", d: "25 minutes" },
      { day: 2, s: "20:00", e: "21:00", t: "Connect: Creative Conversations on the Sand", v: "bonfire", pil: "connect", st: "PEND", d: "Small, invitation-only conversation under the tree on the beach — Zitenje laid out, facilitator, selected participants & refreshments" },
      { day: 2, s: "20:00", e: "21:00", t: "Film Screening — Evening Feature, Slot 1", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 2, s: "20:00", e: "23:00", t: "DJ Set: DJ Flame", v: "dj", pil: "music", st: "CONF", d: "3 hours" },
      { day: 2, s: "20:25", e: "21:25", t: "Live Performance: Chitoliro Band", v: "main", pil: "music", st: "TBC", d: "1 hour" },
      { day: 2, s: "21:00", e: "22:00", t: "Film Screening — Evening Feature, Slot 2", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: false, subs: true, bak: true }, pendChecks: ["dcp"] },
      { day: 2, s: "21:25", e: "21:50", t: "Performance: Nagh Processor (Tanzania)", v: "main", pil: "music", st: "TBC", d: "25 minutes — live vocal + contemporary dance" },
      { day: 2, s: "21:30", e: "23:00", t: "Connect: Bonfire Industry Conversation & Cocktail", v: "bonfire", pil: "connect", st: "PEND", d: "Small, invitation-only evening conversation around the bonfire with drinks — guest list, host & seating needed" },
      { day: 2, s: "21:50", e: "22:50", t: "Live Performance: Erkez Hip Hop (Tunisia)", v: "main", pil: "music", st: "TBC", d: "1 hour — full technical/performance rider on file", gear: "rider on file" },

      // DAY 3
      { day: 3, s: "06:00", e: "06:20", t: "Registration & Participant Check-in", v: "arena", pil: "sports", st: "CONF" },
      { day: 3, s: "06:20", e: "06:35", t: "Warm-up & Safety Briefing", v: "arena", pil: "sports", st: "CONF" },
      { day: 3, s: "06:35", e: "07:15", t: "Beach Volleyball · Soccer (heats) · Canoeing · Kayaking · Swimming · Pool Billiards", v: "arena", pil: "sports", st: "TBC", d: "Team & individual activities run concurrently — see Beach Sports sheet" },
      { day: 3, s: "07:15", e: "07:25", t: "Transition / Hydration Break", v: "arena", pil: "sports", st: "CONF" },
      { day: 3, s: "07:25", e: "08:05", t: "Beach Soccer · Tug-of-War · Sack Race · Arm Wrestling · Darts · Chess · Draughts", v: "arena", pil: "sports", st: "TBC" },
      { day: 3, s: "08:05", e: "08:15", t: "Break / Equipment Reset", v: "arena", pil: "sports", st: "CONF" },
      { day: 3, s: "08:15", e: "09:00", t: "Pool Billiards · Arm Wrestling · Darts · Chess · Draughts (qualifiers)", v: "arena", pil: "sports", st: "TBC" },
      { day: 3, s: "09:00", e: "09:15", t: "Canoeing / Kayaking / Swimming (heats)", v: "arena", pil: "sports", st: "TBC" },
      { day: 3, s: "09:00", e: "10:30", t: "Panel Discussion: Future of African Film — AI, Mobile Filmmaking & New Technology", v: "hub", pil: "learn", st: "TBC", d: "Facilitator: Mr Laluh" },
      { day: 3, s: "09:15", e: "09:40", t: "Beach Volleyball · Soccer · Pool Billiards · Arm Wrestling · Darts (finals/rounds)", v: "arena", pil: "sports", st: "TBC" },
      { day: 3, s: "09:40", e: "09:50", t: "Tug-of-War · Sack Race · Chess · Draughts (finals)", v: "arena", pil: "sports", st: "TBC" },
      { day: 3, s: "09:50", e: "10:00", t: "Results, Recognition & Close", v: "arena", pil: "sports", st: "CONF" },
      { day: 3, s: "10:30", e: "11:00", t: "Film Screening — Morning Shorts", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 3, s: "11:00", e: "12:30", t: "Masterclass: Professional Pathways in Film & TV", v: "hub", pil: "learn", st: "PEND", d: "Proposed partner: MultiChoice; alternative proposed: EU Film Festival" },
      { day: 3, s: "12:30", e: "13:30", t: "Lunch Break", v: "hub", pil: "general", st: "CONF" },
      { day: 3, s: "13:30", e: "14:10", t: "Visual Arts Build — Session 3: Finishing & Installation", v: "hub", pil: "learn", st: "CONF", d: "Showcasing visitors' visual arts space — Charles Levison + Art Team" },
      { day: 3, s: "14:10", e: "15:00", t: "Film Screening — Afternoon Feature", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: true, subs: false, bak: true }, pendChecks: ["subs"] },
      { day: 3, s: "15:00", e: "15:25", t: "Theatre: YDC Theatre — 'The Journey at Lampedusa'", v: "theatre", pil: "theatre", st: "CONF", d: "4 performers", gear: "screen · projector · speakers" },
      { day: 3, s: "15:25", e: "15:50", t: "Theatre: Developing Agency", v: "theatre", pil: "theatre", st: "CONF", d: "5 performers — max 10-min sound check; 2x Stairville CX-60 HEX lights; 3 vocal mics", gear: "2× Stairville CX-60 HEX · 3 vocal mics" },
      { day: 3, s: "15:50", e: "16:10", t: "Spoken Word: Isaac Kadankowa", v: "theatre", pil: "theatre", st: "TBC", d: "1 performer" },
      { day: 3, s: "16:10", e: "16:55", t: "Magic/Illusion: Thoko The Magician", v: "theatre", pil: "theatre", st: "CONF", d: "1 performer", gear: "head mic" },
      { day: 3, s: "17:00", e: "17:45", t: "Film Screening — Pre-Closing Screening, Slot 1", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 3, s: "17:45", e: "18:30", t: "Film Screening — Pre-Closing Screening, Slot 2", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 3, s: "19:00", e: "19:30", t: "Certificates & Closing Ceremony", v: "hub", pil: "learn", st: "CONF", d: "Certificate of Completion awards, participant feedback, group photo — CMIFF Learn Team + Core Team" },
      { day: 3, s: "19:30", e: "20:00", t: "Break / Transition to Closing Night Showcase", v: "hub", pil: "general", st: "CONF" },
      { day: 3, s: "20:00", e: "20:45", t: "Live Performance: Keturah", v: "main", pil: "music", st: "CONF", d: "45 minutes" },
      { day: 3, s: "20:00", e: "23:00", t: "DJ Set: DJ Clame", v: "dj", pil: "music", st: "TBC", d: "3 hours" },
      { day: 3, s: "20:45", e: "21:20", t: "Live Performance: Lucky Stars Band", v: "main", pil: "music", st: "CONF", d: "35 minutes" },
      { day: 3, s: "21:00", e: "22:00", t: "Film Screening — Closing Night Gala, Slot 1", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed", checks: { dcp: true, subs: true, bak: false }, pendChecks: ["bak"] },
      { day: 3, s: "21:20", e: "21:50", t: "Live Performance: King Bandana", v: "main", pil: "music", st: "TBC", d: "30 minutes" },
      { day: 3, s: "21:50", e: "22:25", t: "Live Performance: CeeBee265", v: "main", pil: "music", st: "TBC", d: "35 minutes" },
      { day: 3, s: "22:00", e: "23:00", t: "Film Screening — Closing Night Gala, Slot 2", v: "tent", pil: "film", st: "PROG", d: "Title / director / country to be programmed" },
      { day: 3, s: "22:25", e: "23:15", t: "Live Performance: Evans Mapfumo (Zimbabwe)", v: "main", pil: "music", st: "CONF", d: "50 minutes" },
      { day: 3, s: "23:00", e: "02:00", t: "DJ Set: DJ West", v: "dj", pil: "music", st: "TBC", d: "3 hours — runs into the early hours of 18 Oct" },
      { day: 3, s: "23:15", e: "23:45", t: "Dance Performance: Unstoppable Dance Crew", v: "main", pil: "music", st: "TBC", d: "30 minutes" },
    ];

    // Assign quiet flag
    const quietRegex = /^(Lunch|Dinner|Break|Transition|Registration & Participant|Warm-up|Results)/;

    for (const raw of rawActivities) {
      const sMin = parseTime(raw.s);
      const eMin = parseTime(raw.e);
      // Handle overnight (end < start)
      const duration = eMin > sMin ? eMin - sMin : (1440 - sMin) + eMin;

      // Find crew for venue
      const venueCrew = await ctx.db
        .query("crew_members")
        .withIndex("by_venue", (q) => q.eq("venue", raw.v))
        .collect();

      const leads = venueCrew.filter((p) => p.role === "LEAD");
      const techs = venueCrew.filter((p) => p.role === "TECH").map((p) => p._id);
      const vols = venueCrew.filter((p) => p.role === "VOL").map((p) => p._id);

      // Build checks
      let checks: any = { dcp: true, subs: true, bak: true };
      if (raw.checks) checks = raw.checks;

      await ctx.db.insert("activities", {
        day: raw.day,
        start: sMin,
        end: sMin + duration,
        title: raw.t,
        venue: raw.v,
        pillar: raw.pil,
        status: raw.st,
        details: raw.d || "",
        gear: raw.gear || "",
        quiet: raw.t ? quietRegex.test(raw.t) : false,
        checks,
        delay: 0,
        manual: null,
        crewLead: leads[0]?. _id || null,
        crewTechs: techs,
        crewVols: vols,
      });
    }

    // Seed some initial wire messages and incidents
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmtTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(Math.floor(m % 60))}`;
    const T0 = now.getHours() * 60 + now.getMinutes();
    const tm = (offset: number) => fmtTime(Math.min(1425, Math.max(360, T0 - offset)));

    const initialWire: Array<any> = [
      { id: "w1", time: tm(215), day: 3, team: "AV", kind: "auto", text: "Lakefront projector lamp swapped — spare lamp in AV crate B." },
      { id: "w2", time: tm(150), day: 3, team: "PROG", kind: "auto", text: "Baobab opened 2 min late for a full house — no knock-on." },
      { id: "w3", time: tm(140), day: 3, team: "AV", kind: "incident", text: "Baobab house lights flickered — generator swapped at interval.", sev: "LOW", cat: "POWER", status: "resolved" },
      { id: "w4", time: tm(95), day: 3, team: "GUEST", kind: "auto", text: "Director of featured film collected from Kande lodge — ETA 30 min." },
      { id: "w5", time: tm(55), day: 3, team: "AV", kind: "auto", text: "Hearing-loop battery replaced at Dugout — all clear." },
      { id: "w6", time: tm(35), day: 3, team: "FOH", kind: "incident", text: "Gate 2 queue building before the evening rush — sending two more stewards.", sev: "LOW", cat: "CROWD", status: "open" },
    ];

    for (const w of initialWire) {
      await ctx.db.insert("wire_messages", w);
    }

    // Seed incidents
    await ctx.db.insert("incidents", {
      id: 1, cat: "POWER", sev: "LOW", note: "Baobab house lights flickered — generator swapped at interval.", actId: null, day: 3, tm: tm(140), status: "resolved",
    });
    await ctx.db.insert("incidents", {
      id: 2, cat: "CROWD", sev: "LOW", note: "Gate 2 queue building before the evening rush — send two more stewards.", actId: null, day: 3, tm: tm(35), status: "open",
    });

    return { seeded: rawActivities.length, crew: crew.length };
  },
});

export const getActivities = query({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_day", (q) => q.eq("day", args.day))
      .order("asc")
      .collect();
  },
});

export const getAllActivities = query({
  args: {},
  handler: async (ctx) => {
    const days = [1, 2, 3];
    const all: any[] = [];
    for (const d of days) {
      const acts = await ctx.db
        .query("activities")
        .withIndex("by_day", (q) => q.eq("day", d))
        .order("asc")
        .collect();
      all.push(...acts);
    }
    return all;
  },
});

export const getCrew = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("crew_members").order("asc").collect();
  },
});

export const getWireMessages = query({
  args: { day: v.number(), filter: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const q = ctx.db.query("wire_messages").withIndex("by_day", (q) => q.eq("day", args.day)).order("desc");
    const msgs = await q.limit(100).collect();
    if (args.filter && args.filter !== "all") {
      return msgs.filter((m) => m.kind === args.filter);
    }
    return msgs;
  },
});

export const getIncidents = query({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_day", (q) => q.eq("day", args.day))
      .order("desc")
      .collect();
  },
});

export const getBotMessages = query({
  args: { toId: v.optional(v.string()), day: v.number(), filter: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("bot_messages").withIndex("by_day", (q) => q.eq("day", args.day)).order("desc");
    if (args.toId) {
      q = ctx.db.query("bot_messages").withIndex("by_to", (q) => q.eq("toId", args.toId)).order("desc");
    }
    const msgs = await q.limit(200).collect();
    if (args.filter && args.filter !== "ALL") {
      return msgs.filter((m) => m.kind === args.filter);
    }
    return msgs;
  },
});

export const getBroadcastLogs = query({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("broadcast_logs")
      .withIndex("by_day", (q) => q.eq("day", args.day))
      .order("desc")
      .limit(50)
      .collect();
  },
});

// ─── Mutations ───

export const updateActivity = mutation({
  args: {
    id: v.id("activities"),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { [args.field]: args.value });
  },
});

export const addWireMessage = mutation({
  args: {
    id: v.string(),
    time: v.string(),
    day: v.number(),
    team: v.string(),
    kind: v.string(),
    text: v.string(),
    sev: v.optional(v.string()),
    cat: v.optional(v.string()),
    incId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("wire_messages", args);
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
  args: { id: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.db.resolveId(`incidents/${args.id}`)!, { status: "resolved" });
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
    actId: v.optional(v.string()),
    ruleId: v.optional(v.string()),
    acked: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bot_messages", args);
  },
});

export const ackBotMessage = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.db.resolveId(`bot_messages/${args.id}`)!, { acked: true });
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

export const updateCrewLinked = mutation({
  args: { id: v.id("crew_members"), linked: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { linked: args.linked });
  },
});

export const sendTelegramMessage = mutation({
  args: {
    chatId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.log("[Telegram] No token configured — simulating send");
      return { simulated: true };
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: args.chatId,
          text: args.text,
          parse_mode: "HTML",
        }),
      });
      const data = await res.json();
      return { ok: data.ok, response: data };
    } catch (e) {
      console.error("[Telegram] Send failed:", e);
      return { simulated: true, error: String(e) };
    }
  },
});

export const aiDraftMessage = mutation({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL || "https://api.openai.com/v1";
    const model = process.env.MODEL || "gpt-4o-mini";
    if (!apiKey) {
      // Fallback: return a simple drafted message
      return { text: `📢 OPS UPDATE — ${args.prompt}.\n\nLeads: confirm receipt, brief your crew at next changeover.` };
    }
    try {
      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "You are an assistant for the Cape Maclear International Film Festival (CMIFF) operations team. Draft concise, professional Telegram-style messages for festival staff. Use emojis sparingly. Keep messages under 200 words. Format with line breaks for readability.",
            },
            { role: "user", content: args.prompt },
          ],
          max_tokens: 300,
        }),
      });
      const data = await res.json();
      return { text: data.choices?.[0]?.message?.content || args.prompt };
    } catch (e) {
      console.error("[AI] Draft failed:", e);
      return { text: args.prompt };
    }
  },
});
