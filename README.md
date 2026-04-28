# Multimodal Lead Intelligence Agent Platform

Full-stack demo system for multimodal lead scoring, agent-based decisioning, policy simulation, and closed-loop feedback learning. The platform is designed to feel like a real AI decision operating system: backend APIs serve live scored lead intelligence, while the frontend can automatically fall back to realistic local demo data when the backend is unavailable.

## Project purpose

This project demonstrates how a multimodal, multi-agent architecture can:

- score leads using structured and unstructured signals
- explain why a recommendation was made
- route the lead into a specific commercial action
- simulate policy changes before rollout
- learn from outcomes and propose threshold updates

The experience is built for both engineering validation and executive demos.

## Architecture overview

### Backend

- `backend/app/api`: FastAPI route layer
- `backend/app/services`: business orchestration, simulation, dashboard, and learning logic
- `backend/app/agents`: specialist agents plus a supervisor agent
- `backend/app/repositories`: persistence access layer
- `backend/app/db`: SQLAlchemy models, session wiring, and demo seeding
- `backend/app/schemas`: typed request and response contracts

### Frontend

- `frontend/src/layout`: shell, navigation, and connection status
- `frontend/src/pages`: dashboard, lead workbench, lead detail, agent orchestration, strategy simulation, feedback learning
- `frontend/src/components`: shared panels, charts, trace views, and badges
- `frontend/src/api`: shared API client with timeout and fallback handling
- `frontend/src/data/demoData.ts`: enterprise-style fallback dataset and local simulation logic
- `frontend/src/types`: shared TypeScript API contracts

## Frontend pages

- `Dashboard`: portfolio summary, score distribution, action mix, confidence, and feedback loop health
- `Lead Workbench`: searchable lead queue with score, action, confidence, and status context
- `Lead Detail`: full decision intelligence profile with reasoning trace, feature contribution, multimodal evidence, and feedback form
- `Agent Orchestration`: live agent health plus selected-lead audit trail through the supervisor and specialist agents
- `Strategy Simulation`: policy optimization view for threshold changes, workload impact, and conversion uplift analysis
- `Feedback Learning`: closed-loop learning view for drift, threshold suggestions, retraining candidates, and action performance

## Backend APIs

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/leads`
- `GET /api/leads/{lead_id}`
- `POST /api/leads/score`
- `POST /api/leads/{lead_id}/feedback`
- `GET /api/agents/status`
- `GET /api/strategies/performance`
- `POST /api/simulation/run`

## Agent design

The decision stack includes the following agents:

- `SupervisorAgent`: fuses all specialist outputs into a final decision package and reasoning trace
- `StructuredScoringAgent`: evaluates structured CRM and firmographic features
- `TextIntentAgent`: extracts urgency, objections, and buying intent from CRM notes and transcripts
- `VoiceEmotionAgent`: interprets voice sentiment, hesitation, and conversational confidence
- `BehaviorSequenceAgent`: analyzes event timelines and sequence momentum
- `SimilarCaseAgent`: retrieves historical analogs and conversion patterns
- `StrategyAgent`: chooses recommended commercial action and time window
- `ExplanationAgent`: produces a business-readable rationale for field and leadership teams
- `FeedbackLearningAgent`: monitors drift, threshold changes, and retraining candidates

## Operating modes

The frontend runs in two modes.

### Live backend mode

- Frontend requests go through the Vite proxy from `/api` to `http://127.0.0.1:8000`
- Successful backend requests mark the UI as `Backend connected`
- Data is served from the FastAPI backend

### Demo fallback mode

- Each request times out after 5 seconds
- If the backend is slow, unavailable, or returns an error, the frontend loads realistic local demo data
- The UI clearly shows `Demo fallback mode`
- Strategy Simulation still produces policy output locally
- Feedback Learning still renders useful drift and learning insights

## Setup commands

### Backend setup

From the repo root:

```powershell
cd backend
copy .env.example .env
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
```

### Frontend setup

From the repo root in a second terminal:

```powershell
cd frontend
copy .env.example .env
npm install
```

## How to run backend

Run the backend on the expected live-demo address:

```powershell
cd backend
.venv\Scripts\activate
python -m app.main
```

Backend URLs:

- API root: `http://127.0.0.1:8000`
- OpenAPI docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/api/health`

## How to run frontend

```powershell
cd frontend
npm run dev
```

Frontend URL:

- UI: `http://localhost:5173`

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`.

## Verification commands

### Backend tests

```powershell
cd backend
pytest -q
```

### Frontend build

```powershell
cd frontend
npm run build
```

### Frontend tests

```powershell
cd frontend
npm test
```

### Frontend dev server

```powershell
cd frontend
npm run dev
```

### Backend startup

```powershell
cd backend
python -m app.main
```

## Troubleshooting

- If the header badge says `Demo fallback mode`, confirm the backend is running at `http://127.0.0.1:8000` and that `GET /api/health` succeeds.
- If the frontend is up but live data is not loading, check the browser console for `[api]` logs showing whether the request resolved from the live backend or fallback data.
- If the backend starts but returns empty data, remove `backend/lead_intelligence.db` and restart to reseed demo data.
- If Vite proxy behavior looks wrong, verify `frontend/vite.config.ts` still targets `http://127.0.0.1:8000`.
- If Strategy Simulation appears to fail, confirm whether the page is still returning local fallback output. The page should continue rendering even when the backend POST fails.

## Demo materials

- Demo script: [docs/demo_script.md](docs/demo_script.md)
- Patent positioning: [docs/patent_positioning.md](docs/patent_positioning.md)
