/**
 * Server-side input sanitization utilities for XSS protection
 *
 * This module provides comprehensive input sanitization to prevent XSS attacks
 * and other injection vulnerabilities in user-generated content.
 */

/**
 * Configuration options for sanitization
 */
export interface SanitizeOptions {
  /**
   * Allow basic HTML tags (b, i, em, strong, etc.)
   */
  allowBasicFormatting?: boolean;

  /**
   * Allow newlines and preserve line breaks
   */
  preserveNewlines?: boolean;

  /**
   * Maximum length for the sanitized string (truncate if exceeded)
   */
  maxLength?: number;

  /**
   * Allow specific characters that are normally stripped
   */
  allowedSpecialChars?: string[];
}

/**
 * List of dangerous HTML tags that should always be removed
 */
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet',
  'link', 'style', 'meta', 'form', 'input',
  'button', 'textarea', 'select', 'option'
];

/**
 * List of safe HTML tags for basic formatting
 */
const SAFE_FORMATTING_TAGS = [
  'b', 'i', 'em', 'strong', 'u', 'br', 'p',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'code', 'pre'
];

/**
 * Dangerous event handler attributes
 */
const EVENT_HANDLERS_REGEX = /\s*on\w+\s*=/gi;

/**
 * JavaScript protocol in URLs
 */
const JAVASCRIPT_PROTOCOL_REGEX = /^\s*javascript:/gi;

/**
 * Data URLs that could contain malicious code
 */
const DANGEROUS_DATA_URL_REGEX = /^\s*data:(?!image\/(?:png|jpg|jpeg|gif|webp|svg\+xml);base64,)/gi;

/**
 * Sanitize a string to prevent XSS attacks
 *
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  if (!input) return '';

  const {
    allowBasicFormatting = false,
    preserveNewlines = false,
    maxLength,
    allowedSpecialChars = []
  } = options;

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove or escape dangerous HTML tags
  if (!allowBasicFormatting) {
    // Strip all HTML tags
    sanitized = stripAllHtmlTags(sanitized);
  } else {
    // Only remove dangerous tags, keep safe formatting
    sanitized = removeDangerousTags(sanitized);
    sanitized = removeEventHandlers(sanitized);
    sanitized = sanitizeUrls(sanitized);
  }

  // Escape remaining HTML entities
  sanitized = escapeHtml(sanitized);

  // Handle newlines
  if (!preserveNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Truncate if needed
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize HTML by removing dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
  let sanitized = html;

  // Remove dangerous tags
  sanitized = removeDangerousTags(sanitized);

  // Remove event handlers
  sanitized = removeEventHandlers(sanitized);

  // Sanitize URLs in href and src attributes
  sanitized = sanitizeUrls(sanitized);

  return sanitized;
}

/**
 * Remove all HTML tags from a string
 */
function stripAllHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Remove dangerous HTML tags while preserving safe formatting
 */
function removeDangerousTags(input: string): string {
  let result = input;

  DANGEROUS_TAGS.forEach(tag => {
    // Remove opening and closing tags (case-insensitive)
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    result = result.replace(regex, '');

    // Remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    result = result.replace(selfClosingRegex, '');

    // Remove opening tags without closing
    const openingRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
    result = result.replace(openingRegex, '');
  });

  return result;
}

/**
 * Remove event handler attributes (onclick, onload, etc.)
 */
function removeEventHandlers(input: string): string {
  return input.replace(EVENT_HANDLERS_REGEX, ' data-removed-event=');
}

/**
 * Sanitize URLs to prevent javascript: and dangerous data: protocols
 */
function sanitizeUrls(input: string): string {
  let result = input;

  // Remove javascript: protocol
  result = result.replace(JAVASCRIPT_PROTOCOL_REGEX, 'blocked-javascript:');

  // Remove dangerous data: URLs (keep image data URLs)
  result = result.replace(DANGEROUS_DATA_URL_REGEX, 'blocked-data:');

  return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, char => htmlEscapeMap[char] || char);
}

/**
 * Sanitize a file name to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';

  let sanitized = fileName;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove path traversal sequences
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[/\\]/g, '');

  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '');

  // Limit to reasonable length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  // Ensure it's not empty or just whitespace
  sanitized = sanitized.trim();
  if (!sanitized) {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

/**
 * Sanitize a URL to ensure it's safe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  let sanitized = url.trim();

  // Check for javascript: protocol
  if (JAVASCRIPT_PROTOCOL_REGEX.test(sanitized)) {
    return '';
  }

  // Check for dangerous data: URLs
  if (DANGEROUS_DATA_URL_REGEX.test(sanitized)) {
    return '';
  }

  // Remove HTML encoding attempts
  sanitized = sanitized.replace(/&[#\w]+;/g, '');

  // Basic URL validation
  try {
    const urlObj = new URL(sanitized);

    // Only allow http, https, and mailto protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Sanitize SQL-like input to prevent injection
 * Note: This is a defense-in-depth measure. Always use parameterized queries!
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Remove SQL comment sequences
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');

  // Remove common SQL keywords in suspicious contexts
  const sqlKeywords = [
    'DROP', 'DELETE', 'TRUNCATE', 'UPDATE', 'INSERT',
    'EXEC', 'EXECUTE', 'UNION', 'SELECT', 'ALTER'
  ];

  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    sanitized = sanitized.replace(regex, `[removed-${keyword.toLowerCase()}]`);
  });

  // Remove semicolons (often used to chain SQL commands)
  sanitized = sanitized.replace(/;/g, '');

  return sanitized;
}

/**
 * Sanitize user input that will be used in search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  let sanitized = query;

  // Remove HTML
  sanitized = stripAllHtmlTags(sanitized);

  // Escape special regex characters to prevent ReDoS
  sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limit length to prevent excessive processing
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
}

/**
 * Deep sanitize an object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizeOptions = {}
): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options) as T[Extract<keyof T, string>];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options) as T[Extract<keyof T, string>];
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeString(item, options)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, options)
          : item
      ) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  // Remove any HTML encoding or special characters
  const sanitized = trimmed.replace(/[<>'"&]/g, '');

  return sanitized;
}

/**
 * Create a sanitized version of user input for display
 * This is specifically for content that will be rendered in the UI
 */
export function sanitizeForDisplay(input: string): string {
  return sanitizeString(input, {
    allowBasicFormatting: true,
    preserveNewlines: true,
    maxLength: 10000
  });
}

/**
 * Sanitize content for use in JSON responses
 */
export function sanitizeForJson(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Escape quotes and backslashes
  sanitized = sanitized.replace(/\\/g, '\\\\');
  sanitized = sanitized.replace(/"/g, '\\"');

  return sanitized;
}
