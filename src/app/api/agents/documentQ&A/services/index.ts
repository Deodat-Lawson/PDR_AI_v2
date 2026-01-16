/**
 * Shared services for document Q&A endpoints
 * 
 * This module provides common functionality used by both:
 * - AIQuery: Fast, efficient query search on one document
 * - AIChat: Comprehensive search solution with conversation management
 * 
 * All types are exported from ./types for better organization and tree-shaking
 */

// Functions
export { normalizeModelContent } from "./normalizeModelContent";
export { performWebSearch } from "./webSearch";
export { performTavilySearch } from "./tavilySearch";
export { executeWebSearchAgent } from "./webSearchAgent";
export { SYSTEM_PROMPTS, getSystemPrompt, getWebSearchInstruction } from "./prompts";
export { getChatModel, getEmbeddings } from "./models";

// Types - Centralized export from types.ts
export type {
    // AI Model Types
    AIModelType,
    // Response Style Types
    ResponseStyle,
    // Web Search Types
    WebSearchResult,
    WebSearchAgentInput,
    WebSearchAgentResult,
    // Prompt Types
    AIPersona,
    WebSearchInstructionParams,
    // Search Scope Types
    SearchScope,
    // Utility Types
    PromptStyle,
    PartialDeep,
    RequiredDeep,
} from "./types";

// Type guards
export {
    isAIModelType,
    isResponseStyle,
    isAIPersona,
    isSearchScope,
} from "./types";

// Additional types from specific modules
export type { PerformWebSearchResult } from "./webSearch";

