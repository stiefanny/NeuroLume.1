export interface Env {
  RESEARCH_PASSWORD?: string;
  SESSION_SECRET?: string;
}

const COOKIE_NAME = "neurolume_research";
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function cookies(request: Request) {
  const result = new Map<string, string>();
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0) result.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }
  return result;
}

function constantTimeEqual(left: string, right: string) {
  const size = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < size; index += 1) difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return difference === 0;
}

export function safeReturnPath(value: string | null) {
  return value === "/admin" || value === "/research" ? value : "/research";
}

export async function createSession(secret: string) {
  const payload = `${Date.now() + SESSION_SECONDS * 1000}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function validSession(request: Request, secret: string) {
  const token = cookies(request).get(COOKIE_NAME);
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!Number.isFinite(Number(payload)) || Number(payload) < Date.now()) return false;
  return constantTimeEqual(signature, await hmac(payload, secret));
}

export function sessionCookie(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function passwordMatches(supplied: string, expected: string) {
  return constantTimeEqual(supplied, expected);
}

export async function protectResearchRoute(request: Request, env: Env, next: () => Promise<Response>) {
  if (env.SESSION_SECRET && await validSession(request, env.SESSION_SECRET)) return next();
  const url = new URL(request.url);
  const destination = url.pathname.startsWith("/admin") ? "/admin" : "/research";
  return Response.redirect(new URL(`/login/?return_to=${encodeURIComponent(destination)}`, url), 302);
}
