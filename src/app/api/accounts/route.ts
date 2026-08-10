import { NextResponse } from "next/server";
import { listConnectedAccounts } from "@/lib/google/oauth";

export async function GET() {
  const accounts = await listConnectedAccounts();
  return NextResponse.json({ accounts });
}
