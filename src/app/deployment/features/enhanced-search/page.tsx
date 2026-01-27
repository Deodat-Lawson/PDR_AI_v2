import Link from "next/link";
import React from 'react';
import { ArrowLeft, Search, Zap, DollarSign, CheckCircle, Info } from 'lucide-react';
import styles from '../../../../styles/deployment.module.css';
import { Navbar } from '../../../_components/Navbar';
import { ClerkProvider } from '@clerk/nextjs';

export default function EnhancedSearchPage() {
    return (
        <ClerkProvider>
            <div className={styles.container}>
                <Navbar />

                <div className={styles.contentSection}>
                    <div className={styles.contentContainer}>
                        {/* Breadcrumb */}
                        <div className={styles.breadcrumb}>
                            <Link href="/deployment" className={styles.breadcrumbLink}>
                                <ArrowLeft className="w-4 h-4" />
                                Back to Deployment
                            </Link>
                        </div>

                        {/* Hero */}
                        <div className={styles.featurePageHero}>
                            <div className={styles.featureIconLarge}>
                                <Search className="w-16 h-16" />
                            </div>
                            <h1 className={styles.featurePageTitle}>
                                🔍 Enhanced Search with Tavily AI
                            </h1>
                            <p className={styles.featurePageSubtitle}>
                                Upgrade from basic DuckDuckGo to AI-powered web search with better results and deeper insights.
                            </p>
                            <div className={styles.featureBadgeGroup}>
                                <span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Optional Feature</span>
                                <span className={styles.costBadge}>$0.05 per search</span>
                            </div>
                        </div>

                        {/* What You Get */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Zap className={styles.sectionIcon} />
                                What You Get
                            </h2>

                            <div className={styles.comparisonGrid}>
                                <div className={styles.comparisonCard}>
                                    <h3 className={styles.comparisonTitle}>
                                        <span className={styles.comparisonBadge}>Without Tavily</span>
                                        Free DuckDuckGo Search
                                    </h3>
                                    <ul className={styles.list}>
                                        <li>Basic web search results</li>
                                        <li>Limited relevance ranking</li>
                                        <li>No AI-powered summarization</li>
                                        <li>Standard search snippets</li>
                                    </ul>
                                    <p className={styles.comparisonNote}>
                                        ✅ Free and always available as fallback
                                    </p>
                                </div>

                                <div className={`${styles.comparisonCard} ${styles.comparisonCardHighlight}`}>
                                    <h3 className={styles.comparisonTitle}>
                                        <span className={styles.comparisonBadgeHighlight}>With Tavily AI</span>
                                        Enhanced Search
                                    </h3>
                                    <ul className={styles.list}>
                                        <li>AI-optimized search results</li>
                                        <li>Intelligent relevance ranking</li>
                                        <li>Automated content summarization</li>
                                        <li>Rich context extraction</li>
                                        <li>Better accuracy for complex queries</li>
                                    </ul>
                                    <p className={styles.comparisonNote}>
                                        ⚡ $0.05 per search - pay only for what you use
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Setup Guide */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <CheckCircle className={styles.sectionIcon} />
                                Setup Guide
                            </h2>

                            <div className={styles.setupSteps}>
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>1</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Get Your Tavily API Key</h3>
                                        <p className={styles.stepDescription}>
                                            Sign up for a Tavily account and get your API key from the dashboard.
                                        </p>
                                        <a
                                            href="https://tavily.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                        >
                                            Go to Tavily →
                                        </a>
                                    </div>
                                </div>

                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>2</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Add to Environment Variables</h3>
                                        <p className={styles.stepDescription}>
                                            Add your Tavily API key to your <code>.env</code> file:
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                TAVILY_API_KEY="tvly-your-key-here"
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>3</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Restart Your Application</h3>
                                        <p className={styles.stepDescription}>
                                            The feature auto-detects when the API key is present. Just restart your app!
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # Stop your dev server and restart<br />
                                                pnpm dev
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>4</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Verify It Works</h3>
                                        <p className={styles.stepDescription}>
                                            Your app will now automatically use Tavily for web searches. No code changes needed!
                                        </p>
                                        <div className={styles.successBox}>
                                            <h4>✅ Auto-Detection Active</h4>
                                            <p>
                                                PDR AI automatically detects the Tavily API key and switches from DuckDuckGo to Tavily AI search.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Cost Information */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <DollarSign className={styles.sectionIcon} />
                                Cost & Usage
                            </h2>

                            <div className={styles.costBreakdownCard}>
                                <h3>Pricing Model</h3>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>Cost per search:</span>
                                    <span className={styles.pricingValue}>$0.05</span>
                                </div>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>Estimated monthly (100 searches):</span>
                                    <span className={styles.pricingValue}>$5.00</span>
                                </div>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>Estimated monthly (500 searches):</span>
                                    <span className={styles.pricingValue}>$25.00</span>
                                </div>

                                <div className={styles.noteBox}>
                                    <p>
                                        <strong>Pay-as-you-go:</strong> You only pay for the searches you actually perform.
                                        If you remove the API key, the system automatically falls back to free DuckDuckGo search.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Technical Details */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Info className={styles.sectionIcon} />
                                How It Works
                            </h2>

                            <div className={styles.technicalDetails}>
                                <h3 className={styles.subsectionTitle}>Automatic Fallback</h3>
                                <p className={styles.stepDescription}>
                                    The search service automatically detects which provider to use based on your environment variables:
                                </p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        {`// From src/lib/featureFlags.ts
export const features = {
  tavilySearch: {
    enabled: !!env.server.TAVILY_API_KEY,
    fallback: "DuckDuckGo"
  }
};

// From src/lib/searchService.ts
export async function performWebSearch(query: string) {
  if (features.tavilySearch.enabled) {
    return await tavilySearch(query);
  } else {
    return await duckDuckGoSearch(query);
  }
}`}
                                    </code>
                                </div>

                                <h3 className={styles.subsectionTitle}>Zero Configuration</h3>
                                <p className={styles.stepDescription}>
                                    No code changes needed. Simply add the API key and the feature activates automatically.
                                </p>
                            </div>
                        </section>

                        {/* Next Steps */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Next Steps</h2>
                            <div className={styles.nextStepsGrid}>
                                <Link href="/deployment/features/ocr" className={styles.nextStepCard}>
                                    <h3>📄 OCR Processing</h3>
                                    <p>Extract text from scanned PDFs</p>
                                </Link>
                                <Link href="/deployment/features/voice" className={styles.nextStepCard}>
                                    <h3>🎙️ Voice Features</h3>
                                    <p>Professional text-to-speech</p>
                                </Link>
                                <Link href="/deployment/features/multi-model" className={styles.nextStepCard}>
                                    <h3>🤖 Multi-Model AI</h3>
                                    <p>Add Claude and Gemini models</p>
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </ClerkProvider>
    );
}
