"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Brain,
  Home,
  Zap,
  Search,
  HardDrive,
  ScanLine,
  Eye,
  FileSearch,
  Mic,
  Plug,
  Search as SearchIcon,
  X,
  Database,
} from "lucide-react";

import { ThemeToggle } from "~/app/_components/ThemeToggle";
import LoadingPage from "~/app/_components/loading";
import {
  serviceGuides,
  SERVICE_CATEGORIES,
  type ServiceGuide,
} from "./guides";
import styles from "~/styles/Employer/Integrations.module.css";

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------
const iconMap = { Zap, Search, HardDrive, ScanLine, Eye, FileSearch, Mic, Database } as const;

function ServiceIcon({
  name,
  className,
}: {
  name: ServiceGuide["iconName"];
  className?: string;
}) {
  const Icon = iconMap[name];
  return <Icon className={className ?? styles.cardIcon} />;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ServiceStatus {
  isConnected: boolean;
  maskedKey: string | null;
}

type ServicesMap = Record<string, ServiceStatus>;

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
const IntegrationsPage = () => {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServicesMap>({});

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Auth check + fetch connection status
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      window.alert("Authentication failed! No user found.");
      router.push("/");
      return;
    }

    const init = async () => {
      try {
        const authRes = await fetch("/api/employerAuth", { method: "GET" });
        if (authRes.status === 300) {
          router.push("/employee/pending-approval");
          return;
        }
        if (!authRes.ok) {
          window.alert("Authentication failed! You are not an employer.");
          router.push("/");
          return;
        }

        const res = await fetch("/api/serviceConnections", { method: "GET" });
        if (!res.ok) throw new Error("Failed to fetch service connections");
        const json = (await res.json()) as {
          success: boolean;
          services: ServicesMap;
        };
        setServices(json.services);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [isLoaded, userId, router]);

  // ------------------------------------------------------------------
  // Filtered guides
  // ------------------------------------------------------------------
  const filteredGuides = useMemo(() => {
    let result = serviceGuides;

    // Category filter
    if (activeCategory) {
      result = result.filter((g) => g.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.tagline.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeCategory, searchQuery]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) return <LoadingPage />;

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div
            className={styles.logoWrapper}
            onClick={() => router.push("/employer/home")}
          >
            <Brain className={styles.logoIcon} />
            <span className={styles.logoText}>PDR AI</span>
          </div>

          {/* Search bar – centred in navbar */}
          <div className={styles.searchWrapper}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search integrations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className={styles.searchClearIcon} />
              </button>
            )}
          </div>

          <div className={styles.navActions}>
            <ThemeToggle />
            <button
              onClick={() => router.push("/employer/home")}
              className={styles.iconButton}
              aria-label="Go to home"
            >
              <Home className={styles.iconButtonIcon} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderIcon}>
            <Plug className={styles.pageHeaderIconSvg} />
          </div>
          <h1 className={styles.pageTitle}>Integrations</h1>
          <p className={styles.pageSubtitle}>
            Connect external services to unlock the full power of PDR AI. Click
            on an integration below to set it up.
          </p>
        </header>

        {/* Category pills */}
        <div className={styles.categoryBar}>
          <button
            type="button"
            className={`${styles.categoryPill} ${
              activeCategory === null ? styles.categoryPillActive : ""
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.categoryPill} ${
                activeCategory === cat ? styles.categoryPillActive : ""
              }`}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {filteredGuides.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No integrations match your search.
            </p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredGuides.map((guide) => {
              const allConnected = guide.fields.every(
                (f) => services[f.key]?.isConnected
              );

              return (
                <button
                  key={guide.id}
                  type="button"
                  className={styles.serviceCard}
                  onClick={() =>
                    router.push(`/employer/integrations/${guide.id}`)
                  }
                >
                  {/* Category + status */}
                  <div className={styles.cardTopRow}>
                    <span className={styles.categoryBadge}>
                      {guide.category}
                    </span>
                    {allConnected && (
                      <span
                        className={styles.connectedDot}
                        title="Connected"
                      />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={styles.cardIconWrapper}>
                    <ServiceIcon name={guide.iconName} />
                  </div>

                  {/* Name */}
                  <h2 className={styles.cardName}>{guide.name}</h2>

                  {/* Tagline */}
                  <p className={styles.cardTagline}>{guide.tagline}</p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default IntegrationsPage;
