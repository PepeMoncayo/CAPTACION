"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POSICIONES = [
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
];

type Jugador = {
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
};

const EMPTY_FORM: Partial<Jugador> = {
  posicion_categoria: POSICIONES[0],
  nombre_apellidos: "",
};

function edad(fecha: string | null): string {
  if (!fecha) return "—";
  const nacimiento = new Date(fecha);
  if (Number.isNaN(nacimiento.getTime())) return "—";
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) años--;
  return `${años} años`;
}

export default function PlayersApp() {
  const router = useRouter();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posicionFiltro, setPosicionFiltro] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<Partial<Jugador>>(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (posicionFiltro !== "TODAS") params.set("posicion", posicionFiltro);
    if (busqueda) params.set("q", busqueda);
    try {
      const res = await fetch(`/api/jugadores?${params.toString()}`);
      if (!res.ok) throw new Error("No se pudieron cargar los jugadores");
      const body = await res.json();
      setJugadores(body.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [posicionFiltro, busqueda]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  const totalPorPosicion = useMemo(() => {
    const map: Record<string, number> = {};
    for (const j of jugadores) {
      map[j.posicion_categoria] = (map[j.posicion_categoria] || 0) + 1;
    }
    return map;
  }, [jugadores]);

  function abrirNuevo() {
    setForm(EMPTY_FORM);
    setModalAbierto(true);
  }

  function abrirEdicion(j: Jugador) {
    setForm(j);
    setModalAbierto(true);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const esEdicion = typeof form.id === "number";
      const url = esEdicion ? `/api/jugadores/${form.id}` : "/api/jugadores";
      const method = esEdicion ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo guardar");
      }
      setModalAbierto(false);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(j: Jugador) {
    if (!confirm(`¿Borrar a ${j.nombre_apellidos}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/jugadores/${j.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo borrar");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  async function cerrarSesion() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function campo<K extends keyof Jugador>(key: K, value: Jugador[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">CAPTACIÓN</h1>
            <p className="text-xs text-zinc-500">{jugadores.length} jugadores{posicionFiltro !== "TODAS" ? ` · ${posicionFiltro}` : ""}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/usuarios" className="text-sm text-zinc-500 hover:text-zinc-900">
              Usuarios
            </Link>
            <button
              onClick={cerrarSesion}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl px-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={posicionFiltro}
            onChange={(e) => setPosicionFiltro(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="TODAS">Todas las posiciones</option>
            {POSICIONES.map((p) => (
              <option key={p} value={p}>
                {p} {totalPorPosicion[p] ? `(${totalPorPosicion[p]})` : ""}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-56 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            onClick={abrirNuevo}
            className="ml-auto rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            + Añadir jugador
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3">Posición</th>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3">Talla</th>
                <th className="px-4 py-3">Pie</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Equipo actual</th>
                <th className="px-4 py-3">25/26</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-zinc-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && jugadores.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-zinc-400">
                    No hay jugadores que coincidan.
                  </td>
                </tr>
              )}
              {jugadores.map((j) => (
                <tr key={j.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {j.nombre_apellidos}
                    <div className="text-xs font-normal text-zinc-400">{edad(j.fecha_nacimiento)}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{j.puesto || j.posicion_categoria}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {j.fecha_nacimiento ? new Date(j.fecha_nacimiento).getFullYear() : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{j.talla_raw ?? j.talla_cm ?? "—"} cm</td>
                  <td className="px-4 py-3 text-zinc-600">{j.lateralidad || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{j.categoria || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{j.equipo_actual || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{j.temporada_25_26 || "—"}</td>
                  <td className="px-4 py-3">
                    {j.nivel_estimado && (
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                        {j.nivel_estimado}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                    <button
                      onClick={() => abrirEdicion(j)}
                      className="mr-3 text-zinc-500 hover:text-zinc-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => borrar(j)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              {typeof form.id === "number" ? "Editar jugador" : "Nuevo jugador"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Nombre y apellidos" full>
                <input
                  className="input"
                  value={form.nombre_apellidos ?? ""}
                  onChange={(e) => campo("nombre_apellidos", e.target.value)}
                />
              </Campo>
              <Campo label="Posición">
                <select
                  className="input"
                  value={form.posicion_categoria ?? POSICIONES[0]}
                  onChange={(e) => campo("posicion_categoria", e.target.value)}
                >
                  {POSICIONES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Puesto específico">
                <input
                  className="input"
                  value={form.puesto ?? ""}
                  onChange={(e) => campo("puesto", e.target.value)}
                />
              </Campo>
              <Campo label="Fecha de nacimiento">
                <input
                  type="date"
                  className="input"
                  value={form.fecha_nacimiento ?? ""}
                  onChange={(e) => campo("fecha_nacimiento", e.target.value)}
                />
              </Campo>
              <Campo label="Pie">
                <input
                  className="input"
                  value={form.lateralidad ?? ""}
                  onChange={(e) => campo("lateralidad", e.target.value)}
                />
              </Campo>
              <Campo label="Talla (cm)">
                <input
                  className="input"
                  value={form.talla_raw ?? ""}
                  onChange={(e) => campo("talla_raw", e.target.value)}
                />
              </Campo>
              <Campo label="Categoría">
                <input
                  className="input"
                  value={form.categoria ?? ""}
                  onChange={(e) => campo("categoria", e.target.value)}
                />
              </Campo>
              <Campo label="Equipo actual">
                <input
                  className="input"
                  value={form.equipo_actual ?? ""}
                  onChange={(e) => campo("equipo_actual", e.target.value)}
                />
              </Campo>
              <Campo label="Nivel estimado">
                <input
                  className="input"
                  value={form.nivel_estimado ?? ""}
                  onChange={(e) => campo("nivel_estimado", e.target.value)}
                />
              </Campo>
              <Campo label="Temporada 25/26">
                <input
                  className="input"
                  value={form.temporada_25_26 ?? ""}
                  onChange={(e) => campo("temporada_25_26", e.target.value)}
                />
              </Campo>
              <Campo label="Temporada 24/25">
                <input
                  className="input"
                  value={form.temporada_24_25 ?? ""}
                  onChange={(e) => campo("temporada_24_25", e.target.value)}
                />
              </Campo>
              <Campo label="Temporada 23/24">
                <input
                  className="input"
                  value={form.temporada_23_24 ?? ""}
                  onChange={(e) => campo("temporada_23_24", e.target.value)}
                />
              </Campo>
              <Campo label="Temporada 22/23">
                <input
                  className="input"
                  value={form.temporada_22_23 ?? ""}
                  onChange={(e) => campo("temporada_22_23", e.target.value)}
                />
              </Campo>
              <Campo label="Características ataque" full>
                <textarea
                  className="input min-h-[70px]"
                  value={form.caracteristicas_ataque ?? ""}
                  onChange={(e) => campo("caracteristicas_ataque", e.target.value)}
                />
              </Campo>
              <Campo label="Características defensa" full>
                <textarea
                  className="input min-h-[70px]"
                  value={form.caracteristicas_defensa ?? ""}
                  onChange={(e) => campo("caracteristicas_defensa", e.target.value)}
                />
              </Campo>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.nombre_apellidos}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(212 212 216);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: rgb(113 113 122);
        }
      `}</style>
    </div>
  );
}

function Campo({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
