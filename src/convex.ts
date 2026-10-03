import { createConvexWebClient } from "convex/browser";

// Initialize the Convex web client
// Once deployed, replace with your actual Convex URL
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000";
export const convex = createConvexWebClient(convexUrl);

// Re-export all generated API functions
export { api } from "./_generated/api";
export type { Query } from "./_generated/api";
