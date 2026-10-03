import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data", "crew-links.json");

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readCrewLinks(): Array<{ token: string; telegramChatId: string; linked: boolean; name: string; role: string; venue: string }> {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeCrewLinks(data: Array<{ token: string; telegramChatId: string; linked: boolean; name: string; role: string; venue: string }>) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/crew — returns current linked crew state
export async function GET() {
  const linked = readCrewLinks();
  return NextResponse.json({ crew: linked, count: linked.length });
}

// POST /api/crew/update — update a crew member's link status
export async function POST(req: Request) {
  const { token, telegramChatId, linked, name, role, venue } = await req.json();

  if (!token || !telegramChatId) {
    return NextResponse.json({ ok: false, error: "token and telegramChatId required" }, { status: 400 });
  }

  const current = readCrewLinks();
  const idx = current.findIndex((c) => c.token === token);

  if (idx >= 0) {
    current[idx] = { token, telegramChatId, linked, name, role, venue };
  } else {
    current.push({ token, telegramChatId, linked, name, role, venue });
  }

  writeCrewLinks(current);
  return NextResponse.json({ ok: true, count: current.length });
}
