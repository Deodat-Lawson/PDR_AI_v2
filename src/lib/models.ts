/**
 * Centralized AI Model Configuration
 *
 * This file contains all OpenAI model identifiers used throughout the application.
 * Centralizing these constants makes it easier to:
 * - Update model versions across the codebase
 * - Maintain consistency in model usage
 * - Track which models are used where
 *
 * @see https://platform.openai.com/docs/models
 */

/**
 * Chat completion models for conversational AI tasks
 */
export const CHAT_MODELS = {
  /**
   * GPT-4o - Most capable model for complex reasoning tasks
   * Best for: Document analysis, complex Q&A, structured output generation
   */
  GPT_4O: "gpt-4o",

  /**
   * GPT-4o-mini - Fast and cost-effective for simpler tasks
   * Best for: Query refinement, quick classifications, lightweight processing
   */
  GPT_4O_MINI: "gpt-4o-mini",
} as const;

/**
 * Embedding models for vector search and similarity
 */
export const EMBEDDING_MODELS = {
  /**
   * Ada 002 - Standard embedding model for text similarity
   * Dimensions: 1536
   * Best for: Document chunking, semantic search, RAG applications
   */
  ADA_002: "text-embedding-ada-002",
} as const;

/**
 * Audio transcription models for speech-to-text
 */
export const TRANSCRIPTION_MODELS = {
  /**
   * GPT-4o Transcribe - High-quality speech-to-text transcription
   * Best for: Audio transcription, voice input processing
   */
  GPT_4O_TRANSCRIBE: "gpt-4o-transcribe",
} as const;

/**
 * Default model selections for different use cases
 */
export const DEFAULT_MODELS = {
  /** Default model for document analysis and complex reasoning */
  ANALYSIS: CHAT_MODELS.GPT_4O,

  /** Default model for lightweight tasks like query refinement */
  LIGHTWEIGHT: CHAT_MODELS.GPT_4O_MINI,

  /** Default model for text embeddings */
  EMBEDDING: EMBEDDING_MODELS.ADA_002,

  /** Default model for audio transcription */
  TRANSCRIPTION: TRANSCRIPTION_MODELS.GPT_4O_TRANSCRIBE,
} as const;

// Type exports for TypeScript usage
export type ChatModel = (typeof CHAT_MODELS)[keyof typeof CHAT_MODELS];
export type EmbeddingModel =
  (typeof EMBEDDING_MODELS)[keyof typeof EMBEDDING_MODELS];
export type TranscriptionModel =
  (typeof TRANSCRIPTION_MODELS)[keyof typeof TRANSCRIPTION_MODELS];
