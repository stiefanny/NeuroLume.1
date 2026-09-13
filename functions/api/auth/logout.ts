import { clearSessionCookie } from "../../_shared/auth";

export function onRequestGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const response = Response.redirect(new URL("/", url), 303);
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
