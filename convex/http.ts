import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const router = httpRouter();

// ─── Telegram webhook endpoint ─────────────────────────────────────────
// Handles incoming messages from Telegram
router.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: async (ctx, req) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }), { status: 500 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "invalid JSON" }), { status: 400 });
    }

    // Handle callback query (inline button presses)
    if (body.callback_query) {
      const callback = body.callback_query;
      const chatId = String(callback.message.chat.id);
      const data = callback.data;
      
      // Parse /connect token from callback data
      if (data.startsWith("/connect")) {
        const parts = data.split(" ");
        const accessCode = parts[1];
        
        // Look up crew member
        const crew = await ctx.db
          .query("crew_members")
          .filter((q) => q.eq(q.field("token"), accessCode))
          .collect();
        
        if (crew.length > 0) {
          const member = crew[0];
          await ctx.db.patch(member._id, { linked: true, telegramChatId: chatId });
          
          // Send confirmation
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ *Connected!*\n\nWelcome ${member.name}, ${member.role} @ ${member.venue.toUpperCase()}.\n\nYou're now linked to the CMIFF Ops Board.`,
              parse_mode: "Markdown",
            }),
          });
        }
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    // Handle regular messages
    if (!body.message && !body.edited_message) {
      return new Response(JSON.stringify({ ok: true }));
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
        // Show help with inline keyboard
        const helpText = `🎬 *CMIFF Ops Bot*

To connect your account, send:
/connect <your-access-code>

Your access code is in the app under ADMIN → TELEGRAM ACCOUNTS.`;
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: helpText,
            parse_mode: "Markdown",
          }),
        });
        
        return new Response(JSON.stringify({ ok: true }));
      }

      // Look up crew member by access code
      const crew = await ctx.db
        .query("crew_members")
        .filter((q) => q.eq(q.field("token"), accessCode))
        .collect();

      if (crew.length > 0) {
        const member = crew[0];
        await ctx.db.patch(member._id, { linked: true, telegramChatId: chatId });
        
        // Send confirmation
        const confirmText = `✅ *Connected!*\n\nWelcome ${member.name}, ${member.role} @ ${member.venue.toUpperCase()}.\n\nYou're now linked to the CMIFF Ops Board.`;
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: confirmText,
            parse_mode: "Markdown",
          }),
        });
        
        await ctx.db.insert("bot_messages", {
          id: `bot_in_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          seq: Date.now(),
          day: now.getDate(),
          tm,
          toId: member._id,
          kind: "telegram",
          text: `Connected via /connect`,
          acked: false,
        });
      } else {
        // Invalid token
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `❌ *Invalid access code.*\n\nPlease check the code in the app and try again.\n\nFormat: /connect <your-code>`,
            parse_mode: "Markdown",
          }),
        });
      }
      
      return new Response(JSON.stringify({ ok: true }));
    }

    // Handle regular messages from connected crew
    const linked = await ctx.db
      .query("crew_members")
      .filter((q) => q.eq(q.field("telegramChatId"), chatId))
      .collect();

    if (linked.length > 0) {
      const member = linked[0];
      await ctx.db.insert("bot_messages", {
        id: `bot_in_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        seq: Date.now(),
        day: now.getDate(),
        tm,
        toId: member._id,
        kind: "telegram",
        text: text,
        acked: false,
      });
    } else {
      // Unknown sender
      await ctx.db.insert("bot_messages", {
        id: `bot_in_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        seq: Date.now(),
        day: now.getDate(),
        tm,
        toId: chatId,
        kind: "telegram",
        text: text,
        acked: false,
      });
    }

    return new Response(JSON.stringify({ ok: true }));
  },
});

// ─── Send message to Telegram ──────────────────────────────────────────
export const sendTelegramMessage = router.route({
  path: "/telegram/send",
  method: "POST",
  handler: async (ctx, req) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }), { status: 500 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "invalid JSON" }), { status: 400 });
    }

    const { chatId, text, parseMode = "Markdown" } = body;

    if (!chatId || !text) {
      return new Response(JSON.stringify({ ok: false, error: "chatId and text required" }), { status: 400 });
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_notification: false,
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ ok: data.ok, response: data }));
    } catch (e) {
      console.error("[Telegram send] Error:", e);
      return new Response(JSON.stringify({ ok: false, error: String(e) }));
    }
  },
});

export default router;
