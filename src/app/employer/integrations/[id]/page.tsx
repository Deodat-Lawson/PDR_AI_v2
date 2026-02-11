"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Brain,
  Home,
  Zap,
  Search,
  HardDrive,
  ScanLine,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowLeft,
  FileSearch,
  Mic,
} from "lucide-react";

import { ThemeToggle } from "~/app/_components/ThemeToggle";
import LoadingPage from "~/app/_components/loading";
import { serviceGuides, type ServiceGuide } from "../guides";
import styles from "~/styles/Employer/IntegrationDetail.module.css";

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------
const iconMap = { Zap, Search, HardDrive, ScanLine, Eye, FileSearch, Mic } as const;

function ServiceIcon({ name }: { name: ServiceGuide["iconName"] }) {
  const Icon = iconMap[name];
  return <Icon className={styles.serviceIcon} />;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ServiceStatus {
  isConnected: boolean;
  maskedKey: string | null;
}

type ServicesMap = Record<string, ServiceStatus>;

interface CardState {
  values: Record<string, string>;
  visible: Record<string, boolean>;
  guideOpen: boolean;
  saving: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
}

// ---------------------------------------------------------------------------
// Detail page for a single integration
// ---------------------------------------------------------------------------
const IntegrationDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { isLoaded, userId } = useAuth();

  const guideId = params.id as string;
  const guide = serviceGuides.find((g) => g.id === guideId);

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServicesMap>({});
  const [card, setCard] = useState<CardState | null>(null);

  // ------------------------------------------------------------------
  // Initialise card state
  // ------------------------------------------------------------------
  const initCard = useCallback(
    (svc: ServicesMap, g: ServiceGuide) => {
      const allConnected = g.fields.every((f) => svc[f.key]?.isConnected);
      setCard({
        values: Object.fromEntries(g.fields.map((f) => [f.key, ""])),
        visible: Object.fromEntries(g.fields.map((f) => [f.key, false])),
        guideOpen: !allConnected,
        saving: false,
        feedback: null,
      });
    },
    []
  );

  // ------------------------------------------------------------------
  // Auth + fetch
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      window.alert("Authentication failed! No user found.");
      router.push("/");
      return;
    }

    if (!guide) {
      router.push("/employer/integrations");
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
        initCard(json.services, guide);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [isLoaded, userId, router, guide, initCard]);

  // ------------------------------------------------------------------
  // Card state helpers
  // ------------------------------------------------------------------
  const updateCard = (patch: Partial<CardState>) => {
    setCard((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const setFieldValue = (key: string, value: string) => {
    setCard((prev) =>
      prev ? { ...prev, values: { ...prev.values, [key]: value } } : prev
    );
  };

  const toggleVisible = (key: string) => {
    setCard((prev) =>
      prev
        ? { ...prev, visible: { ...prev.visible, [key]: !prev.visible[key] } }
        : prev
    );
  };

  // ------------------------------------------------------------------
  // Save handler
  // ------------------------------------------------------------------
  const handleSave = async () => {
    if (!guide || !card) return;

    const keys: { keyType: string; keyValue: string }[] = [];
    for (const field of guide.fields) {
      const v = card.values[field.key]?.trim();
      if (v) keys.push({ keyType: field.key, keyValue: v });
    }

    if (keys.length === 0) {
      updateCard({
        feedback: { type: "error", message: "Please enter at least one key." },
      });
      return;
    }

    updateCard({ saving: true, feedback: null });

    try {
      const res = await fetch("/api/serviceConnections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      });

      const json = (await res.json()) as {
        success: boolean;
        message?: string;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Failed to save");
      }

      // Refresh status
      const statusRes = await fetch("/api/serviceConnections", {
        method: "GET",
      });
      const statusJson = (await statusRes.json()) as {
        success: boolean;
        services: ServicesMap;
      };
      setServices(statusJson.services);

      updateCard({
        saving: false,
        values: Object.fromEntries(guide.fields.map((f) => [f.key, ""])),
        feedback: { type: "success", message: "Keys saved successfully!" },
      });

      setTimeout(() => {
        setCard((prev) => (prev ? { ...prev, feedback: null } : prev));
      }, 4000);
    } catch (err) {
      updateCard({
        saving: false,
        feedback: {
          type: "error",
          message:
            err instanceof Error ? err.message : "Something went wrong.",
        },
      });
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) return <LoadingPage />;
  if (!guide || !card) return null;

  const allConnected = guide.fields.every(
    (f) => services[f.key]?.isConnected
  );

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logoWrapper}>
            <Brain className={styles.logoIcon} />
            <span className={styles.logoText}>PDR AI</span>
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
        {/* Back link */}
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push("/employer/integrations")}
        >
          <ArrowLeft className={styles.backIcon} />
          All Integrations
        </button>

        <article className={styles.serviceCard}>
          {/* Card Header */}
          <div className={styles.cardTop}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.serviceIconWrapper}>
                  <ServiceIcon name={guide.iconName} />
                </div>
                <div className={styles.serviceNameBlock}>
                  <h2 className={styles.serviceName}>{guide.name}</h2>
                  <span className={styles.serviceTagline}>
                    {guide.tagline}
                  </span>
                </div>
              </div>
              <span
                className={`${styles.statusBadge} ${
                  allConnected
                    ? styles.statusConnected
                    : styles.statusDisconnected
                }`}
              >
                {allConnected ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>

          {/* What it powers */}
          <div className={styles.powersSection}>
            <h3 className={styles.powersSectionTitle}>
              What this powers in PDR AI
            </h3>
            <ul className={styles.powersList}>
              {guide.whatItPowers.map((item, i) => (
                <li key={i} className={styles.powersItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Collapsible Setup Guide */}
          <button
            type="button"
            className={styles.accordionToggle}
            onClick={() => updateCard({ guideOpen: !card.guideOpen })}
            aria-expanded={card.guideOpen}
          >
            <span className={styles.accordionLabel}>Setup Guide</span>
            <ChevronDown
              className={`${styles.accordionChevron} ${
                card.guideOpen ? styles.accordionChevronOpen : ""
              }`}
            />
          </button>

          {card.guideOpen && (
            <div className={styles.accordionContent}>
              <ol className={styles.stepsList}>
                {guide.steps.map((step, idx) => (
                  <li key={idx} className={styles.step}>
                    <span className={styles.stepNumber}>{idx + 1}</span>
                    <div className={styles.stepBody}>
                      <h4 className={styles.stepTitle}>{step.title}</h4>
                      <p
                        className={styles.stepDescription}
                        dangerouslySetInnerHTML={{ __html: step.description }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Key Input Fields */}
          <div className={styles.inputSection}>
            {guide.fields.map((field) => {
              const status = services[field.key];
              const isVisible = card.visible[field.key];

              return (
                <div key={field.key} className={styles.fieldGroup}>
                  <label
                    htmlFor={`${guide.id}-${field.key}`}
                    className={styles.fieldLabel}
                  >
                    {field.label}
                    {status?.isConnected && status.maskedKey && (
                      <span className={styles.currentKey}>
                        Current: {status.maskedKey}
                      </span>
                    )}
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id={`${guide.id}-${field.key}`}
                      type={isVisible ? "text" : "password"}
                      className={styles.fieldInput}
                      placeholder={field.placeholder}
                      value={card.values[field.key] ?? ""}
                      onChange={(e) =>
                        setFieldValue(field.key, e.target.value)
                      }
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => toggleVisible(field.key)}
                      aria-label={isVisible ? "Hide value" : "Show value"}
                    >
                      {isVisible ? (
                        <EyeOff className={styles.eyeIcon} />
                      ) : (
                        <Eye className={styles.eyeIcon} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className={styles.actionRow}>
            <button
              className={styles.saveButton}
              disabled={card.saving}
              onClick={() => void handleSave()}
            >
              {card.saving ? "Saving..." : "Save"}
            </button>

            {card.feedback && (
              <span
                className={
                  card.feedback.type === "success"
                    ? styles.successText
                    : styles.errorText
                }
              >
                {card.feedback.message}
              </span>
            )}

            <a
              href={guide.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docsLink}
            >
              View Docs
              <ExternalLink className={styles.docsLinkIcon} />
            </a>
          </div>
        </article>
      </main>
    </div>
  );
};

export default IntegrationDetailPage;

