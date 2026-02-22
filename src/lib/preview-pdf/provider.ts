import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { env } from "~/env";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 60_000;

function sanitizeFilename(filename: string): string {
  const parsed = path.parse(filename);
  const safeBase = parsed.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "document";
  const safeExt = parsed.ext.replace(/[^a-zA-Z0-9.]/g, "");
  return `${safeBase}${safeExt}`;
}

async function convertWithGotenberg(params: {
  bytes: Buffer;
  filename: string;
  mimeType?: string;
}): Promise<Buffer> {
  const endpoint = `${process.env.GOTENBERG_URL!.replace(/\/$/, "")}/forms/libreoffice/convert`;
  const formData = new FormData();
  const blob = new Blob([Uint8Array.from(params.bytes)], {
    type: params.mimeType ?? "application/octet-stream",
  });
  formData.append("files", blob, sanitizeFilename(params.filename));

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Gotenberg conversion failed (${response.status}): ${body.slice(0, 400)}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function convertWithLibreOffice(params: {
  bytes: Buffer;
  filename: string;
}): Promise<Buffer> {
  const safeFilename = sanitizeFilename(params.filename);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-to-pdf-"));
  const inputPath = path.join(workDir, safeFilename);
  const outputPath = path.join(
    workDir,
    `${path.parse(safeFilename).name}.pdf`
  );

  try {
    await fs.writeFile(inputPath, params.bytes);

    await execFileAsync(
      "soffice",
      [
        "--headless",
        "--nologo",
        "--nolockcheck",
        "--nodefault",
        "--nofirststartwizard",
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        inputPath,
      ],
      { timeout: DEFAULT_TIMEOUT_MS }
    );

    return await fs.readFile(outputPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        "LibreOffice CLI (soffice) is not installed. Install LibreOffice or set GOTENBERG_URL."
      );
    }
    throw error;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function convertOfficeToPdf(params: {
  bytes: Buffer;
  filename: string;
  mimeType?: string;
  retries?: number;
}): Promise<Buffer> {
  const retries = params.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (process.env.GOTENBERG_URL) {
        return await convertWithGotenberg(params);
      }
      return await convertWithLibreOffice(params);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await delay(500 * (attempt + 1));
    }
  }

  const context = randomUUID().slice(0, 8);
  throw new Error(
    `Office-to-PDF conversion failed after ${retries + 1} attempts [ctx=${context}]: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

