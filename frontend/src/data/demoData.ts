import {
  AgentSignal,
  AgentStatusResponse,
  ApiHealthResponse,
  DashboardSummaryResponse,
  FeedbackRecord,
  FeedbackResponse,
  FeatureContribution,
  LeadDetailResponse,
  LeadInsightSummary,
  LeadListItem,
  RetrainingCandidateSample,
  SimilarCaseSummary,
  SimulationOperationalInsight,
  SimulationRequest,
  SimulationResponse,
  StrategyPerformanceResponse
} from "../types/api";

interface ResolveDemoDataArgs {
  path: string;
  method: string;
  body?: unknown;
}

interface DemoEvent {
  event_type: string;
  channel: string;
  notes: string;
  occurred_at: string;
}

interface DemoLeadScenario {
  id: number;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  title: string;
  industry: string;
  region: string;
  source_channel: string;
  lifecycle_stage: string;
  current_status: string;
  annual_revenue_band: string;
  employee_count: number;
  budget_estimate: number;
  engagement_score: number;
  product_fit_score: number;
  website_visits: number;
  email_open_rate: number;
  crm_notes: string;
  call_transcript: string;
  speaking_speed: number;
  average_pause_duration: number;
  voice_sentiment_score: number;
  hesitation_score: number;
  historical_outcome: string | null;
  owner: string;
  segment: string;
  installed_crm: string;
  compliance_tier: string;
  base_score: number;
  multimodal_score: number;
  score_band: string;
  confidence: number;
  recommended_action: string;
  recommended_time_window: string;
  explanation: string;
  risk_flags: string[];
  top_feature_reasons: string[];
  text_summary: string;
  voice_summary: string;
  behavior_summary: string;
  strategy_summary: string;
  similar_case_focus: string;
  feedback_reason?: string;
  behavior_events: DemoEvent[];
  created_at: string;
  updated_at: string;
}

interface SimulationCohort {
  score: number;
  volume: number;
  risk_penalty: number;
}

interface FeedbackSubmissionBody {
  outcome?: string;
  reason?: string;
  salesperson_feedback?: string;
  conversion_value?: number | null;
}

const DEMO_ANCHOR = new Date("2026-04-27T14:00:00.000Z");
const DEFAULT_THRESHOLDS: SimulationRequest["thresholds"] = {
  s: 0.85,
  a: 0.72,
  b: 0.58,
  c: 0.42
};
const DEFAULT_ACTION_RULES: SimulationRequest["action_rules"] = {
  s_band_action: "senior human call",
  a_band_action: "normal human call",
  b_band_action: "AI outbound call",
  c_band_action: "delayed follow-up",
  d_band_action: "nurture pool"
};
const DEFAULT_HUMAN_CAPACITY = 18;
const DEFAULT_AI_CAPACITY = 40;

const simulationPortfolio: SimulationCohort[] = [
  { score: 0.94, volume: 24, risk_penalty: 0.01 },
  { score: 0.88, volume: 40, risk_penalty: 0.015 },
  { score: 0.79, volume: 58, risk_penalty: 0.02 },
  { score: 0.67, volume: 72, risk_penalty: 0.026 },
  { score: 0.53, volume: 61, risk_penalty: 0.03 },
  { score: 0.37, volume: 46, risk_penalty: 0.02 }
];

function iso(daysAgo: number, hoursAgo = 0): string {
  const timestamp = new Date(DEMO_ANCHOR);
  timestamp.setUTCDate(timestamp.getUTCDate() - daysAgo);
  timestamp.setUTCHours(timestamp.getUTCHours() - hoursAgo);
  return timestamp.toISOString();
}

