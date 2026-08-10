import { google } from "googleapis";
import { getAuthorizedClientForAccount, listConnectedAccounts } from "./oauth";

export type TaggedEmail = {
  id: string;
  accountEmail: string;
  accountLabel: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
};

function getHeader(headers: { name?: string | null; value?: string | null }[] | undefined, name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// Read-only across every connected account (no send/compose — matches the spec).
export async function listRecentEmailsAcrossAccounts(maxResultsPerAccount = 15) {
  const accounts = await listConnectedAccounts();
  const results: TaggedEmail[] = [];

  for (const account of accounts) {
    const authClient = await getAuthorizedClientForAccount(account.email);
    const gmail = google.gmail({ version: "v1", auth: authClient });

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: maxResultsPerAccount,
      labelIds: ["INBOX"],
    });

    for (const msg of list.data.messages ?? []) {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      results.push({
        id: msg.id!,
        accountEmail: account.email,
        accountLabel: account.label,
        from: getHeader(full.data.payload?.headers, "From"),
        subject: getHeader(full.data.payload?.headers, "Subject") || "(제목 없음)",
        snippet: full.data.snippet ?? "",
        date: getHeader(full.data.payload?.headers, "Date"),
        unread: full.data.labelIds?.includes("UNREAD") ?? false,
      });
    }
  }

  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return results;
}
