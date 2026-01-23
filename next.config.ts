import type { NextConfig } from "next";

import "./src/env";

const config: NextConfig = {
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
    "*": [
      "node_modules/@huggingface/transformers/dist/**/*.wasm",
      "node_modules/pdfjs-dist/build/**/*.map",
      "node_modules/onnxruntime-web/dist/**/*.wasm",
      "public/vad/**/*.map",
    ],
  },

  // Exclude heavy packages from serverless bundle to reduce size (Next.js 15+)
  // These packages are loaded from node_modules at runtime instead
  serverExternalPackages: [
    "@huggingface/transformers",
    "pdf2pic",
    "pdfjs-dist",
    "onnxruntime-web",
    "sharp",
    "pdf-parse",
    "pdf-lib",
    "canvas",
    "@napi-rs/canvas",
  ],
};

export default config;

