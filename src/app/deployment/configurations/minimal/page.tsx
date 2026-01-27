import Link from "next/link";
import React from 'react';
import { ArrowLeft, Rocket, CheckCircle, Database, Lock, Upload, Sparkles } from 'lucide-react';
import styles from '../../../../styles/deployment.module.css';
import { Navbar } from '../../../_components/Navbar';
import { ClerkProvider } from '@clerk/nextjs';

export default function MinimalConfigPage() {
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
                        <div className={styles.configPageHero}>
                            <div className={styles.configIconLarge}>
                                <Rocket className="w-16 h-16" />
                            </div>
                            <h1 className={styles.configPageTitle}>
                                Minimal Setup Guide
                            </h1>
                            <p className={styles.configPageSubtitle}>
                                Deploy PDR AI with core features only. Perfect for students, learning projects, and personal use.
                            </p>
                            <div className={styles.configBadgeGroup}>
                                <span className={styles.costBadgeLarge}>$10-30/month</span>
                                <span className={styles.configBadge}>4 Services Required</span>
                            </div>
                        </div>

                        {/* What's Included */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>What's Included</h2>

                            <div className={styles.prerequisitesGrid}>
                                <div className={styles.prerequisiteCard}>
                                    <Database className={styles.prerequisiteIcon} />
                                    <h3>Database</h3>
                                    <p className={styles.serviceProvider}>PostgreSQL + pgvector</p>
                                    <p className={styles.serviceCost}>Free (Neon)</p>
                                    <ul className={styles.list}>
                                        <li>Store documents</li>
                                        <li>Vector embeddings</li>
                                        <li>RAG search</li>
                                    </ul>
                                </div>

                                <div className={styles.prerequisiteCard}>
                                    <Lock className={styles.prerequisiteIcon} />
                                    <h3>Authentication</h3>
                                    <p className={styles.serviceProvider}>Clerk</p>
                                    <p className={styles.serviceCost}>Free (500 users)</p>
                                    <ul className={styles.list}>
                                        <li>User sign-in</li>
                                        <li>Account management</li>
                                        <li>Session handling</li>
                                    </ul>
                                </div>

                                <div className={styles.prerequisiteCard}>
                                    <Upload className={styles.prerequisiteIcon} />
                                    <h3>File Upload</h3>
                                    <p className={styles.serviceProvider}>UploadThing</p>
                                    <p className={styles.serviceCost}>Free (2GB)</p>
                                    <ul className={styles.list}>
                                        <li>PDF uploads</li>
                                        <li>Document storage</li>
                                        <li>File management</li>
                                    </ul>
                                </div>

                                <div className={styles.prerequisiteCard}>
                                    <Sparkles className={styles.prerequisiteIcon} />
                                    <h3>AI Model</h3>
                                    <p className={styles.serviceProvider}>OpenAI GPT-4</p>
                                    <p className={styles.serviceCost}>$10-30/mo</p>
                                    <ul className={styles.list}>
                                        <li>Chat interface</li>
                                        <li>Embeddings</li>
                                        <li>RAG search</li>
                                    </ul>
                                </div>
                            </div>

                            <div className={styles.noteBox}>
                                <p>
                                    <strong>Free Fallbacks Included:</strong> This setup includes free alternatives for search (DuckDuckGo),
                                    voice (browser TTS), and works with text-only PDFs (no OCR needed).
                                </p>
                            </div>
                        </section>

                        {/* Step-by-Step Deployment */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <CheckCircle className={styles.sectionIcon} />
                                Step-by-Step Deployment
                            </h2>

                            <div className={styles.setupSteps}>
                                {/* Step 1: Prerequisites */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>1</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Install Prerequisites</h3>
                                        <p className={styles.stepDescription}>
                                            Ensure you have Node.js 18+ and pnpm installed on your system.
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # Check Node.js version<br />
                                                node --version  # Should be v18.0 or higher<br />
                                                <br />
                                                # Install pnpm if needed<br />
                                                npm install -g pnpm
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Clone & Install */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>2</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Clone Repository & Install Dependencies</h3>
                                        <p className={styles.stepDescription}>
                                            Get the code and install all required packages.
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # Clone the repository<br />
                                                git clone https://github.com/Deodat-Lawson/pdr_ai_v2.git<br />
                                                cd pdr_ai_v2<br />
                                                <br />
                                                # Install dependencies<br />
                                                pnpm install
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Database Setup */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>3</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Set Up PostgreSQL Database (Free - Neon)</h3>
                                        <ol className={styles.orderedList}>
                                            <li>
                                                Go to <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                    neon.tech
                                                </a> and create a free account
                                            </li>
                                            <li>Create a new project</li>
                                            <li>Enable the <code>pgvector</code> extension in your database</li>
                                            <li>Copy your connection string</li>
                                        </ol>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # Your connection string will look like:<br />
                                                postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 4: Clerk Setup */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>4</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Set Up Authentication (Free - Clerk)</h3>
                                        <ol className={styles.orderedList}>
                                            <li>
                                                Go to <a href="https://clerk.com" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                    clerk.com
                                                </a> and create a free account
                                            </li>
                                            <li>Create a new application</li>
                                            <li>Copy your API keys from the dashboard</li>
                                        </ol>
                                        <p className={styles.stepDescription}>You'll need two keys:</p>
                                        <ul className={styles.list}>
                                            <li><code>CLERK_SECRET_KEY</code> (server-side)</li>
                                            <li><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> (client-side)</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Step 5: UploadThing Setup */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>5</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Set Up File Storage (Free - UploadThing)</h3>
                                        <ol className={styles.orderedList}>
                                            <li>
                                                Go to <a href="https://uploadthing.com" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                    uploadthing.com
                                                </a> and create an account
                                            </li>
                                            <li>Create a new app</li>
                                            <li>Copy your API keys</li>
                                        </ol>
                                        <p className={styles.stepDescription}>You'll need:</p>
                                        <ul className={styles.list}>
                                            <li><code>UPLOADTHING_SECRET</code></li>
                                            <li><code>UPLOADTHING_APP_ID</code></li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Step 6: OpenAI Setup */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>6</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Set Up OpenAI API ($10-30/month)</h3>
                                        <ol className={styles.orderedList}>
                                            <li>
                                                Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                    platform.openai.com
                                                </a>
                                            </li>
                                            <li>Create an account and add billing information</li>
                                            <li>Generate an API key</li>
                                            <li>Set usage limits to control costs (recommended: $30/month)</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* Step 7: Environment Variables */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>7</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Configure Environment Variables</h3>
                                        <p className={styles.stepDescription}>
                                            Create a <code>.env</code> file in your project root with all your API keys:
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # Database<br />
                                                DATABASE_URL="postgresql://user:password@host/db?sslmode=require"<br />
                                                <br />
                                                # OpenAI<br />
                                                OPENAI_API_KEY="sk-..."<br />
                                                <br />
                                                # Clerk Authentication<br />
                                                CLERK_SECRET_KEY="sk_..."<br />
                                                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."<br />
                                                <br />
                                                # UploadThing<br />
                                                UPLOADTHING_SECRET="sk_..."<br />
                                                UPLOADTHING_APP_ID="..."<br />
                                                <br />
                                                # Optional: Set base URL (for production)<br />
                                                # NEXT_PUBLIC_BASE_URL="https://your-domain.com"
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 8: Database Migration */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>8</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Run Database Migrations</h3>
                                        <p className={styles.stepDescription}>
                                            Set up your database schema:
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                # Generate migration files<br />
                                                pnpm db:generate<br />
                                                <br />
                                                # Push schema to database<br />
                                                pnpm db:push
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 9: Start Development */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>9</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Start Development Server</h3>
                                        <p className={styles.stepDescription}>
                                            Launch your app locally to test:
                                        </p>
                                        <div className={styles.codeBlock}>
                                            <code>
                                                pnpm dev
                                            </code>
                                        </div>
                                        <p className={styles.stepDescription}>
                                            Your app should now be running at <code>http://localhost:3000</code>
                                        </p>
                                    </div>
                                </div>

                                {/* Step 10: Deploy to Production */}
                                <div className={styles.setupStep}>
                                    <div className={styles.setupStepNumber}>10</div>
                                    <div className={styles.setupStepContent}>
                                        <h3 className={styles.stepTitle}>Deploy to Production (Vercel)</h3>
                                        <ol className={styles.orderedList}>
                                            <li>
                                                Push your code to GitHub
                                            </li>
                                            <li>
                                                Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                    vercel.com
                                                </a> and connect your repository
                                            </li>
                                            <li>
                                                Add all environment variables in Vercel's dashboard
                                            </li>
                                            <li>
                                                Deploy!
                                            </li>
                                        </ol>
                                        <div className={styles.successBox}>
                                            <h4>✅ Deployment Complete!</h4>
                                            <p>
                                                Your minimal PDR AI setup is now live. You can add optional features anytime by simply adding their API keys.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Cost Estimate */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Monthly Cost Breakdown</h2>
                            <div className={styles.costBreakdownCard}>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>Database (Neon):</span>
                                    <span className={styles.pricingValue}>$0</span>
                                </div>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>Authentication (Clerk):</span>
                                    <span className={styles.pricingValue}>$0</span>
                                </div>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>File Storage (UploadThing):</span>
                                    <span className={styles.pricingValue}>$0</span>
                                </div>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>OpenAI API (estimated):</span>
                                    <span className={styles.pricingValue}>$10-30</span>
                                </div>
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabel}>Hosting (Vercel):</span>
                                    <span className={styles.pricingValue}>$0</span>
                                </div>
                                <hr className={styles.costDivider} />
                                <div className={styles.pricingDetail}>
                                    <span className={styles.pricingLabelTotal}>Total Monthly Cost:</span>
                                    <span className={styles.pricingValueTotal}>$10-30</span>
                                </div>
                            </div>
                        </section>

                        {/* Add More Features */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Ready to Add More Features?</h2>
                            <p className={styles.stepDescription}>
                                Your minimal setup is complete! When you're ready, you can add any of these optional features:
                            </p>
                            <div className={styles.nextStepsGrid}>
                                <Link href="/deployment/features/enhanced-search" className={styles.nextStepCard}>
                                    <h3>🔍 Enhanced Search</h3>
                                    <p>Upgrade to Tavily AI ($0.05/search)</p>
                                </Link>
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