function event(
  daysAgo: number,
  hoursAgo: number,
  eventType: string,
  channel: string,
  notes: string
): DemoEvent {
  return {
    event_type: eventType,
    channel,
    notes,
    occurred_at: iso(daysAgo, hoursAgo)
  };
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

const demoLeads: DemoLeadScenario[] = [
  {
    id: 1,
    full_name: "Maya Patel",
    company_name: "Northbridge Health",
    email: "maya.patel@northbridgehealth.com",
    phone: "+1-416-555-0101",
    title: "VP Revenue Operations",
    industry: "Healthcare",
    region: "Ontario",
    source_channel: "partner referral",
    lifecycle_stage: "proposal",
    current_status: "closed_won",
    annual_revenue_band: "$50M-$100M",
    employee_count: 880,
    budget_estimate: 140000,
    engagement_score: 0.92,
    product_fit_score: 0.94,
    website_visits: 21,
    email_open_rate: 0.74,
    crm_notes:
      "CRO and RevOps lead want rollout before quarter end. Security review is scheduled and budget is approved.",
    call_transcript:
      "We are ready to move once procurement clears the paperwork. Maya asked for implementation planning and data migration timing.",
    speaking_speed: 149,
    average_pause_duration: 0.8,
    voice_sentiment_score: 0.61,
    hesitation_score: 0.12,
    historical_outcome: "converted",
    owner: "team-alpha",
    segment: "enterprise",
    installed_crm: "Salesforce",
    compliance_tier: "hipaa-ready",
    base_score: 0.89,
    multimodal_score: 0.93,
    score_band: "S",
    confidence: 0.94,
    recommended_action: "senior human call",
    recommended_time_window: "within 12 hours while procurement is active",
    explanation:
      "Northbridge Health remains a premium conversion opportunity. Buying intent is mature, budget is already allocated, and the latest call signals showed low hesitation with strong next-step clarity.",
    risk_flags: ["security_review_pending"],
    top_feature_reasons: [
      "Approved budget and procurement timeline increased priority weighting.",
      "High product-fit and repeat executive engagement lifted structured confidence.",
      "Voice analysis indicated low hesitation and positive execution readiness."
    ],
    text_summary:
      "Text channels show strong execution intent, concrete timing, and a low-friction stakeholder path.",
    voice_summary:
      "Voice pattern indicates confidence and forward motion, with short pauses and consistently positive sentiment.",
    behavior_summary:
      "Behavior sequence shows accelerated progress from referral to proposal in under three weeks.",
    strategy_summary:
      "Route directly to a senior seller because the account is late-stage and commercially qualified.",
    similar_case_focus:
      "Peer enterprise healthcare deals converted fastest when implementation planning was surfaced before legal review closed.",
    feedback_reason:
      "Observed opportunity progressed to signed deal after follow-up and implementation alignment.",
    behavior_events: [
      event(18, 1, "lead_created", "crm", "Referral intake completed."),
      event(14, 2, "call_connected", "phone", "Discovery call completed with VP RevOps."),
      event(10, 1, "demo_attended", "video", "Executive demo attended by operations team."),
      event(7, 3, "proposal_requested", "email", "Commercial proposal requested."),
      event(3, 2, "appointment_booked", "calendar", "Procurement alignment booked.")
    ],
    created_at: iso(22),
    updated_at: iso(2)
  },
  {
    id: 2,
    full_name: "Liam Chen",
    company_name: "Apex Manufacturing Group",
    email: "liam.chen@apexmfg.com",
    phone: "+1-312-555-0102",
    title: "Director of Sales Excellence",
    industry: "Manufacturing",
    region: "Illinois",
    source_channel: "webinar",
    lifecycle_stage: "evaluation",
    current_status: "closed_won",
    annual_revenue_band: "$100M-$250M",
    employee_count: 1320,
    budget_estimate: 90000,
    engagement_score: 0.82,
    product_fit_score: 0.88,
    website_visits: 17,
    email_open_rate: 0.63,
    crm_notes:
      "Ops team is comparing sequencing workflows and likes the attribution layer. CFO asked for ROI proof, but timing is still this month.",
    call_transcript:
      "We have stakeholders from sales ops and IT in the evaluation. If ROI checks out, we can pilot next month.",
    speaking_speed: 143,
    average_pause_duration: 1,
    voice_sentiment_score: 0.39,
    hesitation_score: 0.18,
    historical_outcome: "converted",
    owner: "team-bravo",
    segment: "enterprise",
    installed_crm: "Dynamics 365",
    compliance_tier: "standard",
    base_score: 0.8,
    multimodal_score: 0.86,
    score_band: "S",
    confidence: 0.87,
    recommended_action: "senior human call",
    recommended_time_window: "inside the current budgeting window",
    explanation:
      "Apex Manufacturing has strong cross-functional engagement and a clear ROI narrative. The account earned a high-priority route because budget timing and operational need are aligned.",
    risk_flags: ["roi_validation_required"],
    top_feature_reasons: [
      "High product fit and operational urgency supported a strong structured score.",
      "Recent demo attendance and pilot planning increased behavioral momentum.",
      "Executive sponsorship offset moderate procurement diligence."
    ],
    text_summary:
      "CRM notes reveal active ROI validation rather than soft interest, which typically precedes fast pilot conversion.",
    voice_summary:
      "Voice sentiment is measured but constructive, with low hesitation once pilot scope is discussed.",
    behavior_summary:
      "Behavior history shows repeat touchpoint engagement across webinar, phone, and calendar channels.",
    strategy_summary:
      "Keep the opportunity in senior human coverage because financial validation is the final unlock.",
    similar_case_focus:
      "Comparable manufacturing accounts closed after aligning a short pilot and a finance-facing value case.",
    feedback_reason:
      "Observed opportunity progressed to signed deal after ROI proof and pilot planning.",
    behavior_events: [
      event(16, 1, "lead_created", "webinar", "Registered from manufacturing pipeline webinar."),
      event(13, 2, "email_opened", "email", "Follow-up email opened twice."),
      event(12, 1, "call_connected", "phone", "Evaluation call with sales ops."),
      event(9, 2, "demo_attended", "video", "Workflow demo attended."),
      event(5, 1, "appointment_booked", "calendar", "Pilot planning booked.")
    ],
    created_at: iso(18),
    updated_at: iso(5)
  },
  {
    id: 3,
    full_name: "Sofia Ramirez",
    company_name: "Brightline Financial",
    email: "sofia.ramirez@brightlinefinancial.com",
    phone: "+1-646-555-0103",
    title: "Head of Revenue Technology",
    industry: "Financial Services",
    region: "New York",
    source_channel: "inbound demo",
    lifecycle_stage: "proposal",
    current_status: "closed_lost",
    annual_revenue_band: "$250M-$500M",
    employee_count: 1900,
    budget_estimate: 110000,
    engagement_score: 0.85,
    product_fit_score: 0.9,
    website_visits: 19,
    email_open_rate: 0.68,
    crm_notes:
      "High executive interest, but legal and pricing are heavy topics. They are comparing us against Salesforce and asked for discount flexibility.",
    call_transcript:
      "The platform looks strong, but procurement wants a better price and the legal review could slow things down.",
    speaking_speed: 137,
    average_pause_duration: 1.6,
    voice_sentiment_score: 0.05,
    hesitation_score: 0.42,
    historical_outcome: "not_converted",
    owner: "team-alpha",
    segment: "enterprise",
    installed_crm: "Salesforce Financial Services Cloud",
    compliance_tier: "sox",
    base_score: 0.81,
    multimodal_score: 0.78,
    score_band: "A",
    confidence: 0.82,
    recommended_action: "normal human call",
    recommended_time_window: "within 24 hours while the pricing committee is active",
    explanation:
      "Brightline Financial still shows commercial relevance, but the latest multimodal review surfaced greater downside from pricing pressure and legal drag than the structured profile alone suggested.",
    risk_flags: ["price_sensitivity", "legal_review_risk"],
    top_feature_reasons: [
      "High site engagement and executive demo attendance kept the score above the A-band floor.",
      "Text analysis surfaced competitive pressure and discount expectations.",
      "Voice hesitation and elongated pauses reduced final conviction."
    ],
    text_summary:
      "Text intent remains serious, but repeated pricing objections suggest the opportunity was over-weighted on engagement alone.",
    voice_summary:
      "Voice review shows hesitation during budget and legal topics, with confidence dropping late in the call.",
    behavior_summary:
      "Behavioral momentum slowed after the proposal stage and then stalled around procurement review.",
    strategy_summary:
      "Retain human coverage, but route through a price-defense and legal-readiness play rather than pure velocity.",
    similar_case_focus:
      "Financial-services opportunities with active legal review converted only when pricing governance was handled early.",
    feedback_reason:
      "Account stalled after pricing and legal review, despite strong initial demo engagement.",
    behavior_events: [
      event(21, 1, "lead_created", "web", "Inbound demo request submitted."),
      event(17, 1, "call_connected", "phone", "Initial evaluation call connected."),
      event(13, 2, "demo_attended", "video", "Technical and business demo completed."),
      event(8, 1, "proposal_requested", "email", "Pricing proposal requested."),
      event(4, 2, "no_show", "calendar", "Procurement review call no-show.")
    ],
    created_at: iso(24),
    updated_at: iso(4)
  },
  {
    id: 4,
    full_name: "Aiden Brooks",
    company_name: "Sterling Education Partners",
    email: "aiden.brooks@sterlingedpartners.org",
    phone: "+1-617-555-0104",
    title: "Enrollment Strategy Lead",
    industry: "Education",
    region: "Massachusetts",
    source_channel: "organic",
    lifecycle_stage: "discovery",
    current_status: "closed_won",
    annual_revenue_band: "$10M-$50M",
    employee_count: 260,
    budget_estimate: 26000,
    engagement_score: 0.49,
    product_fit_score: 0.64,
    website_visits: 8,
    email_open_rate: 0.48,
    crm_notes:
      "They were initially exploratory, but urgency increased after enrollment targets slipped. Team wants a phased deployment with a modest budget.",
    call_transcript:
      "We do not have a huge budget, but this could help us before the next intake cycle if we move carefully.",
    speaking_speed: 151,
    average_pause_duration: 1.1,
    voice_sentiment_score: 0.22,
    hesitation_score: 0.19,
    historical_outcome: "converted",
    owner: "team-charlie",
    segment: "mid-market",
    installed_crm: "HubSpot",
    compliance_tier: "standard",
    base_score: 0.45,
    multimodal_score: 0.49,
    score_band: "C",
    confidence: 0.73,
    recommended_action: "delayed follow-up",
    recommended_time_window: "inside the next 3 business days with a budget-sensitive sequence",
    explanation:
      "Sterling Education Partners converted despite a lower score because hidden urgency emerged after the initial discovery motion. This is a strong example of a low-score win that should inform retraining.",
    risk_flags: ["budget_constraint"],
    top_feature_reasons: [
      "Base profile under-scored the deal because budget and traffic signals were modest.",
      "Text and call context revealed acute timing pressure tied to enrollment goals.",
      "Behavior improved after reactivation, suggesting intent changed late in the cycle."
    ],
    text_summary:
      "Text review shows a buyer that sounds cautious on spend but highly urgent on outcomes.",
    voice_summary:
      "Voice sentiment stayed neutral-to-positive, with low hesitation once the intake timeline was discussed.",
    behavior_summary:
      "The lead reactivated and moved quickly after a change in business urgency.",
    strategy_summary:
      "Use a lower-intensity follow-up motion paired with a cost-conscious proof plan.",
    similar_case_focus:
      "Education buyers with weak top-of-funnel scoring still converted when time-sensitive enrollment targets emerged.",
    feedback_reason:
      "Observed opportunity progressed to signed deal after urgency increased and a phased rollout was offered.",
    behavior_events: [
      event(24, 1, "lead_created", "web", "Organic inbound form."),
      event(20, 2, "call_attempted", "phone", "Initial voicemail left."),
      event(18, 2, "call_connected", "phone", "Discovery call connected."),
      event(12, 1, "reactivated", "email", "Lead reactivated after new intake concern."),
      event(6, 2, "appointment_booked", "calendar", "Decision workshop booked.")
    ],
    created_at: iso(28),
    updated_at: iso(6)
  },
  {
    id: 5,
    full_name: "Noah Bennett",
    company_name: "Harbor Logistics",
    email: "noah.bennett@harborlogistics.com",
    phone: "+1-713-555-0105",
    title: "VP Commercial Operations",
    industry: "Logistics",
    region: "Texas",
    source_channel: "paid search",
    lifecycle_stage: "evaluation",
    current_status: "closed_lost",
    annual_revenue_band: "$50M-$100M",
    employee_count: 540,
    budget_estimate: 38000,
    engagement_score: 0.56,
    product_fit_score: 0.58,
    website_visits: 11,
    email_open_rate: 0.42,
    crm_notes:
      "Ops team liked the workflow logic, but the commercial sponsor changed mid-cycle and the project lost internal air cover.",
    call_transcript:
      "The use case is real, but I need another quarter before I can re-open this with finance.",
    speaking_speed: 140,
    average_pause_duration: 1.5,
    voice_sentiment_score: -0.08,
    hesitation_score: 0.39,
    historical_outcome: "not_converted",
    owner: "team-delta",
    segment: "mid-market",
    installed_crm: "Salesforce",
    compliance_tier: "standard",
    base_score: 0.59,
    multimodal_score: 0.62,
    score_band: "B",
    confidence: 0.76,
    recommended_action: "AI outbound call",
    recommended_time_window: "next week after sponsor alignment resumes",
    explanation:
      "Harbor Logistics retained moderate upside, but sponsor churn and financing delay moved the opportunity out of immediate human-priority territory.",
    risk_flags: ["champion_turnover", "budget_timing"],
    top_feature_reasons: [
      "Product fit kept the account above the mid-band threshold.",
      "Voice sentiment and sponsor change reduced confidence in near-term conversion.",
      "Low sustained engagement after evaluation slowed behavioral momentum."
    ],
    text_summary:
      "Text indicates real process pain, but budget timing and sponsorship risk dominate the account.",
    voice_summary:
      "Call sentiment dipped once ownership and timing were discussed, suggesting a deferral rather than active competitive loss.",
    behavior_summary:
      "Behavior tapered after the evaluation call, with no follow-up meetings booked.",
    strategy_summary:
      "Move to AI-led coverage and light nurture until internal sponsorship is re-established.",
    similar_case_focus:
      "Logistics buyers with sponsor turnover typically require multi-touch nurture before re-entering a human-assisted lane.",
    feedback_reason:
      "Account stalled after sponsor turnover and budget reprioritization.",
    behavior_events: [
      event(20, 1, "lead_created", "search", "Paid search conversion routed to SDR."),
      event(17, 2, "call_connected", "phone", "Discovery call completed."),
      event(13, 1, "demo_attended", "video", "Operations demo attended."),
      event(8, 1, "proposal_requested", "email", "Commercial outline requested."),
      event(3, 2, "deal_stalled", "crm", "Champion moved accounts internally.")
    ],
    created_at: iso(21),
    updated_at: iso(3)
  },
  {
    id: 6,
    full_name: "Emma Wallace",
    company_name: "Nova Clinics Network",
    email: "emma.wallace@novaclinics.com",
    phone: "+1-303-555-0106",
    title: "Chief Growth Officer",
    industry: "Healthcare",
    region: "Colorado",
    source_channel: "partner referral",
    lifecycle_stage: "evaluation",
    current_status: "open",
    annual_revenue_band: "$50M-$100M",
    employee_count: 670,
    budget_estimate: 82000,
    engagement_score: 0.79,
    product_fit_score: 0.87,
    website_visits: 16,
    email_open_rate: 0.66,
    crm_notes:
      "The executive sponsor wants a single operating view across regional clinics. Security questions are active but non-blocking so far.",
    call_transcript:
      "If we can unify the regional teams and preserve compliance controls, this could become our Q3 operating standard.",
    speaking_speed: 145,
    average_pause_duration: 0.9,
    voice_sentiment_score: 0.44,
    hesitation_score: 0.17,
    historical_outcome: null,
    owner: "team-alpha",
    segment: "enterprise",
    installed_crm: "Salesforce",
    compliance_tier: "hipaa-ready",
    base_score: 0.73,
    multimodal_score: 0.77,
    score_band: "A",
    confidence: 0.84,
    recommended_action: "normal human call",
    recommended_time_window: "within 24 hours to anchor the security workstream",
    explanation:
      "Nova Clinics Network is an active expansion opportunity with strong cross-site value and manageable compliance friction. The opportunity is commercially healthy and should remain in direct seller coverage.",
    risk_flags: ["security_review_pending"],
    top_feature_reasons: [
      "Strong fit for multi-site operations increased the structured score.",
      "Repeated executive engagement suggests clear sponsorship.",
      "Security review is active, but call sentiment suggests low execution fear."
    ],
    text_summary:
      "Text analysis shows urgent operational pain and an executive buyer who is already thinking about rollout design.",
    voice_summary:
      "Voice review remains positive and low-friction, with confidence rising as governance is discussed.",
    behavior_summary:
      "Behavior has stayed consistently active across referral, demo, and follow-up planning touchpoints.",
    strategy_summary:
      "Maintain human coverage because the deal is expanding and the next hurdle is multi-stakeholder alignment rather than awareness.",
    similar_case_focus:
      "Healthcare network deals respond well when compliance planning is paired with regional rollout sequencing.",
    behavior_events: [
      event(15, 1, "lead_created", "crm", "Partner-introduced enterprise account."),
      event(11, 2, "call_connected", "phone", "Executive discovery completed."),
      event(7, 1, "demo_attended", "video", "Regional clinic demo attended."),
      event(4, 1, "security_review_started", "email", "Security questionnaire delivered."),
      event(1, 3, "appointment_booked", "calendar", "Architecture review scheduled.")
    ],
    created_at: iso(17),
    updated_at: iso(1)
  },
  {
    id: 7,
    full_name: "Olivia Green",
    company_name: "Vector SaaS",
    email: "olivia.green@vectorsaas.com",
    phone: "+1-206-555-0107",
    title: "Head of Revenue Systems",
    industry: "SaaS",
    region: "Washington",
    source_channel: "inbound demo",
    lifecycle_stage: "evaluation",
    current_status: "open",
    annual_revenue_band: "$10M-$50M",
    employee_count: 310,
    budget_estimate: 52000,
    engagement_score: 0.67,
    product_fit_score: 0.7,
    website_visits: 13,
    email_open_rate: 0.58,
    crm_notes:
      "The buyer is comparing AI-first coverage models and wants evidence that routing will reduce rep overhead without hurting conversions.",
    call_transcript:
      "We are moving quickly, but I need to prove that the AI touch layer will not create noise for the field team.",
    speaking_speed: 153,
    average_pause_duration: 0.95,
    voice_sentiment_score: 0.28,
    hesitation_score: 0.21,
    historical_outcome: null,
    owner: "team-bravo",
    segment: "mid-market",
    installed_crm: "HubSpot",
    compliance_tier: "standard",
    base_score: 0.61,
    multimodal_score: 0.6,
    score_band: "B",
    confidence: 0.79,
    recommended_action: "AI outbound call",
    recommended_time_window: "within 48 hours with a benchmark-focused sequence",
    explanation:
      "Vector SaaS is a strong mid-band opportunity where automation economics matter as much as buyer intent. AI-led outreach is the most efficient motion until proof requirements are satisfied.",
    risk_flags: ["benchmarking_required"],
    top_feature_reasons: [
      "Interest in AI coverage models lifted the behavioral and text signals.",
      "Moderate budget and team size kept the lead in mid-band routing.",
      "Confidence remained healthy because objections are operational rather than competitive."
    ],
    text_summary:
      "Text channels show curiosity, urgency, and a need for operator-grade benchmarks rather than a broad product education track.",
    voice_summary:
      "Voice pattern is engaged and pragmatic, with low hesitation once measurement plans are described.",
    behavior_summary:
      "Behavior suggests active evaluation and repeated return visits to proof-oriented content.",
    strategy_summary:
      "Lead with AI-assisted outreach backed by benchmark evidence and keep human coverage in reserve.",
    similar_case_focus:
      "Comparable SaaS buyers converted after a benchmark-first AI pilot rather than a fully human-led motion.",
    behavior_events: [
      event(14, 1, "lead_created", "web", "Inbound demo request from revenue systems team."),
      event(10, 2, "demo_attended", "video", "AI workflow demo attended."),
      event(8, 1, "email_opened", "email", "Benchmark follow-up opened three times."),
      event(5, 1, "content_downloaded", "web", "ROI benchmark guide downloaded."),
      event(2, 2, "call_connected", "phone", "Evaluation call with RevOps lead.")
    ],
    created_at: iso(15),
    updated_at: iso(2)
  },
  {
    id: 8,
    full_name: "Grace Holloway",
    company_name: "Crest Energy Services",
    email: "grace.holloway@crestenergy.com",
    phone: "+1-403-555-0108",
    title: "Commercial Strategy Director",
    industry: "Energy",
    region: "Alberta",
    source_channel: "conference",
    lifecycle_stage: "nurture",
    current_status: "open",
    annual_revenue_band: "$100M-$250M",
    employee_count: 1180,
    budget_estimate: 47000,
    engagement_score: 0.42,
    product_fit_score: 0.57,
    website_visits: 6,
    email_open_rate: 0.33,
    crm_notes:
      "The account has interest in field productivity, but the current program is exploratory and tied to next-year planning.",
    call_transcript:
      "The concept is useful, but we are still shaping the internal business case and probably will not move this quarter.",
    speaking_speed: 136,
    average_pause_duration: 1.7,
    voice_sentiment_score: 0.02,
    hesitation_score: 0.38,
    historical_outcome: null,
    owner: "team-delta",
    segment: "enterprise",
    installed_crm: "Microsoft Dynamics",
    compliance_tier: "standard",
    base_score: 0.44,
    multimodal_score: 0.46,
    score_band: "C",
    confidence: 0.72,
    recommended_action: "delayed follow-up",
    recommended_time_window: "next month after annual planning checkpoints",
    explanation:
      "Crest Energy Services has strategic fit, but the operating window is too early for expensive human attention. The account should stay warm until planning maturity improves.",
    risk_flags: ["timeline_slip_risk"],
    top_feature_reasons: [
      "Exploratory interest kept the account above the nurture pool floor.",
      "Weak near-term timing signals reduced urgency substantially.",
      "Voice hesitation around ownership and budget lowered the final confidence."
    ],
    text_summary:
      "Text and call notes point to a real use case, but not an active buying cycle.",
    voice_summary:
      "Voice analysis shows a cautious tone and long pauses around timing decisions.",
    behavior_summary:
      "Behavior remains light and periodic, which is consistent with annual-plan evaluation rather than active procurement.",
    strategy_summary:
      "Use delayed follow-up and keep the account in a low-friction education track until planning advances.",
    similar_case_focus:
      "Energy accounts with annual planning constraints convert more efficiently after nurture rather than immediate seller escalation.",
    behavior_events: [
      event(23, 1, "lead_created", "conference", "Badge scan imported from field event."),
      event(16, 1, "email_opened", "email", "Post-event sequence opened once."),
      event(9, 2, "call_connected", "phone", "Exploratory strategy call completed."),
      event(5, 2, "content_downloaded", "web", "Operational benchmarking note downloaded."),
      event(1, 4, "follow_up_scheduled", "crm", "Plan to revisit after annual planning.")
    ],
    created_at: iso(25),
    updated_at: iso(1)
  },
  {
    id: 9,
    full_name: "Daniel Kim",
    company_name: "Lattice MedTech",
    email: "daniel.kim@latticemedtech.com",
    phone: "+1-858-555-0109",
    title: "SVP Commercial Excellence",
    industry: "Medical Devices",
    region: "California",
    source_channel: "executive referral",
    lifecycle_stage: "proposal",
    current_status: "open",
    annual_revenue_band: "$250M-$500M",
    employee_count: 2150,
    budget_estimate: 165000,
    engagement_score: 0.91,
    product_fit_score: 0.95,
    website_visits: 24,
    email_open_rate: 0.79,
    crm_notes:
      "The revenue leadership team wants global orchestration, stronger territory visibility, and an implementation partner recommendation.",
    call_transcript:
      "We already have executive backing. The remaining question is how quickly your team can support a staged deployment.",
    speaking_speed: 148,
    average_pause_duration: 0.75,
    voice_sentiment_score: 0.57,
    hesitation_score: 0.11,
    historical_outcome: null,
    owner: "team-alpha",
    segment: "enterprise",
    installed_crm: "Salesforce",
    compliance_tier: "gxp",
    base_score: 0.87,
    multimodal_score: 0.9,
    score_band: "S",
    confidence: 0.92,
    recommended_action: "senior human call",
    recommended_time_window: "same day to preserve executive momentum",
    explanation:
      "Lattice MedTech is one of the strongest open opportunities in the demo portfolio. The account has executive sponsorship, strong fit, and a deployment-focused buying conversation.",
    risk_flags: ["implementation_capacity_check"],
    top_feature_reasons: [
      "Executive sponsorship and product fit are both top-tier.",
      "Behavioral engagement shows broad stakeholder participation across the buying group.",
      "Voice patterns indicate urgency and low perceived adoption risk."
    ],
    text_summary:
      "Text channels are highly actionable and centered on deployment readiness rather than product education.",
    voice_summary:
      "Voice signals are confident, concise, and execution-oriented, which is typical of late-stage enterprise buyers.",
    behavior_summary:
      "Behavior pattern mirrors the best-converting enterprise opportunities in the current portfolio.",
    strategy_summary:
      "Prioritize senior seller follow-up immediately and bring implementation leadership into the thread early.",
    similar_case_focus:
      "Medical-device enterprise wins accelerated when implementation assurance was paired with executive sponsorship.",
    behavior_events: [
      event(13, 1, "lead_created", "crm", "Executive referral entered by AE."),
      event(10, 2, "call_connected", "phone", "Global RevOps discovery completed."),
      event(7, 1, "demo_attended", "video", "Regional leaders joined demo."),
      event(4, 1, "proposal_requested", "email", "Commercial proposal requested."),
      event(1, 2, "appointment_booked", "calendar", "Implementation planning review booked.")
    ],
    created_at: iso(14),
    updated_at: iso(1)
  },
  {
    id: 10,
    full_name: "Marcus Lee",
    company_name: "Orbit Retail Labs",
    email: "marcus.lee@orbitretail.com",
    phone: "+1-404-555-0110",
    title: "Director of Revenue Analytics",
    industry: "Retail",
    region: "Georgia",
    source_channel: "partner marketplace",
    lifecycle_stage: "evaluation",
    current_status: "closed_won",
    annual_revenue_band: "$10M-$50M",
    employee_count: 190,
    budget_estimate: 31000,
    engagement_score: 0.53,
    product_fit_score: 0.6,
    website_visits: 9,
    email_open_rate: 0.39,
    crm_notes:
      "Early scoring looked average, but the retail ops lead became highly responsive after a regional performance issue surfaced.",
    call_transcript:
      "This was not urgent a month ago, but after the quarter close we need faster territory visibility and better lead prioritization.",
    speaking_speed: 147,
    average_pause_duration: 1.05,
    voice_sentiment_score: 0.24,
    hesitation_score: 0.22,
    historical_outcome: "converted",
    owner: "team-charlie",
    segment: "mid-market",
    installed_crm: "HubSpot",
    compliance_tier: "standard",
    base_score: 0.5,
    multimodal_score: 0.55,
    score_band: "C",
    confidence: 0.75,
    recommended_action: "AI outbound call",
    recommended_time_window: "within 48 hours with a retail-ops playbook",
    explanation:
      "Orbit Retail Labs converted from a low-confidence starting position after urgency rose late in the cycle. It is another useful low-score win for the learning loop.",
    risk_flags: [],
    top_feature_reasons: [
      "Initial profile and engagement looked mid-tier, which kept the score low.",
      "Text and call context revealed a new urgency event tied to regional performance pressure.",
      "Behavior accelerated sharply after the urgency signal emerged."
    ],
    text_summary:
      "Text intent shifted from exploratory to urgent once performance reporting issues became visible.",
    voice_summary:
      "Voice sentiment improved over time and remained low-hesitation once the buyer named the business problem.",
    behavior_summary:
      "Behavior changed materially after the quarter close, suggesting the original score underweighted timing signals.",
    strategy_summary:
      "A lower-cost AI-first motion remained appropriate, but this cohort should be reviewed for hidden urgency patterns.",
    similar_case_focus:
      "Retail opportunities with sudden post-quarter urgency often convert despite softer historical engagement metrics.",
    feedback_reason:
      "Observed opportunity progressed to signed deal after urgency increased and the proof path was simplified.",
    behavior_events: [
      event(19, 1, "lead_created", "partner", "Marketplace referral created."),
      event(15, 1, "email_opened", "email", "Initial outreach opened."),
      event(9, 2, "reactivated", "crm", "Urgency increased after quarter close."),
      event(6, 1, "call_connected", "phone", "Retail-ops evaluation call completed."),
      event(2, 1, "appointment_booked", "calendar", "Pilot kickoff booked.")
    ],
    created_at: iso(20),
    updated_at: iso(2)
  },
  {
    id: 11,
    full_name: "Hannah Cole",
    company_name: "Summit Advisory Group",
    email: "hannah.cole@summitadvisory.com",
    phone: "+1-704-555-0111",
    title: "Managing Director, Growth Operations",
    industry: "Professional Services",
    region: "North Carolina",
    source_channel: "webinar",
    lifecycle_stage: "proposal",
    current_status: "closed_lost",
    annual_revenue_band: "$50M-$100M",
    employee_count: 480,
    budget_estimate: 68000,
    engagement_score: 0.8,
    product_fit_score: 0.82,
    website_visits: 15,
    email_open_rate: 0.64,
    crm_notes:
      "The account engaged deeply with the operating model, but change-management concerns grew after the first proposal review.",
    call_transcript:
      "The analytics are compelling, but I am not sure our regional leaders are ready for the workflow change this quarter.",
    speaking_speed: 142,
    average_pause_duration: 1.4,
    voice_sentiment_score: 0.09,
    hesitation_score: 0.33,
    historical_outcome: "not_converted",
    owner: "team-bravo",
    segment: "mid-market",
    installed_crm: "Salesforce",
    compliance_tier: "standard",
    base_score: 0.74,
    multimodal_score: 0.73,
    score_band: "A",
    confidence: 0.8,
    recommended_action: "normal human call",
    recommended_time_window: "within 24 hours with a change-management angle",
    explanation:
      "Summit Advisory Group looked like a strong A-band candidate, but behavioral and voice signals increasingly pointed to rollout resistance inside the field organization.",
    risk_flags: ["change_management_risk"],
    top_feature_reasons: [
      "Strong webinar and proposal engagement kept the lead in the A band.",
      "Voice and transcript review surfaced adoption hesitation across regional leaders.",
      "The final decision carried more organizational risk than the structured model captured."
    ],
    text_summary:
      "Text and proposal feedback indicate interest in value, but clear friction around internal rollout readiness.",
    voice_summary:
      "Voice analysis suggests polite interest paired with real hesitation about field adoption.",
    behavior_summary:
      "Behavior stayed active until the proposal review and then flattened quickly.",
    strategy_summary:
      "Use human follow-up, but introduce a change-management proof plan before further commercial pressure.",
    similar_case_focus:
      "Professional-services buyers with rollout resistance often require an adoption plan before commercial timing can resume.",
    feedback_reason:
      "Account stalled after internal change-management concerns outweighed the value case.",
    behavior_events: [
      event(18, 1, "lead_created", "webinar", "Webinar conversion routed to account team."),
      event(14, 1, "call_connected", "phone", "Discovery call with growth operations."),
      event(9, 2, "demo_attended", "video", "Proposal-oriented demo attended."),
      event(6, 1, "proposal_requested", "email", "Commercial proposal requested."),
      event(2, 2, "deal_stalled", "crm", "Regional leadership expressed rollout concerns.")
    ],
    created_at: iso(19),
    updated_at: iso(2)
  },
  {
    id: 12,
    full_name: "Chloe Singh",
    company_name: "Redwood Freight Systems",
    email: "chloe.singh@redwoodfreight.com",
    phone: "+1-519-555-0112",
    title: "Chief Commercial Officer",
    industry: "Logistics",
    region: "Ontario",
    source_channel: "inbound demo",
    lifecycle_stage: "evaluation",
    current_status: "closed_lost",
    annual_revenue_band: "$100M-$250M",
    employee_count: 980,
    budget_estimate: 97000,
    engagement_score: 0.89,
    product_fit_score: 0.9,
    website_visits: 22,
    email_open_rate: 0.76,
    crm_notes:
      "Commercial pain is real and multiple executives were engaged, but a board-level cost freeze interrupted the buying motion after the demo.",
    call_transcript:
      "This is a top priority operationally, but our board just froze new spend until the second half of the year.",
    speaking_speed: 146,
    average_pause_duration: 1.2,
    voice_sentiment_score: 0.15,
    hesitation_score: 0.27,
    historical_outcome: "not_converted",
    owner: "team-delta",
    segment: "enterprise",
    installed_crm: "Salesforce",
    compliance_tier: "standard",
    base_score: 0.84,
    multimodal_score: 0.86,
    score_band: "S",
    confidence: 0.85,
    recommended_action: "senior human call",
    recommended_time_window: "immediately if budget governance changes",
    explanation:
      "Redwood Freight Systems remains strategically attractive, but the close signal was interrupted by a non-product budget freeze. It is a high-score miss that should stay visible in the learning loop.",
    risk_flags: ["budget_freeze"],
    top_feature_reasons: [
      "Executive engagement and product fit were both exceptionally strong.",
      "Behavioral momentum was excellent until a macro budget event intervened.",
      "The loss reason was financial governance rather than buyer indifference."
    ],
    text_summary:
      "Text signals show a high-intent buyer whose commercial motion was disrupted by a board-level budget decision.",
    voice_summary:
      "Voice sentiment remained constructive, though certainty dropped once budget governance was mentioned.",
    behavior_summary:
      "Behavior moved like a late-stage opportunity until the spend freeze stopped calendar progression.",
    strategy_summary:
      "Keep the account in executive visibility and reactivate quickly if financial controls loosen.",
    similar_case_focus:
      "High-fit logistics accounts disrupted by budget freezes often re-open faster than standard closed-lost deals.",
    feedback_reason:
      "Account was paused by a board-level cost freeze despite strong operational fit.",
    behavior_events: [
      event(16, 1, "lead_created", "web", "Inbound enterprise demo request."),
      event(12, 2, "call_connected", "phone", "Commercial discovery completed."),
      event(8, 1, "demo_attended", "video", "Executive logistics demo attended."),
      event(5, 1, "proposal_requested", "email", "Commercial package requested."),
      event(2, 1, "deal_stalled", "crm", "Board initiated temporary spend freeze.")
    ],
    created_at: iso(17),
    updated_at: iso(2)
  },
  {
    id: 13,
    full_name: "Priya Nair",
    company_name: "Meridian Banking Partners",
    email: "priya.nair@meridianbanking.com",
    phone: "+1-212-555-0113",
    title: "SVP Revenue Transformation",
    industry: "Financial Services",
    region: "New York",
    source_channel: "inbound demo",
    lifecycle_stage: "evaluation",
    current_status: "open",
    annual_revenue_band: "$500M+",
    employee_count: 3100,
    budget_estimate: 210000,
    engagement_score: 0.83,
    product_fit_score: 0.91,
    website_visits: 18,
    email_open_rate: 0.71,
    crm_notes:
      "The transformation office is aligned on value, and the next gate is architecture review plus data-residency confirmation.",
    call_transcript:
      "We are moving through architecture review now. Assuming data residency is clean, we can take this to the steering committee quickly.",
    speaking_speed: 144,
    average_pause_duration: 0.88,
    voice_sentiment_score: 0.46,
    hesitation_score: 0.14,
    historical_outcome: null,
    owner: "team-alpha",
    segment: "enterprise",
    installed_crm: "Salesforce Financial Services Cloud",
    compliance_tier: "sox",
    base_score: 0.76,
    multimodal_score: 0.75,
    score_band: "A",
    confidence: 0.86,
    recommended_action: "normal human call",
    recommended_time_window: "inside the next business day while architecture review is live",
    explanation:
      "Meridian Banking Partners is a healthy open A-band opportunity. The buyer is operationally aligned and now moving through architecture review, so direct seller attention remains justified.",
    risk_flags: ["data_residency_review"],
    top_feature_reasons: [
      "Large account size and transformation sponsorship create strong commercial upside.",
      "Architecture and data-governance review are the main friction points rather than buyer intent.",
      "Call sentiment remained positive and decisive."
    ],
    text_summary:
      "Text channels show clear committee progress and a buyer who is organizing the final approval path.",
    voice_summary:
      "Voice review indicates measured confidence with minimal hesitation during governance discussion.",
    behavior_summary:
      "Behavior remains synchronized across the operating buyer, architecture team, and steering committee milestones.",
    strategy_summary:
      "Keep a human-led motion and add technical assurance to accelerate committee approval.",
    similar_case_focus:
      "Banking transformations convert best when architecture assurance is packaged alongside executive proof points.",
    behavior_events: [
      event(12, 1, "lead_created", "web", "Inbound financial-services demo request."),
      event(9, 2, "call_connected", "phone", "Transformation office discovery completed."),
      event(6, 1, "demo_attended", "video", "Operating model demo attended."),
      event(3, 1, "security_review_started", "email", "Data residency packet requested."),
      event(1, 1, "appointment_booked", "calendar", "Architecture review booked.")
    ],
    created_at: iso(13),
    updated_at: iso(1)
  }
];

function determineBand(score: number, thresholds: SimulationRequest["thresholds"]): string {
  if (score >= thresholds.s) {
    return "S";
  }
  if (score >= thresholds.a) {
    return "A";
  }
  if (score >= thresholds.b) {
    return "B";
  }
  if (score >= thresholds.c) {
    return "C";
  }
  return "D";
}

function actionForBand(
  band: string,
  rules: SimulationRequest["action_rules"]
): string {
  const mapping: Record<string, string> = {
    S: rules.s_band_action,
    A: rules.a_band_action,
    B: rules.b_band_action,
    C: rules.c_band_action,
    D: rules.d_band_action
  };
  return mapping[band];
}

function createLeadListItem(lead: DemoLeadScenario): LeadListItem {
  return {
    id: lead.id,
    full_name: lead.full_name,
    company_name: lead.company_name,
    industry: lead.industry,
    source_channel: lead.source_channel,
    current_status: lead.current_status,
    historical_outcome: lead.historical_outcome,
    latest_score_band: lead.score_band,
    latest_multimodal_score: lead.multimodal_score,
    latest_action: lead.recommended_action,
    latest_confidence: lead.confidence,
    created_at: lead.created_at,
    updated_at: lead.updated_at
  };
}

function createFeedbackHistory(lead: DemoLeadScenario): FeedbackRecord[] {
  if (!lead.historical_outcome) {
    return [];
  }

  return [
    {
      id: 7000 + lead.id,
      lead_id: lead.id,
      outcome: lead.historical_outcome,
      reason:
        lead.feedback_reason ??
        "Observed outcome was captured by the frontline team during the post-evaluation review.",
      conversion_value:
        lead.historical_outcome === "converted" ? Math.round(lead.budget_estimate * 1.28) : null,
      observed_action: lead.recommended_action,
      observed_band: lead.score_band,
      salesperson_feedback:
        lead.historical_outcome === "converted"
          ? "Field feedback aligned with the operating recommendation."
          : "Commercial friction was higher than the initial score suggested.",
      created_at: iso(2, lead.id % 4)
    }
  ];
}

function createSimilarCases(lead: DemoLeadScenario): SimilarCaseSummary[] {
  return demoLeads
    .filter(
      (candidate) =>
        candidate.id !== lead.id &&
        candidate.historical_outcome === "converted"
    )
    .sort((left, right) => {
      const leftMatch =
        Number(left.industry === lead.industry) * 2 +
        Number(left.segment === lead.segment);
      const rightMatch =
        Number(right.industry === lead.industry) * 2 +
        Number(right.segment === lead.segment);
      return rightMatch - leftMatch;
    })
    .slice(0, 3)
    .map((candidate, index) => {
      const similarity = clamp(
        0.71 +
          (candidate.industry === lead.industry ? 0.12 : 0) +
          (candidate.segment === lead.segment ? 0.06 : 0) -
          index * 0.03,
        0.68,
        0.94
      );

      return {
        lead_id: candidate.id,
        company_name: candidate.company_name,
        industry: candidate.industry,
        score_band: candidate.score_band,
        outcome: "converted",
        recommended_action: candidate.recommended_action,
        similarity_score: Number(similarity.toFixed(2)),
        summary: `${candidate.company_name} converted after a ${candidate.recommended_action.toLowerCase()} motion with strong stakeholder alignment and a clearly defined next milestone.`
      };
    });
}

function roundMetric(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function hasRiskFlag(lead: DemoLeadScenario, token: string): boolean {
  return lead.risk_flags.some((flag) => flag.includes(token));
}

function createFeatureContributions(lead: DemoLeadScenario): FeatureContribution[] {
  const urgencySignal = /(urgent|deadline|quarter|timeline|enrollment|rollout)/i.test(
    `${lead.crm_notes} ${lead.call_transcript} ${lead.text_summary}`
  );

  return [
    {
      feature_name: "Product-fit alignment",
      contribution: roundMetric(lead.product_fit_score * 0.24),
      direction: "positive",
      explanation:
        "The account profile maps well to the platform's operating model, which sustains the structured score."
    },
    {
      feature_name: "Commercial engagement depth",
      contribution: roundMetric(lead.engagement_score * 0.21),
      direction: "positive",
      explanation:
        "Digital engagement, seller interaction density, and follow-up quality all support near-term conversion intent."
    },
    {
      feature_name: "Urgency and buying timeline",
      contribution: urgencySignal ? 0.08 : 0.02,
      direction: "positive",
      explanation:
        "Deadline language and execution pressure create measurable lift when the account is tied to a concrete milestone."
    },
    {
      feature_name: "Voice conviction",
      contribution: roundMetric((lead.voice_sentiment_score - lead.hesitation_score * 0.45) * 0.14),
      direction: lead.voice_sentiment_score >= 0 ? "positive" : "negative",
      explanation:
        "Call delivery and hesitation are used as a confidence modifier on top of the structured thesis."
    },
    {
      feature_name: "Governance and budget friction",
      contribution: roundMetric(
        (hasRiskFlag(lead, "budget") || hasRiskFlag(lead, "review") || hasRiskFlag(lead, "legal")
          ? -0.09
          : -0.03) - (lead.compliance_tier === "high" ? 0.02 : 0)
      ),
      direction: "negative",
      explanation:
        "Late-stage budget, legal, or security review pressure can reduce conversion readiness even for strong-fit accounts."
    }
  ].sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution));
}

