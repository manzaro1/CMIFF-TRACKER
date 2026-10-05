import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  crew_members: defineTable({
    name: v.string(),
    role: v.string(),
    venue: v.string(),
    telegramHandle: v.string(),
    linked: v.boolean(),
    token: v.string(),
    telegramChatId: v.optional(v.string()),
  })
    .index("by_venue", ["venue"])
    .index("by_role", ["role"])
    .index("by_token", ["token"])
    .index("by_telegram_chat", ["telegramChatId"]),
  activities: defineTable({
    day: v.number(),
    start: v.number(),
    end: v.number(),
    title: v.string(),
    venue: v.string(),
    pillar: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    gear: v.optional(v.string()),
    quiet: v.boolean(),
    checks: v.optional(
      v.object({ dcp: v.boolean(), subs: v.boolean(), bak: v.boolean() }),
    ),
    delay: v.optional(v.number()),
    manual: v.optional(v.union(v.string(), v.null())),
    crewLead: v.optional(v.union(v.string(), v.null())),
    crewTechs: v.optional(v.array(v.string())),
    crewVols: v.optional(v.array(v.string())),
  })
    .index("by_day", ["day"])
    .index("by_venue", ["venue"]),
  wire_messages: defineTable({
    id: v.string(),
    time: v.string(),
    day: v.number(),
    team: v.string(),
    kind: v.string(),
    text: v.string(),
  })
    .index("by_day", ["day"])
    .index("by_team", ["team"]),
  incidents: defineTable({
    cat: v.string(),
    sev: v.string(),
    note: v.string(),
    actId: v.optional(v.string()),
    day: v.number(),
    tm: v.string(),
    status: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_day", ["day"]),
  bot_messages: defineTable({
    id: v.string(),
    seq: v.number(),
    day: v.number(),
    tm: v.string(),
    toId: v.string(),
    kind: v.string(),
    text: v.string(),
    acked: v.boolean(),
  })
    .index("by_to", ["toId"])
    .index("by_day", ["day"])
    .index("by_seq", ["seq"]),
  broadcast_logs: defineTable({
    id: v.string(),
    tm: v.string(),
    day: v.number(),
    scope: v.string(),
    n: v.number(),
    prio: v.string(),
    txt: v.string(),
  }).index("by_day", ["day"]),
});

export default schema;
