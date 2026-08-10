import { google } from "googleapis";
import { getAuthorizedClientForAccount, listConnectedAccounts } from "./oauth";

export type TaggedEvent = {
  id: string;
  accountEmail: string;
  accountLabel: string;
  title: string;
  start: string | null | undefined;
  end: string | null | undefined;
  allDay: boolean;
  htmlLink?: string | null;
};

// Fetches events across every connected Google account and tags each with
// which account (업무/개인/취미/...) it belongs to.
export async function listEventsAcrossAccounts(timeMin: string, timeMax: string) {
  const accounts = await listConnectedAccounts();
  const results: TaggedEvent[] = [];

  for (const account of accounts) {
    const authClient = await getAuthorizedClientForAccount(account.email);
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    for (const event of res.data.items ?? []) {
      results.push({
        id: event.id!,
        accountEmail: account.email,
        accountLabel: account.label,
        title: event.summary ?? "(제목 없음)",
        start: event.start?.dateTime ?? event.start?.date,
        end: event.end?.dateTime ?? event.end?.date,
        allDay: !event.start?.dateTime,
        htmlLink: event.htmlLink,
      });
    }
  }

  results.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  return results;
}

export async function createEventOnAccount(
  email: string,
  event: { summary: string; description?: string; start: string; end: string; allDay?: boolean }
) {
  const authClient = await getAuthorizedClientForAccount(email);
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const body = event.allDay
    ? {
        summary: event.summary,
        description: event.description,
        start: { date: event.start },
        end: { date: event.end },
      }
    : {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
      };

  const res = await calendar.events.insert({ calendarId: "primary", requestBody: body });
  return res.data;
}

export async function updateEventOnAccount(
  email: string,
  eventId: string,
  patch: Partial<{ summary: string; description: string; start: string; end: string; allDay: boolean }>
) {
  const authClient = await getAuthorizedClientForAccount(email);
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const body: Record<string, unknown> = {};
  if (patch.summary) body.summary = patch.summary;
  if (patch.description) body.description = patch.description;
  if (patch.start) body.start = patch.allDay ? { date: patch.start } : { dateTime: patch.start };
  if (patch.end) body.end = patch.allDay ? { date: patch.end } : { dateTime: patch.end };

  const res = await calendar.events.patch({ calendarId: "primary", eventId, requestBody: body });
  return res.data;
}

export async function deleteEventOnAccount(email: string, eventId: string) {
  const authClient = await getAuthorizedClientForAccount(email);
  const calendar = google.calendar({ version: "v3", auth: authClient });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
