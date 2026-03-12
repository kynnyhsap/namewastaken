import { Hono } from "hono";

type Bindings = {
  ASSETS: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
  API_BASE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

function getApiBaseUrl(env: Bindings): string {
  return (env.API_BASE_URL ?? "https://api.namewastaken.co").replace(/\/$/, "");
}

async function proxyApi(c: { env: Bindings; req: { raw: Request } }): Promise<Response> {
  const sourceUrl = new URL(c.req.raw.url);
  const targetUrl = `${getApiBaseUrl(c.env)}${sourceUrl.pathname}${sourceUrl.search}`;
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

app.get("/health", (c) => proxyApi(c));
app.get("/check/:username", (c) => proxyApi(c));
app.get("/check/:username/:platform", (c) => proxyApi(c));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
