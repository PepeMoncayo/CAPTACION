import { cookies } from "next/headers";

const COOKIE_NAME = "captacion_session";

// Uses Web Crypto (crypto.subtle), available both in the Node.js runtime
// (route handlers) and the Edge runtime (middleware), so the same logic
// can run in both places.
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedCookieValue(): Promise<string> {
  const password = process.env.APP_PASSWORD || "";
  return sha256Hex(`captacion-session:${password}`);
}

export function checkPassword(candidate: string): boolean {
  const password = process.env.APP_PASSWORD || "";
  if (!password) return false;
  if (candidate.length !== password.length) return false;
  // Comparación en tiempo constante básica.
  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= candidate.charCodeAt(i) ^ password.charCodeAt(i);
  }
  return diff === 0;
}

export async function setSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, await expectedCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return false;
  return value === (await expectedCookieValue());
}

export async function isRequestAuthenticated(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  return cookieValue === (await expectedCookieValue());
}

export { COOKIE_NAME };
