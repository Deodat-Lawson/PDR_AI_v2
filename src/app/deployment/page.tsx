import Link from "next/link";
import React from 'react';
import { Check, Terminal, Database, Shield, Zap, Github, ExternalLink, BookOpen } from 'lucide-react';
import styles from '../../styles/deployment.module.css';
import { Navbar } from '../_components/Navbar';
import { ClerkProvider } from '@clerk/nextjs'

export default function DeploymentPage() {
    return (
        <ClerkProvider>
            <div className={styles.container}>
                <Navbar />

                {/* Table of Contents Sidebar */}
                <div className={styles.tocContainer}>
                    <div className={styles.tocContent}>
                        <div className={styles.tocTitle}>
                            <BookOpen className="inline-block w-5 h-5 mr-2" />
                            Documentation
                        </div>
                        <nav className={styles.tocList}>
                            <div className={styles.tocItem}>
                                <a href="#core-features" className={styles.tocLink}>Core + Optional Features</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#reference-configs" className={styles.tocLink}>Reference Configurations</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#prerequisites" className={styles.tocLink}>Prerequisites</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#quick-start" className={styles.tocLink}>Quick Start</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#api-keys" className={styles.tocLink}>Setting Up API Keys</a>
                                <div className={styles.tocSubList}>
                                    <div className={styles.tocSubItem}>
                                        <a href="#clerk" className={styles.tocSubLink}>Clerk Auth</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#openai" className={styles.tocSubLink}>OpenAI</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#uploadthing" className={styles.tocSubLink}>UploadThing</a>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#feature-guides" className={styles.tocLink}>Feature Integration</a>
                                <div className={styles.tocSubList}>
                                    <div className={styles.tocSubItem}>
                                        <a href="#search" className={styles.tocSubLink}>Web Search</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#ocr" className={styles.tocSubLink}>OCR Processing</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#voice" className={styles.tocSubLink}>Voice Features</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#ai-models" className={styles.tocSubLink}>Multi-Model AI</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#feature-flags" className={styles.tocSubLink}>Feature Flags</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#database" className={styles.tocSubLink}>Database Setup</a>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#deployment" className={styles.tocLink}>Deployment Platforms</a>
                                <div className={styles.tocSubList}>
                                    <div className={styles.tocSubItem}>
                                        <a href="#vercel" className={styles.tocSubLink}>Vercel</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#docker" className={styles.tocSubLink}>Docker</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#vps" className={styles.tocSubLink}>VPS</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#railway" className={styles.tocSubLink}>Railway</a>
                                    </div>
                                    <div className={styles.tocSubItem}>
                                        <a href="#render" className={styles.tocSubLink}>Render</a>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#env-vars" className={styles.tocLink}>Environment Variables</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#advanced" className={styles.tocLink}>Advanced Configuration</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#cost" className={styles.tocLink}>Cost Optimization</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#troubleshooting" className={styles.tocLink}>Troubleshooting</a>
                            </div>
                            <div className={styles.tocItem}>
                                <a href="#customization-examples" className={styles.tocLink}>Customization Examples</a>
                            </div>
                        </nav>
                    </div>
                </div>

                <div className={styles.contentWithToc}>
                    <div className={styles.heroSection}>
                        <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            Build Your Custom PDR AI
                        </h1>
                        <p className={styles.heroDescription}>
                            Start with the core features, then add exactly what you need. Choose your own combination of optional features - no fixed tiers, complete customization.
                        </p>
                        <div className={styles.heroButtons}>
                            <a 
                                href="https://github.com/Deodat-Lawson/pdr_ai_v2" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                            >
                                <Github className={styles.btnIcon} />
                                View on GitHub
                            </a>
                            <Link href="/contact">
                                <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}>
                                    Get Support
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={styles.contentSection}>
                    <div className={styles.contentContainer}>

                        {/* Core + Optional Features Overview */}
                        <section id="core-features" className={styles.section}>
                            <h2 className={styles.sectionTitle}>Core + Optional Features</h2>
                            <p className={styles.stepDescription}>
                                PDR AI is built with modularity in mind. Start with the required core features, then add exactly the optional features you need. No fixed tiers - build your custom setup.
                            </p>

                            {/* The Core (Required Features) */}
                            <h3 className={styles.subsectionTitle}>The Core (Always Required)</h3>
                            <p className={styles.stepDescription}>
                                These 4 features form the foundation of PDR AI. You need all of these to run the system.
                            </p>

                            <div className={styles.tierComparisonTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Feature</th>
                                            <th>Provider</th>
                                            <th>Cost</th>
                                            <th>What It Does</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Required</span> Database
                                            </td>
                                            <td>PostgreSQL + pgvector</td>
                                            <td>Free (Neon)</td>
                                            <td>Stores documents and embeddings for RAG search</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Required</span> Authentication
                                            </td>
                                            <td>Clerk</td>
                                            <td>Free (500 users)</td>
                                            <td>User sign-in and account management</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Required</span> File Upload
                                            </td>
                                            <td>UploadThing</td>
                                            <td>Free (2GB)</td>
                                            <td>PDF and document storage</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Required</span> AI Model
                                            </td>
                                            <td>OpenAI GPT-4</td>
                                            <td>$10-30/mo</td>
                                            <td>Chat, embeddings, RAG search, DuckDuckGo web search</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Optional Features (Pick What You Need) */}
                            <h3 className={styles.subsectionTitle}>Optional Features (Pick What You Need)</h3>
                            <p className={styles.stepDescription}>
                                Add any combination of these features to customize your PDR AI. Each feature is independently optional and auto-detected based on API keys.
                            </p>

                            <div className={styles.tierComparisonTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Feature</th>
                                            <th>Cost</th>
                                            <th>What You Get</th>
                                            <th>Fallback</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Optional</span> 🔍 Enhanced Search (Tavily)
                                            </td>
                                            <td>$0.05/search</td>
                                            <td>AI-powered web search with better results</td>
                                            <td>DuckDuckGo (free)</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Optional</span> 📄 OCR Processing
                                            </td>
                                            <td>$0.30-2/page</td>
                                            <td>Extract text from scanned PDFs (3 provider options)</td>
                                            <td>Text-only PDFs</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Optional</span> 🎙️ Voice Features (ElevenLabs)
                                            </td>
                                            <td>$0.30/1K chars</td>
                                            <td>Professional text-to-speech synthesis</td>
                                            <td>Browser TTS</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeFull}`}>Optional</span> 🤖 Claude AI (Anthropic)
                                            </td>
                                            <td>$0.015-0.075/1K tokens</td>
                                            <td>Additional AI model option for chat</td>
                                            <td>OpenAI only</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeFull}`}>Optional</span> 🤖 Gemini AI (Google)
                                            </td>
                                            <td>Free tier + paid</td>
                                            <td>Additional AI model option for chat</td>
                                            <td>OpenAI only</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Optional</span> 📊 LangSmith Monitoring
                                            </td>
                                            <td>Free tier available</td>
                                            <td>LLM call tracing and debugging tools</td>
                                            <td>No monitoring</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                        </section>

                        {/* Reference Configurations */}
                        <section id="reference-configs" className={styles.section}>
                            <h2 className={styles.sectionTitle}>Reference Configurations</h2>
                            <p className={styles.stepDescription}>
                                These are example setups showing common configurations. Feel free to customize - you can add any combination of optional features that fits your needs!
                            </p>

                            <div className={styles.featureMatrix}>
                                <div className={styles.featureMatrixCard}>
                                    <Zap className={styles.featureIcon} />
                                    <h4>Minimal Setup (Example)</h4>
                                    <p className={styles.exampleBadge}>$10-30/month</p>
                                    <p>Core features only - great for students and personal projects.</p>
                                    <ul className={styles.list}>
                                        <li>✅ Database (PostgreSQL + pgvector)</li>
                                        <li>✅ Authentication (Clerk)</li>
                                        <li>✅ File Upload (UploadThing)</li>
                                        <li>✅ OpenAI GPT-4</li>
                                    </ul>
                                    <p className={styles.exampleNote}>Good for: Students, learning, personal use</p>
                                </div>
                                <div className={styles.featureMatrixCard}>
                                    <Zap className={styles.featureIcon} />
                                    <h4>Professional Setup (Example)</h4>
                                    <p className={styles.exampleBadge}>$20-60/month</p>
                                    <p>Core + popular optional features for small businesses.</p>
                                    <ul className={styles.list}>
                                        <li>✅ All Core Features</li>
                                        <li>➕ Enhanced Search (Tavily)</li>
                                        <li>➕ OCR Processing (Datalab/Azure)</li>
                                        <li>➕ Voice Features (ElevenLabs)</li>
                                    </ul>
                                    <p className={styles.exampleNote}>Good for: Small business, scanned docs, professional use</p>
                                </div>
                                <div className={styles.featureMatrixCard}>
                                    <Zap className={styles.featureIcon} />
                                    <h4>Full-Featured Setup (Example)</h4>
                                    <p className={styles.exampleBadge}>$40-160/month</p>
                                    <p>Core + all optional features for maximum capabilities.</p>
                                    <ul className={styles.list}>
                                        <li>✅ All Core Features</li>
                                        <li>➕ All Optional Features</li>
                                        <li>➕ Multi-Model AI (Claude + Gemini)</li>
                                        <li>➕ LangSmith Monitoring</li>
                                    </ul>
                                    <p className={styles.exampleNote}>Good for: Enterprise, research teams, multi-model comparison</p>
                                </div>
                            </div>

                            <div className={styles.noteBox}>
                                <p><strong>Remember:</strong> These are just examples! You can mix and match any optional features. Want OCR but not voice? Just add the OCR API key. Need multi-model AI without enhanced search? Add Claude/Gemini keys. Build your own custom PDR AI!</p>
                            </div>
                        </section>

                        {/* Prerequisites Section */}
                        <section id="prerequisites" className={styles.section}>
                            <h2 className={styles.sectionTitle}>Prerequisites</h2>
                            <div className={styles.prerequisitesGrid}>
                                <div className={styles.prerequisiteCard}>
                                    <Terminal className={styles.prerequisiteIcon} />
                                    <h3>Node.js & Package Manager</h3>
                                    <ul className={styles.list}>
                                        <li>Node.js v18.0 or higher</li>
                                        <li>pnpm (recommended) or npm</li>
                                        <li>Git for version control</li>
                                    </ul>
                                </div>
                                <div className={styles.prerequisiteCard}>
                                    <Database className={styles.prerequisiteIcon} />
                                    <h3>Database</h3>
                                    <ul className={styles.list}>
                                        <li>Docker (for local PostgreSQL)</li>
                                        <li>Or existing PostgreSQL instance</li>
                                        <li>PostgreSQL 14+ recommended</li>
                                    </ul>
                                </div>
                                <div className={styles.prerequisiteCard}>
                                    <Shield className={styles.prerequisiteIcon} />
                                    <h3>API Keys Required</h3>
                                    <ul className={styles.list}>
                                        <li>OpenAI API key</li>
                                        <li>Clerk authentication</li>
                                        <li>UploadThing for file storage</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Quick Start Section */}
                        <section id="quick-start" className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Zap className={styles.sectionIcon} />
                                Quick Start
                            </h2>
                            <div className={styles.codeSection}>
                                <h3 className={styles.stepTitle}>1. Clone the Repository</h3>
                                <div className={styles.codeBlock}>
                                    <code>
                                        git clone https://github.com/Deodat-Lawson/pdr_ai_v2.git<br />
                                        cd pdr_ai_v2
                                    </code>
                                </div>
                            </div>

                            <div className={styles.codeSection}>
                                <h3 className={styles.stepTitle}>2. Install Dependencies</h3>
                                <div className={styles.codeBlock}>
                                    <code>pnpm install</code>
                                </div>
                            </div>

                            <div className={styles.codeSection}>
                                <h3 className={styles.stepTitle}>3. Configure Environment Variables</h3>
                                <p className={styles.stepDescription}>
                                    Create a <code>.env</code> file in the root directory with all required variables:
                                </p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Database Configuration<br />
                                        # Format: postgresql://[user]:[password]@[host]:[port]/[database]<br />
                                        DATABASE_URL=&quot;postgresql://postgres:password@localhost:5432/pdr_ai_v2&quot;<br />
                                        <br />
                                        # Clerk Authentication (get from https://clerk.com/)<br />
                                        # Required for user authentication and authorization<br />
                                        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key<br />
                                        CLERK_SECRET_KEY=your_clerk_secret_key<br />
                                        <br />
                                        # Clerk Force Redirect URLs (Optional - for custom redirect after authentication)<br />
                                        # These URLs control where users are redirected after sign in/up/sign out<br />
                                        # If not set, Clerk will use default redirect behavior<br />
                                        NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=https://your-domain.com/employer/home<br />
                                        NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=https://your-domain.com/signup<br />
                                        NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL=https://your-domain.com/<br />
                                        <br />
                                        # OpenAI API (get from https://platform.openai.com/)<br />
                                        # Required for AI features: document analysis, embeddings, chat<br />
                                        OPENAI_API_KEY=your_openai_api_key<br />
                                        <br />
                                        # LangChain (get from https://smith.langchain.com/)<br />
                                        # Optional: Required for LangSmith tracing and monitoring<br />
                                        # LangSmith provides observability and debugging for LangChain operations<br />
                                        LANGCHAIN_TRACING_V2=true<br />
                                        LANGCHAIN_API_KEY=your_langchain_api_key<br />
                                        <br />
                                        # Tavily Search API (get from https://tavily.com/)<br />
                                        # Optional: Required for enhanced web search capabilities<br />
                                        # Used for finding related documents and external resources<br />
                                        TAVILY_API_KEY=your_tavily_api_key<br />
                                        <br />
                                        # UploadThing (get from https://uploadthing.com/)<br />
                                        # Required for file uploads (PDF documents)<br />
                                        UPLOADTHING_SECRET=your_uploadthing_secret<br />
                                        UPLOADTHING_APP_ID=your_uploadthing_app_id<br />
                                        <br />
                                        # Environment Configuration<br />
                                        # Options: development, test, production<br />
                                        NODE_ENV=development<br />
                                        <br />
                                        # Optional: Skip environment validation (useful for Docker builds)<br />
                                        # SKIP_ENV_VALIDATION=false
                                    </code>
                                </div>
                            </div>

                            <div className={styles.codeSection}>
                                <h3 className={styles.stepTitle}>4. Set Up Database</h3>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Start PostgreSQL with Docker<br />
                                        chmod +x start-database.sh<br />
                                        ./start-database.sh<br />
                                        <br />
                                        # Run migrations<br />
                                        pnpm db:push
                                    </code>
                                </div>
                            </div>

                            <div className={styles.codeSection}>
                                <h3 className={styles.stepTitle}>5. Start Development Server</h3>
                                <div className={styles.codeBlock}>
                                    <code>pnpm dev</code>
                                </div>
                                <p className={styles.stepDescription}>
                                    Your application will be available at <code>http://localhost:3000</code>
                                </p>
                            </div>
                        </section>

                        {/* API Keys Section */}
                        <section id="api-keys" className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Shield className={styles.sectionIcon} />
                                Setting Up API Keys
                            </h2>

                            <div id="clerk" className={styles.apiKeySection}>
                                <h3 className={styles.apiKeyTitle}>Clerk Authentication</h3>
                                <ol className={styles.orderedList}>
                                    <li>Create an account at <a href="https://clerk.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>Clerk.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Create a new application</li>
                                    <li>Copy the publishable and secret keys</li>
                                    <li>Add them to your <code>.env</code> file</li>
                                    <li>Configure sign-in/sign-up methods as needed</li>
                                    <li><strong>Optional:</strong> Set up force redirect URLs:
                                        <ul className={styles.list}>
                                            <li><code>NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL</code> - Redirect after sign in</li>
                                            <li><code>NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL</code> - Redirect after sign up</li>
                                            <li><code>NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL</code> - Redirect after sign out</li>
                                        </ul>
                                    </li>
                                </ol>
                            </div>

                            <div id="openai" className={styles.apiKeySection}>
                                <h3 className={styles.apiKeyTitle}>OpenAI API</h3>
                                <ol className={styles.orderedList}>
                                    <li>Create an account at <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>OpenAI Platform <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Navigate to API keys section</li>
                                    <li>Generate a new API key</li>
                                    <li>Add the key to your <code>.env</code> file</li>
                                    <li>Set up billing for API usage</li>
                                </ol>
                            </div>

                            <div className={styles.apiKeySection}>
                                <h3 className={styles.apiKeyTitle}>LangChain (LangSmith) - Optional</h3>
                                <ol className={styles.orderedList}>
                                    <li>Create an account at <a href="https://smith.langchain.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>LangSmith <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Generate an API key from your account settings</li>
                                    <li>Set <code>LANGCHAIN_TRACING_V2=true</code> in your <code>.env</code> file</li>
                                    <li>Add <code>LANGCHAIN_API_KEY</code> to your <code>.env</code> file</li>
                                    <li>This enables tracing and monitoring of LangChain operations for debugging</li>
                                </ol>
                            </div>

                            <div className={styles.apiKeySection}>
                                <h3 className={styles.apiKeyTitle}>Tavily Search API - Optional</h3>
                                <ol className={styles.orderedList}>
                                    <li>Create an account at <a href="https://tavily.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>Tavily <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Generate an API key from your dashboard</li>
                                    <li>Add <code>TAVILY_API_KEY</code> to your <code>.env</code> file</li>
                                    <li>Used for enhanced web search capabilities in document analysis</li>
                                </ol>
                            </div>

                            <div id="uploadthing" className={styles.apiKeySection}>
                                <h3 className={styles.apiKeyTitle}>UploadThing</h3>
                                <ol className={styles.orderedList}>
                                    <li>Create an account at <a href="https://uploadthing.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>UploadThing.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Create a new app</li>
                                    <li>Copy the secret and app ID</li>
                                    <li>Add them to your <code>.env</code> file</li>
                                </ol>
                            </div>
                        </section>

                        {/* Feature Integration Guides Section */}
                        <section id="feature-guides" className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Zap className={styles.sectionIcon} />
                                Feature Integration Guides
                            </h2>
                            <p className={styles.stepDescription}>
                                Detailed setup guides for each optional feature. All features gracefully degrade if API keys are not provided.
                            </p>

                            {/* Search Services */}
                            <div id="search" className={styles.integrationGuide}>
                                <h3>🔍 Web Search Services</h3>
                                <p className={styles.stepDescription}>
                                    PDR AI automatically detects which search provider is available and uses the best option.
                                </p>

                                <div className={styles.providerComparisonTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Provider</th>
                                                <th>Cost</th>
                                                <th>Quality</th>
                                                <th>Setup</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Tavily AI</strong> (Enhanced)</td>
                                                <td>$0.05/search</td>
                                                <td>High - AI-powered relevance</td>
                                                <td>API key required</td>
                                            </tr>
                                            <tr>
                                                <td><strong>DuckDuckGo</strong> (Core Fallback)</td>
                                                <td>Free</td>
                                                <td>Good - Privacy-focused</td>
                                                <td>No setup needed</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4>Tavily AI Setup (Optional Feature)</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://tavily.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>tavily.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Get your API key from the dashboard</li>
                                    <li>Add to <code>.env</code>: <code>TAVILY_API_KEY=&quot;tvly-...&quot;</code></li>
                                    <li>Restart server - search automatically uses Tavily!</li>
                                </ol>

                                <div className={styles.codeBlock}>
                                    <code>
                                        # Automatic fallback behavior:<br />
                                        # 1. If TAVILY_API_KEY exists → Uses Tavily (premium)<br />
                                        # 2. If no API key → Uses DuckDuckGo (free)<br />
                                        # No code changes needed!
                                    </code>
                                </div>
                            </div>

                            {/* OCR Processing */}
                            <div id="ocr" className={styles.integrationGuide}>
                                <h3>📄 OCR Processing</h3>
                                <p className={styles.stepDescription}>
                                    Enable OCR to extract text from scanned documents and images. Choose a provider based on your needs.
                                </p>

                                <div className={styles.providerComparisonTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Provider</th>
                                                <th>Cost/Page</th>
                                                <th>Best For</th>
                                                <th>Accuracy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Azure Document Intelligence</strong></td>
                                                <td>$0.50-2.00</td>
                                                <td>Complex layouts, tables</td>
                                                <td>Very High</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Datalab Marker</strong></td>
                                                <td>$0.30-2.00</td>
                                                <td>Scanned documents</td>
                                                <td>High</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Landing.AI</strong></td>
                                                <td>$0.30</td>
                                                <td>Handwritten text</td>
                                                <td>Medium-High</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Native PDF</strong> (Fallback)</td>
                                                <td>Free</td>
                                                <td>Digital PDFs only</td>
                                                <td>N/A (text extraction)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4>Azure Document Intelligence Setup</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create Azure account at <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className={styles.link}>portal.azure.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Create a &quot;Document Intelligence&quot; resource</li>
                                    <li>Copy endpoint and key from resource</li>
                                    <li>Add to <code>.env</code>:
                                        <div className={styles.codeBlock}>
                                            <code>
                                                AZURE_DOC_INTELLIGENCE_ENDPOINT=&quot;https://your-resource.cognitiveservices.azure.com/&quot;<br />
                                                AZURE_DOC_INTELLIGENCE_KEY=&quot;your_key&quot;
                                            </code>
                                        </div>
                                    </li>
                                    <li>Restart server - OCR checkbox appears in upload UI</li>
                                </ol>

                                <h4>Datalab Marker Setup (Recommended)</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://www.datalab.to/" target="_blank" rel="noopener noreferrer" className={styles.link}>datalab.to <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Get API key from dashboard</li>
                                    <li>Add to <code>.env</code>: <code>DATALAB_API_KEY=&quot;...&quot;</code></li>
                                    <li>Restart server</li>
                                </ol>

                                <h4>Landing.AI Setup</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://landing.ai/" target="_blank" rel="noopener noreferrer" className={styles.link}>landing.ai <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Get API key</li>
                                    <li>Add to <code>.env</code>: <code>LANDING_AI_API_KEY=&quot;...&quot;</code></li>
                                </ol>
                            </div>

                            {/* Voice Features */}
                            <div id="voice" className={styles.integrationGuide}>
                                <h3>🎤 Voice Features</h3>
                                <p className={styles.stepDescription}>
                                    Enable text-to-speech and speech-to-text for interactive voice chat in the Study Agent.
                                </p>

                                <h4>ElevenLabs Text-to-Speech (Optional Feature)</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className={styles.link}>elevenlabs.io <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Get your API key</li>
                                    <li>Choose a voice ID (default: Rachel)</li>
                                    <li>Add to <code>.env</code>:
                                        <div className={styles.codeBlock}>
                                            <code>
                                                ELEVENLABS_API_KEY=&quot;your_key&quot;<br />
                                                ELEVENLABS_VOICE_ID=&quot;L1QogKoobNwLy4IaMsyA&quot;  # Optional
                                            </code>
                                        </div>
                                    </li>
                                    <li>Restart server - voice features enabled in Study Agent</li>
                                </ol>

                                <div className={styles.infoBox}>
                                    <h4>Fallback Behavior</h4>
                                    <ul className={styles.list}>
                                        <li><strong>No ElevenLabs key:</strong> Uses browser Web Speech API (free, but quality varies)</li>
                                        <li><strong>Speech-to-text:</strong> Uses browser Web Speech Recognition API (always available)</li>
                                    </ul>
                                </div>

                                <p className={styles.stepDescription}>
                                    <strong>Cost:</strong> ~$0.30 per 1,000 characters. Average AI response is 200-500 characters ($0.06-0.15 per response).
                                </p>
                            </div>

                            {/* Multi-Model AI */}
                            <div id="ai-models" className={styles.integrationGuide}>
                                <h3>🤖 Multi-Model AI</h3>
                                <p className={styles.stepDescription}>
                                    Add Claude and Gemini models for comparison, specialized tasks, or cost optimization.
                                </p>

                                <div className={styles.providerComparisonTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Model</th>
                                                <th>Provider</th>
                                                <th>Cost (per 1K tokens)</th>
                                                <th>Best For</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>GPT-4</strong> (Required)</td>
                                                <td>OpenAI</td>
                                                <td>$0.01-0.03</td>
                                                <td>General-purpose, reliable</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Claude</strong> (Optional)</td>
                                                <td>Anthropic</td>
                                                <td>$0.015-0.075</td>
                                                <td>Advanced reasoning, long context</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Gemini</strong> (Optional)</td>
                                                <td>Google AI</td>
                                                <td>$0.0001-0.0005</td>
                                                <td>Cost-effective, free tier</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4>Anthropic Claude Setup (Optional Feature)</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>console.anthropic.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Get API key</li>
                                    <li>Add to <code>.env</code>: <code>ANTHROPIC_API_KEY=&quot;sk-ant-...&quot;</code></li>
                                    <li>Restart server - Claude models available in chat</li>
                                </ol>

                                <h4>Google Gemini Setup (Optional Feature)</h4>
                                <ol className={styles.orderedList}>
                                    <li>Get API key from <a href="https://makersuite.google.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>makersuite.google.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Add to <code>.env</code>: <code>GOOGLE_AI_API_KEY=&quot;...&quot;</code></li>
                                    <li>Restart server - Gemini models available</li>
                                </ol>

                                <div className={styles.highlightBox}>
                                    <h4>💡 Pro Tip: Use Gemini for Cost Savings</h4>
                                    <p>
                                        Gemini has a generous free tier (60 requests/minute). Use it for:
                                    </p>
                                    <ul className={styles.list}>
                                        <li>Low-priority document analysis</li>
                                        <li>Development and testing</li>
                                        <li>Batch processing tasks</li>
                                    </ul>
                                    <p>
                                        Can reduce AI costs by 50-70%!
                                    </p>
                                </div>
                            </div>

                            {/* Feature Flags System */}
                            <div id="feature-flags" className={styles.integrationGuide}>
                                <h3>⚙️ Feature Flags System</h3>
                                <p className={styles.stepDescription}>
                                    PDR AI automatically detects which features are enabled based on your environment variables.
                                </p>

                                <div className={styles.codeBlock}>
                                    <code>
                                        {`// src/lib/featureFlags.ts
import { env } from "~/env";

export const features = {
  tavilySearch: {
    enabled: !!env.server.TAVILY_API_KEY,
    fallback: "duck-duck-scrape",
  },
  ocr: {
    enabled: !!env.server.DATALAB_API_KEY || !!env.server.AZURE_DOC_INTELLIGENCE_KEY,
    fallback: "text-only",
  },
  tts: {
    enabled: !!env.server.ELEVENLABS_API_KEY,
    fallback: "browser-tts",
  },
  aiModels: {
    openai: true, // Always available
    claude: !!env.server.ANTHROPIC_API_KEY,
    gemini: !!env.server.GOOGLE_AI_API_KEY,
  },
};`}
                                    </code>
                                </div>

                                <p className={styles.stepDescription}>
                                    <strong>How it works:</strong> No configuration needed! Just add API keys to <code>.env</code> and the system automatically:
                                </p>
                                <ul className={styles.list}>
                                    <li>✅ Enables features when keys are present</li>
                                    <li>✅ Gracefully falls back to free alternatives when keys are missing</li>
                                    <li>✅ Shows/hides UI elements based on availability</li>
                                    <li>✅ Calculates your current deployment tier</li>
                                </ul>
                            </div>

                            {/* Database & Vector Search */}
                            <div id="database" className={styles.integrationGuide}>
                                <h3>🗄️ Database & Vector Search</h3>
                                <p className={styles.stepDescription}>
                                    PDR AI requires PostgreSQL with pgvector extension for storing embeddings and vector similarity search.
                                </p>

                                <div className={styles.providerComparisonTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Provider</th>
                                                <th>Free Tier</th>
                                                <th>Best For</th>
                                                <th>Setup</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Neon</strong> (Recommended)</td>
                                                <td>0.5GB storage</td>
                                                <td>Vercel deployments, serverless</td>
                                                <td>Very Easy</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Supabase</strong></td>
                                                <td>500MB database</td>
                                                <td>Full backend features</td>
                                                <td>Easy</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Railway</strong></td>
                                                <td>$5 credit</td>
                                                <td>Simple deployments</td>
                                                <td>Easy</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Local Docker</strong></td>
                                                <td>Free (unlimited)</td>
                                                <td>Development</td>
                                                <td>Medium</td>
                                            </tr>
                                            <tr>
                                                <td><strong>AWS RDS</strong></td>
                                                <td>12 months free</td>
                                                <td>Enterprise, AWS ecosystem</td>
                                                <td>Complex</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4>Essential: Enable pgvector Extension</h4>
                                <div className={styles.warningBox}>
                                    <h4>⚠️ Critical Step</h4>
                                    <p>
                                        You MUST enable the pgvector extension on your database. Without it, vector search will not work.
                                    </p>
                                </div>

                                <div className={styles.codeBlock}>
                                    <code>
                                        -- Run this SQL command in your database:<br />
                                        CREATE EXTENSION IF NOT EXISTS vector;
                                    </code>
                                </div>

                                <h4>Drizzle Studio (Database GUI)</h4>
                                <p className={styles.stepDescription}>
                                    Manage your database visually with Drizzle Studio:
                                </p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        pnpm db:studio  # Opens GUI at localhost:4983
                                    </code>
                                </div>
                            </div>
                        </section>

                        {/* Production Deployment Section */}
                        <section id="deployment" className={styles.section}>
                            <h2 className={styles.sectionTitle}>Production Deployment</h2>
                            
                            <div className={styles.infoBox}>
                                <h3>Prerequisites for Production</h3>
                                <ul className={styles.list}>
                                    <li>✅ All environment variables configured</li>
                                    <li>✅ Production database set up (PostgreSQL with pgvector extension)</li>
                                    <li>✅ API keys for all external services</li>
                                    <li>✅ Domain name configured (if using custom domain)</li>
                                </ul>
                            </div>
                            
                            <div id="vercel" className={styles.deploymentOption}>
                                <h3 className={styles.deploymentTitle}>1. Vercel (Recommended for Next.js)</h3>
                                <p className={styles.stepDescription}>
                                    Vercel is the recommended platform for Next.js applications with automatic deployments and scaling.
                                </p>
                                <ol className={styles.orderedList}>
                                    <li><strong>Push your code to GitHub</strong>
                                        <div className={styles.codeBlock}>
                                            <code>git push origin main</code>
                                        </div>
                                    </li>
                                    <li><strong>Import repository on <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Vercel <ExternalLink className={styles.linkIcon} /></a></strong>
                                        <ul className={styles.list}>
                                            <li>Go to vercel.com and sign in</li>
                                            <li>Click &quot;Add New Project&quot;</li>
                                            <li>Import your GitHub repository</li>
                                        </ul>
                                    </li>
                                    <li><strong>Set up Database and Environment Variables</strong>
                                        <div className={styles.infoBox}>
                                            <h4>Database Setup:</h4>
                                            <p><strong>Option A: Using Vercel Postgres (Recommended)</strong></p>
                                            <ol className={styles.orderedList}>
                                                <li>In Vercel dashboard, go to Storage → Create Database → Postgres</li>
                                                <li>Choose a region and create the database</li>
                                                <li>Vercel will automatically create the <code>DATABASE_URL</code> environment variable</li>
                                                <li>Enable pgvector extension: Connect to your database and run <code>CREATE EXTENSION IF NOT EXISTS vector;</code></li>
                                            </ol>
                                            <p><strong>Option B: Using Neon Database (Recommended for pgvector support)</strong></p>
                                            <ol className={styles.orderedList}>
                                                <li>Create a Neon account at <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className={styles.link}>neon.tech <ExternalLink className={styles.linkIcon} /></a> if you don&apos;t have one</li>
                                                <li>Create a new project in Neon dashboard</li>
                                                <li>Choose PostgreSQL version 14 or higher</li>
                                                <li>In Vercel dashboard, go to your project → Storage tab</li>
                                                <li>Click &quot;Create Database&quot; or &quot;Browse Marketplace&quot;</li>
                                                <li>Select &quot;Neon&quot; from the integrations</li>
                                                <li>Click &quot;Connect&quot; or &quot;Add Integration&quot;</li>
                                                <li>Authenticate with your Neon account</li>
                                                <li>Select your Neon project and branch</li>
                                                <li>Vercel will automatically create the <code>DATABASE_URL</code> environment variable from Neon</li>
                                                <li>You may also see additional Neon-related variables like <code>POSTGRES_URL</code>, <code>POSTGRES_PRISMA_URL</code>, etc.</li>
                                                <li>Enable pgvector extension in Neon:
                                                    <ul className={styles.list}>
                                                        <li>Go to Neon dashboard → SQL Editor</li>
                                                        <li>Run: <code>CREATE EXTENSION IF NOT EXISTS vector;</code></li>
                                                    </ul>
                                                </li>
                                            </ol>
                                            <p><strong>Option C: Using External Database (Manual Setup)</strong></p>
                                            <ol className={styles.orderedList}>
                                                <li>In Vercel dashboard, go to Settings → Environment Variables</li>
                                                <li>Click &quot;Add New&quot;</li>
                                                <li>Key: <code>DATABASE_URL</code></li>
                                                <li>Value: Your PostgreSQL connection string</li>
                                                <li>Select environments: Production, Preview, Development (as needed)</li>
                                                <li>Click &quot;Save&quot;</li>
                                            </ol>
                                        </div>
                                        <div className={styles.infoBox}>
                                            <h4>Add Other Environment Variables:</h4>
                                            <ul className={styles.list}>
                                                <li>In Vercel dashboard, go to Settings → Environment Variables</li>
                                                <li>Add all required environment variables:
                                                    <ul className={styles.list}>
                                                        <li><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code></li>
                                                        <li><code>CLERK_SECRET_KEY</code></li>
                                                        <li><code>OPENAI_API_KEY</code></li>
                                                        <li><code>UPLOADTHING_SECRET</code></li>
                                                        <li><code>UPLOADTHING_APP_ID</code></li>
                                                        <li><code>NODE_ENV=production</code></li>
                                                        <li><code>LANGCHAIN_TRACING_V2=true</code> (optional, for LangSmith tracing)</li>
                                                        <li><code>LANGCHAIN_API_KEY</code> (optional, required if tracing enabled)</li>
                                                        <li><code>TAVILY_API_KEY</code> (optional, for enhanced web search)</li>
                                                        <li><code>NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL</code> (optional)</li>
                                                        <li><code>NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL</code> (optional)</li>
                                                        <li><code>NEXT_PUBLIC_CLERK_SIGN_OUT_FORCE_REDIRECT_URL</code> (optional)</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                    <li><strong>Configure build settings</strong>
                                        <ul className={styles.list}>
                                            <li>Build Command: <code>pnpm build</code></li>
                                            <li>Output Directory: <code>.next</code> (default)</li>
                                            <li>Install Command: <code>pnpm install</code></li>
                                        </ul>
                                    </li>
                                    <li><strong>Deploy</strong>
                                        <ul className={styles.list}>
                                            <li>Click &quot;Deploy&quot;</li>
                                            <li>Vercel will automatically deploy on every push to your main branch</li>
                                        </ul>
                                    </li>
                                </ol>
                                <div className={styles.infoBox}>
                                    <h4>Post-Deployment Steps:</h4>
                                    <ol className={styles.orderedList}>
                                        <li><strong>Enable pgvector Extension:</strong>
                                            <ul className={styles.list}>
                                                <li>For Vercel Postgres: Use Vercel&apos;s SQL editor in Storage dashboard</li>
                                                <li>For Neon: Go to Neon dashboard → SQL Editor</li>
                                                <li>For External Database: Connect using your PostgreSQL client</li>
                                                <li>Run: <code>CREATE EXTENSION IF NOT EXISTS vector;</code></li>
                                            </ul>
                                        </li>
                                        <li><strong>Run database migrations:</strong>
                                <div className={styles.codeBlock}>
                                    <code>
                                                    # Option 1: Using Vercel CLI locally<br />
                                                    vercel env pull .env.local<br />
                                                    pnpm db:migrate<br />
                                        <br />
                                                    # Option 2: Using direct connection<br />
                                                    DATABASE_URL=&quot;your_production_db_url&quot; pnpm db:migrate
                                    </code>
                                            </div>
                                        </li>
                                        <li>Set up Clerk webhooks (if needed): Configure webhook URL in Clerk dashboard</li>
                                        <li>Configure UploadThing: Add your production domain to allowed origins</li>
                                    </ol>
                                </div>
                            </div>

                            <div id="vps" className={styles.deploymentOption}>
                                <h3 className={styles.deploymentTitle}>2. Self-Hosted VPS</h3>
                                <p className={styles.stepDescription}>
                                    Deploy on your own VPS with full control over the infrastructure.
                                </p>
                                <ol className={styles.orderedList}>
                                    <li><strong>Prerequisites</strong>
                                        <ul className={styles.list}>
                                            <li>VPS with Node.js 18+ installed</li>
                                            <li>PostgreSQL database (with pgvector extension)</li>
                                            <li>Nginx (for reverse proxy)</li>
                                            <li>PM2 or similar process manager</li>
                                        </ul>
                                    </li>
                                    <li><strong>Clone and install</strong>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                git clone &lt;your-repo-url&gt;<br />
                                                cd pdr_ai_v2-2<br />
                                                pnpm install
                                            </code>
                                        </div>
                                    </li>
                                    <li><strong>Configure environment variables</strong>
                                        <div className={styles.codeBlock}>
                                            <code>nano .env  # Add all production environment variables</code>
                                        </div>
                                    </li>
                                    <li><strong>Build the application</strong>
                                        <div className={styles.codeBlock}>
                                            <code>pnpm build</code>
                                        </div>
                                    </li>
                                    <li><strong>Set up PM2</strong>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                npm install -g pm2<br />
                                                pm2 start pnpm --name &quot;pdr-ai&quot; -- start<br />
                                                pm2 save<br />
                                                pm2 startup
                                            </code>
                                        </div>
                                    </li>
                                    <li><strong>Configure Nginx</strong>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                server &#123;<br />
                                                &nbsp;&nbsp;listen 80;<br />
                                                &nbsp;&nbsp;server_name your-domain.com;<br />
                                                &nbsp;&nbsp;location / &#123;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;proxy_pass http://localhost:3000;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;proxy_set_header Host $host;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;proxy_set_header X-Real-IP $remote_addr;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;proxy_set_header X-Forwarded-Proto $scheme;<br />
                                                &nbsp;&nbsp;&#125;<br />
                                                &#125;
                                            </code>
                                        </div>
                                    </li>
                                    <li><strong>Set up SSL with Let&apos;s Encrypt</strong>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                sudo apt-get install certbot python3-certbot-nginx<br />
                                                sudo certbot --nginx -d your-domain.com
                                            </code>
                                        </div>
                                    </li>
                                    <li><strong>Run database migrations</strong>
                                        <div className={styles.codeBlock}>
                                            <code>pnpm db:migrate</code>
                                        </div>
                                    </li>
                                </ol>
                            </div>

                            {/* Docker Deployment */}
                            <div id="docker" className={styles.deploymentOption}>
                                <h3 className={styles.deploymentTitle}>3. Docker & Docker Compose</h3>
                                <p className={styles.stepDescription}>
                                    Deploy with Docker for containerized, reproducible deployments across any environment.
                                </p>

                                <h4>docker-compose.yml</h4>
                                <p className={styles.stepDescription}>Create this file in your project root:</p>
                                <div className={styles.dockerBlock}>
                                    <pre>{`version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: pdr_ai_v2
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DATABASE_PASSWORD:-changeme}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:\${DATABASE_PASSWORD:-changeme}@postgres:5432/pdr_ai_v2
      NODE_ENV: production
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: \${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      CLERK_SECRET_KEY: \${CLERK_SECRET_KEY}
      OPENAI_API_KEY: \${OPENAI_API_KEY}
      UPLOADTHING_SECRET: \${UPLOADTHING_SECRET}
      UPLOADTHING_APP_ID: \${UPLOADTHING_APP_ID}
      # Add optional env vars as needed
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:`}</pre>
                                </div>

                                <h4>Dockerfile</h4>
                                <p className={styles.stepDescription}>Create this file in your project root:</p>
                                <div className={styles.dockerBlock}>
                                    <pre>{`FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Build application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`}</pre>
                                </div>

                                <h4>Deploy with Docker Compose</h4>
                                <ol className={styles.orderedList}>
                                    <li>Create <code>.env.production</code> file with your environment variables</li>
                                    <li>Build and start containers:
                                        <div className={styles.codeBlock}>
                                            <code>
                                                docker-compose up -d --build
                                            </code>
                                        </div>
                                    </li>
                                    <li>Run database migrations:
                                        <div className={styles.codeBlock}>
                                            <code>
                                                docker-compose exec app pnpm db:migrate
                                            </code>
                                        </div>
                                    </li>
                                    <li>Enable pgvector extension:
                                        <div className={styles.codeBlock}>
                                            <code>
                                                docker-compose exec postgres psql -U postgres -d pdr_ai_v2 -c &quot;CREATE EXTENSION IF NOT EXISTS vector;&quot;
                                            </code>
                                        </div>
                                    </li>
                                    <li>Access your app at <code>http://localhost:3000</code></li>
                                </ol>

                                <div className={styles.infoBox}>
                                    <h4>Docker Tips</h4>
                                    <ul className={styles.list}>
                                        <li><strong>View logs:</strong> <code>docker-compose logs -f app</code></li>
                                        <li><strong>Restart:</strong> <code>docker-compose restart</code></li>
                                        <li><strong>Stop:</strong> <code>docker-compose down</code></li>
                                        <li><strong>Update:</strong> <code>git pull && docker-compose up -d --build</code></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Railway Deployment */}
                            <div id="railway" className={styles.deploymentOption}>
                                <h3 className={styles.deploymentTitle}>4. Railway</h3>
                                <p className={styles.stepDescription}>
                                    Deploy to Railway for simple, GitHub-connected deployments with built-in PostgreSQL.
                                </p>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className={styles.link}>railway.app <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Click &quot;New Project&quot; → &quot;Deploy from GitHub repo&quot;</li>
                                    <li>Select your repository</li>
                                    <li>Add PostgreSQL database:
                                        <ul className={styles.list}>
                                            <li>Click &quot;New&quot; → &quot;Database&quot; → &quot;Add PostgreSQL&quot;</li>
                                            <li>Railway automatically sets <code>DATABASE_URL</code></li>
                                        </ul>
                                    </li>
                                    <li>Add environment variables in project settings</li>
                                    <li>Enable pgvector: Connect via Railway&apos;s PostgreSQL console and run:
                                        <div className={styles.codeBlock}>
                                            <code>CREATE EXTENSION IF NOT EXISTS vector;</code>
                                        </div>
                                    </li>
                                    <li>Deploy! Railway automatically deploys on git push</li>
                                </ol>
                            </div>

                            {/* Render Deployment */}
                            <div id="render" className={styles.deploymentOption}>
                                <h3 className={styles.deploymentTitle}>5. Render</h3>
                                <p className={styles.stepDescription}>
                                    Deploy to Render for simple web service hosting with managed PostgreSQL.
                                </p>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://render.com" target="_blank" rel="noopener noreferrer" className={styles.link}>render.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Create PostgreSQL database:
                                        <ul className={styles.list}>
                                            <li>Click &quot;New+&quot; → &quot;PostgreSQL&quot;</li>
                                            <li>Choose free tier or paid plan</li>
                                            <li>Copy internal database URL</li>
                                        </ul>
                                    </li>
                                    <li>Enable pgvector extension:
                                        <ul className={styles.list}>
                                            <li>Go to database → Shell</li>
                                            <li>Run: <code>CREATE EXTENSION IF NOT EXISTS vector;</code></li>
                                        </ul>
                                    </li>
                                    <li>Create Web Service:
                                        <ul className={styles.list}>
                                            <li>Click &quot;New+&quot; → &quot;Web Service&quot;</li>
                                            <li>Connect your GitHub repository</li>
                                            <li>Build Command: <code>pnpm install && pnpm build</code></li>
                                            <li>Start Command: <code>pnpm start</code></li>
                                        </ul>
                                    </li>
                                    <li>Add environment variables in web service settings</li>
                                    <li>Deploy! Render auto-deploys on git push</li>
                                </ol>
                            </div>

                            {/* Platform Comparison */}
                            <div className={styles.infoBox}>
                                <h3>Deployment Platform Comparison</h3>
                                <div className={styles.providerComparisonTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Platform</th>
                                                <th>Best For</th>
                                                <th>Difficulty</th>
                                                <th>Free Tier</th>
                                                <th>Paid From</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Vercel</strong></td>
                                                <td>Next.js, fastest setup</td>
                                                <td>Easy</td>
                                                <td>Generous</td>
                                                <td>$20/mo</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Railway</strong></td>
                                                <td>GitHub integration, simple</td>
                                                <td>Easy</td>
                                                <td>$5 credit</td>
                                                <td>Usage-based</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Render</strong></td>
                                                <td>Full-stack apps</td>
                                                <td>Easy</td>
                                                <td>Limited</td>
                                                <td>$7/mo</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Docker</strong></td>
                                                <td>Any cloud, portability</td>
                                                <td>Medium</td>
                                                <td>N/A</td>
                                                <td>Varies</td>
                                            </tr>
                                            <tr>
                                                <td><strong>VPS</strong></td>
                                                <td>Full control, cost-effective</td>
                                                <td>Hard</td>
                                                <td>N/A</td>
                                                <td>$5/mo+</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4>Recommendation by Use Case</h4>
                                <ul className={styles.list}>
                                    <li><strong>Fastest start:</strong> Vercel (one-click deploy)</li>
                                    <li><strong>Learning/prototyping:</strong> Railway (simple, generous)</li>
                                    <li><strong>Production app:</strong> Vercel or Render</li>
                                    <li><strong>Cost-sensitive:</strong> VPS (DigitalOcean, Linode)</li>
                                    <li><strong>Enterprise/compliance:</strong> Docker on AWS/GCP/Azure</li>
                                </ul>
                            </div>

                            <div className={styles.infoBox}>
                                <h3>Production Database Setup</h3>
                                <p><strong>Important:</strong> Your production database must have the <code>pgvector</code> extension enabled:</p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        CREATE EXTENSION IF NOT EXISTS vector;
                                    </code>
                                </div>
                                <p><strong>Recommended Database Providers:</strong></p>
                                <ul className={styles.list}>
                                    <li><strong>Neon</strong>: Fully serverless PostgreSQL with pgvector support</li>
                                    <li><strong>Supabase</strong>: PostgreSQL with pgvector extension</li>
                                    <li><strong>AWS RDS</strong>: Managed PostgreSQL (requires manual pgvector installation)</li>
                                    <li><strong>Railway</strong>: Simple PostgreSQL hosting</li>
                                </ul>
                            </div>

                            <div className={styles.infoBox}>
                                <h3>Post-Deployment Checklist</h3>
                                <ul className={styles.list}>
                                    <li>✅ Verify all environment variables are set correctly</li>
                                    <li>✅ Database migrations have been run</li>
                                    <li>✅ Clerk authentication is working</li>
                                    <li>✅ File uploads are working (UploadThing)</li>
                                    <li>✅ AI features are functioning (OpenAI API)</li>
                                    <li>✅ Database has pgvector extension enabled</li>
                                    <li>✅ SSL certificate is configured (if using custom domain)</li>
                                    <li>✅ Monitoring and logging are set up</li>
                                    <li>✅ Backup strategy is in place</li>
                                    <li>✅ Error tracking is configured (e.g., Sentry)</li>
                                </ul>
                            </div>
                        </section>

                        {/* Environment Variables Reference */}
                        <section id="env-vars" className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Shield className={styles.sectionIcon} />
                                Environment Variables Reference
                            </h2>
                            <p className={styles.stepDescription}>
                                Complete reference of all environment variables organized by deployment tier.
                            </p>

                            <div className={styles.envVarTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Variable</th>
                                            <th>Tier</th>
                                            <th>Required</th>
                                            <th>Description</th>
                                            <th>Cost Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Core (Required) */}
                                        <tr>
                                            <td colSpan={5}><strong>CORE FEATURES (Required)</strong></td>
                                        </tr>
                                        <tr>
                                            <td><code>DATABASE_URL</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Core</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeRequired}`}>Required</span></td>
                                            <td>PostgreSQL connection string with pgvector</td>
                                            <td>Free (Neon)</td>
                                        </tr>
                                        <tr>
                                            <td><code>OPENAI_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Core</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeRequired}`}>Required</span></td>
                                            <td>OpenAI for embeddings + chat (GPT-4)</td>
                                            <td>$10-30/mo</td>
                                        </tr>
                                        <tr>
                                            <td><code>CLERK_SECRET_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Core</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeRequired}`}>Required</span></td>
                                            <td>Clerk authentication backend secret</td>
                                            <td>Free (500 MAU)</td>
                                        </tr>
                                        <tr>
                                            <td><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Core</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeRequired}`}>Required</span></td>
                                            <td>Clerk frontend public key</td>
                                            <td>Free (500 MAU)</td>
                                        </tr>
                                        <tr>
                                            <td><code>UPLOADTHING_SECRET</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Core</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeRequired}`}>Required</span></td>
                                            <td>UploadThing backend secret for file uploads</td>
                                            <td>Free (100GB/mo)</td>
                                        </tr>
                                        <tr>
                                            <td><code>UPLOADTHING_APP_ID</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeCore}`}>Core</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeRequired}`}>Required</span></td>
                                            <td>UploadThing application identifier</td>
                                            <td>Free (100GB/mo)</td>
                                        </tr>

                                        {/* Optional Features - Enhanced */}
                                        <tr>
                                            <td colSpan={5}><strong>OPTIONAL FEATURES - Enhanced Search, OCR, Voice</strong></td>
                                        </tr>
                                        <tr>
                                            <td><code>TAVILY_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Premium web search (fallback: DuckDuckGo)</td>
                                            <td>$0.05/search</td>
                                        </tr>
                                        <tr>
                                            <td><code>DATALAB_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Datalab Marker OCR for scanned documents</td>
                                            <td>$0.30-2/page</td>
                                        </tr>
                                        <tr>
                                            <td><code>AZURE_DOC_INTELLIGENCE_ENDPOINT</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Azure Document Intelligence endpoint URL</td>
                                            <td>$0.50-2/page</td>
                                        </tr>
                                        <tr>
                                            <td><code>AZURE_DOC_INTELLIGENCE_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Azure Document Intelligence API key</td>
                                            <td>$0.50-2/page</td>
                                        </tr>
                                        <tr>
                                            <td><code>LANDING_AI_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Landing.AI OCR for handwritten documents</td>
                                            <td>$0.30/page</td>
                                        </tr>
                                        <tr>
                                            <td><code>ELEVENLABS_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>ElevenLabs text-to-speech (fallback: browser TTS)</td>
                                            <td>$0.30/1K chars</td>
                                        </tr>
                                        <tr>
                                            <td><code>ELEVENLABS_VOICE_ID</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeEnhanced}`}>Enhanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>ElevenLabs voice selection (default: Rachel)</td>
                                            <td>Included</td>
                                        </tr>

                                        {/* Full Tier */}
                                        <tr>
                                            <td colSpan={5}><strong>OPTIONAL FEATURES - Multi-Model AI</strong></td>
                                        </tr>
                                        <tr>
                                            <td><code>ANTHROPIC_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeFull}`}>Full</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Anthropic Claude AI models</td>
                                            <td>$0.015-0.075/1K tokens</td>
                                        </tr>
                                        <tr>
                                            <td><code>GOOGLE_AI_API_KEY</code></td>
                                            <td><span className={`${styles.tierBadge} ${styles.tierBadgeFull}`}>Full</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Google Gemini AI models (generous free tier)</td>
                                            <td>Free tier + $0.0001-0.0005/1K tokens</td>
                                        </tr>

                                        {/* Monitoring */}
                                        <tr>
                                            <td colSpan={5}><strong>MONITORING & DEBUGGING (Optional)</strong></td>
                                        </tr>
                                        <tr>
                                            <td><code>LANGCHAIN_TRACING_V2</code></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeAdvanced}`}>Advanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>Enable LangSmith tracing for debugging</td>
                                            <td>Free tier</td>
                                        </tr>
                                        <tr>
                                            <td><code>LANGCHAIN_API_KEY</code></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeAdvanced}`}>Advanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>LangSmith API key for tracing</td>
                                            <td>Free tier</td>
                                        </tr>
                                        <tr>
                                            <td><code>LANGCHAIN_PROJECT</code></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeAdvanced}`}>Advanced</span></td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusBadgeOptional}`}>Optional</span></td>
                                            <td>LangSmith project name</td>
                                            <td>Free tier</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.highlightBox}>
                                <h4>🔒 Security Best Practices</h4>
                                <ul className={styles.list}>
                                    <li><strong>Never commit <code>.env</code> files:</strong> Add to <code>.gitignore</code></li>
                                    <li><strong>Rotate API keys regularly:</strong> Especially for production</li>
                                    <li><strong>Use environment-specific variables:</strong> Different keys for dev/staging/prod</li>
                                    <li><strong>Limit API key permissions:</strong> Create read-only keys when possible</li>
                                    <li><strong>Monitor usage:</strong> Set up alerts for unusual API usage</li>
                                </ul>
                            </div>
                        </section>

                        {/* Advanced Configuration Section */}
                        <section id="advanced" className={styles.section}>
                            <h2 className={styles.sectionTitle}>Advanced Configuration</h2>
                            <p className={styles.stepDescription}>
                                Performance optimization, monitoring, security hardening, and scaling strategies for production deployments.
                            </p>

                            {/* Performance Optimization */}
                            <div className={styles.integrationGuide}>
                                <h3>⚡ Performance Optimization</h3>

                                <h4>Bundle Size Optimization (Pre-configured)</h4>
                                <p className={styles.stepDescription}>
                                    PDR AI is already optimized for Vercel deployments with:
                                </p>
                                <ul className={styles.list}>
                                    <li><strong>WASM Backend:</strong> HuggingFace Transformers uses WASM instead of Node.js runtime</li>
                                    <li><strong>Server External Packages:</strong> Heavy packages loaded at runtime, not bundled</li>
                                    <li><strong>File Tracing Exclusions:</strong> Unnecessary files excluded from serverless functions</li>
                                    <li><strong>Code Splitting:</strong> Automatic route-based code splitting</li>
                                </ul>

                                <h4>Database Query Optimization</h4>
                                <ul className={styles.list}>
                                    <li><strong>Connection Pooling:</strong> Use Neon pooling or pgBouncer for serverless</li>
                                    <li><strong>Index Embeddings:</strong> Vector indexes speed up similarity search</li>
                                    <li><strong>Limit Result Sets:</strong> Paginate large queries</li>
                                    <li><strong>Cache Embeddings:</strong> Avoid re-generating embeddings for same content</li>
                                </ul>

                                <h4>Caching Strategies</h4>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Cache repeated queries in Redis/Upstash<br />
                                        # Cache vector search results for common questions<br />
                                        # Use Next.js ISR for static content<br />
                                        # CDN caching for uploaded documents
                                    </code>
                                </div>
                            </div>

                            {/* Monitoring & Debugging */}
                            <div className={styles.integrationGuide}>
                                <h3>📊 Monitoring & Debugging</h3>

                                <h4>LangSmith Integration (Recommended)</h4>
                                <p className={styles.stepDescription}>
                                    Track LLM calls, debug chains, and monitor performance:
                                </p>
                                <ol className={styles.orderedList}>
                                    <li>Create account at <a href="https://smith.langchain.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>smith.langchain.com <ExternalLink className={styles.linkIcon} /></a></li>
                                    <li>Get API key</li>
                                    <li>Add to <code>.env</code>:
                                        <div className={styles.codeBlock}>
                                            <code>
                                                LANGCHAIN_TRACING_V2=&quot;true&quot;<br />
                                                LANGCHAIN_API_KEY=&quot;lsv2_...&quot;<br />
                                                LANGCHAIN_PROJECT=&quot;pdr-ai-production&quot;
                                            </code>
                                        </div>
                                    </li>
                                    <li>View traces in LangSmith dashboard</li>
                                </ol>

                                <h4>Error Tracking (Recommended)</h4>
                                <p className={styles.stepDescription}>Consider adding error tracking:</p>
                                <ul className={styles.list}>
                                    <li><strong>Sentry:</strong> Error tracking and performance monitoring</li>
                                    <li><strong>LogRocket:</strong> Session replay and error tracking</li>
                                    <li><strong>Datadog:</strong> Full-stack observability</li>
                                </ul>

                                <h4>Performance Monitoring</h4>
                                <ul className={styles.list}>
                                    <li><strong>Vercel Analytics:</strong> Auto-enabled on Vercel deployments</li>
                                    <li><strong>OpenAI Usage Dashboard:</strong> Monitor API costs and usage</li>
                                    <li><strong>Database Monitoring:</strong> Track query performance, connections</li>
                                </ul>
                            </div>

                            {/* Security Hardening */}
                            <div className={styles.integrationGuide}>
                                <h3>🔒 Security Hardening</h3>

                                <h4>API Key Security</h4>
                                <ul className={styles.list}>
                                    <li><strong>Environment Variables:</strong> Never hardcode keys in code</li>
                                    <li><strong>Key Rotation:</strong> Rotate keys every 90 days</li>
                                    <li><strong>Separate Keys:</strong> Different keys for dev/staging/prod</li>
                                    <li><strong>Rate Limiting:</strong> Implement API rate limits to prevent abuse</li>
                                </ul>

                                <h4>Authentication Security</h4>
                                <ul className={styles.list}>
                                    <li><strong>Clerk Webhooks:</strong> Verify webhook signatures</li>
                                    <li><strong>CORS:</strong> Restrict origins in production</li>
                                    <li><strong>Session Security:</strong> Use secure, httpOnly cookies</li>
                                </ul>

                                <h4>Database Security</h4>
                                <ul className={styles.list}>
                                    <li><strong>SSL/TLS:</strong> Always use encrypted connections</li>
                                    <li><strong>Least Privilege:</strong> Database user with minimal permissions</li>
                                    <li><strong>Backups:</strong> Automated daily backups</li>
                                    <li><strong>Access Control:</strong> IP whitelist for database access</li>
                                </ul>
                            </div>

                            {/* Scaling Strategies */}
                            <div className={styles.integrationGuide}>
                                <h3>📈 Scaling Strategies</h3>

                                <h4>Database Scaling</h4>
                                <ul className={styles.list}>
                                    <li><strong>Read Replicas:</strong> Distribute read queries across replicas</li>
                                    <li><strong>Connection Pooling:</strong> Use Neon pooling or PgBouncer</li>
                                    <li><strong>Partitioning:</strong> Partition large tables by company/user</li>
                                    <li><strong>Archiving:</strong> Move old data to cold storage</li>
                                </ul>

                                <h4>Serverless Function Limits</h4>
                                <p className={styles.stepDescription}>
                                    Vercel Free tier limits: 10s execution, 50MB size. Solutions:
                                </p>
                                <ul className={styles.list}>
                                    <li><strong>Upgrade to Pro:</strong> 60s execution, 250MB size</li>
                                    <li><strong>Background Jobs:</strong> Use Inngest for long-running tasks</li>
                                    <li><strong>Streaming:</strong> Stream responses for long AI generations</li>
                                </ul>

                                <h4>Horizontal Scaling (VPS)</h4>
                                <ul className={styles.list}>
                                    <li><strong>Load Balancer:</strong> Nginx or HAProxy for traffic distribution</li>
                                    <li><strong>Multiple Instances:</strong> PM2 cluster mode for multi-core</li>
                                    <li><strong>CDN:</strong> CloudFlare or Fastly for static assets</li>
                                    <li><strong>Redis Cache:</strong> Shared cache across instances</li>
                                </ul>
                            </div>
                        </section>

                        {/* Cost Optimization Section */}
                        <section id="cost" className={styles.section}>
                            <h2 className={styles.sectionTitle}>💰 Cost Optimization Guide</h2>
                            <p className={styles.stepDescription}>
                                Strategies to minimize costs while maintaining functionality. Choose the right tier and optimize usage.
                            </p>

                            {/* Tier Selection */}
                            <div className={styles.decisionTree}>
                                <h3>Customization Examples</h3>
                                <p className={styles.stepDescription}>
                                    Here are some example configurations. Remember - you can mix and match any features you want!
                                </p>

                                <div className={styles.decisionNode}>
                                    <h5>👨‍🎓 Students & Learning Projects → Minimal Setup ($10-30/mo)</h5>
                                    <p>
                                        Core features only: OpenAI, Clerk, UploadThing, and Database. Use free DuckDuckGo search,
                                        text-only PDFs, and browser TTS. Perfect for learning and personal projects.
                                    </p>
                                </div>

                                <div className={styles.decisionNode}>
                                    <h5>🏢 Small Business & Professionals → Add OCR + Search ($20-60/mo)</h5>
                                    <p>
                                        Core + Tavily (better search) + OCR (scanned documents) + ElevenLabs (voice).
                                        Great for businesses processing physical documents or needing premium features.
                                    </p>
                                </div>

                                <div className={styles.decisionNode}>
                                    <h5>🏛️ Enterprise & Research → Full-Featured Setup ($40-160/mo)</h5>
                                    <p>
                                        Core + All Optional Features: Claude and Gemini for model comparison, specialized tasks, and redundancy.
                                        Best for teams requiring multiple AI models or advanced reasoning capabilities.
                                    </p>
                                </div>
                            </div>

                            {/* Usage Monitoring */}
                            <div className={styles.integrationGuide}>
                                <h3>📊 Monitor Usage & Costs</h3>
                                <ul className={styles.list}>
                                    <li><strong>OpenAI Dashboard:</strong> <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className={styles.link}>platform.openai.com/usage <ExternalLink className={styles.linkIcon} /></a> - Track API usage and costs</li>
                                    <li><strong>Clerk Dashboard:</strong> Monitor monthly active users (MAU)</li>
                                    <li><strong>UploadThing:</strong> Track storage usage and bandwidth</li>
                                    <li><strong>Database:</strong> Monitor database size (Neon free tier: 0.5GB)</li>
                                    <li><strong>Set Budgets:</strong> Configure billing alerts at OpenAI, Anthropic, etc.</li>
                                </ul>
                            </div>

                            {/* Cost Reduction Strategies */}
                            <div className={styles.integrationGuide}>
                                <h3>💡 Cost Reduction Strategies</h3>

                                <h4>Embeddings Optimization</h4>
                                <ul className={styles.list}>
                                    <li><strong>Cache Embeddings:</strong> Store embeddings, don&apos;t regenerate for same content</li>
                                    <li><strong>Batch Processing:</strong> Generate embeddings in batches (reduces API overhead)</li>
                                    <li><strong>Smaller Model:</strong> Use <code>text-embedding-3-small</code> instead of <code>-large</code> (5x cheaper, slightly lower quality)</li>
                                </ul>

                                <h4>Chat/LLM Cost Savings</h4>
                                <ul className={styles.list}>
                                    <li><strong>Use Gemini Free Tier:</strong> 60 requests/minute free - perfect for dev/testing</li>
                                    <li><strong>Shorter Context:</strong> Limit retrieved documents to top 3-5 most relevant</li>
                                    <li><strong>Streaming:</strong> Stream responses to reduce perceived latency, same cost</li>
                                    <li><strong>Prompt Caching:</strong> Cache system prompts (coming to OpenAI)</li>
                                </ul>

                                <h4>Search Cost Optimization</h4>
                                <ul className={styles.list}>
                                    <li><strong>Use DuckDuckGo:</strong> Free fallback for general queries</li>
                                    <li><strong>Reserve Tavily:</strong> Only use for high-value, specific searches</li>
                                    <li><strong>Cache Results:</strong> Store search results for repeated queries</li>
                                </ul>

                                <h4>OCR Cost Management</h4>
                                <ul className={styles.list}>
                                    <li><strong>Detect Text-Only PDFs:</strong> Skip OCR for digital PDFs (native text extraction is free)</li>
                                    <li><strong>User Confirmation:</strong> Let users decide if OCR is needed</li>
                                    <li><strong>Page Limits:</strong> Limit OCR to first N pages for preview</li>
                                </ul>

                                <div className={styles.highlightBox}>
                                    <h4>🎯 Target: $15-20/month for Most Users</h4>
                                    <p>
                                        With smart optimization, most users can run the core features for $15-20/month:
                                    </p>
                                    <div className={styles.costBreakdown}>
                                        <div className={styles.costItem}>
                                            <span className={styles.costLabel}>OpenAI (embeddings + chat)</span>
                                            <span className={styles.costValue}>$10-15/mo</span>
                                        </div>
                                        <div className={styles.costItem}>
                                            <span className={styles.costLabel}>Clerk (authentication)</span>
                                            <span className={styles.costValue}>$0 (free tier)</span>
                                        </div>
                                        <div className={styles.costItem}>
                                            <span className={styles.costLabel}>UploadThing (storage)</span>
                                            <span className={styles.costValue}>$0 (free tier)</span>
                                        </div>
                                        <div className={styles.costItem}>
                                            <span className={styles.costLabel}>Database (Neon)</span>
                                            <span className={styles.costValue}>$0 (free tier)</span>
                                        </div>
                                        <div className={styles.costItem}>
                                            <span className={styles.costLabel}>Vercel (hosting)</span>
                                            <span className={styles.costValue}>$0 (hobby tier)</span>
                                        </div>
                                        <div className={styles.costItem}>
                                            <span className={styles.costLabel}><strong>Total</strong></span>
                                            <span className={styles.costValue}><strong>$10-15/mo</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Database Management Section */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Database className={styles.sectionIcon} />
                                Database Management
                            </h2>
                            
                            <div className={styles.infoBox}>
                                <h3>Useful Database Commands</h3>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Open Drizzle Studio (Database GUI)<br />
                                        pnpm db:studio<br />
                                        <br />
                                        # Generate new migrations<br />
                                        pnpm db:generate<br />
                                        <br />
                                        # Apply migrations<br />
                                        pnpm db:migrate<br />
                                        <br />
                                        # Push schema changes directly (dev)<br />
                                        pnpm db:push
                                    </code>
                                </div>
                            </div>
                        </section>

                        {/* Troubleshooting Section */}
                        <section id="troubleshooting" className={styles.section}>
                            <h2 className={styles.sectionTitle}>🔧 Troubleshooting</h2>
                            <p className={styles.stepDescription}>
                                Common issues and solutions organized by category.
                            </p>

                            <div className={styles.troubleshootSection}>
                                <h3 className={styles.troubleshootTitle}>Database Connection Issues</h3>
                                <ul className={styles.list}>
                                    <li><strong>Local Docker:</strong> Ensure Docker is running: <code>docker ps</code></li>
                                    <li><strong>Container Status:</strong> Check database container: <code>docker restart pdr_ai_v2-postgres</code></li>
                                    <li><strong>Connection String:</strong> Verify <code>DATABASE_URL</code> format in <code>.env</code> file</li>
                                    <li><strong>pgvector Extension:</strong> Run <code>CREATE EXTENSION IF NOT EXISTS vector;</code> in your database</li>
                                    <li><strong>Neon/Cloud:</strong> Check database is running and IP whitelist is configured</li>
                                </ul>
                            </div>

                            <div className={styles.troubleshootSection}>
                                <h3 className={styles.troubleshootTitle}>Build Errors</h3>
                                <ul className={styles.list}>
                                    <li><strong>Clear Next.js cache:</strong> <code>rm -rf .next</code> (Windows: <code>rmdir /s .next</code>)</li>
                                    <li><strong>Reinstall dependencies:</strong> <code>rm -rf node_modules && pnpm install</code></li>
                                    <li><strong>TypeScript errors:</strong> Run <code>pnpm typecheck</code> to see all errors</li>
                                    <li><strong>&quot;Module not found&quot;:</strong> Clear cache and reinstall packages</li>
                                    <li><strong>Vercel build fails:</strong> Check environment variables are set in Vercel dashboard</li>
                                </ul>
                            </div>

                            <div className={styles.troubleshootSection}>
                                <h3 className={styles.troubleshootTitle}>API Key Issues</h3>
                                <ul className={styles.list}>
                                    <li><strong>Missing required keys:</strong> Core features require 4 services (Database, OpenAI, Clerk, UploadThing)</li>
                                    <li><strong>Environment file:</strong> Check for spaces around <code>=</code> in <code>.env</code></li>
                                    <li><strong>Invalid keys:</strong> Verify keys are copied correctly (no extra spaces)</li>
                                    <li><strong>Clerk keys:</strong> Make sure you copied BOTH publishable and secret keys</li>
                                    <li><strong>After changing .env:</strong> Always restart dev server (<code>pnpm dev</code>)</li>
                                </ul>
                            </div>

                            <div className={styles.troubleshootSection}>
                                <h3 className={styles.troubleshootTitle}>Feature-Specific Issues</h3>

                                <h4>Search Not Working</h4>
                                <ul className={styles.list}>
                                    <li><strong>DuckDuckGo fallback:</strong> Should work even without Tavily key</li>
                                    <li><strong>Tavily errors:</strong> Check API key is valid and has credit</li>
                                    <li><strong>No results:</strong> Try different search queries or check network connection</li>
                                </ul>

                                <h4>OCR Not Available</h4>
                                <ul className={styles.list}>
                                    <li><strong>No OCR checkbox:</strong> Add at least one OCR provider key to <code>.env</code></li>
                                    <li><strong>Azure errors:</strong> Verify endpoint URL and key are correct</li>
                                    <li><strong>Datalab errors:</strong> Check API credit balance</li>
                                    <li><strong>Fallback:</strong> Without OCR keys, only text-based PDFs work</li>
                                </ul>

                                <h4>Voice Features Not Working</h4>
                                <ul className={styles.list}>
                                    <li><strong>No ElevenLabs:</strong> Falls back to browser Web Speech API</li>
                                    <li><strong>Browser TTS quality:</strong> Varies by browser - Chrome has best quality</li>
                                    <li><strong>Voice not playing:</strong> Check browser allows audio autoplay</li>
                                </ul>
                            </div>

                            <div className={styles.troubleshootSection}>
                                <h3 className={styles.troubleshootTitle}>Platform-Specific Issues</h3>

                                <h4>Vercel Deployment</h4>
                                <ul className={styles.list}>
                                    <li><strong>Build timeout:</strong> Upgrade to Vercel Pro for longer build times</li>
                                    <li><strong>Function size limit:</strong> Already optimized - check environment variables are set</li>
                                    <li><strong>Database connection:</strong> Use Neon pooling or set connection limit</li>
                                    <li><strong>Environment variables:</strong> Make sure all variables are set for Production environment</li>
                                </ul>

                                <h4>Docker Deployment</h4>
                                <ul className={styles.list}>
                                    <li><strong>Container won&apos;t start:</strong> Check logs with <code>docker-compose logs app</code></li>
                                    <li><strong>Database not connecting:</strong> Wait for PostgreSQL healthcheck to pass</li>
                                    <li><strong>Port already in use:</strong> Change port mapping in docker-compose.yml</li>
                                    <li><strong>Out of memory:</strong> Increase Docker memory limit in settings</li>
                                </ul>

                                <h4>VPS Deployment</h4>
                                <ul className={styles.list}>
                                    <li><strong>PM2 not starting:</strong> Check logs with <code>pm2 logs</code></li>
                                    <li><strong>Nginx 502 error:</strong> Verify app is running on correct port</li>
                                    <li><strong>SSL certificate fails:</strong> Check domain DNS is pointing to server</li>
                                    <li><strong>Out of memory:</strong> Increase swap or upgrade server RAM</li>
                                </ul>
                            </div>

                            <div className={styles.highlightBox}>
                                <h4>Still Having Issues?</h4>
                                <p>If you can&apos;t resolve your issue:</p>
                                <ul className={styles.list}>
                                    <li>Check <a href="https://github.com/Deodat-Lawson/pdr_ai_v2/issues" target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub Issues <ExternalLink className={styles.linkIcon} /></a> for similar problems</li>
                                    <li>Create a new issue with:
                                        <ul className={styles.list}>
                                            <li>Error message (full text)</li>
                                            <li>Steps to reproduce</li>
                                            <li>Your deployment tier and platform</li>
                                            <li>Node.js version (<code>node --version</code>)</li>
                                        </ul>
                                    </li>
                                    <li>Contact support via <Link href="/contact">support page</Link></li>
                                </ul>
                            </div>
                        </section>

                        {/* Customization Examples Section */}
                        <section id="customization-examples" className={styles.section}>
                            <h2 className={styles.sectionTitle}>🎨 Customization Examples</h2>
                            <p className={styles.stepDescription}>
                                Real-world examples of how to customize PDR AI for different use cases. Mix and match features to build your perfect setup!
                            </p>

                            {/* Adding Features */}
                            <div className={styles.integrationGuide}>
                                <h3>How to Add Optional Features</h3>

                                <h4>Adding Any Optional Feature</h4>
                                <ol className={styles.orderedList}>
                                    <li>Choose which features you want from the optional features list above</li>
                                    <li>Get API keys for your chosen services</li>
                                    <li>Add the API keys to your <code>.env</code> file</li>
                                    <li>Restart your application</li>
                                    <li>Features automatically activate! No code changes needed</li>
                                </ol>

                                <div className={styles.successBox}>
                                    <h4>✅ Zero Configuration Required</h4>
                                    <p>
                                        PDR AI automatically detects new API keys and enables features.
                                        Just add the keys and restart - that&apos;s it! Features work independently - add OCR without adding voice, or add multi-model AI without enhanced search.
                                    </p>
                                </div>

                                <h4>Example: Student Setup (Core Only)</h4>
                                <p>Perfect for learning and personal projects at minimal cost ($10-30/month):</p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Core features only (all required)<br />
                                        DATABASE_URL=&quot;...&quot;<br />
                                        OPENAI_API_KEY=&quot;sk-...&quot;<br />
                                        CLERK_SECRET_KEY=&quot;...&quot;<br />
                                        UPLOADTHING_SECRET=&quot;...&quot;<br />
                                        <br />
                                        # No optional features - uses free fallbacks:<br />
                                        # - DuckDuckGo for web search<br />
                                        # - Text-only PDF processing<br />
                                        # - Browser TTS for voice
                                    </code>
                                </div>

                                <h4>Example: Small Business Setup (Core + OCR + Search)</h4>
                                <p>Great for businesses processing scanned documents ($20-60/month):</p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Core features (required)<br />
                                        DATABASE_URL=&quot;...&quot;<br />
                                        OPENAI_API_KEY=&quot;sk-...&quot;<br />
                                        CLERK_SECRET_KEY=&quot;...&quot;<br />
                                        UPLOADTHING_SECRET=&quot;...&quot;<br />
                                        <br />
                                        # Optional: Enhanced search<br />
                                        TAVILY_API_KEY=&quot;tvly-...&quot;<br />
                                        <br />
                                        # Optional: OCR for scanned docs<br />
                                        DATALAB_API_KEY=&quot;...&quot;<br />
                                        <br />
                                        # Not adding: Voice (using browser TTS fallback)<br />
                                        # Not adding: Multi-model AI (using OpenAI only)
                                    </code>
                                </div>

                                <h4>Example: Research Team Setup (Core + Multi-Model AI)</h4>
                                <p>Model comparison for research without other premium features:</p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Core features (required)<br />
                                        DATABASE_URL=&quot;...&quot;<br />
                                        OPENAI_API_KEY=&quot;sk-...&quot;<br />
                                        CLERK_SECRET_KEY=&quot;...&quot;<br />
                                        UPLOADTHING_SECRET=&quot;...&quot;<br />
                                        <br />
                                        # Optional: Additional AI models<br />
                                        ANTHROPIC_API_KEY=&quot;sk-ant-...&quot;<br />
                                        GOOGLE_AI_API_KEY=&quot;...&quot;<br />
                                        <br />
                                        # Not adding: OCR, Search, Voice<br />
                                        # Using: DuckDuckGo, text-only PDFs, browser TTS
                                    </code>
                                </div>

                                <h4>Example: Full-Featured Enterprise Setup</h4>
                                <p>All features enabled for maximum capabilities ($40-160/month):</p>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Core features<br />
                                        DATABASE_URL=&quot;...&quot;<br />
                                        OPENAI_API_KEY=&quot;sk-...&quot;<br />
                                        CLERK_SECRET_KEY=&quot;...&quot;<br />
                                        UPLOADTHING_SECRET=&quot;...&quot;<br />
                                        <br />
                                        # All optional features<br />
                                        TAVILY_API_KEY=&quot;tvly-...&quot;<br />
                                        DATALAB_API_KEY=&quot;...&quot;<br />
                                        ELEVENLABS_API_KEY=&quot;...&quot;<br />
                                        ANTHROPIC_API_KEY=&quot;sk-ant-...&quot;<br />
                                        GOOGLE_AI_API_KEY=&quot;...&quot;<br />
                                        LANGCHAIN_API_KEY=&quot;...&quot;
                                    </code>
                                </div>
                            </div>

                            {/* Database Migrations */}
                            <div className={styles.integrationGuide}>
                                <h3>Database Migrations</h3>

                                <h4>Running Migrations Safely</h4>
                                <ol className={styles.orderedList}>
                                    <li><strong>Backup first:</strong>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # For local PostgreSQL:<br />
                                                pg_dump -U postgres pdr_ai_v2 {`>`} backup.sql<br />
                                                <br />
                                                # For Neon: Use dashboard backup feature
                                            </code>
                                        </div>
                                    </li>
                                    <li><strong>Generate migration:</strong>
                                        <div className={styles.codeBlock}>
                                            <code>pnpm db:generate</code>
                                        </div>
                                    </li>
                                    <li><strong>Review migration files</strong> in <code>drizzle/</code> folder</li>
                                    <li><strong>Apply migration:</strong>
                                        <div className={styles.codeBlock}>
                                            <code>pnpm db:migrate</code>
                                        </div>
                                    </li>
                                    <li><strong>Verify:</strong> Check Drizzle Studio or run test queries</li>
                                </ol>

                                <div className={styles.warningBox}>
                                    <h4>⚠️ Production Migration Safety</h4>
                                    <ul className={styles.list}>
                                        <li>Always backup before migrations</li>
                                        <li>Test migrations on staging environment first</li>
                                        <li>Run during low-traffic periods</li>
                                        <li>Have rollback plan ready</li>
                                    </ul>
                                </div>

                                <h4>Database Migration Commands</h4>
                                <div className={styles.codeBlock}>
                                    <code>
                                        pnpm db:generate  # Generate migration from schema changes<br />
                                        pnpm db:migrate   # Apply migrations to database<br />
                                        pnpm db:push      # Push schema directly (development only)<br />
                                        pnpm db:studio    # Open visual database editor
                                    </code>
                                </div>
                            </div>

                            {/* Zero-Downtime Deployment */}
                            <div className={styles.integrationGuide}>
                                <h3>Zero-Downtime Deployment</h3>

                                <h4>Vercel (Automatic)</h4>
                                <p className={styles.stepDescription}>
                                    Vercel automatically handles zero-downtime deployments:
                                </p>
                                <ul className={styles.list}>
                                    <li>New build deployed to temporary URL</li>
                                    <li>Health checks pass before promotion</li>
                                    <li>Traffic switches atomically</li>
                                    <li>Previous version kept for instant rollback</li>
                                </ul>

                                <h4>VPS/Docker (Manual)</h4>
                                <ol className={styles.orderedList}>
                                    <li><strong>Run migrations first</strong> (backwards-compatible schema changes)</li>
                                    <li><strong>Deploy new version</strong> alongside old version</li>
                                    <li><strong>Health check</strong> new version</li>
                                    <li><strong>Switch traffic</strong> via load balancer/Nginx</li>
                                    <li><strong>Monitor</strong> for errors</li>
                                    <li><strong>Decommission</strong> old version after verification</li>
                                </ol>

                                <h4>Rollback Strategy</h4>
                                <div className={styles.codeBlock}>
                                    <code>
                                        # Vercel: Click &quot;Rollback&quot; in dashboard<br />
                                        <br />
                                        # Docker: Keep previous image<br />
                                        docker tag pdr-ai:latest pdr-ai:previous<br />
                                        docker run pdr-ai:previous  # Rollback<br />
                                        <br />
                                        # VPS with PM2:<br />
                                        git reset --hard HEAD^  # Rollback code<br />
                                        pnpm install && pnpm build<br />
                                        pm2 restart pdr-ai
                                    </code>
                                </div>
                            </div>
                        </section>

                        {/* Features Section */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>What You Get</h2>
                            <div className={styles.featuresGrid}>
                                <div className={styles.featureCard}>
                                    <Check className={styles.featureIcon} />
                                    <h3>Full Source Code</h3>
                                    <p>Complete access to all application code with no restrictions</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <Check className={styles.featureIcon} />
                                    <h3>Predictive Document Analysis</h3>
                                    <p>AI-powered missing document detection and recommendations</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <Check className={styles.featureIcon} />
                                    <h3>AI Chat Engine</h3>
                                    <p>Interactive Q&A system for document analysis</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <Check className={styles.featureIcon} />
                                    <h3>Employee Management</h3>
                                    <p>Complete employee and employer authentication system</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <Check className={styles.featureIcon} />
                                    <h3>Document Management</h3>
                                    <p>Upload, categorize, and manage documents</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <Check className={styles.featureIcon} />
                                    <h3>Analytics Dashboard</h3>
                                    <p>Insights and statistics for document usage</p>
                                </div>
                            </div>
                        </section>

                        {/* Support Section */}
                        <section className={styles.section}>
                            <div className={styles.supportBox}>
                                <h2>Need Help?</h2>
                                <p>
                                    Having trouble with deployment? Our support team is here to help!
                                </p>
                                <div className={styles.supportButtons}>
                                    <a 
                                        href="https://github.com/Deodat-Lawson/pdr_ai_v2/issues" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`${styles.btn} ${styles.btnOutline}`}
                                    >
                                        <Github className={styles.btnIcon} />
                                        GitHub Issues
                                    </a>
                                    <Link href="/contact">
                                        <button className={`${styles.btn} ${styles.btnPrimary}`}>
                                            Contact Support
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
                </div>
            </div>
        </ClerkProvider>
    );
}

