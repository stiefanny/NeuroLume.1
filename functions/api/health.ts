export function onRequestGet() {
  return Response.json({ ok: true, service: "NeuroLume Cloudflare", storage: false, model: "NoSMOTE browser runtime" });
}
