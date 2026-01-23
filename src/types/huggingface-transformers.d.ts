/**
 * Type declarations for @huggingface/transformers
 */
declare module "@huggingface/transformers" {
  export interface PipelineOptions {
    quantized?: boolean;
    revision?: string;
    progress_callback?: (progress: number) => void;
  }

  export interface ClassificationResult {
    label: string;
    score: number;
  }

  export type ImageInput = string | Buffer | Uint8Array | ArrayBuffer;

  export interface ZeroShotImageClassificationPipeline {
    (
      images: ImageInput | ImageInput[],
      candidateLabels: string[],
      options?: { hypothesis_template?: string }
    ): Promise<ClassificationResult[] | ClassificationResult[][]>;
  }

  export interface TextClassificationPipeline {
    (text: string | string[]): Promise<ClassificationResult[]>;
  }

  export type Pipeline =
    | ZeroShotImageClassificationPipeline
    | TextClassificationPipeline;

  export function pipeline(
    task: "zero-shot-image-classification",
    model?: string,
    options?: PipelineOptions
  ): Promise<ZeroShotImageClassificationPipeline>;

  export function pipeline(
    task: "text-classification",
    model?: string,
    options?: PipelineOptions
  ): Promise<TextClassificationPipeline>;

  export function pipeline(
    task: string,
    model?: string,
    options?: PipelineOptions
  ): Promise<Pipeline>;
}

