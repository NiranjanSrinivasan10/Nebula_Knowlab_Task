# Mail Web App

A modern mail web application with AI-powered assistance, built with FastAPI (backend) and React + Vite + TypeScript (frontend).

## Features

- **Google OAuth2 Authentication** - Secure login with Gmail integration
- **Gmail Integration** - Read, send, and manage emails via Gmail API
- **AI Assistant** - Natural language commands to manage your email using Vercel AI SDK (Anthropic Claude)
- **Real-time Updates** - Live inbox updates via Pub/Sub webhooks or polling fallback
- **Dark Mode** - Toggle between light and dark themes
- **Advanced Filtering** - Filter emails by date, sender, keyword, and read status
- **Responsive Design** - Clean, minimal UI built with Tailwind CSS

## Screenshots/Demo

<!-- TODO: Add screenshots of the application -->
<!-- TODO: Add demo video link -->

## Architecture

### Backend (FastAPI)

```
backend/
├── app/
│   ├── api/
│   │   ├── auth.py          # Google OAuth2 endpoints
│   │   ├── mail.py          # Gmail API endpoints
│   │   ├── assistant.py     # WebSocket for AI assistant
│   │   └── webhooks.py      # Pub/Sub webhook handlers
│   ├── core/
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   ├── services/
│   │   ├── gmail_service.py     # Gmail API client
│   │   ├── assistant_service.py  # Anthropic Claude integration
│   │   ├── pubsub_service.py     # GCP Pub/Sub integration
│   │   └── polling_service.py    # Fallback polling service
│   ├── config.py           # Pydantic settings
│   └── main.py             # FastAPI app
├── tests/
│   └── test_mail.py        # API tests
└── requirements.txt
```

### Frontend (React + Vite + TypeScript)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Inbox.tsx       # Inbox view
│   │   ├── Sent.tsx        # Sent emails view
│   │   ├── Compose.tsx     # Email composition
│   │   ├── EmailDetail.tsx # Email detail view
│   │   ├── Filters.tsx     # Filter controls
│   │   └── AssistantPanel.tsx # AI chat sidebar (Vercel AI SDK)
│   ├── hooks/
│   │   └── useMailStore.ts # Zustand state management
│   ├── services/
│   │   ├── api.ts          # API client
│   │   └── assistant.ts   # Vercel AI SDK integration
│   ├── lib/
│   │   └── actionHandlers.ts # Assistant action handlers
│   └── types/
├── public/
└── package.json
```

## Setup Instructions

### Backend Setup

1. **Create and activate virtual environment**
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
   GCP_PROJECT_ID=your_gcp_project_id_here
   PUBSUB_TOPIC=your_pubsub_topic_here
   SESSION_SECRET=your_session_secret_here
   USE_POLLING=false  # Set to true for local dev without public URL
   ```

4. **Get Google OAuth2 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Go to Credentials → Create Credentials → OAuth client ID
   - Add `http://localhost:5173/auth/callback` as authorized redirect URI
   - Copy Client ID and Client Secret to `.env`

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

3. **Get Anthropic API Key**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an API key
   - Copy to `.env.local` as `VITE_ANTHROPIC_API_KEY`

