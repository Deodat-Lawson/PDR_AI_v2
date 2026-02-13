export interface ServiceGuideField {
  /** Key name matching the DB column (camelCase) */
  key: string;
  label: string;
  placeholder: string;
}

export interface SetupStep {
  title: string;
  /** Plain text description. Use <a> or <b> HTML for inline links / bold. */
  description: string;
}

export interface ServiceGuide {
  id: string;
  name: string;
  tagline: string;
  /** Category label shown on the card (e.g. "Background Jobs") */
  category: string;
  /** lucide-react icon name used to pick the icon in the page component */
  iconName: "Zap" | "Search" | "HardDrive" | "ScanLine" | "Eye" | "FileSearch" | "Mic" | "Database";
  docsUrl: string;
  fields: ServiceGuideField[];
  steps: SetupStep[];
  whatItPowers: string[];
}

/** All categories that appear in the guides (used for filter UI) */
export const SERVICE_CATEGORIES = [
  "Background Jobs",
  "Observability",
  "Search",
  "Storage",
  "OCR",
  "Voice",
  "Cache",
] as const;

export const serviceGuides: ServiceGuide[] = [
  // -----------------------------------------------------------------------
  // Inngest
  // -----------------------------------------------------------------------
  {
    id: "inngest",
    name: "Inngest",
    tagline: "Background jobs & event-driven workflows",
    category: "Background Jobs",
    iconName: "Zap",
    docsUrl: "https://www.inngest.com/docs",
    fields: [
      {
        key: "inngestEventKey",
        label: "Event Key",
        placeholder: "your_event_key_here",
      },
      {
        key: "inngestSigningKey",
        label: "Signing Key",
        placeholder: "signkey-prod-xxxxx",
      },
    ],
    steps: [
      {
        title: "Create an Inngest account",
        description:
          'Go to <a href="https://www.inngest.com" target="_blank" rel="noopener noreferrer">inngest.com</a> and sign up for a free account.',
      },
      {
        title: "Create a project",
        description:
          "Once logged in, create a new project from the dashboard (or use an existing one).",
      },
      {
        title: "Open the Keys page",
        description:
          "Navigate to <b>Settings &rarr; Keys</b> in the Inngest dashboard.",
      },
      {
        title: "Copy your Event Key",
        description:
          "The <b>Event Key</b> is used to send events from PDR AI to Inngest. Copy it and paste it into the field below.",
      },
      {
        title: "Copy your Signing Key",
        description:
          'The <b>Signing Key</b> starts with <code>signkey-prod-</code> or <code>signkey-test-</code>. It is used to verify incoming webhook payloads. Copy it and paste it below.',
      },
      {
        title: "Save your keys",
        description:
          "Click <b>Save</b> below. PDR AI will securely encrypt and store both keys for your organization.",
      },
    ],
    whatItPowers: [
      "Asynchronous OCR document processing pipeline",
      "Event-driven document ingestion and indexing",
      "Background job scheduling and retries",
    ],
  },

  // -----------------------------------------------------------------------
  // LangChain / LangSmith Tracing
  // -----------------------------------------------------------------------
  {
    id: "langchain",
    name: "LangChain Tracing",
    tagline: "Monitor & debug AI operations with LangSmith",
    category: "Observability",
    iconName: "Eye",
    docsUrl: "https://docs.smith.langchain.com",
    fields: [
      {
        key: "langchainApiKey",
        label: "LangSmith API Key",
        placeholder: "lsv2_pt_your_key_here",
      },
    ],
    steps: [
      {
        title: "Create a LangSmith account",
        description:
          'Visit <a href="https://smith.langchain.com" target="_blank" rel="noopener noreferrer">smith.langchain.com</a> and create an account.',
      },
      {
        title: "Get your API key",
        description:
          "Navigate to <b>Settings &rarr; API Keys</b> and generate a new key.",
      },
      {
        title: "Paste and save",
        description:
          "Paste the API key into the field below and click <b>Save</b>. Tracing will be enabled automatically.",
      },
    ],
    whatItPowers: [
      "Full trace visibility of every AI model call",
      "Debug complex chains and agent behaviors",
      "Monitor performance and token usage",
      "Analyze prompt effectiveness",
    ],
  },

  // -----------------------------------------------------------------------
  // Tavily Search
  // -----------------------------------------------------------------------
  {
    id: "tavily",
    name: "Tavily Search",
    tagline: "AI-powered web search",
    category: "Search",
    iconName: "Search",
    docsUrl: "https://docs.tavily.com",
    fields: [
      {
        key: "tavilyApiKey",
        label: "API Key",
        placeholder: "tvly-your_key_here",
      },
    ],
    steps: [
      {
        title: "Sign up for Tavily",
        description:
          'Visit <a href="https://tavily.com" target="_blank" rel="noopener noreferrer">tavily.com</a> and create a free account. The free tier includes 1,000 searches per month.',
      },
      {
        title: "Open the API Keys page",
        description:
          "After signing in, navigate to the <b>API Keys</b> section in your Tavily dashboard.",
      },
      {
        title: "Create a new key",
        description:
          'Click <b>Create New Key</b>. The key starts with <code>tvly-</code>. Copy it to your clipboard.',
      },
      {
        title: "Paste and save",
        description:
          "Paste the API key into the field below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "Web-augmented document Q&A (answers enriched with live web data)",
      "Research & learning agent web search capabilities",
      "Repair guide search across the internet",
    ],
  },

  // -----------------------------------------------------------------------
  // Uploadthing
  // -----------------------------------------------------------------------
  {
    id: "uploadthing",
    name: "Uploadthing",
    tagline: "File storage for document uploads",
    category: "Storage",
    iconName: "HardDrive",
    docsUrl: "https://docs.uploadthing.com",
    fields: [
      {
        key: "uploadthingToken",
        label: "Token",
        placeholder: "your_token_here",
      },
    ],
    steps: [
      {
        title: "Create an Uploadthing account",
        description:
          'Go to <a href="https://uploadthing.com" target="_blank" rel="noopener noreferrer">uploadthing.com</a> and sign up.',
      },
      {
        title: "Create a new app",
        description:
          "In the Uploadthing dashboard, click <b>New App</b> and give it a name (e.g. &ldquo;PDR AI Documents&rdquo;).",
      },
      {
        title: "Find your token",
        description:
          "Navigate to the <b>API Keys</b> section in your app settings. Copy the <b>UPLOADTHING_TOKEN</b> value.",
      },
      {
        title: "Paste and save",
        description:
          "Paste the token into the field below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "Secure PDF upload and cloud storage for all documents",
      "File management and URL generation for document access",
      "Upload progress tracking and file size validation",
    ],
  },

  // -----------------------------------------------------------------------
  // Azure Document Intelligence
  // -----------------------------------------------------------------------
  {
    id: "azure-ocr",
    name: "Azure Document Intelligence",
    tagline: "Enterprise OCR for documents, forms & layouts",
    category: "OCR",
    iconName: "FileSearch",
    docsUrl: "https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/",
    fields: [
      {
        key: "azureDocIntelligenceEndpoint",
        label: "Endpoint URL",
        placeholder: "https://your-resource.cognitiveservices.azure.com/",
      },
      {
        key: "azureDocIntelligenceKey",
        label: "API Key",
        placeholder: "your_azure_key_here",
      },
    ],
    steps: [
      {
        title: "Create an Azure account",
        description:
          'Visit <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer">portal.azure.com</a> and create an Azure account if you don\'t have one.',
      },
      {
        title: "Create a Document Intelligence resource",
        description:
          'Search for <b>Document Intelligence</b> in the Azure Portal, click <b>Create</b>, select a subscription and resource group, then choose a region and pricing tier (F0 free tier available).',
      },
      {
        title: "Get keys and endpoint",
        description:
          "After deployment, go to <b>Keys and Endpoint</b> in your resource. Copy the <b>Endpoint URL</b> and <b>KEY 1</b>.",
      },
      {
        title: "Paste and save",
        description:
          "Paste both values into the fields below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "High-accuracy OCR for standard documents and forms",
      "Excellent layout preservation and table extraction",
      "Enterprise-grade reliability with free tier (F0)",
    ],
  },

  // -----------------------------------------------------------------------
  // LandingAI OCR
  // -----------------------------------------------------------------------
  {
    id: "landingai",
    name: "LandingAI OCR",
    tagline: "Advanced OCR for complex documents",
    category: "OCR",
    iconName: "ScanLine",
    docsUrl: "https://landing.ai/docs",
    fields: [
      {
        key: "landingAiApiKey",
        label: "API Key",
        placeholder: "your_landing_ai_key_here",
      },
    ],
    steps: [
      {
        title: "Create a LandingAI account",
        description:
          'Go to <a href="https://landing.ai" target="_blank" rel="noopener noreferrer">landing.ai</a> and sign up for an account.',
      },
      {
        title: "Navigate to API Keys",
        description:
          "Once logged in, go to <b>Account Settings &rarr; API Keys</b>.",
      },
      {
        title: "Generate a key",
        description:
          "Click <b>Generate New Key</b>, give it a descriptive name (e.g. &ldquo;PDR AI&rdquo;), and copy the key.",
      },
      {
        title: "Paste and save",
        description:
          "Paste the API key into the field below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "Fallback OCR for complex or scanned documents",
      "Table extraction and handwriting recognition",
      "Mixed-layout document processing (forms, invoices, contracts)",
    ],
  },

  // -----------------------------------------------------------------------
  // Datalab OCR (Legacy)
  // -----------------------------------------------------------------------
  {
    id: "datalab",
    name: "Datalab OCR",
    tagline: "Legacy OCR provider for basic text extraction",
    category: "OCR",
    iconName: "FileSearch",
    docsUrl: "https://www.datalab.to",
    fields: [
      {
        key: "datalabApiKey",
        label: "API Key",
        placeholder: "your_datalab_key_here",
      },
    ],
    steps: [
      {
        title: "Create a Datalab account",
        description:
          'Visit <a href="https://www.datalab.to" target="_blank" rel="noopener noreferrer">datalab.to</a> and sign up.',
      },
      {
        title: "Get your API key",
        description:
          "Navigate to the <b>API Keys</b> section in your dashboard and copy your key.",
      },
      {
        title: "Paste and save",
        description:
          "Paste the API key into the field below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "Basic OCR text extraction from PDF documents",
      "Legacy fallback for simple document processing",
    ],
  },

  // -----------------------------------------------------------------------
  // Voice / ElevenLabs
  // -----------------------------------------------------------------------
  {
    id: "elevenlabs",
    name: "ElevenLabs Voice",
    tagline: "Text-to-speech & voice capabilities",
    category: "Voice",
    iconName: "Mic",
    docsUrl: "https://elevenlabs.io/docs",
    fields: [
      {
        key: "elevenLabsApiKey",
        label: "API Key",
        placeholder: "sk_your_key_here",
      },
      {
        key: "elevenLabsVoiceId",
        label: "Voice ID",
        placeholder: "your_chosen_voice_id",
      },
    ],
    steps: [
      {
        title: "Create an ElevenLabs account",
        description:
          'Visit <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">elevenlabs.io</a> and create an account.',
      },
      {
        title: "Get your API key",
        description:
          "Navigate to <b>Profile &rarr; API Keys</b> and generate a new key.",
      },
      {
        title: "Choose a voice",
        description:
          "Browse available voices in the <b>Voice Lab</b> and copy the Voice ID you want to use.",
      },
      {
        title: "Paste and save",
        description:
          "Paste the API key and Voice ID into the fields below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "Convert document summaries to audio",
      "Voice-enabled AI responses in the study agent",
      "Accessibility features for visually impaired users",
      "Multiple voice options and languages",
    ],
  },

  // -----------------------------------------------------------------------
  // Upstash Redis
  // -----------------------------------------------------------------------
  {
    id: "redis",
    name: "Upstash Redis",
    tagline: "Serverless Redis for caching & rate limiting",
    category: "Cache",
    iconName: "Database",
    docsUrl: "https://upstash.com/docs/redis/overall/getstarted",
    fields: [
      {
        key: "redisUrl",
        label: "Redis URL",
        placeholder: "redis://default:password@endpoint:port",
      },
    ],
    steps: [
      {
        title: "Create an Upstash account",
        description:
          'Go to <a href="https://upstash.com" target="_blank" rel="noopener noreferrer">upstash.com</a> and sign up for an account.',
      },
      {
        title: "Create a database",
        description:
          "In the console, click <b>Create Database</b>. Give it a name and select a region close to your users.",
      },
      {
        title: "Get your connection URL",
        description:
          "On the database details page, scroll to the <b>Connect</b> section. Select <b>Redis</b> (or ioredis) and copy the connection string (starts with <code>redis://</code> or <code>rediss://</code>).",
      },
      {
        title: "Paste and save",
        description:
          "Paste the connection string into the field below and click <b>Save</b>.",
      },
    ],
    whatItPowers: [
      "High-performance caching for API keys and database queries",
      "Rate limiting to protect AI endpoints",
      "Session storage and ephemeral data",
    ],
  },
];
