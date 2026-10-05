/* eslint-disable */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import { anyApi } from "convex/server";
import type * as ai from "../ai.js";
import type * as examples from "../examples.js";
import type * as staff from "../staff.js";
import type * as telegram from "../telegram.js";

const fullApi: ApiFromModules<{
  ai: typeof ai;
  examples: typeof examples;
  staff: typeof staff;
  telegram: typeof telegram;
}> = anyApi as any;

export const api: FilterApi<typeof fullApi, FunctionReference<any, "public">> =
  anyApi as any;
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;