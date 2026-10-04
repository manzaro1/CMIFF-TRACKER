import { defineConfig, schema } from "convex/server";
import { httpRouter } from "convex/server";

const router = httpRouter();

export default defineConfig({
  // HTTP routes for webhook handlers
  httpRouter: router,

  // Database tables
  tables: {
    // Crew members who are linked to the Telegram bot
    crew_members: schema.table({
      name: schema.string(),
      role: schema.string(), // "LEAD", "TECH", "VOL"
      venue: schema.string(),
      telegramHandle: schema.string(),
      linked: schema.boolean(),
      token: schema.string(),
      telegramChatId: schema.optional(schema.string()),
    }).index("by_venue", ["venue"]).index("by_role", ["role"]).index("by_token", ["token"]),

    // Activities in the festival schedule
    activities: schema.table({
      day: schema.number(),
      start: schema.number(), // minutes from midnight
      end: schema.number(),
      title: schema.string(),
      venue: schema.string(),
      pillar: schema.string(),
      status: schema.string(), // "CONF", "TBC", "PEND", "PROG"
      details: schema.optional(schema.string()),
      gear: schema.optional(schema.string()),
      quiet: schema.boolean(),
    }).index("by_day", ["day"]).index("by_venue", ["venue"]),

    // Wire messages (internal chat)
    wire_messages: schema.table({
      time: schema.string(),
      day: schema.number(),
      team: schema.string(),
      kind: schema.string(), // "alert", "info", "ops"
      text: schema.string(),
    }).index("by_day", ["day"]).index("by_team", ["team"]),

    // Incidents
    incidents: schema.table({
      cat: schema.string(),
      sev: schema.string(), // "CRITICAL", "HIGH", "MEDIUM", "LOW"
      note: schema.string(),
      actId: schema.optional(schema.string()),
      day: schema.number(),
      tm: schema.string(),
      status: schema.string(), // "open", "resolved"
    }).index("by_status", ["status"]).index("by_day", ["day"]),

    // Bot messages (Telegram)
    bot_messages: schema.table({
      id: schema.string(),
      seq: schema.number(),
      day: schema.number(),
      tm: schema.string(),
      toId: schema.string(), // crew member ID or chat ID
      kind: schema.string(), // "telegram", "app"
      text: schema.string(),
      acked: schema.boolean(),
    }).index("by_to", ["toId"]).index("by_day", ["day"]),

    // Broadcast logs
    broadcast_logs: schema.table({
      id: schema.string(),
      tm: schema.string(),
      day: schema.number(),
      scope: schema.string(), // "all", "venue", "role"
      n: schema.number(),
      prio: schema.string(), // "INFO", "ALERT", "CRITICAL"
      txt: schema.string(),
    }).index("by_day", ["day"]),
  },
});
