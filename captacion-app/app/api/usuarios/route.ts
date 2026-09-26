import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// Esta ruta ya queda protegida por proxy.ts (todas las rutas /api/ salvo
// /api/login requieren sesión iniciada), así que cualquier usuario que haya
// iniciado sesión puede gestionar el resto de cuentas.

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, email, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => null);

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Introduce un email válido" }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 4 caracteres" },
      { status: 400 }
    );
  }

  const { salt, hash } = await hashPassword(password);

  const { data, error } = await supabase
    .from("usuarios")
    .insert({ email, password_salt: salt, password_hash: hash })
    .select("id, email, created_at")
    .single();

  if (error) {
    const mensaje = error.code === "23505" ? "Ya existe un usuario con ese email" : error.message;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
