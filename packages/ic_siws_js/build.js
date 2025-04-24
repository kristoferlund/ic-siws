import esbuild from "esbuild";
// Node __dirname support for ES modules
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

esbuild.build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  splitting: true,
  external: [
    "@dfinity/agent",
    "@dfinity/candid",
    "@dfinity/identity",
    "@dfinity/principal",
    "@solana/wallet-adapter-base",
    "@solana/web3.js",
  ],
  plugins: [],
});

esbuild.build({
  entryPoints: ["./src/react/index.tsx"],
  bundle: true,
  outdir: "dist/react",
  format: "esm",
  splitting: true,
  external: [
    "@dfinity/agent",
    "@dfinity/candid",
    "@dfinity/identity",
    "@dfinity/principal",
    "@solana/wallet-adapter-base",
    "@solana/web3.js",
    "react",
    "react-dom",
  ],
});

esbuild.build({
  entryPoints: ["./src/vue/index.ts"],
  bundle: true,
  outdir: "dist/vue",
  format: "esm",
  splitting: true,
  external: [
    "@dfinity/agent",
    "@dfinity/candid",
    "@dfinity/identity",
    "@dfinity/principal",
    "@solana/wallet-adapter-base",
    "@solana/web3.js",
    "vue",
  ],
});

// Build Svelte sub-library
esbuild.build({
  entryPoints: ["./src/svelte/index.ts"],
  bundle: true,
  outdir: "dist/svelte",
  format: "esm",
  splitting: true,
  external: [
    "@dfinity/agent",
    "@dfinity/candid",
    "@dfinity/identity",
    "@dfinity/principal",
    "@solana/wallet-adapter-base",
    "@solana/web3.js",
    "svelte",
    "svelte/store",
    "*.svelte",
  ],
});
