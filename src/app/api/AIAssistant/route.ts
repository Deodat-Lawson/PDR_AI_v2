/**
 * AIAssistant API Route - Backward compatibility endpoint
 * 
 * This endpoint re-exports the comprehensive AIChat query endpoint.
 * For new implementations, use:
 * - /api/agents/documentQ&A/AIQuery - Fast, efficient single-document queries
 * - /api/agents/documentQ&A/AIChat/query - Comprehensive search solution
 */

// Re-export the AIChat query handler for backward compatibility
export { POST } from "../agents/documentQ&A/AIChat/query/route";
export const runtime = 'nodejs';
export const maxDuration = 300;

