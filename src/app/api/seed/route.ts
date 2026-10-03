import { NextResponse } from "next/server";

// Seed data from the operations plan PDF
const CREW = [
  { _id: "c1", name: "Grace Banda", role: "LEAD", venue: "arena", telegramHandle: "@grace_banda", linked: false, token: "cmiff-grace", telegramChatId: undefined },
  { _id: "c2", name: "Timothy Mvula", role: "LEAD", venue: "hub", telegramHandle: "@t_mvula", linked: false, token: "cmiff-timothy", telegramChatId: undefined },
  { _id: "c3", name: "Alinafe Chirwa", role: "LEAD", venue: "tent", telegramHandle: "@alinafe.c", linked: false, token: "cmiff-alinafe", telegramChatId: undefined },
  { _id: "c4", name: "Dalitso Nkhoma", role: "LEAD", venue: "theatre", telegramHandle: "@dalitso_n", linked: false, token: "cmiff-dalitso", telegramChatId: undefined },
  { _id: "c5", name: "Chisomo Phiri", role: "LEAD", venue: "main", telegramHandle: "@chisomo_p", linked: false, token: "cmiff-chisomo", telegramChatId: undefined },
  { _id: "c6", name: "Yamikani Jere", role: "LEAD", venue: "dj", telegramHandle: "@yamijere", linked: false, token: "cmiff-yamikani", telegramChatId: undefined },
  { _id: "c7", name: "Tiwonge Kasonda", role: "LEAD", venue: "bonfire", telegramHandle: "@tiwonge.k", linked: false, token: "cmiff-tiwonge", telegramChatId: undefined },
  { _id: "c8", name: "Peter Gondwe", role: "TECH", venue: "arena", telegramHandle: "@pgondwe", linked: false, token: "cmiff-peter", telegramChatId: undefined },
  { _id: "c9", name: "Memory Kaunda", role: "TECH", venue: "hub", telegramHandle: "@memory.k", linked: false, token: "cmiff-memory", telegramChatId: undefined },
  { _id: "c10", name: "Fletcher Mwale", role: "TECH", venue: "tent", telegramHandle: "@fletch.mw", linked: false, token: "cmiff-fletcher", telegramChatId: undefined },
  { _id: "c11", name: "Hillary Nyondo", role: "TECH", venue: "tent", telegramHandle: "@hillaryn", linked: false, token: "cmiff-hillary", telegramChatId: undefined },
  { _id: "c12", name: "Tapiwa Msowoya", role: "TECH", venue: "theatre", telegramHandle: "@tapiwa.s", linked: false, token: "cmiff-tapiwa", telegramChatId: undefined },
  { _id: "c13", name: "Blessings Chavula", role: "TECH", venue: "main", telegramHandle: "@blessc", linked: false, token: "cmiff-blessings", telegramChatId: undefined },
  { _id: "c14", name: "Ernest Kalonga", role: "TECH", venue: "main", telegramHandle: "@ernestk", linked: false, token: "cmiff-ernest", telegramChatId: undefined },
  { _id: "c15", name: "Kingston Mbewe", role: "TECH", venue: "dj", telegramHandle: "@kingston.mb", linked: false, token: "cmiff-kingston", telegramChatId: undefined },
  { _id: "c16", name: "Lameck Zimba", role: "TECH", venue: "bonfire", telegramHandle: "@lameck.z", linked: false, token: "cmiff-lameck", telegramChatId: undefined },
  { _id: "c17", name: "Lucky Njala", role: "VOL", venue: "arena", telegramHandle: "@luckynjala", linked: false, token: "cmiff-lucky", telegramChatId: undefined },
  { _id: "c18", name: "Sabrina Otto", role: "VOL", venue: "arena", telegramHandle: "@sabrinaotto", linked: false, token: "cmiff-sabrina", telegramChatId: undefined },
  { _id: "c19", name: "Dex Mtambo", role: "VOL", venue: "arena", telegramHandle: "@dexmtambo", linked: false, token: "cmiff-dex", telegramChatId: undefined },
  { _id: "c20", name: "Wongani Simbi", role: "VOL", venue: "hub", telegramHandle: "@wongani", linked: false, token: "cmiff-wongani", telegramChatId: undefined },
  { _id: "c21", name: "Faith Kondowe", role: "VOL", venue: "hub", telegramHandle: "@faithk", linked: false, token: "cmiff-faith", telegramChatId: undefined },
  { _id: "c22", name: "Stella Kachala", role: "VOL", venue: "tent", telegramHandle: "@stellak", linked: false, token: "cmiff-stella", telegramChatId: undefined },
  { _id: "c23", name: "Moses Kamanga", role: "VOL", venue: "tent", telegramHandle: "@moseskam", linked: false, token: "cmiff-moses", telegramChatId: undefined },
  { _id: "c24", name: "Chikondi Namanja", role: "VOL", venue: "theatre", telegramHandle: "@chikondin", linked: false, token: "cmiff-chikondi", telegramChatId: undefined },
  { _id: "c25", name: "Praise Nyasulu", role: "VOL", venue: "theatre", telegramHandle: "@praisen", linked: false, token: "cmiff-praise", telegramChatId: undefined },
  { _id: "c26", name: "Gift Zamadenga", role: "VOL", venue: "main", telegramHandle: "@giftz", linked: false, token: "cmiff-gift", telegramChatId: undefined },
  { _id: "c27", name: "Esnat Maulidi", role: "VOL", venue: "main", telegramHandle: "@esnatm", linked: false, token: "cmiff-esnat", telegramChatId: undefined },
  { _id: "c28", name: "Bright Chilenje", role: "VOL", venue: "main", telegramHandle: "@brightc", linked: false, token: "cmiff-bright", telegramChatId: undefined },
  { _id: "c29", name: "Kettie Mwalabu", role: "VOL", venue: "dj", telegramHandle: "@kettie.m", linked: false, token: "cmiff-kettie", telegramChatId: undefined },
  { _id: "c30", name: "Zione Kalenga", role: "VOL", venue: "bonfire", telegramHandle: "@zione", linked: false, token: "cmiff-zione", telegramChatId: undefined },
  { _id: "c31", name: "Madalo Chirwa", role: "VOL", venue: "bonfire", telegramHandle: "@madalo", linked: false, token: "cmiff-madalo", telegramChatId: undefined },
];

