import { NextRequest, NextResponse } from "next/server";
import { updateEventOnAccount, deleteEventOnAccount } from "@/lib/google/calendar";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const body = await request.json();
  const event = await updateEventOnAccount(body.email, eventId, body);
  return NextResponse.json({ event });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email 쿼리 파라미터 필요" }, { status: 400 });
  await deleteEventOnAccount(email, eventId);
  return NextResponse.json({ ok: true });
}
