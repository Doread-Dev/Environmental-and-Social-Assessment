import { require } from "./app.js";

const apiRouter = require("../../src/routes");

// Turns Express 4's mount regexp (e.g. /^\/projects\/?(?=\/|$)/i) back into "/projects".
const mountPath = (layer) =>
  layer.regexp.source.replace(/^\^/, "").replace("\\/?(?=\\/|$)", "").replace(/\\\//g, "/");

// Every route mounted under /api/v1, read from the real routers, with its middleware chain:
// { method, prefix, path, key: "get /projects/:id", handlers: [fn, …] }.
export function listRoutes() {
  const routes = [];
  for (const layer of apiRouter.stack) {
    if (!layer.handle.stack) continue; // router-level middleware such as auth
    const prefix = mountPath(layer);
    for (const sub of layer.handle.stack) {
      if (!sub.route) continue;
      for (const method of Object.keys(sub.route.methods)) {
        const routePath = `${prefix}${sub.route.path === "/" ? "" : sub.route.path}`;
        routes.push({
          method,
          prefix,
          path: routePath,
          key: `${method} ${routePath}`,
          handlers: sub.route.stack.filter((l) => l.method === method).map((l) => l.handle),
        });
      }
    }
  }
  return routes;
}
