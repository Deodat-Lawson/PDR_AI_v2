/**
 * PDF.js Polyfill for Node.js
 * Provides DOM APIs that pdfjs-dist expects in a browser environment
 */

// Polyfill DOMMatrix for pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error - Polyfilling browser API
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;

    constructor(init?: string | number[]) {
      if (Array.isArray(init)) {
        if (init.length === 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
    }
  };
}

// Export to ensure module is loaded
export {};