function createGovernanceNotes(lead: DemoLeadScenario): string[] {
  const notes = [
    `${lead.compliance_tier.toUpperCase()} compliance tier requires explainable routing and auditable next-action rationale.`,
    `Installed CRM context is ${lead.installed_crm}, so any seller-facing recommendation should remain exportable into the commercial system of record.`
  ];

  if (hasRiskFlag(lead, "review") || hasRiskFlag(lead, "legal") || hasRiskFlag(lead, "security")) {
    notes.push(
      "Governance-sensitive review signals are present, so recommended actions should preserve escalation evidence for sales leadership and RevOps."
    );
  }

  if (hasRiskFlag(lead, "budget") || hasRiskFlag(lead, "price")) {
    notes.push(
      "Commercial pressure signals suggest the account should be monitored for threshold drift before expanding top-band routing criteria."
    );
  }

  return notes;
}

function createReasoningTrace(
  lead: DemoLeadScenario,
  similarCases: SimilarCaseSummary[]
): AgentSignal[] {
  const latestEvent = lead.behavior_events[lead.behavior_events.length - 1];
  const behaviorMomentum = lead.behavior_events.length >= 5 ? "stable" : "developing";
  const featureContributions = createFeatureContributions(lead);

  return [
    {
      agent_name: "SupervisorAgent",
      input_signals: {
        structured_score: lead.base_score,
        multimodal_score: lead.multimodal_score,
        score_band: lead.score_band,
        specialist_agents: 7,
        open_risk_flags: lead.risk_flags
      },
      reasoning_summary:
        "The supervisor fused structured, behavioral, voice, text, and historical analog signals into a single decision package with audit-ready evidence.",
      confidence: roundMetric(Math.min(0.98, lead.confidence + 0.01)),
      contribution: roundMetric(lead.multimodal_score - lead.base_score),
      risk_flags: lead.risk_flags.slice(0, 3),
      action_implication:
        "Preserve the current recommended action while surfacing the leading friction signals for seller review.",
      latency_ms: 15 + lead.id,
      output_signals: {
        recommended_action: lead.recommended_action,
        recommended_time_window: lead.recommended_time_window,
        dominant_driver: featureContributions[0]?.feature_name ?? "multimodal fusion"
      }
    },
    {
      agent_name: "StructuredScoringAgent",
      input_signals: {
        segment: lead.segment,
        engagement_score: lead.engagement_score,
        product_fit_score: lead.product_fit_score,
        budget_estimate: lead.budget_estimate
      },
      reasoning_summary:
        "Structured fit remains strong because account scale, solution fit, and engagement depth align with historically successful opportunities.",
      confidence: roundMetric(lead.confidence - 0.03),
      contribution: roundMetric(lead.base_score - 0.52),
      risk_flags:
        hasRiskFlag(lead, "budget") ? ["budget_watchlist"] : [],
      action_implication:
        "Keep the account in the current commercial band unless new governance friction materially alters the economics.",
      latency_ms: 23 + lead.id,
      output_signals: {
        base_score: lead.base_score,
        score_band: lead.score_band,
        top_features: featureContributions.slice(0, 2).map((item) => item.feature_name)
      }
    },
    {
      agent_name: "TextIntentAgent",
      input_signals: {
        source_channel: lead.source_channel,
        crm_notes_excerpt: lead.crm_notes.slice(0, 180),
        transcript_excerpt: lead.call_transcript.slice(0, 180)
      },
      reasoning_summary: lead.text_summary,
      confidence: roundMetric(lead.confidence - 0.01),
      contribution: hasRiskFlag(lead, "price") ? -0.04 : 0.05,
      risk_flags: lead.risk_flags.filter((flag) =>
        ["price_sensitivity", "change_management_risk", "budget_freeze"].includes(flag)
      ),
      action_implication:
        "Weight seller messaging toward the stated business case, urgency, and objection handling cues extracted from notes and transcript text.",
      latency_ms: 31 + lead.id,
      output_signals: {
        dominant_theme: lead.recommended_action,
        extracted_intent: lead.text_summary,
        buying_stage: lead.lifecycle_stage
      }
    },
    {
      agent_name: "VoiceEmotionAgent",
      input_signals: {
        speaking_speed: lead.speaking_speed,
        average_pause_duration: lead.average_pause_duration,
        voice_sentiment_score: lead.voice_sentiment_score,
        hesitation_score: lead.hesitation_score
      },
      reasoning_summary: lead.voice_summary,
      confidence: roundMetric(lead.confidence - 0.02),
      contribution:
        lead.voice_sentiment_score >= 0.3
          ? 0.04
          : lead.voice_sentiment_score >= 0
            ? 0.01
            : -0.05,
      risk_flags: lead.hesitation_score > 0.3 ? ["hesitation_detected"] : [],
      action_implication:
        "Use voice conviction to calibrate outreach intensity and determine whether the account needs reassurance, proof, or urgency reinforcement.",
      latency_ms: 35 + lead.id,
      output_signals: {
        concern_level: lead.hesitation_score > 0.3 ? "elevated" : "contained",
        voice_sentiment_score: lead.voice_sentiment_score,
        follow_up_tone: lead.voice_sentiment_score >= 0 ? "commercial confidence" : "risk-mitigating reassurance"
      }
    },
    {
      agent_name: "BehaviorSequenceAgent",
      input_signals: {
        latest_event: latestEvent?.event_type ?? "unknown",
        event_count: lead.behavior_events.length,
        current_status: lead.current_status
      },
      reasoning_summary: lead.behavior_summary,
      confidence: roundMetric(lead.confidence - 0.02),
      contribution:
        lead.current_status === "open"
          ? 0.03
          : lead.historical_outcome === "converted"
            ? 0.05
            : -0.02,
      risk_flags:
        latestEvent?.event_type === "deal_stalled" ? ["stalled_motion"] : [],
      action_implication:
        "Sequence momentum informs whether the next touch should accelerate, preserve, or de-risk the active motion.",
      latency_ms: 27 + lead.id,
      output_signals: {
        momentum: behaviorMomentum,
        latest_event: latestEvent?.event_type ?? "unknown",
        recommended_action: lead.recommended_action
      }
    },
    {
      agent_name: "SimilarCaseAgent",
      input_signals: {
        industry: lead.industry,
        segment: lead.segment,
        comparison_pool_size: similarCases.length
      },
      reasoning_summary: lead.similar_case_focus,
      confidence: roundMetric(lead.confidence - 0.01),
      contribution: similarCases.length ? 0.03 : 0,
      risk_flags: [],
      action_implication:
        "Use converted analogs to sharpen the seller playbook and benchmark whether the account should stay in the current route.",
      latency_ms: 29 + lead.id,
      output_signals: {
        similar_case_count: similarCases.length,
        top_match: similarCases[0]?.company_name ?? "none",
        top_similarity: similarCases[0]?.similarity_score ?? 0
      }
    },
    {
      agent_name: "StrategyAgent",
      input_signals: {
        score_band: lead.score_band,
        current_status: lead.current_status,
        risk_flags: lead.risk_flags
      },
      reasoning_summary: lead.strategy_summary,
      confidence: lead.confidence,
      contribution: 0.02,
      risk_flags: lead.risk_flags.slice(0, 2),
      action_implication:
        "Translate the fused decision into a concrete route, owner expectation, and time window for execution.",
      latency_ms: 18 + lead.id,
      output_signals: {
        recommended_action: lead.recommended_action,
        recommended_time_window: lead.recommended_time_window
      }
    },
    {
      agent_name: "ExplanationAgent",
      input_signals: {
        company_name: lead.company_name,
        score_band: lead.score_band,
        risk_flags: lead.risk_flags
      },
      reasoning_summary:
        "Prepared a business-readable rationale that ties model evidence, operating risk, and next-step guidance into one seller-ready narrative.",
      confidence: roundMetric(Math.min(0.98, lead.confidence + 0.01)),
      contribution: 0,
      risk_flags: [],
      action_implication:
        "Provide leadership, RevOps, and sellers with a clear audit trail for why this recommendation should be trusted.",
      latency_ms: 16 + lead.id,
      output_signals: {
        explanation: lead.explanation,
        audience: "field leadership and frontline sellers"
      }
    }
  ];
}

