import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

http.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const suppliedSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!expectedSecret || suppliedSecret !== expectedSecret) {
      return json({ ok: false, error: "Unauthorized webhook." }, 401);
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return json({ ok: false, error: "Bot is not configured." }, 503);

    let update: any;
    try {
      update = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON." }, 400);
    }

    const reply = await ctx.runMutation(internal.telegram.processWebhook, { update });
    if (reply?.reply) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: reply.chatId,
          text: reply.reply,
          parse_mode: "Markdown",
        }),
      });
    }
    return json({ ok: true });
  }),
});

export default http;