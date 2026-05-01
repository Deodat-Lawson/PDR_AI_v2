"use client";

import type { ReactNode } from "react";
import { useSetBreadcrumbs } from "./BreadcrumbContext";

const TOOLS_CRUMBS = ["Drift", "Tools"];

/**
 * Tool pages render inside the global `DriftShell` (sidebar + topbar). This
 * wrapper just feeds a "Tools" breadcrumb into the shared topbar; visual
 * chrome is otherwise inherited.
 */
export function ToolsStudioShell({
  children,
  pageTitle,
}: {
  children: ReactNode;
  pageTitle?: string;
}) {
  useSetBreadcrumbs(pageTitle ? [...TOOLS_CRUMBS, pageTitle] : TOOLS_CRUMBS);
  return <>{children}</>;
}