function createLeadDetail(lead: DemoLeadScenario): LeadDetailResponse {
  const similarCases = createSimilarCases(lead);
  const reasoningTrace = createReasoningTrace(lead, similarCases);
  const featureContributions = createFeatureContributions(lead);
  const governanceNotes = createGovernanceNotes(lead);

  return {
    profile: {
      id: lead.id,
      full_name: lead.full_name,
      company_name: lead.company_name,
      email: lead.email,
      phone: lead.phone,
      title: lead.title,
      industry: lead.industry,
      region: lead.region,
      source_channel: lead.source_channel,
      lifecycle_stage: lead.lifecycle_stage,
      current_status: lead.current_status,
      annual_revenue_band: lead.annual_revenue_band,
      employee_count: lead.employee_count,
      budget_estimate: lead.budget_estimate,
      engagement_score: lead.engagement_score,
      product_fit_score: lead.product_fit_score,
      website_visits: lead.website_visits,
      email_open_rate: lead.email_open_rate,
      crm_notes: lead.crm_notes,
      call_transcript: lead.call_transcript,
      speaking_speed: lead.speaking_speed,
      average_pause_duration: lead.average_pause_duration,
      voice_sentiment_score: lead.voice_sentiment_score,
      hesitation_score: lead.hesitation_score,
      historical_outcome: lead.historical_outcome,
      metadata_json: {
        owner: lead.owner,
        segment: lead.segment,
        installed_crm: lead.installed_crm,
        compliance_tier: lead.compliance_tier
      },
      created_at: lead.created_at,
      updated_at: lead.updated_at
    },
    decision: {
      lead_id: lead.id,
      base_score: lead.base_score,
      multimodal_score: lead.multimodal_score,
      score_band: lead.score_band,
      confidence: lead.confidence,
      agent_signals: reasoningTrace,
      reasoning_trace: reasoningTrace,
      feature_contributions: featureContributions,
      recommended_action: lead.recommended_action,
      recommended_time_window: lead.recommended_time_window,
      explanation: lead.explanation,
      risk_flags: lead.risk_flags,
      governance_notes: governanceNotes,
      similar_cases: similarCases,
      top_feature_reasons: lead.top_feature_reasons,
      feedback_required: lead.historical_outcome == null,
      created_at: lead.updated_at
    },
    behavior_events: lead.behavior_events,
    feedback_history: createFeedbackHistory(lead)
  };
}

