"use client";

import React, { useCallback, useState } from "react";
import { DocumentGeneratorEditor } from "./DocumentGeneratorEditor";
import type { Citation } from "./generator";

const DEFAULT_TITLE = "Untitled (Rewrite)";

export function RewriteDiffView() {
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(
    async (title: string, content: string, citations?: Citation[]) => {
      setSaveError(null);
      const docTitle = title.trim() || DEFAULT_TITLE;
      try {
        const response = await fetch("/api/document-generator/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: docTitle,
            content,
            templateId: "rewrite",
            citations: citations ?? [],
            metadata: { source: "rewrite" },
          }),
        });
        const data = (await response.json()) as {
          success: boolean;
          message?: string;
          document?: { id: number };
        };
        if (!data.success) {
          setSaveError(data.message ?? "Failed to save document");
        }
      } catch (err) {
        console.error("Save to documents failed:", err);
        setSaveError("Failed to save document");
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-full w-full">
      {saveError && (
        <div className="flex-shrink-0 px-4 py-2 bg-destructive/10 text-destructive text-sm border-b border-border">
          {saveError}
        </div>
      )}
      <DocumentGeneratorEditor
        initialTitle=""
        initialContent=""
        onBack={() => {}}
        onSave={handleSave}
        mode="rewrite"
      />
    </div>
  );
}
