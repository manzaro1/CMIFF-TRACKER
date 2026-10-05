import { v } from "convex/values";
import { action } from "./_generated/server";
import { requireStaff } from "./lib/auth";

// ─── Parse uploaded text into structured activities ─────────────────────
export const parseActivityFile = action({
  args: {
    day: v.number(),
    text: v.string(),
    venue: v.optional(v.string()),
    pillar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL || "https://api.openai.com/v1";
    const model = process.env.MODEL || "gpt-4o-mini";

    const VEN_MAP: Record<string, string> = {
      arena: "Beach Sports Arena (ARENA)",
      hub: "Learn & Connect Hub (HUB)",
      tent: "Film Screening Tent (TENT)",
      theatre: "Theatre & Spoken Word Stage (THTR)",
      main: "Main Stage (MAIN)",
      dj: "DJ Lounge / Sundowner Deck (DJ)",
      bonfire: "Beach & Bonfire (FIRE)",
    };
    const PIL_MAP: Record<string, string> = {
      sports: "Beach Sports",
      learn: "Learn",
      connect: "Connect",
      film: "Film",
      theatre: "Theatre & Spoken Word",
      music: "Music · DJs · Dance",
      general: "General",
    };

    const systemPrompt = `You are an expert festival programme parser for the Cape Maclear International Film Festival (CMIFF), a 3-day cultural festival in Malawi.

You receive raw text from schedules, PDFs, Excel sheets, or handwritten notes. Your job is to extract individual activities with as much structure as possible.

VENUES (use exactly these keys):
${Object.entries(VEN_MAP).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
If a venue is mentioned but not in this list, use "general".

PILLARS (use exactly these keys):
${Object.entries(PIL_MAP).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
If unclear, use "general".

STATUS heuristics:
- CONFIRMED if it has a named performer/director/facilitator
- TBC if it describes a competition/sport without results
- PENDING if it says "TBD", "to be confirmed", or needs more info
- TITLE TBC if it's a film screening with no title yet

GUESS reasonable times from context if not explicitly stated.
Treat "–" or "to" as time ranges.

Return ONLY a JSON array (no markdown, no explanation). Each item:
{
  "title": string,
  "start": "HH:MM",
  "end": "HH:MM",
  "venue": string (key from VENUES),
  "pillar": string (key from PILLARS),
  "status": "CONF" | "TBC" | "PEND" | "PROG",
  "details": string or null,
  "gear": string or null (comma-separated if multiple)
}

Return an empty array [] if the text contains no scheduleable activities.`;

    if (!apiKey) {
      // Fallback: try simple regex parsing
      return await fallbackParse(args.text, args.day, args.venue, args.pillar);
    }

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Day ${args.day} — Parse this schedule:\n\n${args.text}` },
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      let parsed: any[];
      try {
        const obj = JSON.parse(content);
        parsed = Array.isArray(obj.activities) ? obj.activities : obj;
      } catch {
        // Try to extract JSON from the response
        const match = content.match(/\[[\s\S]*\]/);
        parsed = match ? JSON.parse(match[0]) : [];
      }

      return { success: true, activities: parsed, raw: content };
    } catch (e) {
      console.error("[AI parse] Error:", e);
      return { success: false, error: String(e), activities: [] };
    }
  },
});

// Simple rule-based fallback when no API key is configured
async function fallbackParse(
  text: string,
  day: number,
  defaultVenue?: string,
  defaultPillar?: string
): Promise<{ success: boolean; activities: any[]; raw: string }> {
  const lines = text.split("\n").filter((l) => l.trim());
  const activities: any[] = [];
  const VEN = ["arena", "hub", "tent", "theatre", "main", "dj", "bonfire"];
  const PIL = ["sports", "learn", "connect", "film", "theatre", "music", "general"];

  for (const line of lines) {
    const trimmed = line.trim();
    // Try to match patterns like "09:00 - 10:00  Title" or "09:00–10:00 | Title"
    const timeMatch = trimmed.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*(.+)$/);
    if (timeMatch) {
      const [, start, end, title] = timeMatch;
      // Heuristic: find venue/pillar keywords
      let venue = defaultVenue || "general";
      let pillar = defaultPillar || "general";
      const lower = trimmed.toLowerCase();
      for (const v of VEN) {
        if (lower.includes(v)) {
          venue = v;
          break;
        }
      }
      for (const p of PIL) {
        if (lower.includes(p)) { pillar = p; break; }
      }
      activities.push({
        title: title.trim(),
        start,
        end,
        venue,
        pillar,
        status: "PEND",
        details: null,
        gear: null,
      });
    }
  }

  return { success: true, activities, raw: text };
}

// ─── AI draft for broadcast messages ───────────────────────────────────
export const aiDraftBroadcast = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL || "https://api.openai.com/v1";
    const model = process.env.MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return { text: args.prompt };
    }

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an assistant for the Cape Maclear International Film Festival (CMIFF) operations team. Draft concise, professional Telegram-style messages for festival staff. Use emojis sparingly. Keep messages under 200 words. Format with line breaks for readability.",
            },
            { role: "user", content: args.prompt },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || args.prompt;
      return { text };
    } catch (e) {
      console.error("[AI draft] Error:", e);
      return { text: args.prompt };
    }
  },
});
