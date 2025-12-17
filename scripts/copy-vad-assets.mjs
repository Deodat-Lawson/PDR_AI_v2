import { mkdir, cp } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public", "vad");

await mkdir(outDir, { recursive: true });

/**
 * Copy VAD assets (worklet + models) from vad-web dist.
 * This usually includes:
 * - vad.worklet.bundle.min.js
 * - silero_vad_legacy.onnx
 * - silero_vad_v5.onnx (if present)
 */
await cp(
  path.join(root, "node_modules", "@ricky0123", "vad-web", "dist"),
  outDir,
  { recursive: true }
);

/**
 * Copy ONNX Runtime Web assets (.mjs + .wasm).
 * These are required for the WASM backend to initialize.
 */
await cp(
  path.join(root, "node_modules", "onnxruntime-web", "dist"),
  outDir,
  { recursive: true }
);

console.log("✅ Copied VAD + ORT assets to /public/vad");
