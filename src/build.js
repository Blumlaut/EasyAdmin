const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["bot/**/*.js"], // Change this to your main script
  bundle: true,
  minify: false,
  platform: "node",
  target: "node22", // Match your node_version
  outdir: "../dist",
  treeShaking: true,
  ignoreAnnotations: true,
  define: { "process.env.NODE_ENV": '"development"' },
  external: ["zlib-sync"], // These modules may need native bindings and should be installed on the server
}).catch(() => process.exit(1));
