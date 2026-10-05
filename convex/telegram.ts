import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { requireStaff } from "./lib/auth";

export const getBotStatus = action({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured." };

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      return { ok: false, error: data.description ?? "Telegram bot check failed." };
    }
    return {
      ok: true,
      bot: {
        id: data.result.id,
        first_name: data.result.first_name,
        username: data.result.username,
      },
    };
  },
});

export const sendMessage = action({
  args: {
    chatId: v.string(),
    text: v.string(),
    parseMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured." };
    if (!args.chatId.trim() || !args.text.trim()) {
      return { ok: false, error: "A chat ID and message are required." };
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: args.chatId,
        text: args.text,
        parse_mode: args.parseMode ?? "Markdown",
        disable_notification: false,
      }),
    });
    const data = await response.json();
    return {
      ok: response.ok && Boolean(data.ok),
      error: data.description,
    };
  },
});

// Telegram updates are accepted only by the secret-checked HTTP action.
export const processWebhook = internalMutation({
  args: { update: v.any() },
  handler: async (ctx, { update }) => {
    const message = update.message ?? update.edited_message;
    const callback = update.callback_query;
    const chat = callback?.message?.chat ?? message?.chat;
    if (!chat?.id) return null;

    const chatId = String(chat.id);
    const text = String(callback?.data ?? message?.text ?? "").trim();
    const now = new Date();
    const tm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const makeMessageId = () =>
      `bot_in_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (text.startsWith("/connect")) {
      const accessCode = text.split(/\s+/, 2)[1];
      if (!accessCode) {
        return {
          chatId,
          reply:
            "🎬 *CMIFF Ops Bot*\n\nTo connect your account, send:\n`/connect your-access-code`\n\nYour code is in the tracker under ADMIN → TELEGRAM ACCOUNTS.",
        };
      }

      const member = await ctx.db
        .query("crew_members")
        .withIndex("by_token", (q) => q.eq("token", accessCode))
        .first();
      if (!member) {
        return { chatId, reply: "❌ *Invalid access code.* Check the tracker and try again." };
      }

      await ctx.db.patch(member._id, { linked: true, telegramChatId: chatId });
      await ctx.db.insert("bot_messages", {
        id: makeMessageId(),
        seq: Date.now(),
        day: now.getDate(),
        tm,
        toId: String(member._id),
        kind: "telegram",
        text: "Connected via /connect",
        acked: false,
      });
      return {
        chatId,
        reply: `✅ *Connected!*\n\nWelcome ${member.name}, ${member.role} @ ${member.venue.toUpperCase()}.\n\nYou're now linked to the CMIFF Ops Board.`,
      };
    }

    if (!message) return null;
    const member = await ctx.db
      .query("crew_members")
      .withIndex("by_telegram_chat", (q) => q.eq("telegramChatId", chatId))
      .first();
    await ctx.db.insert("bot_messages", {
      id: makeMessageId(),
      seq: Date.now(),
      day: now.getDate(),
      tm,
      toId: member ? String(member._id) : chatId,
      kind: "telegram",
      text,
      acked: false,
    });
    return null;
  },
});