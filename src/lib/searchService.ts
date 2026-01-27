/**
 * Unified Search Service
 *
 * Provides a single interface for web search with automatic fallback:
 * - Primary: Tavily AI Search (if API key available)
 * - Fallback: DuckDuckGo (free, always available)
 *
 * Usage:
 *   import { performWebSearch } from "~/lib/searchService";
 *
 *   const results = await performWebSearch("AI document processing");
 *   // Automatically uses Tavily or DuckDuckGo based on API key availability
 */

import { search as duckDuckGoSearch } from "duck-duck-scrape";
import { performTavilySearch } from "~/app/api/agents/documentQ&A/services/tavilySearch";
import { features } from "./featureFlags";
import type { WebSearchResult } from "~/app/api/agents/documentQ&A/services/types";

/**
 * Performs a web search using the best available provider
 *
 * If Tavily API key is configured, uses Tavily AI Search (enhanced).
 * Otherwise, falls back to DuckDuckGo (free, always available).
 *
 * @param query - The search query
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Array of web search results
 *
 * @example
 * ```typescript
 * // With Tavily API key configured
 * const results = await performWebSearch("document AI tools");
 * // -> Uses Tavily (enhanced search with AI-powered relevance)
 *
 * // Without Tavily API key
 * const results = await performWebSearch("document AI tools");
 * // -> Uses DuckDuckGo (free fallback)
 * ```
 */
export async function performWebSearch(
  query: string,
  maxResults = 5
): Promise<WebSearchResult[]> {
  // Try Tavily if API key is available (Tier 2: Enhanced)
  if (features.tavilySearch.enabled) {
    try {
      console.log("[Search] Using Tavily Search (enhanced)");
      const results = await performTavilySearch(query, maxResults);

      if (results.length > 0) {
        return results;
      }

      console.log("[Search] Tavily returned no results, falling back to DuckDuckGo");
    } catch (error) {
      console.error(
        "[Search] Tavily failed, falling back to DuckDuckGo:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Fallback to DuckDuckGo (Tier 1: Core - always available)
  return performDuckDuckGoSearch(query, maxResults);
}

/**
 * Performs a search using DuckDuckGo (free fallback)
 *
 * @param query - The search query
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Array of web search results
 */
async function performDuckDuckGoSearch(
  query: string,
  maxResults = 5
): Promise<WebSearchResult[]> {
  console.log("[Search] Using DuckDuckGo (core fallback)");

  try {
    const results = await duckDuckGoSearch(query, {
      safeSearch: 1, // 0 = off, 1 = moderate, 2 = strict
    });

    if (!results.results || !Array.isArray(results.results)) {
      console.error("[Search] DuckDuckGo returned invalid results format");
      return [];
    }

    return results.results
      .slice(0, maxResults)
      .map((result) => ({
        title: result.title || "Untitled",
        url: result.url || "",
        snippet: result.description || "",
      }))
      .filter((item) => item.url && item.title);
  } catch (error) {
    console.error(
      "[Search] DuckDuckGo search failed:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Get the current search provider name (for logging/UI display)
 *
 * @returns "Tavily" or "DuckDuckGo"
 */
export function getSearchProvider(): "Tavily" | "DuckDuckGo" {
  return features.tavilySearch.enabled ? "Tavily" : "DuckDuckGo";
}

/**
 * Check if enhanced search is available
 *
 * @returns true if Tavily is enabled, false if using DuckDuckGo fallback
 */
export function hasEnhancedSearch(): boolean {
  return features.tavilySearch.enabled;
}

/**
 * Get search provider information
 *
 * @returns Information about the current search provider
 */
export function getSearchProviderInfo() {
  if (features.tavilySearch.enabled) {
    return {
      provider: "Tavily" as const,
      tier: "enhanced" as const,
      cost: "$0.05 per search",
      features: ["AI-powered relevance", "Deep web search", "Content extraction"],
    };
  }

  return {
    provider: "DuckDuckGo" as const,
    tier: "core" as const,
    cost: "Free",
    features: ["Basic web search", "Privacy-focused"],
  };
}
