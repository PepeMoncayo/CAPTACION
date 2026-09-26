import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "posicion_categoria",
  "nombre_apellidos",
  "fecha_nacimiento",
  "puesto",
  "lateralidad",
  "talla_cm",
  "talla_raw",
  "categoria",
  "equipo_actual",
  "temporada_25_26",
  "temporada_24_25",
  "temporada_23_24",
  "temporada_22_23",
  "nivel_estimado",
  "caracteristicas_ataque",
  "caracteristicas_defensa",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      update[field] = body[field] === "" ? null : body[field];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("jugadores")
    .update(update)
    .eq("id", id)
    .select()
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

  const { error } = await supabase.from("jugadores").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