const demoLeadMap = new Map<number, DemoLeadScenario>(
  demoLeads.map((lead) => [lead.id, lead])
);

const healthResponse: ApiHealthResponse = {
  status: "demo-fallback",
  app_name: "Multimodal Lead Intelligence Agent Platform",
  api_prefix: "/api",
  backend_url: "http://127.0.0.1:8000",
  database_url: "sqlite:///./lead_intelligence.db",
  seeded_demo_mode: true,
  checked_at: iso(0)
};

const dashboardSummary: DashboardSummaryResponse = {
  total_leads_scored: 486,
  open_leads: 138,
  converted_leads: 92,
  score_distribution: [
    { band: "S", count: 58, conversion_rate: 0.72 },
    { band: "A", count: 104, conversion_rate: 0.51 },
    { band: "B", count: 136, conversion_rate: 0.29 },
    { band: "C", count: 119, conversion_rate: 0.14 },
    { band: "D", count: 69, conversion_rate: 0.04 }
  ],
  action_breakdown: [
    { action: "senior human call", count: 64, avg_conversion_rate: 0.69 },
    { action: "normal human call", count: 118, avg_conversion_rate: 0.48 },
    { action: "AI outbound call", count: 134, avg_conversion_rate: 0.24 },
    { action: "delayed follow-up", count: 101, avg_conversion_rate: 0.12 },
    { action: "nurture pool", count: 69, avg_conversion_rate: 0.04 }
  ],
  confidence_summary: {
    average_confidence: 0.81,
    high_confidence_share: 0.47,
    low_confidence_share: 0.13
  },
  feedback_loop_status: {
    total_feedback_records: 117,
    high_score_non_converted: 9,
    low_score_converted: 4,
    drift_warnings: [
      "High-priority financial and logistics cohorts are showing elevated price and governance attrition.",
      "A small but rising set of lower-score wins suggests hidden urgency in budget-sensitive accounts."
    ],
    threshold_change_suggestions: [
      {
        title: "Tighten A-band routing for pricing-sensitive enterprises",
        description:
          "Raise the A-band cut line for governance-heavy enterprise accounts unless a validated budget signal is present.",
        impact: "Reduces expensive seller time spent on over-scored, low-converting enterprise opportunities."
      },
      {
        title: "Review low-score urgency triggers",
        description:
          "Promote recent reactivation and deadline language as stronger uplift signals in the learning loop.",
        impact: "Captures non-obvious opportunities that are converting after urgency emerges mid-cycle."
      }
    ]
  }
};

