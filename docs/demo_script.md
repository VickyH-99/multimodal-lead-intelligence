# 5-Minute Demo Script

## 1. Problem

Most lead systems score accounts once, show a number, and stop there. Sales and RevOps teams still have to answer the hard questions manually:

- Why did the score change?
- Which signals mattered most?
- Should a human or AI handle the next action?
- Are our routing policies still working?
- What did we learn from recent outcomes?

This platform turns lead scoring into a multimodal decision operating system.

## 2. System architecture

Open with the top-right status indicator.

- If the backend is live, point out `Backend connected`
- If the backend is down, point out `Demo fallback mode`
- Explain that the frontend is resilient by design and stays fully usable in both modes

Then summarize the architecture:

- FastAPI backend for live lead intelligence APIs
- Supervisor and specialist agents for multimodal decisioning
- React frontend for operator workflows
- Local fallback dataset so demos never collapse when infrastructure is unstable

## 3. Multimodal agents

Go to `Agent Orchestration`.

Walk through the flow:

1. `SupervisorAgent` fuses all signals and assembles the final audit package.
2. `StructuredScoringAgent` evaluates firmographic and CRM features.
3. `TextIntentAgent` extracts urgency, objections, and buying intent from notes and transcripts.
4. `VoiceEmotionAgent` interprets sentiment, hesitation, and confidence cues.
5. `BehaviorSequenceAgent` analyzes timeline momentum.
6. `SimilarCaseAgent` finds historical analogs.
7. `StrategyAgent` recommends the next commercial action.
8. `ExplanationAgent` produces the business narrative.

Point out that the reasoning trace is not a chatbot transcript. It is an audit-style decision trail with:

- input signals
- reasoning summary
- confidence
- contribution to the final decision
- action implication

## 4. Lead decision profile

Open `Lead Detail`.

Show that one lead becomes a full decision intelligence profile:

- structured score and multimodal score
- score band and confidence
- recommended action and time window
- SHAP-style feature contribution
- text intent evidence
- voice emotion evidence
- behavior timeline
- similar converted cases
- governance notes
- full agent reasoning trace
- feedback form

Message to deliver:

"This is the difference between a score and a decision platform. We can show not only what we recommend, but why we recommend it and what evidence supports it."

## 5. Strategy simulation

Open `Strategy Simulation`.

Explain that this is a policy optimization engine, not just a reporting view.

Demonstrate:

- adjust thresholds
- rerun the simulation
- compare current versus proposed strategy
- review conversion delta, workload delta, and AI versus human load
- open the `Why this result?` section
- highlight threshold sensitivity analysis
- point to the exportable summary text

Message to deliver:

"Before leadership changes routing policy, they can see the projected commercial upside and operational cost of the change."

## 6. Feedback learning loop

Open `Feedback Learning`.

Show:

- high-score non-converted leads
- low-score converted leads
- drift warnings
- threshold suggestions
- retraining candidate samples
- action performance by strategy type
- governance notes

Message to deliver:

"The system does not just score and route. It learns from outcome data, identifies drift, and proposes how to improve the next decision cycle."

## 7. Why this is patent-grade

Close with the positioning:

- multimodal fusion across structured, text, voice, behavior, and historical analog signals
- supervisor-plus-specialist agent architecture
- decision-level reasoning trace with operational implications
- simulation-based policy optimization before deployment
- closed-loop learning from actual lead outcomes
- resilient demo and production behavior through live mode plus fallback mode

Final line:

"This is not a dashboard around a model. It is a full decision intelligence platform for multimodal lead orchestration."
