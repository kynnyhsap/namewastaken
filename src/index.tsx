import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { jsxRenderer } from "hono/jsx-renderer";
import { serveStatic } from "hono/bun";

import { NotFoundPage } from "./pages/404.page";
import { HomePage } from "./pages/home.page";

const PORT = process.env.PORT || 3003;

const app = new Hono();

app
  .use("*", cors())
  .use("*", logger())

  .use(
    "*",
    jsxRenderer(({ children }) => <>{children}</>, { stream: true })
  )

  .get("/", (c) => {
    const handle = c.req.query("handle");
    if (handle) {
      return c.redirect(`/@${handle.replace("@", "")}`);
    }
    return c.render(<HomePage />);
  })
  .get("/:handle{@.+}", (c) => c.render(<HomePage />))

  .get("*", serveStatic({ root: "./public" }));

export default {
  port: PORT,
  fetch: app.fetch,
};
