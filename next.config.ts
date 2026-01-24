import type { NextConfig } from "next";

import "./src/env";

const config: NextConfig = {
  // Configure environment to prevent HuggingFace from trying to load Node.js-specific backends
  env: {
    TRANSFORMERS_BACKEND: "webgpu",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iiazjw8b8a.ufs.sh",
        port: "",
        pathname: "/f/**",
      },
    ],
  },

  // Exclude unnecessary files from Vercel output (moved from experimental in Next.js 15)
  outputFileTracingExcludes: {
    "/api/inngest": [
      // Exclude the massive onnxruntime-node package (404MB) - not needed for Inngest
      "node_modules/.pnpm/onnxruntime-node@*/**",
      // Exclude sharp native bindings - not needed for Inngest
      "node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@*/**",
      "node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/**",
      // Exclude HuggingFace heavy files since we lazy load
      "node_modules/.pnpm/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist/**/*.wasm",
      "node_modules/.pnpm/@huggingface+transformers@*/node_modules/@huggingface/transformers/models/**",
      // Exclude pdfjs heavy files since we lazy load
      "node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/build/**/*.map",
      "node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/**",
      // Exclude pdf-parse test data
      "node_modules/.pnpm/pdf-parse@*/node_modules/pdf-parse/test/**",
    ],
  },

  // Exclude heavy packages from serverless bundle to reduce size (Next.js 15+)
  // These packages are loaded from node_modules at runtime instead
  serverExternalPackages: [
    "@huggingface/transformers",
    "pdf2pic",
    "pdfjs-dist",
    "onnxruntime-web",
    "onnxruntime-node",
    "sharp",
    "@img/sharp-libvips-linuxmusl-x64",
    "@img/sharp-libvips-linux-x64",
    "pdf-parse",
    "pdf-lib",
    "canvas",
    "@napi-rs/canvas",
  ],
};

export default config;

