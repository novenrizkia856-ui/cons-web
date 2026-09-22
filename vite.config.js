import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // Only PUBLIC_* variables are exposed to the browser. See .env.example.
  envPrefix: "PUBLIC_",
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        app: resolve(import.meta.dirname, "app.html"),
      },
    },
  },
  plugins: [
    {
      /* The dev server does not map /docs/ to its index.html the way Vercel does. */
      name: "cons-docs-dev-index",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const [path] = (request.url || "").split("?");
          if (path === "/docs") {
            response.statusCode = 301;
            response.setHeader("location", "/docs/");
            return response.end();
          }
          if (path === "/docs/") request.url = "/docs/index.html";
          else if (path === "/app") request.url = "/app.html";
          next();
        });
      },
    },
  ],
});
