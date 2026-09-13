import { createSession, passwordMatches, safeReturnPath, sessionCookie, type Env } from "../../_shared/auth";

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const form = await request.formData();
  const supplied = String(form.get("password") || "");
  const returnTo = safeReturnPath(String(form.get("return_to") || "/research"));
  const url = new URL(request.url);
  if (!env.RESEARCH_PASSWORD || env.RESEARCH_PASSWORD.length < 8 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    return Response.redirect(new URL(`/login/?error=config&return_to=${encodeURIComponent(returnTo)}`, url), 303);
  }
  if (!passwordMatches(supplied, env.RESEARCH_PASSWORD)) {
    return Response.redirect(new URL(`/login/?error=invalid&return_to=${encodeURIComponent(returnTo)}`, url), 303);
  }
  const response = Response.redirect(new URL(`${returnTo}/`, url), 303);
  response.headers.set("Set-Cookie", sessionCookie(await createSession(env.SESSION_SECRET)));
  return response;
}
