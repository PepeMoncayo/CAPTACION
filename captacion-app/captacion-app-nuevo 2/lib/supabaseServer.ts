import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the service_role key, which bypasses
// Row Level Security. This file must NEVER be imported from a client
// component - only from Route Handlers / Server Components.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export type Jugador = {
  id: number;
  posicion_categoria: string;
  nombre_apellidos: string | null;
  fecha_nacimiento: string | null;
  puesto: string | null;
  lateralidad: string | null;
  talla_cm: number | null;
  talla_raw: string | null;
  categoria: string | null;
  equipo_actual: string | null;
  temporada_25_26: string | null;
  temporada_24_25: string | null;
  temporada_23_24: string | null;
  temporada_22_23: string | null;
  nivel_estimado: string | null;
  caracteristicas_ataque: string | null;
  caracteristicas_defensa: string | null;
  fila_excel: number | null;
  created_at: string | null;
};

export const POSICIONES = [
  "PORTEROS",
  "LATERALES DCHO",
  "LATERALES IZQDO",
  "CENTRAL DCHO",
  "CENTRAL IZQDO",
  "MEDIOCENTRO",
  "MC AVANZADOS",
  "EXTREMOS DCHO",
  "EXTREMOS IZQDO",
  "DELANTEROS",
] as const;
