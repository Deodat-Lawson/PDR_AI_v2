import type { OCRProvider } from "~/lib/ocr/types";
import { pipeline } from "@huggingface/transformers";
import { PDFDocument } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import { fromBuffer } from "pdf2pic";

// --- Configuration ---
const SAMPLING_CONFIG = {
    MIN_PAGES_TO_SAMPLE: 3,
    MAX_PAGES_TO_SAMPLE: 5,
    VISION_MODEL_ID: "google/siglip-base-patch16-224",
    CONFIDENCE_THRESHOLD: 0.60,
    RENDER_SCALE: 2, // Lower scale saves memory in serverless
  };

const COMPLEX_LABELS = [
  "handwritten notes",
  "messy scanned document",
  "receipt or invoice",
  "complex table structure"
];

const SIMPLE_LABELS = [
  "digital text document",
  "clean screenshot",
  "blank page"
];

const ALL_COMPLEXITY_LABELS = [...COMPLEX_LABELS, ...SIMPLE_LABELS];

// --- Interfaces ---
interface VisionClassification {
  label: string;
  score: number;
}

export interface RoutingDecision {
  provider: OCRProvider;
  reason: string;
  confidence: number;
  // Added pageCount to interface so it propagates to the main workflow
  pageCount: number; 
  visionResult?: VisionClassification;
}

// --- Singleton Vision Model ---
let visionClassifier: any = null;

async function getVisionClassifier() {
  if (!visionClassifier) {
    console.log("Loading Vision Model (SigLIP)...");
    visionClassifier = await pipeline("zero-shot-image-classification", SAMPLING_CONFIG.VISION_MODEL_ID);
  }
  return visionClassifier;
}

// --- Helper: Page Sampling ---
export function selectSamplePages(totalPages: number): number[] {
  if (totalPages <= SAMPLING_CONFIG.MIN_PAGES_TO_SAMPLE) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(Math.ceil(totalPages / 2));
  pages.add(totalPages);

  if (totalPages > 20) {
    const randomPage = Math.floor(Math.random() * (totalPages - 2)) + 2;
    pages.add(randomPage);
  }

  return Array.from(pages).sort((a, b) => a - b).slice(0, SAMPLING_CONFIG.MAX_PAGES_TO_SAMPLE);
}

// --- Helper: Vision Check ---
async function runVisionCheck(images: Uint8Array[]): Promise<VisionClassification> {
  const classifier = await getVisionClassifier();
  
  let maxComplexityScore = 0;
  let dominantLabel = "digital text document";

  for (const image of images) {
    const result: any = await classifier(image, ALL_COMPLEXITY_LABELS);
    const topMatch = result[0];

    if (COMPLEX_LABELS.includes(topMatch.label)) {
      if (topMatch.score > maxComplexityScore) {
        maxComplexityScore = topMatch.score;
        dominantLabel = topMatch.label;
      }
    }
  }
  
  if (maxComplexityScore === 0 && images.length > 0) {
     const result: any = await classifier(images[0], ALL_COMPLEXITY_LABELS);
     return { label: result[0].label, score: result[0].score };
  }

  return { label: dominantLabel, score: maxComplexityScore };
}

async function renderPagesToImages(buffer: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array[]> {
  try {
    const converter = fromBuffer(Buffer.from(buffer), {
      density: 200,
      format: "png",
      width: 1024,
      height: 1448,
    });

    const images: Uint8Array[] = [];

    for (const pageIndex of pageIndices) {
      try {
        const result = await converter(pageIndex, { responseType: "buffer" });
        if (result?.buffer) {
          images.push(result.buffer);
        }
      } catch (pageError: any) {
        // Only log if it's not a common error
        if (!pageError?.message?.includes('page number')) {
          console.warn(`Failed to render page ${pageIndex}:`, pageError);
        }
      }
    }

    return images;
  } catch (error: any) {
    console.warn(`PDF rendering unavailable (${error?.message || 'unknown error'}), falling back to OCR`);
    return [];
  }
}

export async function determineDocumentRouting(documentUrl: string): Promise<RoutingDecision> {
  const response = await fetch(documentUrl);
  const buffer = await response.arrayBuffer();

  let pageCount = 0;
  let hasInteractiveForms = false;

  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pageCount = doc.getPageCount();
    hasInteractiveForms = doc.getForm().getFields().length > 0;
    
    if (hasInteractiveForms) {
      return {
        provider: "NATIVE_PDF",
        reason: "Interactive form fields detected",
        confidence: 0.99,
        pageCount
      };
    }
  } catch (e) {
    console.warn("PDF Structure load failed, assuming standard processing needed", e);
    // If we can't load structure, we might default pageCount to 1 or fail
    pageCount = 1; 
  }

try {
    // Use pdf-parse to extract text sample (dynamic import to avoid test file issues)
    const { default: pdfParse } = await import("pdf-parse");
    const data = await pdfParse(buffer);
    const sampleText = data.text.substring(0, 200).trim();

    // If we have substantial text, trust the native parser
    if (sampleText.length > 50) {
      return {
        provider: "NATIVE_PDF",
        reason: `Text layer detected (sampled ~${sampleText.length} chars)`,
        confidence: 0.95,
        pageCount: pageCount || data.numpages
      };
    }
  } catch (e: any) {
    // Suppress pdf-parse debug mode test file errors (harmless)
    if (e?.code !== 'ENOENT' || !e?.path?.includes('test/data')) {
      console.warn("Text extraction failed, proceeding to vision check.", e);
    }
  }

  // 4. Vision Analysis (Slow / Expensive)
  // Only reached if it's not a Form and has no Text Layer (likely a scan)
  try {
    const pagesToSample = selectSamplePages(pageCount);
    const images = await renderPagesToImages(buffer, pagesToSample);

    if (images.length === 0) {
       return {
         provider: "AZURE",
         reason: "No text layer detected, using OCR",
         confidence: 0.5,
         pageCount
        };
    }

    const visionResult = await runVisionCheck(images);

    // If Vision detects handwriting/messiness -> Landing AI
    if (COMPLEX_LABELS.includes(visionResult.label) && visionResult.score > SAMPLING_CONFIG.CONFIDENCE_THRESHOLD) {
      return {
        provider: "LANDING_AI",
        reason: `Vision detected '${visionResult.label}'`,
        confidence: visionResult.score,
        visionResult,
        pageCount
      };
    }

    // Otherwise -> Azure (clean scans)
    return {
      provider: "AZURE",
      reason: `Vision detected clean layout '${visionResult.label}'`,
      confidence: visionResult.score,
      visionResult,
      pageCount
    };

  } catch (error: any) {
    // Only log unexpected errors
    if (!error?.message?.includes('ENOENT')) {
      console.warn("Vision routing failed, defaulting to Azure OCR:", error?.message || error);
    }
    return {
      provider: "AZURE",
      reason: "Defaulting to OCR",
      confidence: 0.5,
      pageCount
    };
  }
}