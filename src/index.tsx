import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { jsxRenderer } from "hono/jsx-renderer";
import { serveStatic } from "hono/bun";

import { NotFoundPage } from "./pages/404.page";
import { HomePage } from "./pages/home.page";
import { checkHandle } from "./api/handlers";

const PORT = process.env.PORT || 3001;

const app = new Hono();

app
  .use("*", cors())
  .use("*", logger())

  .get("/api/check/:handle", async (c) => {
    const handle = c.req.param("handle");
    const result = await checkHandle(handle);
    return c.json(result);
  })

  .use(
    "*",
    jsxRenderer(({ children }) => <>{children}</>, { stream: true })
  )

  .get("/", (c) => c.render(<HomePage />))

  .get("*", serveStatic({ root: "./public" }))

  .get("*", (c) => c.render(<NotFoundPage />));

export default {
  port: PORT,
  fetch: app.fetch,
};
