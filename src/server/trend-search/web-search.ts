import { env } from "~/env";
import type { PlannedQuery, RawSearchResult } from "~/server/trend-search/types";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const MAX_RESULTS_PER_QUERY = 10;
const MAX_RETRIES = 2;

/** Response shape from Tavily /search API (subset we use) */
interface TavilyResultItem {
    title?: string;
    url?: string;
    content?: string;
    score?: number;
}

interface TavilySearchResponse {
    results?: TavilyResultItem[];
}

/**
 * Calls Tavily search API for a single query with advanced depth and news topic.
 * @returns RawSearchResult[] or empty array on missing key / parse failure
 */
async function callTavily(query: string): Promise<RawSearchResult[]> {
    const apiKey = env.server.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn("[web-search] TAVILY_API_KEY not set; skipping Tavily search.");
        return [];
    }

    const response = await fetch(TAVILY_SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            api_key: apiKey,
            query,
            search_depth: "advanced",
            topic: "news",
            max_results: MAX_RESULTS_PER_QUERY,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Tavily API error: ${response.status} ${response.statusText} - ${text}`);
    }

    const data = (await response.json()) as TavilySearchResponse;
    if (!data.results || !Array.isArray(data.results)) {
        return [];
    }

    return data.results
        .filter((item): item is TavilyResultItem & { url: string } => Boolean(item?.url))
        .map((item) => ({
            url: item.url,
            title: item.title ?? "Untitled",
            content: item.content ?? "",
            score: typeof item.score === "number" ? item.score : 0,
        }));
}

/**
 * Executes Tavily search for each planned sub-query with retries, then merges and
 * deduplicates results by URL.
 */
export async function executeSearch(
    subQueries: PlannedQuery[],
): Promise<RawSearchResult[]> {
    const seenUrls = new Set<string>();
    const combined: RawSearchResult[] = [];

    for (const sub of subQueries) {
        const query = sub.searchQuery;
        let lastError: Error | null = null;
        let results: RawSearchResult[] = [];

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                results = await callTavily(query);
                lastError = null;
                break;
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < MAX_RETRIES) {
                    console.warn(
                        `[web-search] Sub-query failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): "${query.slice(0, 50)}..."`,
                        lastError.message,
                    );
                } else {
                    console.error(
                        `[web-search] Sub-query failed after ${MAX_RETRIES + 1} attempts: "${query.slice(0, 50)}..."`,
                        lastError,
                    );
                }
            }
        }

        if (results.length === 0 && lastError) {
            continue;
        }
        if (results.length === 0) {
            console.warn(`[web-search] Zero results for sub-query: "${query.slice(0, 80)}..."`);
            continue;
        }

        for (const r of results) {
            const normalizedUrl = r.url.trim();
            if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
                seenUrls.add(normalizedUrl);
                combined.push(r);
            }
        }
    }

    return combined;
}
