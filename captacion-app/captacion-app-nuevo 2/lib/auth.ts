import { cookies } from "next/headers";

const COOKIE_NAME = "captacion_session";

// --- Utilidades de codificación ---

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// --- Contraseñas de usuario (tabla "usuarios" en Supabase) ---
// Usamos PBKDF2 vía Web Crypto (crypto.subtle), disponible tanto en el
// runtime de Node.js (Route Handlers) como en el runtime usado por proxy.ts,
// así la misma lógica funciona en ambos sitios sin dependencias externas.

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH_BYTES = 32;

async function derivePbkdf2Hex(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(saltHex).slice().buffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH_BYTES * 8
  );
  return toHex(derived);
}

export async function hashPassword(
  password: string
): Promise<{ salt: string; hash: string }> {
  const salt = randomHex(16);
  const hash = await derivePbkdf2Hex(password, salt);
  return { salt, hash };
}

export async function verifyPasswordHash(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const hash = await derivePbkdf2Hex(password, salt);
  return timingSafeEqualHex(hash, expectedHash);
}

// --- Sesiones firmadas ---
// La cookie de sesión guarda el email del usuario junto con una fecha de
// caducidad, firmados con HMAC-SHA256. El secreto de firma reutiliza la
// variable de entorno APP_PASSWORD (ya configurada en Vercel): dejó de ser
// la contraseña de acceso a la app (ahora se entra con email + contraseña,
// almacenados en la tabla "usuarios" de Supabase) y pasa a ser el secreto
// interno que firma las sesiones. No hace falta tocar Vercel para esto.

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

function sessionSecret(): string {
  return process.env.APP_PASSWORD || "captacion-fallback-secret-no-configurado";
}

async function hmacHex(value: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(signature);
}

async function createSessionToken(email: string): Promise<string> {
  const payload = JSON.stringify({ email, exp: Date.now() + SESSION_MAX_AGE_MS });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = await hmacHex(encoded);
  return `${encoded}.${signature}`;
}

async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = await hmacHex(encoded);
  if (!timingSafeEqualHex(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };
    if (!payload.email || !payload.exp || Date.now() > payload.exp) return null;
    return payload.email;
  } catch {
    return null;
  }
}

export async function setSessionCookie(email: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, await createSessionToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Devuelve el email del usuario autenticado, o null si la cookie no es
// válida o ha caducado.
export async function isRequestAuthenticated(
  cookieValue: string | undefined
): Promise<string | null> {
  return verifySessionToken(cookieValue);
}

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME };
