import { NextResponse } from "next/server";
import {
  buildCSP,
  getSecurityHeaders,
  applySecurityHeaders,
  CSPPresets,
  getEnvironmentCSP,
} from "~/lib/security-headers";
import type { CSPConfig } from "~/lib/security-headers";

describe("Security Headers", () => {
  describe("buildCSP", () => {
    it("should build basic CSP with default configuration", () => {
      const csp = buildCSP();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-src 'none'");
    });

    it("should include unsafe-inline for scripts when allowed", () => {
      const csp = buildCSP({ allowInlineScripts: true });
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    });

    it("should include unsafe-eval when allowed", () => {
      const csp = buildCSP({ allowEval: true });
      expect(csp).toContain("'unsafe-eval'");
    });

    it("should include custom script sources", () => {
      const csp = buildCSP({
        scriptSources: ["https://cdn.example.com", "https://analytics.example.com"],
      });
      expect(csp).toContain("https://cdn.example.com");
      expect(csp).toContain("https://analytics.example.com");
    });

    it("should include custom style sources", () => {
      const csp = buildCSP({
        styleSources: ["https://fonts.googleapis.com"],
      });
      expect(csp).toContain("https://fonts.googleapis.com");
    });

    it("should include custom image sources", () => {
      const csp = buildCSP({
        imgSources: ["https:", "data:", "blob:"],
      });
      expect(csp).toContain("img-src 'self' data: blob: https:");
    });

    it("should include custom connect sources", () => {
      const csp = buildCSP({
        connectSources: ["https://api.example.com"],
      });
      expect(csp).toContain("https://api.example.com");
    });

    it("should include report URI when configured", () => {
      const csp = buildCSP({
        reportUri: "/api/csp-report",
      });
      expect(csp).toContain("report-uri /api/csp-report");
    });

    it("should include upgrade-insecure-requests", () => {
      const csp = buildCSP();
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it("should include block-all-mixed-content", () => {
      const csp = buildCSP();
      expect(csp).toContain("block-all-mixed-content");
    });

    it("should restrict base-uri to self", () => {
      const csp = buildCSP();
      expect(csp).toContain("base-uri 'self'");
    });

    it("should restrict form-action to self", () => {
      const csp = buildCSP();
      expect(csp).toContain("form-action 'self'");
    });
  });

  describe("getSecurityHeaders", () => {
    it("should return all required security headers", () => {
      const headers = getSecurityHeaders();

      expect(headers["Content-Security-Policy"]).toBeDefined();
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["Permissions-Policy"]).toContain("camera=()");
      expect(headers["Permissions-Policy"]).toContain("microphone=()");
      expect(headers["Permissions-Policy"]).toContain("geolocation=()");
    });

    it("should use Content-Security-Policy-Report-Only when reportOnly is true", () => {
      const headers = getSecurityHeaders({ reportOnly: true });

      expect(headers["Content-Security-Policy-Report-Only"]).toBeDefined();
      expect(headers["Content-Security-Policy"]).toBeUndefined();
    });

    it("should include HSTS header in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const headers = getSecurityHeaders();
      expect(headers["Strict-Transport-Security"]).toBeDefined();
      expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000");
      expect(headers["Strict-Transport-Security"]).toContain("includeSubDomains");

      process.env.NODE_ENV = originalEnv;
    });

    it("should not include HSTS header in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const headers = getSecurityHeaders();
      expect(headers["Strict-Transport-Security"]).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("applySecurityHeaders", () => {
    it("should apply all security headers to a response", () => {
      const response = NextResponse.json({ success: true });
      const updatedResponse = applySecurityHeaders(response);

      expect(updatedResponse.headers.get("Content-Security-Policy")).toBeDefined();
      expect(updatedResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(updatedResponse.headers.get("X-Frame-Options")).toBe("DENY");
      expect(updatedResponse.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });

    it("should apply custom CSP configuration", () => {
      const response = NextResponse.json({ success: true });
      const customCSP: CSPConfig = {
        scriptSources: ["https://custom.cdn.com"],
      };

      const updatedResponse = applySecurityHeaders(response, customCSP);
      const csp = updatedResponse.headers.get("Content-Security-Policy");

      expect(csp).toContain("https://custom.cdn.com");
    });
  });

  describe("CSPPresets", () => {
    it("should have strict preset with no inline scripts or eval", () => {
      expect(CSPPresets.strict.allowInlineScripts).toBe(false);
      expect(CSPPresets.strict.allowEval).toBe(false);
    });

    it("should have nextjs preset suitable for Next.js applications", () => {
      expect(CSPPresets.nextjs.allowInlineScripts).toBe(false);
      expect(CSPPresets.nextjs.allowEval).toBe(false);
      expect(CSPPresets.nextjs.styleSources).toContain("fonts.googleapis.com");
      expect(CSPPresets.nextjs.imgSources).toContain("https:");
    });

    it("should have development preset that is more permissive", () => {
      expect(CSPPresets.development.allowInlineScripts).toBe(true);
      expect(CSPPresets.development.allowEval).toBe(true);
      expect(CSPPresets.development.reportOnly).toBe(true);
    });
  });

  describe("getEnvironmentCSP", () => {
    it("should return development preset in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const csp = getEnvironmentCSP();
      expect(csp.allowInlineScripts).toBe(true);
      expect(csp.reportOnly).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it("should return production preset in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const csp = getEnvironmentCSP();
      expect(csp.allowInlineScripts).toBe(false);
      expect(csp.scriptSources).toContain("https://clerk.com");
      expect(csp.connectSources).toContain("https://api.openai.com");

      process.env.NODE_ENV = originalEnv;
    });

    it("should include Clerk sources for authentication", () => {
      const csp = getEnvironmentCSP();
      expect(csp.scriptSources).toContain("https://clerk.com");
      expect(csp.connectSources).toContain("https://clerk.com");
      expect(csp.imgSources).toContain("https://img.clerk.com");
    });

    it("should include OpenAI API in connect sources", () => {
      const csp = getEnvironmentCSP();
      expect(csp.connectSources).toContain("https://api.openai.com");
    });
  });

  describe("Security Header Integration", () => {
    it("should protect against clickjacking with X-Frame-Options", () => {
      const headers = getSecurityHeaders();
      expect(headers["X-Frame-Options"]).toBe("DENY");
    });

    it("should prevent MIME type sniffing", () => {
      const headers = getSecurityHeaders();
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    });

    it("should control referrer information", () => {
      const headers = getSecurityHeaders();
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    });

    it("should restrict browser features with Permissions-Policy", () => {
      const headers = getSecurityHeaders();
      const permissionsPolicy = headers["Permissions-Policy"];

      expect(permissionsPolicy).toContain("camera=()");
      expect(permissionsPolicy).toContain("microphone=()");
      expect(permissionsPolicy).toContain("geolocation=()");
    });

    it("should enable XSS protection in browsers", () => {
      const headers = getSecurityHeaders();
      expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
    });
  });

  describe("CSP Defense Against Attacks", () => {
    it("should block inline script execution by default", () => {
      const csp = buildCSP();
      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toContain("'unsafe-inline'");
    });

    it("should block eval and Function constructor by default", () => {
      const csp = buildCSP();
      expect(csp).not.toContain("'unsafe-eval'");
    });

    it("should block object and embed tags", () => {
      const csp = buildCSP();
      expect(csp).toContain("object-src 'none'");
    });

    it("should block iframes by default", () => {
      const csp = buildCSP();
      expect(csp).toContain("frame-src 'none'");
    });

    it("should upgrade HTTP to HTTPS", () => {
      const csp = buildCSP();
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it("should block mixed content", () => {
      const csp = buildCSP();
      expect(csp).toContain("block-all-mixed-content");
    });

    it("should restrict base tag to prevent base tag injection", () => {
      const csp = buildCSP();
      expect(csp).toContain("base-uri 'self'");
    });

    it("should restrict form submission to same origin", () => {
      const csp = buildCSP();
      expect(csp).toContain("form-action 'self'");
    });
  });
});
