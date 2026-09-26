import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
