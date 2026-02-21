"use client";

import React from "react";
import { diffWords } from "diff";
import { Button } from "../ui/button";
import { Check, X, RotateCw } from "lucide-react";
import { cn } from "~/lib/utils";

export interface RewritePreviewProps {
  originalText: string;
  proposedText: string;
  onAccept: () => void;
  onReject: () => void;
  onTryAgain: () => void;
  isRetrying?: boolean;
}

export function RewritePreviewPanel({
  originalText,
  proposedText,
  onAccept,
  onReject,
  onTryAgain,
  isRetrying = false,
}: RewritePreviewProps) {
  const changes = diffWords(originalText, proposedText);

  return (
    <div className="flex flex-col gap-4 p-4 border border-border rounded-xl bg-card shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Rewrite preview</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isRetrying}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <X className="w-3 h-3 mr-1.5" />
            Reject
          </Button>
          <Button variant="outline" size="sm" onClick={onTryAgain} disabled={isRetrying}>
            <RotateCw className={cn("w-3 h-3 mr-1.5", isRetrying && "animate-spin")} />
            Try again
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            disabled={isRetrying}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-3 h-3 mr-1.5" />
            Accept
          </Button>
        </div>
      </div>

      <div className="grid gap-4 text-sm">
        <div>
          <p className="text-xs font-bold mb-1.5 text-muted-foreground uppercase tracking-wider">Before → After</p>
          <div className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-xs leading-relaxed max-h-48 overflow-y-auto">
            {changes.map((part, i) => (
              <span
                key={i}
                className={cn(
                  part.added && "bg-green-500/20 text-green-800 dark:text-green-200",
                  part.removed && "bg-red-500/20 text-red-800 dark:text-red-200 line-through",
                  !part.added && !part.removed && "text-foreground"
                )}
              >
                {part.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
