import * as esbuild from "esbuild"
import { rm } from "node:fs/promises"

const production = process.env.RAILS_ENV === "production" || process.env.NODE_ENV === "production"
const watch = process.argv.includes("--watch")
const staleEntryPointOutputs = [
  "app/assets/builds/dummy_tw.js",
  "app/assets/builds/dummy_tw.js.map",
  "app/assets/builds/el-transition.js",
  "app/assets/builds/el-transition.js.map",
  "app/assets/builds/locales.js",
  "app/assets/builds/locales.js.map",
  "app/assets/builds/react_app.css",
  "app/assets/builds/react_app.css.map",
  "app/assets/builds/react_app.js",
  "app/assets/builds/react_app.js.map",
]

const options = {
  entryPoints: ["app/javascript/application.js"],
  bundle: true,
  sourcemap: !production,
  minify: production,
  outdir: "app/assets/builds",
  publicPath: "/assets",
  loader: {
    ".js": "jsx",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
  },
  legalComments: production ? "none" : "inline",
}

await Promise.all(staleEntryPointOutputs.map((path) => rm(path, { force: true })))

if (production) {
  await Promise.all([
    rm("app/assets/builds/application.js.map", { force: true }),
    rm("app/assets/builds/application.css.map", { force: true }),
  ])
}

if (watch) {
  const context = await esbuild.context(options)
  await context.watch()
  console.log(`esbuild watching (${production ? "production" : "development"})`)
} else {
  await esbuild.build(options)
}
