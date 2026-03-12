import { Hono } from "hono";

type Bindings = {
  ASSETS: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
  API_BASE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

function getApiBaseUrl(env: Bindings): string {
  return (env.API_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
}

async function proxyApi(
  c: { env: Bindings; req: { raw: Request } },
  path: string,
): Promise<Response> {
  const targetUrl = `${getApiBaseUrl(c.env)}${path}`;
  const sourceRequest = c.req.raw;

  const headers = new Headers(sourceRequest.headers);
  headers.set("accept", "application/json");

  const body =
    sourceRequest.method === "GET" || sourceRequest.method === "HEAD"
      ? undefined
      : await sourceRequest.text();

  const response = await fetch(targetUrl, {
    method: sourceRequest.method,
    headers,
    body,
  });

  const proxiedHeaders = new Headers(response.headers);
  proxiedHeaders.set("cache-control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: proxiedHeaders,
  });
}

app.post("/api/check", (c) => proxyApi(c, "/api/check"));
app.get("/api/health", (c) => proxyApi(c, "/api/health"));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
