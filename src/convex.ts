import { createConvexWebClient } from "convex/browser";

// Initialize the Convex web client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000";
export const convex = createConvexWebClient(convexUrl);

// Re-export all generated API functions
// These will be available after running `npx convex codegen`
export { api } from "./_generated/api";
export type { Query } from "./_generated/api";
