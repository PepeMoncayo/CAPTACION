"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Usuario = {
  id: number;
  email: string;
  created_at: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [creando, setCreando] = useState(false);

  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [guardandoReset, setGuardandoReset] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
      const body = await res.json();
      setUsuarios(body.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, 0);
    return () => clearTimeout(t);
  }, [cargar]);

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    setError(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nuevoEmail, password: nuevaPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo crear el usuario");
      }
      setNuevoEmail("");
      setNuevaPassword("");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCreando(false);
    }
  }

  async function borrar(u: Usuario) {
    if (!confirm(`¿Quitar el acceso a ${u.email}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo borrar el usuario");
      }
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  function abrirReset(u: Usuario) {
    setResetId(u.id);
    setResetPassword("");
  }

  async function guardarReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetId === null) return;
    setGuardandoReset(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo cambiar la contraseña");
      }
      setResetId(null);
      setResetPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGuardandoReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Usuarios</h1>
            <p className="text-xs text-zinc-500">Quién puede entrar en CAPTACIÓN</p>
          </div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Volver a jugadores
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-3xl px-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Crear nuevo usuario</h2>
          <form onSubmit={crearUsuario} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">Email</span>
              <input
                type="email"
                required
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                placeholder="persona@ejemplo.com"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">Contraseña</span>
              <input
                type="text"
                required
                minLength={4}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-48 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Mínimo 4 caracteres"
              />
            </label>
            <button
              type="submit"
              disabled={creando}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creando ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && usuarios.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                    No hay usuarios todavía.
                  </td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                    <button
                      onClick={() => abrirReset(u)}
                      className="mr-3 text-zinc-500 hover:text-zinc-900"
                    >
                      Cambiar contraseña
                    </button>
                    <button onClick={() => borrar(u)} className="text-red-500 hover:text-red-700">
                      Quitar acceso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {resetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Cambiar contraseña</h2>
            <form onSubmit={guardarReset} className="flex flex-col gap-4">
              <input
                type="text"
                autoFocus
                required
                minLength={4}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Nueva contraseña (mínimo 4 caracteres)"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetId(null)}
                  className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReset}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {guardandoReset ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
