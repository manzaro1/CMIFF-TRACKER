import { ConvexHttpClient } from "convex/browser";
import { api } from "../_generated/api";

// We use the HTTP client for server-side data fetching
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function seedData() {
  try {
    const result = await client.mutation(api.examples.seedAll, {});
    return result;
  } catch (e) {
    console.error("Seed failed:", e);
    return null;
  }
}

export async function getActivities(day: number) {
  return await client.query(api.examples.getActivities, { day });
}

export async function getAllActivities() {
  return await client.query(api.examples.getAllActivities, {});
}

export async function getCrew() {
  return await client.query(api.examples.getCrew, {});
}

export async function getWireMessages(day: number, filter?: string) {
  return await client.query(api.examples.getWireMessages, { day, filter });
}

export async function addWireMessage(msg: any) {
  return await client.mutation(api.examples.addWireMessage, msg);
}

export async function getIncidents() {
  return await client.query(api.examples.getIncidents, {});
}

export async function addIncident(incident: any) {
  return await client.mutation(api.examples.addIncident, incident);
}

export async function resolveIncident(id: number) {
  return await client.mutation(api.examples.resolveIncident, { id });
}

export async function getBotMessages() {
  return await client.query(api.examples.getBotMessages, {});
}

export async function addBotMessage(msg: any) {
  return await client.mutation(api.examples.addBotMessage, msg);
}

export async function ackBotMessage(id: string) {
  return await client.mutation(api.examples.ackBotMessage, { id });
}

export async function getBroadcastLogs() {
  return await client.query(api.examples.getBroadcastLogs, {});
}

export async function addBroadcastLog(log: any) {
  return await client.mutation(api.examples.addBroadcastLog, log);
}
