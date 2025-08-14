import type { Plugin } from "vite";
import * as path from "@std/path";

export function pathWithRoot(fileOrDir: string, root?: string): string {
  if (path.isAbsolute(fileOrDir)) return fileOrDir;

  if (root === undefined) {
    return path.join(Deno.cwd(), fileOrDir);
  }

  if (path.isAbsolute(root)) return path.join(root, fileOrDir);

  return path.join(Deno.cwd(), root, fileOrDir);
}

export function fresh(config?: any): Plugin[] {
  const fConfig: any = {
    serverEntry: config?.serverEntry ?? "main.ts",
    islandsDir: config?.islandsDir ?? "islands",
    routeDir: config?.routeDir ?? "routes",
    ignore: config?.ignore ?? [],
  };

  return [
    {
      name: "fresh",
      config(config, env) {
        return {
          esbuild: {
            jsx: "automatic",
            jsxImportSource: "preact",
            jsxDev: env.command === "serve",
          },
          resolve: {
            alias: {
              "react-dom/test-utils": "preact/test-utils",
              "react-dom": "preact/compat",
              react: "preact/compat",
              // "@preact/signals": "npm:@preact/signals",
            },
            dedupe: [
              "preact",
              "preact/hooks",
              "preact/jsx-runtime",
              "preact/jsx-dev-runtime",
              "preact/compat",
              "@preact/signals",
              "@preact/signals-core",
            ],
          },

          publicDir: pathWithRoot("static", config.root),

          builder: {
            async buildApp(builder) {
              // Build client env first
              const clientEnv = builder.environments.client;
              if (clientEnv !== undefined) {
                await builder.build(clientEnv);
              }

              await Promise.all(
                Object.values(builder.environments).filter((env) =>
                  env !== clientEnv
                ).map((env) => builder.build(env)),
              );
            },
          },
          environments: {
            client: {
              build: {
                copyPublicDir: false,
                manifest: true,

                outDir: config.environments?.client?.build?.outDir ??
                  "_fresh/client",
                rollupOptions: {
                  preserveEntrySignatures: "strict",
                  input: {
                    "client-entry": "fresh:client-entry",
                    "client-snapshot": "fresh:client-snapshot",
                  },
                },
              },
            },
            ssr: {
              build: {
                manifest: false,
                copyPublicDir: false,

                outDir: config.environments?.ssr?.build?.outDir ??
                  "_fresh/server",
                rollupOptions: {
                  input: {
                    "server-entry": "fresh:server_entry",
                  },
                },
              },
            },
          },
        };
      },
      configResolved(config) {
        fConfig.islandsDir = pathWithRoot(fConfig.islandsDir, config.root);
        fConfig.routeDir = pathWithRoot(fConfig.routeDir, config.root);
      },
    },
  ];
}
