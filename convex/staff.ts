import { query } from "./_generated/server";
import { isStaff } from "./lib/auth";

// This reveals only whether the signed-in user is on the allowlist.
export const access = query({
  args: {},
  handler: async (ctx) => ({
    authenticated: Boolean(await ctx.auth.getUserIdentity()),
    staff: await isStaff(ctx),
  }),
});