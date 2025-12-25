import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile, copyFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // Create temporary .env.production for Vite to pick up VITE_ prefixed vars
  const envFilePath = "client/.env.production";
  const envVars = [
    `VITE_TURNSTILE_SITE_KEY=${process.env.VITE_TURNSTILE_SITE_KEY || ''}`,
  ].join('\n');
  await writeFile(envFilePath, envVars);
  console.log("created temporary client/.env.production for build");

  console.log("building client...");
  await viteBuild();

  // Clean up temporary env file
  await rm(envFilePath, { force: true });
  console.log("cleaned up temporary env file");

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Create dist/index.js as a wrapper that loads .env before running the app
  // This is needed for Hostinger where hPanel env vars don't reach lsnode.js
  console.log("creating Hostinger-compatible entry point with dotenv loader...");
  
  const wrapperCode = `// Hostinger entry point - loads .env then runs the app
const fs = require('fs');
const path = require('path');

// Load .env file from public_html root (one level up from dist/)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
  console.log('[Hostinger] Loaded environment from .env file');
}

// Now require the actual app
require('./index.cjs');
`;
  
  await writeFile("dist/index.js", wrapperCode);
  
  // Create dist/package.json to force CommonJS mode for .js files in dist/
  await writeFile("dist/package.json", JSON.stringify({ type: "commonjs" }));
  
  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
