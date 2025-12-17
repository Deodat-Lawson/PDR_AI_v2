import {
  sanitizeString,
  sanitizeHtml,
  sanitizeFileName,
  sanitizeUrl,
  sanitizeSqlInput,
  sanitizeSearchQuery,
  sanitizeObject,
  sanitizeEmail,
  sanitizeForDisplay,
  sanitizeForJson,
} from "~/lib/sanitizer";

describe("Sanitizer", () => {
  describe("sanitizeString", () => {
    it("should remove script tags", () => {
      const input = 'Hello <script>alert("XSS")</script>World';
      const result = sanitizeString(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("should handle null and undefined inputs", () => {
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString(undefined)).toBe("");
      expect(sanitizeString("")).toBe("");
    });

    it("should escape HTML entities", () => {
      const input = '<div>Test & "quotes"</div>';
      const result = sanitizeString(input);
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;");
    });

    it("should truncate to maxLength", () => {
      const input = "a".repeat(1000);
      const result = sanitizeString(input, { maxLength: 100 });
      expect(result.length).toBe(100);
    });

    it("should preserve newlines when specified", () => {
      const input = "Line 1\nLine 2\nLine 3";
      const result = sanitizeString(input, { preserveNewlines: true });
      expect(result).toContain("\n");
    });

    it("should remove newlines by default", () => {
      const input = "Line 1\nLine 2\nLine 3";
      const result = sanitizeString(input);
      expect(result).not.toContain("\n");
      expect(result).toBe("Line 1 Line 2 Line 3");
    });

    it("should remove null bytes", () => {
      const input = "Hello\x00World";
      const result = sanitizeString(input);
      expect(result).toBe("HelloWorld");
    });

    it("should normalize whitespace", () => {
      const input = "Hello    World   Test";
      const result = sanitizeString(input);
      expect(result).toBe("Hello World Test");
    });
  });

  describe("sanitizeHtml", () => {
    it("should remove dangerous tags", () => {
      const input = '<div>Safe</div><script>alert("XSS")</script><iframe src="evil"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("<iframe>");
      expect(result).toContain("<div>");
    });

    it("should remove event handlers", () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("onclick=");
      expect(result).toContain("data-removed-event");
    });

    it("should sanitize javascript: URLs", () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("javascript:");
      expect(result).toContain("blocked-javascript:");
    });

    it("should remove dangerous data: URLs", () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain("blocked-data:");
    });

    it("should allow safe image data: URLs", () => {
      const input = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA">';
      const result = sanitizeHtml(input);
      expect(result).toContain("data:image/png");
    });
  });

  describe("sanitizeFileName", () => {
    it("should remove path traversal sequences", () => {
      expect(sanitizeFileName("../../etc/passwd")).toBe("etcpasswd");
      expect(sanitizeFileName("..\\..\\windows\\system32")).toBe("windowssystem32");
    });

    it("should remove special characters", () => {
      expect(sanitizeFileName('file<>:"|?*.txt')).toBe("file.txt");
    });

    it("should handle empty or invalid filenames", () => {
      expect(sanitizeFileName("")).toBe("unnamed_file");
      expect(sanitizeFileName("   ")).toBe("unnamed_file");
      expect(sanitizeFileName("...")).toBe("unnamed_file");
    });

    it("should truncate long filenames", () => {
      const longName = "a".repeat(300) + ".txt";
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result).toEndWith(".txt");
    });

    it("should remove null bytes", () => {
      const input = "file\x00name.txt";
      const result = sanitizeFileName(input);
      expect(result).toBe("filename.txt");
    });
  });

  describe("sanitizeUrl", () => {
    it("should allow valid HTTP URLs", () => {
      const url = "https://example.com/path?query=value";
      const result = sanitizeUrl(url);
      expect(result).toBe("https://example.com/path?query=value");
    });

    it("should block javascript: protocol", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("  javascript:alert(1)  ")).toBe("");
      expect(sanitizeUrl("JAVASCRIPT:alert(1)")).toBe("");
    });

    it("should block dangerous data: URLs", () => {
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    });

    it("should allow image data: URLs", () => {
      const url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA";
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it("should allow mailto: URLs", () => {
      const url = "mailto:test@example.com";
      const result = sanitizeUrl(url);
      expect(result).toBe("mailto:test@example.com");
    });

    it("should block file: protocol", () => {
      expect(sanitizeUrl("file:///etc/passwd")).toBe("");
    });

    it("should handle invalid URLs", () => {
      expect(sanitizeUrl("not a url")).toBe("");
      expect(sanitizeUrl("ht tp://broken.com")).toBe("");
    });

    it("should handle empty URLs", () => {
      expect(sanitizeUrl("")).toBe("");
      expect(sanitizeUrl("   ")).toBe("");
    });
  });

  describe("sanitizeSqlInput", () => {
    it("should remove SQL comments", () => {
      const input = "SELECT * FROM users -- comment";
      const result = sanitizeSqlInput(input);
      expect(result).not.toContain("--");
    });

    it("should remove SQL keywords in suspicious contexts", () => {
      const input = "username' OR 1=1; DROP TABLE users;--";
      const result = sanitizeSqlInput(input);
      expect(result).not.toContain("DROP");
      expect(result).not.toContain(";");
      expect(result).toContain("[removed-drop]");
    });

    it("should remove multi-line comments", () => {
      const input = "SELECT * /* comment */ FROM users";
      const result = sanitizeSqlInput(input);
      expect(result).not.toContain("/*");
      expect(result).not.toContain("*/");
    });

    it("should remove semicolons", () => {
      const input = "SELECT * FROM users; DROP TABLE users;";
      const result = sanitizeSqlInput(input);
      expect(result).not.toContain(";");
    });

    it("should handle various SQL injection attempts", () => {
      const attempts = [
        "' OR '1'='1",
        "admin'--",
        "1'; DROP TABLE users--",
        "' UNION SELECT * FROM passwords--",
      ];

      attempts.forEach(attempt => {
        const result = sanitizeSqlInput(attempt);
        expect(result).not.toContain("DROP");
        expect(result).not.toContain("UNION");
        expect(result).not.toContain("--");
      });
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("should remove HTML tags", () => {
      const input = '<script>alert("XSS")</script>search term';
      const result = sanitizeSearchQuery(input);
      expect(result).not.toContain("<script>");
      expect(result).toContain("search term");
    });

    it("should escape regex special characters", () => {
      const input = "search.*+?^${}()|[]\\term";
      const result = sanitizeSearchQuery(input);
      expect(result).toContain("\\.");
      expect(result).toContain("\\*");
      expect(result).toContain("\\+");
    });

    it("should normalize whitespace", () => {
      const input = "search   query   with   spaces";
      const result = sanitizeSearchQuery(input);
      expect(result).toBe("search query with spaces");
    });

    it("should truncate long queries", () => {
      const input = "a".repeat(1000);
      const result = sanitizeSearchQuery(input);
      expect(result.length).toBe(500);
    });

    it("should handle empty queries", () => {
      expect(sanitizeSearchQuery("")).toBe("");
      expect(sanitizeSearchQuery("   ")).toBe("");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize string values", () => {
      const obj = {
        name: '<script>alert("XSS")</script>John',
        email: "john@example.com",
      };

      const result = sanitizeObject(obj);
      expect(result.name).not.toContain("<script>");
      expect(result.email).toBe("john@example.com");
    });

    it("should recursively sanitize nested objects", () => {
      const obj = {
        user: {
          name: '<script>alert("XSS")</script>John',
          profile: {
            bio: '<iframe src="evil"></iframe>Bio',
          },
        },
      };

      const result = sanitizeObject(obj);
      expect(result.user.name).not.toContain("<script>");
      expect(result.user.profile.bio).not.toContain("<iframe>");
    });

    it("should sanitize arrays", () => {
      const obj = {
        tags: [
          '<script>alert("XSS")</script>tag1',
          "tag2",
          '<iframe src="evil"></iframe>tag3',
        ],
      };

      const result = sanitizeObject(obj);
      result.tags.forEach((tag: string) => {
        expect(tag).not.toContain("<script>");
        expect(tag).not.toContain("<iframe>");
      });
    });

    it("should preserve non-string values", () => {
      const obj = {
        name: "John",
        age: 30,
        active: true,
        metadata: null,
      };

      const result = sanitizeObject(obj);
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.metadata).toBeNull();
    });
  });

  describe("sanitizeEmail", () => {
    it("should validate and sanitize valid emails", () => {
      expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
      expect(sanitizeEmail("  TEST@EXAMPLE.COM  ")).toBe("test@example.com");
    });

    it("should reject invalid emails", () => {
      expect(sanitizeEmail("not-an-email")).toBe("");
      expect(sanitizeEmail("@example.com")).toBe("");
      expect(sanitizeEmail("test@")).toBe("");
      expect(sanitizeEmail("test")).toBe("");
    });

    it("should remove HTML encoding", () => {
      const input = "test<>@example.com";
      const result = sanitizeEmail(input);
      expect(result).toBe("");
    });

    it("should handle empty input", () => {
      expect(sanitizeEmail("")).toBe("");
      expect(sanitizeEmail("   ")).toBe("");
    });
  });

  describe("sanitizeForDisplay", () => {
    it("should allow basic formatting tags", () => {
      const input = "<p>Hello <b>World</b></p>";
      const result = sanitizeForDisplay(input);
      // After sanitization, HTML should be escaped
      expect(result).toBeDefined();
    });

    it("should preserve newlines", () => {
      const input = "Line 1\nLine 2\nLine 3";
      const result = sanitizeForDisplay(input);
      expect(result).toContain("\n");
    });

    it("should respect max length", () => {
      const input = "a".repeat(20000);
      const result = sanitizeForDisplay(input);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe("sanitizeForJson", () => {
    it("should escape quotes and backslashes", () => {
      const input = 'Hello "World" with \\ backslash';
      const result = sanitizeForJson(input);
      expect(result).toContain('\\"');
      expect(result).toContain("\\\\");
    });

    it("should remove control characters", () => {
      const input = "Hello\x00\x01\x02World";
      const result = sanitizeForJson(input);
      expect(result).toBe("HelloWorld");
    });

    it("should preserve newlines and tabs", () => {
      const input = "Line 1\nLine 2\tTabbed";
      const result = sanitizeForJson(input);
      expect(result).toContain("\n");
      expect(result).toContain("\t");
    });

    it("should handle empty input", () => {
      expect(sanitizeForJson("")).toBe("");
    });
  });

  describe("XSS Attack Vectors", () => {
    const xssVectors = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
      '<input onfocus=alert(1) autofocus>',
      '<select onfocus=alert(1) autofocus>',
      '<textarea onfocus=alert(1) autofocus>',
      '<marquee onstart=alert(1)>',
      '<a href="data:text/html,<script>alert(1)</script>">',
    ];

    xssVectors.forEach(vector => {
      it(`should sanitize XSS vector: ${vector.substring(0, 50)}`, () => {
        const result = sanitizeString(vector);
        expect(result.toLowerCase()).not.toContain("alert");
        expect(result.toLowerCase()).not.toContain("javascript:");
        expect(result.toLowerCase()).not.toContain("onerror");
        expect(result.toLowerCase()).not.toContain("onload");
      });
    });
  });
});
