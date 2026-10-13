import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("public", { recursive: true });
await copyFile("index.html", "public/index.html");
await rm("public/brand", { recursive: true, force: true });
await cp("brand", "public/brand", { recursive: true });
await build({
  entryPoints: ["src/auth.js"],
  outfile: "public/auth.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
});

const require = createRequire(import.meta.url);
execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', 'src/site.css', '-o', 'public/site.css', '--minify', '--content', 'index.html'], { stdio: 'inherit' });
