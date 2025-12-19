# AgenticSearch

A modern AI-powered web research agent with streaming responses, multi-model support, and real-time source tracking.

## Features

### AI Research
- **Autonomous Web Research**: Ask questions and watch the AI search, extract content, and synthesize comprehensive answers
- **Streaming Responses**: See results in real-time as the AI thinks and researches
- **Source Citations**: All sources displayed with clickable links and timestamps
- **Tool Activity Log**: Track search queries and URL extractions as they happen

### Model Support
- **Dynamic Model Selection**: Access all available models from OpenRouter API
- **Custom Models**: Add your own model IDs for testing or specialized use cases
- **Default Models Include**:
  - Claude Opus 4.5, Sonnet 4.5, Haiku 4.5
  - Gemini 3.0 Flash & Pro
  - GPT 5.2

### User Experience
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Glassmorphism UI**: Modern, polished interface with backdrop blur effects
- **Local Storage**: API keys and preferences saved securely in your browser

## Technology Stack

- **Frontend**: React 19.2 + TypeScript
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS 4.1
- **Markdown**: react-markdown with syntax highlighting
- **APIs**: OpenRouter (LLM) + Parallel.ai (Search & Extract)

## Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ParallelSearch
```

2. Install dependencies:
```bash
npm install
```

3. Get API Keys:
   - **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys)
   - **Parallel.ai**: [platform.parallel.ai](https://platform.parallel.ai)

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173)

## Usage

### First Time Setup
1. Click "Configure API Keys" in the top navigation
2. Enter your OpenRouter and Parallel.ai API keys
3. Click "Save API Keys"

### Research Workflow
1. Select an AI model from the dropdown (or add a custom model)
2. Enter your research question
3. Click "Research" or press Enter
4. Watch as the AI:
   - Searches the web for relevant information
   - Extracts content from authoritative sources
   - Synthesizes a comprehensive answer
5. Review source citations and tool activity
6. Ask follow-up questions or start a new research session

### Custom Models
- Click "Custom Model" in the model dropdown
- Enter the model ID (e.g., `anthropic/claude-3.5-sonnet`)
- The model will be saved for future sessions

## Architecture

### Research Tools
The agent has access to two primary tools:

**search_web**: Searches the web using Parallel.ai's search API
- Parameters: objective, search_queries (optional), max_results
- Returns: Search results with titles, URLs, and snippets

**extract_url**: Extracts detailed content from specific URLs
- Parameters: urls, objective, excerpts (boolean)
- Returns: Full content or excerpts from target pages

### API Proxy
Development server proxies API requests through Vite:
- `/api/openrouter` → `https://openrouter.ai`
- `/api/parallel` → `https://api.parallel.ai`

This avoids CORS issues during development.

## Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ResearchAgent.tsx      # Main app component
│   ├── ApiKeyConfig.tsx       # API key management
│   ├── ModelSelector.tsx      # Model selection UI
│   ├── QueryInput.tsx         # Search input
│   ├── StreamingResponse.tsx  # Real-time response display
│   ├── SourceCitations.tsx    # Source links
│   ├── ToolActivityLog.tsx    # Tool execution log
│   ├── ThemeToggle.tsx        # Dark/light mode toggle
│   └── ErrorDisplay.tsx       # Error handling
├── hooks/              # Custom React hooks
│   ├── useResearchAgent.ts    # Main research state
│   ├── useOpenRouterModels.ts # Model fetching & management
│   └── useLocalStorage.ts     # Persistent storage
├── lib/                # Core logic
│   ├── openrouter/            # OpenRouter API client
│   ├── parallel/              # Parallel.ai search/extract
│   └── orchestration/         # Agent orchestration
├── styles/             # Global CSS
└── types/              # TypeScript definitions
```

## Configuration

### API Keys
Stored in browser localStorage:
- `research-agent-openrouter-key`
- `research-agent-parallel-key`

### Custom Models
Stored in browser localStorage:
- `research-agent-custom-models`

### Theme Preference
Stored in browser localStorage:
- `research-agent-theme`

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. The `dist/` folder contains the static build

3. Deploy to any static hosting service:
   - Vercel, Netlify, Cloudflare Pages
   - AWS S3 + CloudFront
   - GitHub Pages

**Important**: For production, you'll need to handle API proxying differently:
- Use serverless functions/edge functions
- Or configure CORS on your backend
- The current Vite proxy only works in development

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
