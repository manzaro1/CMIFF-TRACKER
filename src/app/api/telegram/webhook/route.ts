import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data", "crew-links.json");
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Telegram API error");
  return data.result;
}

// GET /api/telegram/webhook — verify webhook is reachable
export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, endpoint: "/api/telegram/webhook", note: "This endpoint accepts POST requests from Telegram" });
}

// POST /api/telegram/webhook — receives Telegram updates
export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  // Handle callback queries (inline button presses)
  if (body.callback_query) {
    const callback = body.callback_query;
    const chatId = String(callback.message.chat.id);
    const data = callback.data;

    if (data.startsWith("/connect")) {
      const parts = data.split(" ");
      const accessCode = parts[1];
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const tm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const crew = readCrewLinks();
      const member = crew.find((c) => c.token === accessCode);

      if (member) {
        member.linked = true;
        member.telegramChatId = chatId;
        writeCrewLinks(crew);

        try {
          await sendTelegramMessage(BOT_TOKEN, chatId,
            `✅ *Connected!*\n\nWelcome ${member.name}, ${member.role} @ ${member.venue.toUpperCase()}.\n\nYou're now linked to the CMIFF Ops Board.`
          );
        } catch (e) {
          console.error("[webhook] send message error:", e);
        }
      } else {
        try {
          await sendTelegramMessage(BOT_TOKEN, chatId,
            `❌ *Invalid access code.*\n\nPlease check the code in the app and try again.`
          );
        } catch (e) {
          console.error("[webhook] send message error:", e);
        }
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Handle regular messages
  if (!body.message && !body.edited_message) {
    return NextResponse.json({ ok: true });
  }

  const msg = body.message || body.edited_message;
  const chatId = String(msg.chat.id);
  const text = (msg.text || "").trim();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const tm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Handle /connect command
  if (text.startsWith("/connect")) {
    const parts = text.split(" ");
    const accessCode = parts[1];

    if (!accessCode) {
      try {
        await sendTelegramMessage(BOT_TOKEN, chatId,
          `🎬 *CMIFF Ops Bot*\n\nTo connect your account, send:\n\`/connect <your-access-code>\`\n\nYour access code is in the app under ADMIN → Telegram Accounts.`
        );
      } catch (e) {
        console.error("[webhook] send message error:", e);
      }
      return NextResponse.json({ ok: true });
    }

    const crew = readCrewLinks();
    const memberIdx = crew.findIndex((c) => c.token === accessCode);

    if (memberIdx >= 0) {
      const member = crew[memberIdx];
      member.linked = true;
      member.telegramChatId = chatId;
      writeCrewLinks(crew);

      try {
        await sendTelegramMessage(BOT_TOKEN, chatId,
          `✅ *Connected!*\n\nWelcome ${member.name}, ${member.role} @ ${member.venue.toUpperCase()}.\n\nYou're now linked to the CMIFF Ops Board.`
        );
      } catch (e) {
        console.error("[webhook] send message error:", e);
      }
    } else {
      // Not in JSON file — check seed data
      try {
        const seedRes = await fetch("http://localhost:3000/api/seed");
        const seedData = await seedRes.json();
        const seedMember = seedData.crew?.find((c: any) => c.token === accessCode);

        if (seedMember) {
          crew.push({
            token: seedMember.token,
            telegramChatId: chatId,
            linked: true,
            name: seedMember.name,
            role: seedMember.role,
            venue: seedMember.venue,
          });
          writeCrewLinks(crew);

          try {
            await sendTelegramMessage(BOT_TOKEN, chatId,
              `✅ *Connected!*\n\nWelcome ${seedMember.name}, ${seedMember.role} @ ${seedMember.venue.toUpperCase()}.\n\nYou're now linked to the CMIFF Ops Board.`
            );
          } catch (e) {
            console.error("[webhook] send message error:", e);
          }
        } else {
          try {
            await sendTelegramMessage(BOT_TOKEN, chatId,
              `❌ *Invalid access code.*\n\nPlease check the code in the app (ADMIN → Telegram Accounts) and try again.`
            );
          } catch (e) {
            console.error("[webhook] send message error:", e);
          }
        }
      } catch (e) {
        console.error("[webhook] seed fetch error:", e);
        try {
          await sendTelegramMessage(BOT_TOKEN, chatId,
            `❌ *Invalid access code.*\n\nPlease check the code in the app (ADMIN → Telegram Accounts) and try again.`
          );
        } catch (e2) {
          console.error("[webhook] send message error:", e2);
        }
      }
    }

    return NextResponse.json({ ok: true });
  }

  // Handle regular messages from linked crew
  const crew = readCrewLinks();
  const linked = crew.find((c) => c.telegramChatId === chatId && c.linked);

  if (linked) {
    // Log the message — in production this would go to a database
    console.log(`[Telegram] ${linked.name} (${chatId}): ${text}`);
  } else if (text) {
    // Unknown sender — let them know how to connect
    try {
      await sendTelegramMessage(BOT_TOKEN, chatId,
        `👋 Hello! You're not connected to the CMIFF Ops Bot yet.\n\nSend this to connect:\n\`/connect <your-access-code>\`\n\nGet your code from the app (ADMIN → Telegram Accounts).`
      );
    } catch (e) {
      console.error("[webhook] send message error:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