const ACTIVITIES = [
  // DAY 1 - 15 October 2026
  { _id: "a1", day: 1, start: 360, end: 380, title: "Registration & Participant Check-in", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
  { _id: "a2", day: 1, start: 380, end: 395, title: "Warm-up & Safety Briefing", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
  { _id: "a3", day: 1, start: 395, end: 435, title: "Beach Volleyball · Soccer (heats) · Canoeing · Kayaking · Swimming · Pool Billiards", venue: "arena", pillar: "sports", status: "TBC", details: "Team & individual activities run concurrently", gear: "", quiet: false },
  { _id: "a4", day: 1, start: 435, end: 445, title: "Transition / Hydration Break", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: true },
  { _id: "a5", day: 1, start: 445, end: 485, title: "Beach Soccer · Tug-of-War · Sack Race · Arm Wrestling · Darts · Chess · Draughts", venue: "arena", pillar: "sports", status: "TBC", details: "Team & individual activities run concurrently", gear: "", quiet: false },
  { _id: "a6", day: 1, start: 510, end: 540, title: "Registration & Orientation", venue: "hub", pillar: "learn", status: "CONF", details: "Welcome, participant registration, programme overview & grouping", gear: "", quiet: false },
  { _id: "a7", day: 1, start: 570, end: 630, title: "Training Workshop: Storytelling & Scriptwriting", venue: "hub", pillar: "learn", status: "TBC", details: "From idea to script: story structure, character development, writing for the screen — Facilitator: Mr Moyo (FAMA)", gear: "", quiet: false },
  { _id: "a8", day: 1, start: 630, end: 650, title: "Film Screening — Opening Shorts, Slot 1", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
  { _id: "a9", day: 1, start: 650, end: 670, title: "Film Screening — Opening Shorts, Slot 2", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
  { _id: "a10", day: 1, start: 670, end: 730, title: "Connect: Meet the Industry", venue: "hub", pillar: "connect", status: "PEND", details: "Selected industry practitioners share career journeys and practical advice", gear: "", quiet: false },
  { _id: "a11", day: 1, start: 735, end: 750, title: "Lunch Break", venue: "hub", pillar: "general", status: "CONF", details: "", gear: "", quiet: true },
  { _id: "a12", day: 1, start: 750, end: 810, title: "Panel Discussion: Cultural Authenticity as Competitive Edge", venue: "hub", pillar: "learn", status: "TBC", details: "Facilitator: Mr Odala Banda", gear: "", quiet: false },
  { _id: "a13", day: 1, start: 960, end: 1020, title: "DJ Set: DJ Vee", venue: "dj", pillar: "music", status: "TBC", details: "2 hours", gear: "", quiet: false },
  { _id: "a14", day: 1, start: 1020, end: 1080, title: "Live Performance: The Black Missionaries", venue: "main", pillar: "music", status: "CONF", details: "1 hour · 3 + band", gear: "", quiet: false },
  { _id: "a15", day: 1, start: 1080, end: 1140, title: "Film Screening — Evening Feature, Slot 1", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
  { _id: "a16", day: 1, start: 1200, end: 1320, title: "DJ Set: DJ HashTag", venue: "dj", pillar: "music", status: "TBC", details: "2 hours", gear: "", quiet: false },

  // DAY 2 - 16 October 2026
  { _id: "a17", day: 2, start: 360, end: 380, title: "Registration & Participant Check-in", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
  { _id: "a18", day: 2, start: 380, end: 395, title: "Warm-up & Safety Briefing", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
  { _id: "a19", day: 2, start: 600, end: 720, title: "Training Workshop: Camera", venue: "hub", pillar: "learn", status: "TBC", details: "Camera handling, framing & composition — Facilitator: Mr Laluh", gear: "", quiet: false },
  { _id: "a20", day: 2, start: 975, end: 1025, title: "Live Performance: Driemo", venue: "main", pillar: "music", status: "TBC", details: "1 hour · 1 + band", gear: "", quiet: false },
  { _id: "a21", day: 2, start: 1200, end: 1380, title: "DJ Set: DJ Flame", venue: "dj", pillar: "music", status: "CONF", details: "3 hours", gear: "", quiet: false },

  // DAY 3 - 17 October 2026
  { _id: "a22", day: 3, start: 360, end: 380, title: "Registration & Participant Check-in", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
  { _id: "a23", day: 3, start: 380, end: 395, title: "Warm-up & Safety Briefing", venue: "arena", pillar: "sports", status: "CONF", details: "", gear: "", quiet: false },
  { _id: "a24", day: 3, start: 540, end: 630, title: "Panel Discussion: Future of African Film — AI, Mobile Filmmaking", venue: "hub", pillar: "learn", status: "TBC", details: "Facilitator: Mr Laluh", gear: "", quiet: false },
  { _id: "a25", day: 3, start: 1140, end: 1230, title: "Masterclass: Professional Pathways in Film & TV", venue: "hub", pillar: "learn", status: "PEND", details: "Proposed partner: MultiChoice", gear: "", quiet: false },
  { _id: "a26", day: 3, start: 1140, end: 1200, title: "Film Screening — Morning Shorts", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
  { _id: "a27", day: 3, start: 1200, end: 1260, title: "Film Screening — Afternoon Feature", venue: "tent", pillar: "film", status: "PROG", details: "Title / director / country to be programmed", gear: "", quiet: false },
  { _id: "a28", day: 3, start: 1140, end: 1260, title: "DJ Set: DJ Clame", venue: "dj", pillar: "music", status: "TBC", details: "3 hours", gear: "", quiet: false },
  { _id: "a29", day: 3, start: 1200, end: 1290, title: "Live Performance: Keturah", venue: "main", pillar: "music", status: "CONF", details: "45 minutes", gear: "", quiet: false },
  { _id: "a30", day: 3, start: 1290, end: 1350, title: "Live Performance: Lucky Stars Band", venue: "main", pillar: "music", status: "CONF", details: "35 minutes", gear: "", quiet: false },
  { _id: "a31", day: 3, start: 1350, end: 1410, title: "Live Performance: King Bandana", venue: "main", pillar: "music", status: "TBC", details: "30 minutes", gear: "", quiet: false },
  { _id: "a32", day: 3, start: 1410, end: 1470, title: "Live Performance: CeeBee265", venue: "main", pillar: "music", status: "TBC", details: "35 minutes", gear: "", quiet: false },
  { _id: "a33", day: 3, start: 1470, end: 1530, title: "Live Performance: Evans Mapfumo (Zimbabwe)", venue: "main", pillar: "music", status: "CONF", details: "50 minutes", gear: "", quiet: false },
  { _id: "a34", day: 3, start: 1530, end: 1620, title: "DJ Set: DJ West", venue: "dj", pillar: "music", status: "TBC", details: "3 hours — runs into the early hours of 18 Oct", gear: "", quiet: false },
  { _id: "a35", day: 3, start: 1140, end: 1200, title: "Certificates & Closing Ceremony", venue: "hub", pillar: "learn", status: "CONF", details: "Certificate of Completion awards, participant feedback, group photo", gear: "", quiet: false },
];

export async function GET() {
  return NextResponse.json({
    crew: CREW,
    activities: ACTIVITIES,
    count: { crew: CREW.length, activities: ACTIVITIES.length }
  });
}
