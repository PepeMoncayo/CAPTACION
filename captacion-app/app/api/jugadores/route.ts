import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const posicion = searchParams.get("posicion");
  const q = searchParams.get("q");

  let query = supabase.from("jugadores").select("*").order("posicion_categoria").order("fila_excel");

  if (posicion && posicion !== "TODAS") {
    query = query.eq("posicion_categoria", posicion);
  }
  if (q) {
    query = query.ilike("nombre_apellidos", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => null);

  if (!body || typeof body.nombre_apellidos !== "string" || !body.nombre_apellidos.trim()) {
    return NextResponse.json({ error: "El nombre del jugador es obligatorio" }, { status: 400 });
  }
  if (!body.posicion_categoria) {
    return NextResponse.json({ error: "La posición es obligatoria" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("jugadores")
    .insert({
      posicion_categoria: body.posicion_categoria,
      nombre_apellidos: body.nombre_apellidos,
      fecha_nacimiento: body.fecha_nacimiento || null,
      puesto: body.puesto || null,
      lateralidad: body.lateralidad || null,
      talla_cm: body.talla_cm || null,
      talla_raw: body.talla_raw || null,
      categoria: body.categoria || null,
      equipo_actual: body.equipo_actual || null,
      temporada_25_26: body.temporada_25_26 || null,
      temporada_24_25: body.temporada_24_25 || null,
      temporada_23_24: body.temporada_23_24 || null,
      temporada_22_23: body.temporada_22_23 || null,
      nivel_estimado: body.nivel_estimado || null,
      caracteristicas_ataque: body.caracteristicas_ataque || null,
      caracteristicas_defensa: body.caracteristicas_defensa || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
