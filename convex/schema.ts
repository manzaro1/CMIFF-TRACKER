import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    quiet: v.optional(v.boolean()),
    checks: v.optional(v.object({ dcp: v.boolean(), subs: v.boolean(), bak: v.boolean() })),
    delay: v.optional(v.number()),
    manual: v.optional(v.string()),
  })
    .index("by_day_venue", ["day", "venue"])
    .index("by_day", ["day"]),

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
    .index("by_chat_id", ["telegramChatId"]),

  wire_messages: defineTable({
    id: v.string(),
    time: v.string(),
    day: v.number(),
    team: v.string(),
    kind: v.string(),
    text: v.string(),
    sev: v.optional(v.string()),
    cat: v.optional(v.string()),
    incId: v.optional(v.string()),
    status: v.optional(v.string()),
  })
    .index("by_day", ["day"]),

  incidents: defineTable({
    id: v.number(),
    cat: v.string(),
    sev: v.string(),
    note: v.string(),
    actId: v.optional(v.string()),
    day: v.number(),
    tm: v.string(),
    status: v.string(),
  })
    .index("by_day", ["day"])
    .index("by_status", ["status"]),

  bot_messages: defineTable({
    id: v.string(),
    seq: v.number(),
    day: v.number(),
    tm: v.string(),
    toId: v.string(),
    kind: v.string(),
    text: v.string(),
    actId: v.optional(v.string()),
    ruleId: v.optional(v.string()),
    acked: v.boolean(),
  })
    .index("by_to", ["toId"])
    .index("by_day", ["day"]),

  broadcast_logs: defineTable({
    id: v.string(),
    tm: v.string(),
    day: v.number(),
    scope: v.string(),
    n: v.number(),
    prio: v.string(),
    txt: v.string(),
  })
    .index("by_day", ["day"]),
});
