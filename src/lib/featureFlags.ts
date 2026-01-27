/**
 * Feature Flags System
 *
 * Auto-detects which features are enabled based on available API keys.
 * Enables graceful degradation when optional services are not configured.
 *
 * Usage:
 *   import { features, getDeploymentTier } from "~/lib/featureFlags";
 *
 *   if (features.tavilySearch.enabled) {
 *     // Use Tavily
 *   } else {
 *     // Fall back to DuckDuckGo
 *   }
 */

import { env } from "~/env";

export const features = {
  /**
   * Tavily AI Search
   * - Enhanced: Premium AI-powered search with Tavily API
   * - Fallback: Free DuckDuckGo search (duck-duck-scrape package)
   */
  tavilySearch: {
    enabled: !!env.server.TAVILY_API_KEY,
    fallback: "duck-duck-scrape",
    description: "Enhanced web search with Tavily API",
    cost: "$0.05 per search",
  },

  /**
   * OCR Processing
   * - Enhanced: Datalab Marker API for scanned documents
   * - Fallback: Text-only PDF processing (no OCR)
   */
  ocr: {
    enabled: !!env.server.DATALAB_API_KEY,
    fallback: "disabled",
    description: "OCR processing for scanned documents",
    cost: "$0.30-2 per page",
  },

  /**
   * Azure Document Intelligence (Alternative OCR)
   */
  azureOcr: {
    enabled: !!(
      env.server.AZURE_DOC_INTELLIGENCE_ENDPOINT &&
      env.server.AZURE_DOC_INTELLIGENCE_KEY
    ),
    fallback: "disabled",
    description: "Azure OCR for document processing",
    cost: "$0.50-2 per page",
  },

  /**
   * Landing.AI (Complex document OCR)
   */
  landingOcr: {
    enabled: !!env.server.LANDING_AI_API_KEY,
    fallback: "disabled",
    description: "Landing.AI for complex documents with handwriting",
    cost: "$0.30 per page",
  },

  /**
   * Text-to-Speech (ElevenLabs)
   * - Enhanced: ElevenLabs voice synthesis
   * - Fallback: Browser Web Speech API
   */
  tts: {
    enabled: !!env.server.ELEVENLABS_API_KEY,
    fallback: "browser-tts",
    description: "ElevenLabs voice synthesis for Study Agent",
    cost: "$0.30 per 1K characters",
  },

  /**
   * AI Model Availability
   * OpenAI is always required, others are optional
   */
  aiModels: {
    openai: true, // Always available (required in env.ts)
    claude: !!env.server.ANTHROPIC_API_KEY,
    gemini: !!env.server.GOOGLE_AI_API_KEY,
  },

  /**
   * LangSmith Tracing
   * - Enabled: LangSmith monitoring and debugging
   * - Disabled: No tracing (production default)
   */
  langsmith: {
    enabled: !!(
      env.server.LANGCHAIN_TRACING_V2 && env.server.LANGCHAIN_API_KEY
    ),
    fallback: "disabled",
    description: "LangSmith tracing for development/debugging",
    cost: "Free tier available",
  },
} as const;

/**
 * Calculate the current deployment tier based on enabled features
 *
 * - Core: Minimum required features (OpenAI, Clerk, UploadThing)
 * - Enhanced: Core + at least 1 optional feature
 * - Full: Enhanced + multi-model AI support
 *
 * @returns Current deployment tier
 */
export function getDeploymentTier(): "core" | "enhanced" | "full" {
  const enhancedFeatureCount = [
    features.tavilySearch.enabled,
    features.ocr.enabled || features.azureOcr.enabled || features.landingOcr.enabled,
    features.tts.enabled,
  ].filter(Boolean).length;

  const hasExtraModels = features.aiModels.claude || features.aiModels.gemini;

  // Full tier: Enhanced features + multi-model support
  if (hasExtraModels && enhancedFeatureCount >= 2) {
    return "full";
  }

  // Enhanced tier: At least one optional feature enabled
  if (enhancedFeatureCount >= 1) {
    return "enhanced";
  }

  // Core tier: Only required features
  return "core";
}

/**
 * Get a summary of enabled features for logging/debugging
 */
export function getFeatureSummary() {
  const tier = getDeploymentTier();

  return {
    tier,
    features: {
      search: features.tavilySearch.enabled ? "Tavily" : "DuckDuckGo",
      ocr: features.ocr.enabled
        ? "Datalab"
        : features.azureOcr.enabled
          ? "Azure"
          : features.landingOcr.enabled
            ? "Landing.AI"
            : "Disabled",
      tts: features.tts.enabled ? "ElevenLabs" : "Browser",
      aiModels: [
        "OpenAI",
        features.aiModels.claude && "Claude",
        features.aiModels.gemini && "Gemini",
      ]
        .filter(Boolean)
        .join(", "),
      monitoring: features.langsmith.enabled ? "LangSmith" : "None",
    },
  };
}

/**
 * Check if any OCR provider is available
 */
export function hasOcrSupport(): boolean {
  return (
    features.ocr.enabled ||
    features.azureOcr.enabled ||
    features.landingOcr.enabled
  );
}

/**
 * Get the preferred OCR provider based on availability
 * Priority: Datalab > Azure > Landing.AI
 */
export function getOcrProvider():
  | "datalab"
  | "azure"
  | "landing"
  | "disabled" {
  if (features.ocr.enabled) return "datalab";
  if (features.azureOcr.enabled) return "azure";
  if (features.landingOcr.enabled) return "landing";
  return "disabled";
}
