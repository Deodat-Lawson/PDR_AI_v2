/**
 * Fetch utility with automatic retry support for timeout and network errors.
 *
 * Features:
 * - Automatic retry on timeout/network errors
 * - Configurable retry count and delay
 * - Exponential backoff support
 * - Proper error handling and type safety
 */

export interface FetchWithRetriesOptions {
  /**
   * Maximum number of retry attempts
   * @default 5
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds between retries
   * @default 1000
   */
  baseDelayMs?: number;

  /**
   * Whether to use exponential backoff for retry delays
   * @default false
   */
  useExponentialBackoff?: boolean;

  /**
   * Custom function to determine if an error should trigger a retry
   * @default Retries on timeout and abort errors
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry condition: retry on timeout and abort errors
 */
const defaultShouldRetry = (error: Error): boolean => {
  const isTimeoutError = /timed out/i.test(error.message) || error.name === "AbortError";
  return isTimeoutError;
};

/**
 * Calculate delay with optional exponential backoff
 */
const calculateDelay = (
  attempt: number,
  baseDelayMs: number,
  useExponentialBackoff: boolean
): number => {
  if (useExponentialBackoff) {
    return baseDelayMs * Math.pow(2, attempt - 1);
  }
  return baseDelayMs;
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * A helper function that retries fetch requests on timeout or network errors.
 *
 * @param url - The URL to fetch
 * @param requestOptions - Standard fetch RequestInit options
 * @param retryOptions - Configuration for retry behavior
 * @returns The parsed JSON response
 * @throws Error if all retries are exhausted or a non-retryable error occurs
 *
 * @example
 * ```typescript
 * // Basic usage
 * const data = await fetchWithRetries('/api/data');
 *
 * // With custom options
 * const data = await fetchWithRetries('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }),
 * }, {
 *   maxRetries: 3,
 *   useExponentialBackoff: true,
 * });
 * ```
 */
export async function fetchWithRetries(
  url: string,
  requestOptions: RequestInit = {},
  retryOptions: FetchWithRetriesOptions = {}
): Promise<unknown> {
  const {
    maxRetries = 5,
    baseDelayMs = 1000,
    useExponentialBackoff = false,
    shouldRetry = defaultShouldRetry,
  } = retryOptions;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, requestOptions);

      if (!res.ok) {
        // For a non-200 response, parse the error body or throw generic error
        const rawErrorData: unknown = await res.json().catch(() => ({}));

        if (typeof rawErrorData !== "object" || rawErrorData === null) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const errorData = rawErrorData as { error?: string };
        throw new Error(errorData.error ?? `Request failed with status ${res.status}`);
      }

      // If fetch + response parsing is successful, return the JSON
      const data: unknown = await res.json();
      return data;
    } catch (err: unknown) {
      lastError = err;

      // Check if error is retryable
      if (err instanceof Error) {
        const isRetryable = shouldRetry(err, attempt);

        if (isRetryable && attempt < maxRetries) {
          const delay = calculateDelay(attempt, baseDelayMs, useExponentialBackoff);
          console.warn(
            `Attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }

        // If it's a non-retryable error or we've used all retries, re-throw
        throw err;
      } else {
        // Wrap non-Error in a real Error
        throw new Error(`Non-Error thrown: ${String(err)}`);
      }
    }
  }

  // If we somehow exit the loop, throw the last error
  if (!(lastError instanceof Error)) {
    throw new Error(`Non-Error thrown: ${String(lastError)}`);
  }
  throw lastError;
}

/**
 * Convenience wrapper that maintains backward compatibility with the original
 * fetchWithRetries signature (url, options, maxRetries).
 *
 * @deprecated Use fetchWithRetries with FetchWithRetriesOptions instead
 */
export async function fetchWithRetriesLegacy(
  url: string,
  options: RequestInit = {},
  maxRetries = 5
): Promise<unknown> {
  return fetchWithRetries(url, options, { maxRetries });
}
