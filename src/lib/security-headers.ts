/**
 * Security headers middleware for Content Security Policy and other protections
 *
 * This module provides security headers to protect against XSS, clickjacking,
 * and other web vulnerabilities.
 */

import { NextResponse } from "next/server";

/**
 * Content Security Policy configuration
 */
export interface CSPConfig {
  /**
   * Allow inline scripts (use cautiously)
   */
  allowInlineScripts?: boolean;

  /**
   * Allow eval and Function constructor (use very cautiously)
   */
  allowEval?: boolean;

  /**
   * Additional script sources
   */
  scriptSources?: string[];

  /**
   * Additional style sources
   */
  styleSources?: string[];

  /**
   * Additional image sources
   */
  imgSources?: string[];

  /**
   * Additional connect sources (for fetch, WebSocket, etc.)
   */
  connectSources?: string[];

  /**
   * Enable report URI for CSP violations
   */
  reportUri?: string;

  /**
   * Report-only mode (log violations but don't enforce)
   */
  reportOnly?: boolean;
}

/**
 * Default CSP configuration for production
 */
const DEFAULT_CSP_CONFIG: CSPConfig = {
  allowInlineScripts: false,
  allowEval: false,
  scriptSources: [],
  styleSources: [],
  imgSources: [],
  connectSources: [],
  reportOnly: false,
};

/**
 * Build Content Security Policy header value
 */
export function buildCSP(config: CSPConfig = {}): string {
  const mergedConfig = { ...DEFAULT_CSP_CONFIG, ...config };

  const directives: string[] = [];

  // Default source - restrict everything by default
  directives.push("default-src 'self'");

  // Script sources
  const scriptSrc = ["'self'"];
  if (mergedConfig.allowInlineScripts) {
    scriptSrc.push("'unsafe-inline'");
  }
  if (mergedConfig.allowEval) {
    scriptSrc.push("'unsafe-eval'");
  }
  if (mergedConfig.scriptSources && mergedConfig.scriptSources.length > 0) {
    scriptSrc.push(...mergedConfig.scriptSources);
  }
  directives.push(`script-src ${scriptSrc.join(' ')}`);

  // Style sources
  const styleSrc = ["'self'"];
  // Most modern apps need unsafe-inline for styled-components, CSS-in-JS
  styleSrc.push("'unsafe-inline'");
  if (mergedConfig.styleSources && mergedConfig.styleSources.length > 0) {
    styleSrc.push(...mergedConfig.styleSources);
  }
  directives.push(`style-src ${styleSrc.join(' ')}`);

  // Image sources
  const imgSrc = ["'self'", 'data:', 'blob:'];
  if (mergedConfig.imgSources && mergedConfig.imgSources.length > 0) {
    imgSrc.push(...mergedConfig.imgSources);
  }
  directives.push(`img-src ${imgSrc.join(' ')}`);

  // Font sources
  directives.push("font-src 'self' data:");

  // Connect sources (fetch, XHR, WebSocket, etc.)
  const connectSrc = ["'self'"];
  if (mergedConfig.connectSources && mergedConfig.connectSources.length > 0) {
    connectSrc.push(...mergedConfig.connectSources);
  }
  directives.push(`connect-src ${connectSrc.join(' ')}`);

  // Object sources (plugins)
  directives.push("object-src 'none'");

  // Frame sources (iframes)
  directives.push("frame-src 'none'");

  // Base URI restriction
  directives.push("base-uri 'self'");

  // Form action restriction
  directives.push("form-action 'self'");

  // Upgrade insecure requests
  directives.push("upgrade-insecure-requests");

  // Block mixed content
  directives.push("block-all-mixed-content");

  // Report URI if configured
  if (mergedConfig.reportUri) {
    directives.push(`report-uri ${mergedConfig.reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Get all security headers for a response
 */
export function getSecurityHeaders(cspConfig?: CSPConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Content Security Policy
  const csp = buildCSP(cspConfig);
  if (cspConfig?.reportOnly) {
    headers['Content-Security-Policy-Report-Only'] = csp;
  } else {
    headers['Content-Security-Policy'] = csp;
  }

  // X-Content-Type-Options: Prevent MIME type sniffing
  headers['X-Content-Type-Options'] = 'nosniff';

  // X-Frame-Options: Prevent clickjacking
  headers['X-Frame-Options'] = 'DENY';

  // X-XSS-Protection: Enable browser XSS filter (legacy support)
  headers['X-XSS-Protection'] = '1; mode=block';

  // Referrer-Policy: Control referrer information
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

  // Permissions-Policy: Control browser features
  headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

  // Strict-Transport-Security: Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  cspConfig?: CSPConfig
): NextResponse {
  const headers = getSecurityHeaders(cspConfig);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a middleware wrapper to apply security headers
 */
export function withSecurityHeaders(
  handler: () => Promise<NextResponse>,
  cspConfig?: CSPConfig
): Promise<NextResponse> {
  return handler().then(response => applySecurityHeaders(response, cspConfig));
}

/**
 * Predefined CSP configurations for common scenarios
 */
export const CSPPresets = {
  /**
   * Strict CSP for maximum security
   * Use for static content and server-rendered pages
   */
  strict: {
    allowInlineScripts: false,
    allowEval: false,
    scriptSources: [],
    styleSources: [],
  } as CSPConfig,

  /**
   * Relaxed CSP for applications using Next.js
   * Allows inline styles for CSS-in-JS libraries
   */
  nextjs: {
    allowInlineScripts: false,
    allowEval: false,
    scriptSources: [],
    styleSources: ['fonts.googleapis.com'],
    imgSources: ['https:', 'data:', 'blob:'],
    connectSources: [],
  } as CSPConfig,

  /**
   * Development CSP - more permissive for easier development
   * Should NOT be used in production
   */
  development: {
    allowInlineScripts: true,
    allowEval: true,
    scriptSources: ['*'],
    styleSources: ['*'],
    imgSources: ['*'],
    connectSources: ['*'],
    reportOnly: true,
  } as CSPConfig,
} as const;

/**
 * Get appropriate CSP config based on environment
 */
export function getEnvironmentCSP(): CSPConfig {
  if (process.env.NODE_ENV === 'development') {
    return CSPPresets.development;
  }

  // For Next.js applications in production
  return {
    ...CSPPresets.nextjs,
    // Add your specific sources here
    scriptSources: [
      'https://clerk.com',
      'https://clerk.*.com',
    ],
    connectSources: [
      'https://api.openai.com',
      'https://clerk.com',
      'https://clerk.*.com',
    ],
    imgSources: [
      'https:',
      'data:',
      'blob:',
      'https://img.clerk.com',
    ],
  };
}
