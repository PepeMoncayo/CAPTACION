import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || password.length < 4) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 4 caracteres" },
      { status: 400 }
    );
  }

  const { salt, hash } = await hashPassword(password);

  const { data, error } = await supabase
    .from("usuarios")
    .update({ password_salt: salt, password_hash: hash })
    .eq("id", id)
    .select("id, email, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("usuarios")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "No puedes borrar el único usuario que queda: te quedarías sin acceso." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("usuarios").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