const agentStatus: AgentStatusResponse = {
  supervisor_status: "healthy - live orchestration and audit packaging available",
  agents: [
    {
      agent_name: "SupervisorAgent",
      status: "healthy",
      description: "Supervisor-level multimodal fusion, exception handling, and audit package assembly.",
      avg_latency_ms: 19.8,
      avg_confidence: 0.88,
      last_output_preview: { score_band: "A", recommended_action: "normal human call" },
      last_reasoning_summary:
        "Fused structured, voice, text, behavior, and analog signals into an execution-ready recommendation.",
      last_action_implication:
        "Keep the lead in the current route while elevating budget and governance watchpoints."
    },
    {
      agent_name: "StructuredScoringAgent",
      status: "healthy",
      description: "Structured model wrapper with feature attribution.",
      avg_latency_ms: 24.2,
      avg_confidence: 0.86,
      last_output_preview: { score_band: "A", top_driver: "product_fit_score" },
      last_reasoning_summary:
        "Account fit, engagement depth, and revenue profile continue to support premium routing.",
      last_action_implication:
        "Maintain structured prioritization unless new friction emerges in budget or governance."
    },
    {
      agent_name: "TextIntentAgent",
      status: "healthy",
      description: "CRM note and transcript understanding.",
      avg_latency_ms: 34.7,
      avg_confidence: 0.81,
      last_output_preview: { dominant_theme: "pricing objection", uplift: "timing urgency" },
      last_reasoning_summary:
        "Detected urgency language but also identified procurement and pricing pressure in the latest notes.",
      last_action_implication:
        "Frame the next touch around economic value proof and timeline certainty."
    },
    {
      agent_name: "VoiceEmotionAgent",
      status: "healthy",
      description: "Voice-derived confidence and escalation analysis.",
      avg_latency_ms: 37.9,
      avg_confidence: 0.79,
      last_output_preview: { concern_level: "contained", hesitation_score: 0.18 },
      last_reasoning_summary:
        "Voice conviction remains net positive, with mild hesitation isolated to rollout complexity questions.",
      last_action_implication:
        "Use a confident but proof-oriented follow-up tone rather than a high-pressure escalation."
    },
    {
      agent_name: "BehaviorSequenceAgent",
      status: "healthy",
      description: "Timeline-based momentum and sequence interpretation.",
      avg_latency_ms: 29.8,
      avg_confidence: 0.8,
      last_output_preview: { momentum: "stable", latest_event: "proposal_requested" },
      last_reasoning_summary:
        "The behavioral sequence shows steady progression with no evidence of queue decay.",
      last_action_implication:
        "Preserve cadence and keep the next milestone inside the recommended time window."
    },
    {
      agent_name: "SimilarCaseAgent",
      status: "healthy",
      description: "Historical analog retrieval for conversion patterns.",
      avg_latency_ms: 31.6,
      avg_confidence: 0.78,
      last_output_preview: { matches: 3, top_match: "Northbridge Health" },
      last_reasoning_summary:
        "Comparable converted accounts point to value in keeping the playbook anchored to stakeholder alignment and proof of rollout readiness.",
      last_action_implication:
        "Use similar-case evidence to strengthen seller confidence and executive sponsorship."
    },
    {
      agent_name: "StrategyAgent",
      status: "healthy",
      description: "Action routing and next-step policy selection.",
      avg_latency_ms: 19.4,
      avg_confidence: 0.83,
      last_output_preview: { recommended_action: "normal human call", time_window: "24 hours" },
      last_reasoning_summary:
        "The current operating policy favors seller-led follow-up with targeted objection handling.",
      last_action_implication:
        "Keep the account in the present route and monitor whether capacity pressure warrants AI-first overflow."
    },
    {
      agent_name: "ExplanationAgent",
      status: "healthy",
      description: "Business-readable narrative generation for sales and leadership.",
      avg_latency_ms: 17.8,
      avg_confidence: 0.84,
      last_output_preview: { summary_ready: true, audience: "field + leadership" },
      last_reasoning_summary:
        "A concise executive-ready rationale is available for field sellers, RevOps, and governance reviewers.",
      last_action_implication:
        "Use the explanation package as the seller-facing audit trail for this recommendation."
    },
    {
      agent_name: "FeedbackLearningAgent",
      status: "degraded-watch",
      description: "Closed-loop drift detection and threshold recommendation engine.",
      avg_latency_ms: 42.1,
      avg_confidence: 0.76,
      last_output_preview: { drift_warning_count: 2, suggested_action: "tighten A-band routing" },
      last_reasoning_summary:
        "Recent feedback shows a small concentration of high-score misses in governance-heavy enterprise motions.",
      last_action_implication:
        "Tighten A-band routing for objection-heavy enterprise accounts while widening urgency-sensitive B-band coverage."
    }
  ]
};

function buildLeadInsightSummary(leadId: number, note: string): LeadInsightSummary {
  const lead = getLeadScenario(leadId);
  return {
    lead_id: lead.id,
    company_name: lead.company_name,
    full_name: lead.full_name,
    current_status: lead.current_status,
    score_band: lead.score_band,
    multimodal_score: lead.multimodal_score,
    note
  };
}

function buildRetrainingCandidateSample(
  leadId: number,
  reason: string,
  recommendedLabel: string
): RetrainingCandidateSample {
  const lead = getLeadScenario(leadId);
  return {
    lead_id: lead.id,
    company_name: lead.company_name,
    reason,
    recommended_label: recommendedLabel
  };
}