4. **Run the frontend**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:5173](http://localhost:5173) in your browser

## Architecture Decisions and Trade-offs

### Why Vercel AI SDK in Frontend?

**Decision:** Moved AI assistant logic to frontend using Vercel AI SDK instead of backend WebSocket.

**Rationale:**
- **Simpler architecture:** No need for WebSocket connection management in backend
- **Direct API calls:** Frontend can call AI provider directly, reducing backend complexity
- **Better UX:** Immediate responses without WebSocket connection overhead
- **Flexibility:** Easy to switch between AI providers (Anthropic, OpenAI, etc.) using Vercel AI SDK
- **Free tier support:** Can use free AI providers like Groq with Vercel AI SDK

**Trade-off:**
- API key exposed in frontend (must use environment variables and never commit)
- No server-side caching of AI responses
- Rate limiting per client IP instead of server-side

### Why Tool-Use Over Scripted Intent Parser?

**Decision:** Used Anthropic Claude's tool-use capability instead of building a custom intent parser.

**Rationale:**
- **Natural language understanding:** Claude provides superior NLP capabilities out-of-the-box
- **Flexibility:** Easy to add new tools without retraining or complex regex patterns
- **Structured output:** Tool-use returns structured JSON with parameters, reducing parsing errors
- **Context awareness:** Claude can understand context from conversation history and UI state

**Trade-off:**
- External API dependency (Anthropic)
- Cost per API call
- Requires network connectivity

### Why Polling Fallback?

**Decision:** Implemented polling service (15s interval) as fallback when Pub/Sub is unavailable.

**Rationale:**
- **Local development:** Pub/Sub requires a public URL for webhooks, which isn't available in local dev
- **Graceful degradation:** App remains functional even if Pub/Sub setup fails
- **Simplicity:** Easier to debug in development without GCP infrastructure

**Trade-off:**
- Higher latency (15s delay vs. near-instant Pub/Sub)
- More server load (continuous polling vs. event-driven)
- Not suitable for production (should use Pub/Sub in production)

### Why In-Memory Session Storage?

**Decision:** Used in-memory dictionary for session/token storage instead of database or encrypted files.

**Rationale:**
- **Simplicity:** Easier to understand and debug for a hiring task
- **No external dependencies:** Doesn't require Redis or database setup
- **Sufficient for demo:** Demonstrates OAuth flow without added complexity

**Trade-off:**
- Ephemeral: Lost on server restart
- Not production-ready (should use Redis/database in production)
- No persistence across instances

### Why Zustand Over Redux?

**Decision:** Used Zustand for state management instead of Redux.

**Rationale:**
- **Simpler API:** Less boilerplate, no actions/reducers
- **TypeScript support:** Built-in TypeScript support
- **Performance:** No need for selectors, direct store access
- **Smaller bundle size:** Less code to ship

**Trade-off:**
- Less ecosystem tooling compared to Redux
- No built-in devtools (though separate package available)

## What I'd Improve

### Backend

1. **Persistent Session Storage**
   - Replace in-memory storage with Redis or database
   - Add session expiration and refresh token logic
   - Implement proper session management across instances

2. **Error Handling**
   - Add comprehensive error handling with custom exceptions
   - Implement retry logic for Gmail API calls
   - Add rate limiting and circuit breakers

3. **Testing**
   - Add integration tests for OAuth flow
   - Mock Gmail API responses in tests
   - Add WebSocket connection tests

4. **Pub/Sub Improvements**
   - Add proper authentication for webhook endpoints
   - Implement idempotent message processing
   - Add dead-letter queue for failed messages

5. **Security**
   - Add CSRF protection
   - Implement proper session cookie settings (secure, httpOnly, sameSite)
   - Add input validation and sanitization

### Frontend

1. **Thread View**
   - Implement conversation/thread view for email replies
   - Show message history in chronological order
   - Add visual indicators for thread depth

2. **Loading States**
   - Add skeleton loaders for email lists
   - Implement optimistic UI updates
   - Add loading spinners for async operations

3. **Error Boundaries**
   - Add React Error Boundaries for graceful error handling
   - Implement retry mechanisms for failed API calls
   - Show user-friendly error messages

4. **Performance**
   - Implement virtual scrolling for large email lists
   - Add memoization for expensive computations
   - Implement lazy loading for email content

5. **Accessibility**
   - Add ARIA labels and roles
   - Implement keyboard navigation
   - Add screen reader support

6. **Testing**
   - Add component tests with React Testing Library
   - Add E2E tests with Playwright
   - Test action handlers with mocked store

### DevOps

1. **Docker**
   - Create Dockerfile for backend and frontend
   - Add docker-compose for local development
   - Implement multi-stage builds for production

2. **CI/CD**
   - Add GitHub Actions for automated testing
   - Implement automated deployment pipeline
   - Add environment-specific configurations

3. **Monitoring**
   - Add logging (e.g., Sentry for error tracking)
   - Implement performance monitoring
   - Add health check endpoints

4. **Documentation**
   - Add API documentation with Swagger/OpenAPI
   - Create component storybook
   - Add architecture diagrams

## Running Tests

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## License

This project is built as a hiring task demonstration.
