import type { NextConfig } from "next";

import "./src/env";

const config: NextConfig = {
  // Force HuggingFace Transformers to use web backend (WASM) instead of Node.js (onnxruntime-node)
  // This prevents the 404MB onnxruntime-node package from being required
  env: {
    TRANSFORMERS_BACKEND: "wasm",
    USE_ONNX_NODE: "false",
    ONNX_EXECUTION_PROVIDERS: "wasm",
  },

  // Webpack config to completely ignore onnxruntime-node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (webpackConfig: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Mark onnxruntime-node as external - never bundle it
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      webpackConfig.externals = webpackConfig.externals ?? [];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      webpackConfig.externals.push({
        "onnxruntime-node": "commonjs onnxruntime-node",
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return webpackConfig;
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
  // Apply to all routes using "/*" wildcard
  outputFileTracingExcludes: {
    "/*": [
      // Exclude the massive onnxruntime-node package (404MB) - we use web/WASM backend only
      "node_modules/.pnpm/onnxruntime-node@*/**",
      "node_modules/onnxruntime-node/**",
      "**/onnxruntime-node/**",
      // Exclude sharp native bindings - use external package
      "node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@*/**",
      "node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/**",
      // Exclude HuggingFace heavy files since we lazy load
      "node_modules/.pnpm/@huggingface+transformers@*/node_modules/@huggingface/transformers/dist/**/*.wasm",
      "node_modules/.pnpm/@huggingface+transformers@*/node_modules/@huggingface/transformers/models/**",
      // Exclude pdfjs heavy files since we lazy load
      "node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/build/**/*.map",
      "node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/**",
      // Exclude pdf-parse test data (8MB)
      "node_modules/.pnpm/pdf-parse@*/node_modules/pdf-parse/test/**",
      "node_modules/pdf-parse/test/**",
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