const strategyPerformance: StrategyPerformanceResponse = {
  action_performance: [
    {
      action: "senior human call",
      recommendation_count: 64,
      converted_count: 44,
      conversion_rate: 0.69
    },
    {
      action: "normal human call",
      recommendation_count: 118,
      converted_count: 57,
      conversion_rate: 0.48
    },
    {
      action: "AI outbound call",
      recommendation_count: 134,
      converted_count: 35,
      conversion_rate: 0.26
    },
    {
      action: "delayed follow-up",
      recommendation_count: 101,
      converted_count: 12,
      conversion_rate: 0.12
    },
    {
      action: "nurture pool",
      recommendation_count: 69,
      converted_count: 3,
      conversion_rate: 0.04
    }
  ],
  score_band_performance: [
    { band: "S", count: 58, conversion_rate: 0.72 },
    { band: "A", count: 104, conversion_rate: 0.51 },
    { band: "B", count: 136, conversion_rate: 0.29 },
    { band: "C", count: 119, conversion_rate: 0.14 },
    { band: "D", count: 69, conversion_rate: 0.04 }
  ],
  drift_warnings: [
    "False positives are accumulating in governance-heavy A-band opportunities where pricing and rollout friction emerges late.",
    "A small but material group of C-band wins now share reactivation and deadline language that the base model is underweighting."
  ],
  threshold_change_suggestions: [
    {
      title: "Tighten A-band routing",
      description:
        "Raise the A-band threshold by 0.02 for enterprise accounts with price objection or legal review signals before assigning direct seller priority.",
      impact: "Protects senior seller capacity while preserving top-tier S-band coverage."
    },
    {
      title: "Expand B-band catchment for urgency-reactivated leads",
      description:
        "Promote reactivated leads with explicit deadline language into the B band even when historical engagement is modest.",
      impact: "Captures hidden upside in time-sensitive education, retail, and partner-sourced cohorts."
    },
    {
      title: "Promote AI-first mid-band coverage",
      description:
        "AI outbound call is outperforming standard human outreach in stable mid-band segments that need benchmark proof more than deal strategy.",
      impact: "Improves capacity efficiency without compressing projected conversions."
    }
  ],
  retraining_candidates: [3, 11, 12, 4, 10],
  high_score_non_converted_leads: [3, 11, 12],
  low_score_converted_leads: [4, 10],
  executive_summary:
    "The current strategy is healthy overall, but it is over-prioritizing some governance-heavy enterprise accounts and under-reading urgency shifts in a small set of lower-score wins.",
  learned_patterns: [
    "Healthcare and medical-device accounts convert at higher rates when multimodal urgency cues are paired with a seller-led action inside 24 hours.",
    "Manufacturing and logistics accounts tolerate AI-first outreach well in the B band when the pitch emphasizes rollout efficiency rather than feature depth.",
    "Financial-services and energy opportunities show elevated false-positive risk when governance review begins before pricing alignment is secured."
  ],
  governance_notes: [
    "Threshold changes should remain explainable by industry, band, and risk-flag cohort before being promoted into default routing policy.",
    "Retraining candidates include both misses and surprising wins so model updates preserve upside without masking compliance-sensitive failure modes."
  ],
  high_score_non_converted_details: [
    buildLeadInsightSummary(
      3,
      "A-band score held up on engagement, but pricing sensitivity and legal drag surfaced too late."
    ),
    buildLeadInsightSummary(
      11,
      "Proposal-stage engagement looked healthy, yet internal rollout resistance materially reduced conversion readiness."
    ),
    buildLeadInsightSummary(
      12,
      "Operational urgency was genuine, but a board-level spend freeze broke the commercial path."
    )
  ],
  low_score_converted_details: [
    buildLeadInsightSummary(
      4,
      "The original score missed an urgency spike tied to enrollment pressure and a fast phased rollout."
    ),
    buildLeadInsightSummary(
      10,
      "Quarter-close pressure changed the account from exploratory to urgent after the initial score was assigned."
    )
  ],
  retraining_candidate_samples: [
    buildRetrainingCandidateSample(
      3,
      "High-score miss with late-stage pricing and legal friction that should become a stronger down-weight signal.",
      "Review as likely A-to-B reassignment"
    ),
    buildRetrainingCandidateSample(
      12,
      "High-fit opportunity lost for macro budget reasons; keep as a separate budget-freeze cohort rather than a generic false positive.",
      "Tag as external-budget-risk"
    ),
    buildRetrainingCandidateSample(
      4,
      "Converted despite a C-band score because urgency emerged after reactivation.",
      "Review as likely B-band uplift"
    ),
    buildRetrainingCandidateSample(
      10,
      "Converted after a late urgency event that was underweighted by the base profile.",
      "Promote urgency-reactivated pattern"
    )
  ]
};

function getLeadScenario(leadId: number): DemoLeadScenario {
  return demoLeadMap.get(leadId) ?? demoLeads[0];
}

function getDemoLeads(searchParams: URLSearchParams): LeadListItem[] {
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const scoreBand = searchParams.get("score_band")?.trim().toUpperCase() ?? "";
  const status = searchParams.get("status")?.trim().toLowerCase() ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const filtered = demoLeads.filter((lead) => {
    const matchesQuery =
      !query ||
      lead.full_name.toLowerCase().includes(query) ||
      lead.company_name.toLowerCase().includes(query) ||
      lead.industry.toLowerCase().includes(query);
    const matchesBand = !scoreBand || lead.score_band === scoreBand;
    const matchesStatus = !status || lead.current_status.toLowerCase() === status;
    return matchesQuery && matchesBand && matchesStatus;
  });

  const items = filtered.map(createLeadListItem);
  return typeof limit === "number" && Number.isFinite(limit) ? items.slice(0, limit) : items;
}

function simulate(
  thresholds: SimulationRequest["thresholds"],
  actionRules: SimulationRequest["action_rules"],
  humanCapacityLimit: number,
  aiCallCapacityLimit: number
) {
  let expectedConversions = 0;
  let humanCalls = 0;
  let aiCalls = 0;
  let nurturePool = 0;
  let weightedWorkload = 0;

  for (const cohort of simulationPortfolio) {
    const band = determineBand(cohort.score, thresholds);
    const action = actionForBand(band, actionRules);
    const multiplierMap: Record<string, number> = {
      "senior human call": 1.13,
      "normal human call": 1.05,
      "AI outbound call": 0.95,
      "delayed follow-up": 0.78,
      "nurture pool": 0.56,
      "do-not-contact review": 0.08
    };
    const multiplier = multiplierMap[action] ?? 0.56;
    const unitConversion = clamp(cohort.score * multiplier - cohort.risk_penalty, 0.02, 0.97);
    expectedConversions += unitConversion * cohort.volume;

    if (action === "senior human call" || action === "normal human call") {
      humanCalls += cohort.volume;
      weightedWorkload += cohort.volume * (action === "senior human call" ? 1.45 : 1.0);
      continue;
    }

    if (action === "AI outbound call") {
      aiCalls += cohort.volume;
      weightedWorkload += cohort.volume * 0.46;
      continue;
    }

    nurturePool += cohort.volume;
    weightedWorkload += cohort.volume * (action === "do-not-contact review" ? 0.1 : 0.22);
  }

  if (humanCalls > humanCapacityLimit) {
    expectedConversions -= (humanCalls - humanCapacityLimit) * 0.027;
  }

  if (aiCalls > aiCallCapacityLimit) {
    expectedConversions -= (aiCalls - aiCallCapacityLimit) * 0.012;
  }

  return {
    expected_conversions: Number(expectedConversions.toFixed(2)),
    human_calls: humanCalls,
    ai_calls: aiCalls,
    nurture_pool: nurturePool,
    weighted_workload: Number(weightedWorkload.toFixed(2))
  };
}

export function buildSimulationInsight(
  response: SimulationResponse,
  request: SimulationRequest
): SimulationOperationalInsight {
  const { current, proposed, delta_expected_conversions } = response.comparison;
  const expectedUplift =
    current.expected_conversions > 0
      ? delta_expected_conversions / current.expected_conversions
      : 0;

  let riskWarning =
    "Projected operating load stays inside the modeled capacity envelope.";
  if (proposed.human_calls > request.human_capacity_limit) {
    riskWarning = `Projected human-call volume exceeds stated capacity by ${proposed.human_calls - request.human_capacity_limit} touches, which may compress conversion quality late in the queue.`;
  } else if (proposed.ai_calls > request.ai_call_capacity_limit) {
    riskWarning = `Projected AI call volume exceeds stated capacity by ${proposed.ai_calls - request.ai_call_capacity_limit} calls, creating a risk of lower coverage quality or throttled execution.`;
  } else if (proposed.weighted_workload > current.weighted_workload * 1.12) {
    riskWarning =
      "Projected workload expands materially faster than expected conversions, so seller efficiency should be watched closely.";
  }

  let recommendedThresholdAdjustment =
    "Hold the current thresholds and monitor another feedback window before introducing a broader strategy change.";
  if (
    request.thresholds.a < DEFAULT_THRESHOLDS.a &&
    proposed.human_calls > request.human_capacity_limit
  ) {
    recommendedThresholdAdjustment =
      "Raise the A-band threshold by 0.02 and move the overflow into an AI-first B-band motion to reduce human saturation.";
  } else if (
    request.thresholds.b > DEFAULT_THRESHOLDS.b &&
    delta_expected_conversions < 0
  ) {
    recommendedThresholdAdjustment =
      "Lower the B-band threshold slightly or widen the AI outbound catchment to recover mid-band conversion coverage.";
  } else if (
    request.thresholds.c < DEFAULT_THRESHOLDS.c &&
    proposed.weighted_workload > current.weighted_workload
  ) {
    recommendedThresholdAdjustment =
      "Tighten the C-band threshold back toward 0.42 unless the added delayed-follow-up volume is producing measurable uplift.";
  }

  return {
    projected_conversions: proposed.expected_conversions,
    human_workload: proposed.human_calls,
    ai_call_workload: proposed.ai_calls,
    expected_uplift: Number(expectedUplift.toFixed(3)),
    conversion_delta: roundMetric(delta_expected_conversions),
    workload_delta: roundMetric(response.comparison.delta_weighted_workload),
    risk_warning: riskWarning,
    recommended_threshold_adjustment: recommendedThresholdAdjustment
  };
}

