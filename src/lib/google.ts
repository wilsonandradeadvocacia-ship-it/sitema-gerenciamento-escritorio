import { google } from "googleapis";
import { prisma } from "./prisma";

export const GOOGLE_CONFIGURED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function getOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
}

export async function getStoredTokens() {
  const row = await prisma.setting.findUnique({ where: { key: "google_tokens" } });
  return row ? JSON.parse(row.value) : null;
}

export async function storeTokens(tokens: any) {
  await prisma.setting.upsert({
    where: { key: "google_tokens" },
    update: { value: JSON.stringify(tokens) },
    create: { key: "google_tokens", value: JSON.stringify(tokens) },
  });
}

export async function isGoogleConnected() {
  if (!GOOGLE_CONFIGURED) return false;
  const tokens = await getStoredTokens();
  return !!tokens;
}

export async function getCalendarClient(redirectUri: string) {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  const auth = getOAuthClient(redirectUri);
  auth.setCredentials(tokens);
  return google.calendar({ version: "v3", auth });
}

export async function pushEventToGoogle(redirectUri: string, event: {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  endDate?: Date | null;
  allDay: boolean;
  location?: string | null;
  googleEventId?: string | null;
}) {
  const calendar = await getCalendarClient(redirectUri);
  if (!calendar) return null;

  const end = event.endDate ?? new Date(event.date.getTime() + 60 * 60 * 1000);
  const body = event.allDay
    ? {
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        start: { date: event.date.toISOString().slice(0, 10) },
        end: { date: end.toISOString().slice(0, 10) },
      }
    : {
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        start: { dateTime: event.date.toISOString() },
        end: { dateTime: end.toISOString() },
      };

  if (event.googleEventId) {
    const res = await calendar.events.update({ calendarId: "primary", eventId: event.googleEventId, requestBody: body });
    return res.data.id;
  }
  const res = await calendar.events.insert({ calendarId: "primary", requestBody: body });
  return res.data.id;
}
