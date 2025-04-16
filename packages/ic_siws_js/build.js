import esbuild from "esbuild";

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
