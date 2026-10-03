import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const { chatId, text, parseMode = "Markdown" } = body;

  if (!chatId || !text) {
    return NextResponse.json({ ok: false, error: "chatId and text required" }, { status: 400 });
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
    
    if (data.ok) {
      return NextResponse.json({ ok: true, messageId: data.result.message_id });
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: data.description || "Telegram API error",
        errorCode: data.error_code 
      }, { status: 400 });
    }
  } catch (e) {
    console.error("[Telegram send] Error:", e);
    return NextResponse.json({ ok: false, error: String(e) });
  }
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    
    if (data.ok) {
      return NextResponse.json({
        ok: true,
        bot: {
          id: data.result.id,
          first_name: data.result.first_name,
          username: data.result.username,
          can_join_groups: data.result.can_join_groups,
          can_read_all_group_messages: data.result.can_read_all_group_messages,
          supports_inline_queries: data.result.supports_inline_queries,
        }
      });
    } else {
      return NextResponse.json({ ok: false, error: data.description });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
