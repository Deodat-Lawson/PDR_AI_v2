"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Command,
  FileText,
  Gavel,
  Home,
  Inbox,
  Layers,
  MessageSquare,
  Moon,
  Settings,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { BreadcrumbProvider, useBreadcrumbs } from "./BreadcrumbContext";
import ProfileDropdown from "../_components/ProfileDropdown";
import styles from "./DriftShell.module.css";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  match: (path: string) => boolean;
  count?: number;
  pill?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/employer/home",
    icon: <Home size={14} />,
    match: (p) => p === "/employer/home" || p === "/employer",
  },
  {
    id: "inbox",
    label: "Inbox",
    href: "/employer/contact",
    icon: <Inbox size={14} />,
    match: (p) => p.startsWith("/employer/contact"),
  },
  {
    id: "documents",
    label: "Documents",
    href: "/employer/documents",
    icon: <FileText size={14} />,
    match: (p) => p.startsWith("/employer/documents"),
    pill: "AI",
  },
  {
    id: "marketing",
    label: "Marketing",
    href: "/employer/tools/marketing-pipeline",
    icon: <MessageSquare size={14} />,
    match: (p) => p.startsWith("/employer/tools/marketing-pipeline"),
    pill: "AI",
  },
  {
    id: "legal",
    label: "Legal",
    href: "/employer/documents/generator",
    icon: <Gavel size={14} />,
    match: (p) => p.startsWith("/employer/documents/generator"),
    pill: "AI",
  },
  {
    id: "tools",
    label: "Workflows",
    href: "/employer/tools/repo-explainer",
    icon: <Workflow size={14} />,
    match: (p) =>
      p.startsWith("/employer/tools") &&
      !p.startsWith("/employer/tools/marketing-pipeline"),
  },
  {
    id: "library",
    label: "Library",
    href: "/employer/statistics",
    icon: <Layers size={14} />,
    match: (p) => p.startsWith("/employer/statistics"),
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  {
    id: "settings",
    label: "Settings",
    href: "/employer/settings",
    icon: <Settings size={14} />,
    match: (p) => p.startsWith("/employer/settings"),
  },
];

function Topbar() {
  const breadcrumbs = useBreadcrumbs();
  return (
    <header className={styles.topbar}>
      <div className={styles.crumbs}>
        {breadcrumbs.map((c, i) => (
          <span key={i} className={styles.crumbsItem}>
            {i > 0 && <span className={styles.crumbsSep}>›</span>}
            <span
              className={i === breadcrumbs.length - 1 ? styles.crumbsLast : ""}
            >
              {c}
            </span>
          </span>
        ))}
      </div>
      <div className={styles.spacer} />
      <button type="button" className={styles.kbdPill} aria-label="Command menu">
        <Command size={12} />
        <span>⌘K</span>
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Notifications">
        <Bell size={14} />
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Theme">
        <Moon size={14} />
      </button>
      <div className={styles.profileSlot}>
        <ProfileDropdown />
      </div>
    </header>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className={styles.sidebar}>
      <Link href="/employer/home" className={styles.brand}>
        <span className={styles.brandMark}>
          <span>d</span>
        </span>
        <span className={styles.brandWord}>
          <em>drift</em>
        </span>
      </Link>
      <nav className={styles.nav}>
        <div className={styles.eyebrow}>Workspace</div>
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            >
              {item.icon}
              <span className={styles.navLabel}>{item.label}</span>
              {item.count != null && (
                <span className={styles.navCount}>{item.count}</span>
              )}
              {item.pill && <span className={styles.navPill}>{item.pill}</span>}
            </Link>
          );
        })}
        <div className={styles.eyebrow}>Account</div>
        {ACCOUNT_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            >
              {item.icon}
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function AmbientLayer() {
  return (
    <>
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>
      <div className={styles.dots} aria-hidden="true" />
    </>
  );
}

export function DriftShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/employer/home";

  return (
    <BreadcrumbProvider>
      <div className={`lsw-root ${styles.app}`}>
        <AmbientLayer />
        <Sidebar pathname={pathname} />
        <div className={styles.main}>
          <Topbar />
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
