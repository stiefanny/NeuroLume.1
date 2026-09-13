import { protectResearchRoute, type Env } from "../_shared/auth";

export const onRequest = (context: { request: Request; env: Env; next: () => Promise<Response> }) =>
  protectResearchRoute(context.request, context.env, context.next);