function buildSimulationResponse(payload: SimulationRequest): SimulationResponse {
  const current = simulate(
    DEFAULT_THRESHOLDS,
    DEFAULT_ACTION_RULES,
    DEFAULT_HUMAN_CAPACITY,
    DEFAULT_AI_CAPACITY
  );
  const proposed = simulate(
    payload.thresholds,
    payload.action_rules,
    payload.human_capacity_limit,
    payload.ai_call_capacity_limit
  );

  const comparison = {
    current,
    proposed,
    delta_expected_conversions: Number(
      (proposed.expected_conversions - current.expected_conversions).toFixed(2)
    ),
    delta_weighted_workload: Number(
      (proposed.weighted_workload - current.weighted_workload).toFixed(2)
    )
  };

  const responseBase = {
    comparison: {
      current: comparison.current,
      proposed: comparison.proposed,
      delta_expected_conversions: comparison.delta_expected_conversions,
      delta_weighted_workload: comparison.delta_weighted_workload
    },
    proposed_thresholds: payload.thresholds,
    proposed_rules: payload.action_rules,
    assumptions: [
      "Projected conversions are estimated from cohort score strength, routing effectiveness, and observed risk penalties.",
      "Human-priority overload reduces expected conversion quality once proposed volume exceeds declared capacity.",
      "AI outbound execution is modeled separately so threshold changes can shift work without hiding capacity pressure."
    ]
  };

  const response: SimulationResponse = {
    ...responseBase,
    operational_insight: {
      projected_conversions: proposed.expected_conversions,
      human_workload: proposed.human_calls,
      ai_call_workload: proposed.ai_calls,
      expected_uplift:
        current.expected_conversions > 0
          ? roundMetric(comparison.delta_expected_conversions / current.expected_conversions, 3)
          : 0,
      conversion_delta: comparison.delta_expected_conversions,
      workload_delta: comparison.delta_weighted_workload,
      risk_warning:
        proposed.human_calls > payload.human_capacity_limit
          ? `Human-priority routing exceeds stated seller capacity by ${proposed.human_calls - payload.human_capacity_limit} touches, creating queue compression risk in the proposed policy.`
          : proposed.ai_calls > payload.ai_call_capacity_limit
            ? `AI call volume exceeds the declared automation lane by ${proposed.ai_calls - payload.ai_call_capacity_limit} calls, which may dilute execution quality or require throttling.`
            : "Projected operating load remains inside the modeled capacity envelope for both human and AI execution lanes.",
      recommended_threshold_adjustment:
        comparison.delta_expected_conversions >= 0 && proposed.human_calls <= payload.human_capacity_limit
          ? "Preserve the proposed S and A thresholds, then tighten the B threshold only if feedback confirms mid-band saturation."
          : "Raise the A-band threshold by 0.01 to 0.02 or widen the AI-first B-band route so seller capacity is not consumed by objection-heavy enterprise traffic."
    },
    why_result:
      comparison.delta_expected_conversions >= 0
        ? "The proposed policy lifts projected conversions because it reallocates more of the near-threshold portfolio into actions with stronger historical close rates without breaching modeled capacity too severely."
        : "The proposed policy reduces projected conversions because it withholds too many near-threshold leads from high-conviction seller or AI-first motions relative to the baseline policy.",
    conversion_uplift_explanation:
      comparison.delta_expected_conversions >= 0
        ? "Most of the uplift comes from improving treatment of borderline A and B band cohorts where urgency, fit, and sequence momentum justify a faster route."
        : "The modeled drop is concentrated in the middle bands, where stricter routing reduces coverage more than it reduces risk exposure.",
    threshold_sensitivity_analysis: [
      {
        threshold: "S threshold",
        current_value: DEFAULT_THRESHOLDS.s,
        proposed_value: payload.thresholds.s,
        directional_effect:
          payload.thresholds.s >= DEFAULT_THRESHOLDS.s ? "More selective top-band seller routing" : "Broader top-band seller routing",
        explanation:
          "Changes here primarily affect the smallest, highest-conviction cohort and should be used to manage senior seller capacity."
      },
      {
        threshold: "A threshold",
        current_value: DEFAULT_THRESHOLDS.a,
        proposed_value: payload.thresholds.a,
        directional_effect:
          payload.thresholds.a >= DEFAULT_THRESHOLDS.a ? "Tighter A-band qualification" : "Wider A-band qualification",
        explanation:
          "This threshold has the strongest effect on human workload because it shifts borderline enterprise accounts into or out of seller-led motions."
      },
      {
        threshold: "B threshold",
        current_value: DEFAULT_THRESHOLDS.b,
        proposed_value: payload.thresholds.b,
        directional_effect:
          payload.thresholds.b >= DEFAULT_THRESHOLDS.b ? "Narrower AI-first catchment" : "Broader AI-first catchment",
        explanation:
          "B-band sensitivity governs how much mid-market volume is preserved through automated but still conversion-productive outreach."
      },
      {
        threshold: "C threshold",
        current_value: DEFAULT_THRESHOLDS.c,
        proposed_value: payload.thresholds.c,
        directional_effect:
          payload.thresholds.c >= DEFAULT_THRESHOLDS.c ? "Tighter delayed-follow-up gate" : "Broader delayed-follow-up gate",
        explanation:
          "C-band changes mostly influence nurture load and should be evaluated against queue efficiency rather than headline conversion volume alone."
      }
    ],
    recommended_next_policy:
      comparison.delta_expected_conversions >= 0
        ? "Adopt the proposed policy for the next operating window, but keep governance-heavy enterprise accounts on a review watchlist and confirm capacity utilization after one feedback cycle."
        : "Retain the current policy and test a narrower change focused on A-band enterprise qualification plus AI-first expansion for urgency-reactivated B-band leads.",
    export_summary:
      `Simulation summary: current policy projects ${current.expected_conversions.toFixed(2)} conversions at ${current.weighted_workload.toFixed(2)} weighted workload. Proposed policy projects ${proposed.expected_conversions.toFixed(2)} conversions at ${proposed.weighted_workload.toFixed(2)} workload, a delta of ${comparison.delta_expected_conversions.toFixed(2)} conversions and ${comparison.delta_weighted_workload.toFixed(2)} workload. Recommended next policy: ${comparison.delta_expected_conversions >= 0 ? "advance with controlled rollout" : "retain baseline and run targeted threshold test"}.`,
    current_strategy_summary: {
      label: "Current strategy",
      expected_conversions: current.expected_conversions,
      human_workload: current.human_calls,
      ai_call_workload: current.ai_calls,
      weighted_workload: current.weighted_workload,
      routing_profile:
        "Baseline policy prioritizes seller-led follow-up for upper bands, AI-first handling for B-band traffic, and delayed sequencing for lower-confidence cohorts.",
      explanation:
        "This is the operating baseline currently reflected in the demo portfolio and recent feedback-learning cohort."
    },
    proposed_strategy_summary: {
      label: "Proposed strategy",
      expected_conversions: proposed.expected_conversions,
      human_workload: proposed.human_calls,
      ai_call_workload: proposed.ai_calls,
      weighted_workload: proposed.weighted_workload,
      routing_profile:
        `Proposed policy applies S:${payload.thresholds.s.toFixed(2)} A:${payload.thresholds.a.toFixed(2)} B:${payload.thresholds.b.toFixed(2)} C:${payload.thresholds.c.toFixed(2)} with revised seller and AI routing.`,
      explanation:
        "This scenario shows how the candidate policy would shift conversion yield, seller demand, and AI lane utilization before operational rollout."
    }
  };

  return {
    ...response,
    operational_insight: buildSimulationInsight(response, payload)
  };
}

function buildFeedbackResponse(
  leadId: number,
  body: FeedbackSubmissionBody
): FeedbackResponse {
  const lead = getLeadScenario(leadId);
  const outcome = body.outcome ?? "converted";
  const feedback: FeedbackRecord = {
    id: 9000 + leadId,
    lead_id: leadId,
    outcome,
    reason:
      body.reason?.trim() ||
      (outcome === "converted"
        ? "Demo feedback captured for a converted outcome."
        : "Demo feedback captured for a non-converted outcome."),
    conversion_value:
      body.conversion_value ??
      (outcome === "converted" ? Math.round(lead.budget_estimate * 1.22) : null),
    observed_action: lead.recommended_action,
    observed_band: lead.score_band,
    salesperson_feedback:
      body.salesperson_feedback?.trim() ||
      "Demo fallback mode is active, so this learning snapshot is illustrative and not persisted.",
    created_at: iso(0)
  };

  const driftWarnings: string[] = [];
  const thresholdSuggestions = [];
  if (outcome !== "converted" && ["S", "A"].includes(lead.score_band)) {
    driftWarnings.push(
      "Another high-score miss has been observed in a premium routing band. Review objection and governance signals before preserving the current threshold."
    );
    thresholdSuggestions.push({
      title: "Re-check high-priority band qualification",
      description:
        "Add a stronger objection or governance gate before assigning immediate human-priority coverage to similar accounts.",
      impact: "Reduces false-positive seller load in premium routing bands."
    });
  }
  if (outcome === "converted" && ["C", "D"].includes(lead.score_band)) {
    driftWarnings.push(
      "A low-score win was recorded. Hidden urgency or timing signals may be underweighted in the current model."
    );
    thresholdSuggestions.push({
      title: "Promote urgency-reactivated leads",
      description:
        "Review text and behavior cues that triggered the conversion so similar leads can be escalated earlier.",
      impact: "Improves recall on undervalued but time-sensitive opportunities."
    });
  }
  if (!thresholdSuggestions.length) {
    thresholdSuggestions.push({
      title: "Hold current thresholds",
      description:
        "The captured outcome is directionally consistent with the current strategy. Continue monitoring until more closed-loop samples accrue.",
      impact: "Maintains strategy continuity while preserving learning signal quality."
    });
  }

  return {
    feedback,
    drift_warnings: driftWarnings,
    threshold_change_suggestions: thresholdSuggestions,
    retraining_candidates: Array.from(new Set([leadId, ...strategyPerformance.retraining_candidates])).slice(0, 6)
  };
}

function parseLeadIdFromPath(pathname: string): number {
  const match = pathname.match(/\/leads\/(\d+)/);
  return match ? Number(match[1]) : demoLeads[0].id;
}

function parseSimulationPayload(body: unknown): SimulationRequest {
  const payload = (body ?? {}) as Partial<SimulationRequest>;
  return {
    thresholds: {
      s: payload.thresholds?.s ?? DEFAULT_THRESHOLDS.s,
      a: payload.thresholds?.a ?? DEFAULT_THRESHOLDS.a,
      b: payload.thresholds?.b ?? DEFAULT_THRESHOLDS.b,
      c: payload.thresholds?.c ?? DEFAULT_THRESHOLDS.c
    },
    action_rules: {
      s_band_action: payload.action_rules?.s_band_action ?? DEFAULT_ACTION_RULES.s_band_action,
      a_band_action: payload.action_rules?.a_band_action ?? DEFAULT_ACTION_RULES.a_band_action,
      b_band_action: payload.action_rules?.b_band_action ?? DEFAULT_ACTION_RULES.b_band_action,
      c_band_action: payload.action_rules?.c_band_action ?? DEFAULT_ACTION_RULES.c_band_action,
      d_band_action: payload.action_rules?.d_band_action ?? DEFAULT_ACTION_RULES.d_band_action
    },
    human_capacity_limit: payload.human_capacity_limit ?? DEFAULT_HUMAN_CAPACITY,
    ai_call_capacity_limit: payload.ai_call_capacity_limit ?? DEFAULT_AI_CAPACITY
  };
}

export function resolveDemoData<T>({
  path,
  method,
  body
}: ResolveDemoDataArgs): T {
  const url = new URL(path, "http://demo.local");
  const pathname = url.pathname;
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET" && pathname === "/health") {
    return healthResponse as T;
  }

  if (normalizedMethod === "GET" && pathname === "/dashboard/summary") {
    return dashboardSummary as T;
  }

  if (normalizedMethod === "GET" && pathname === "/leads") {
    return getDemoLeads(url.searchParams) as T;
  }

  if (normalizedMethod === "GET" && /^\/leads\/\d+$/.test(pathname)) {
    return createLeadDetail(getLeadScenario(parseLeadIdFromPath(pathname))) as T;
  }

  if (normalizedMethod === "POST" && /^\/leads\/\d+\/feedback$/.test(pathname)) {
    return buildFeedbackResponse(parseLeadIdFromPath(pathname), (body ?? {}) as FeedbackSubmissionBody) as T;
  }

  if (normalizedMethod === "GET" && pathname === "/agents/status") {
    return agentStatus as T;
  }

  if (normalizedMethod === "GET" && pathname === "/strategies/performance") {
    return strategyPerformance as T;
  }

  if (normalizedMethod === "POST" && pathname === "/simulation/run") {
    return buildSimulationResponse(parseSimulationPayload(body)) as T;
  }

  throw new Error(`No demo fallback is configured for ${normalizedMethod} ${pathname}.`);
}
