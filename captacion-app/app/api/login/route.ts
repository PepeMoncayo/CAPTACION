import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordHash, setSessionCookie } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("email, password_salt, password_hash")
    .ilike("email", email)
    .maybeSingle();

  if (error || !usuario) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const valido = await verifyPasswordHash(
    password,
    usuario.password_salt,
    usuario.password_hash
  );

  if (!valido) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  await setSessionCookie(usuario.email);
  return NextResponse.json({ ok: true });
}
