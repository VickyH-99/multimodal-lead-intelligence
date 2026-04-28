export interface ApiHealthResponse {
  status: string;
  app_name: string;
  api_prefix: string;
  backend_url: string;
  database_url: string;
  seeded_demo_mode: boolean;
  checked_at: string;
}

export interface FeatureContribution {
  feature_name: string;
  contribution: number;
  direction: string;
  explanation: string;
}

export interface AgentSignal {
  agent_name: string;
  input_signals: Record<string, unknown>;
  reasoning_summary: string;
  confidence: number;
  contribution: number;
  risk_flags: string[];
  action_implication: string;
  latency_ms: number;
  output_signals: Record<string, unknown>;
}

export interface ReasoningTraceStep extends AgentSignal {}

export interface SimilarCaseSummary {
  lead_id: number;
  company_name: string;
  industry: string;
  score_band: string;
  outcome: string;
  recommended_action: string;
  similarity_score: number;
  summary: string;
}

export interface DecisionPackage {
  lead_id: number;
  base_score: number;
  multimodal_score: number;
  score_band: string;
  confidence: number;
  agent_signals: AgentSignal[];
  reasoning_trace: ReasoningTraceStep[];
  feature_contributions: FeatureContribution[];
  recommended_action: string;
  recommended_time_window: string;
  explanation: string;
  risk_flags: string[];
  governance_notes: string[];
  similar_cases: SimilarCaseSummary[];
  top_feature_reasons: string[];
  feedback_required: boolean;
  created_at: string;
}

export interface LeadListItem {
  id: number;
  full_name: string;
  company_name: string;
  industry: string;
  source_channel: string;
  current_status: string;
  historical_outcome: string | null;
  latest_score_band: string | null;
  latest_multimodal_score: number | null;
  latest_action: string | null;
  latest_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeadProfile {
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
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BehaviorEvent {
  event_type: string;
  channel: string;
  notes: string;
  occurred_at: string;
}

export interface FeedbackRecord {
  id: number;
  lead_id: number;
  outcome: string;
  reason: string;
  conversion_value: number | null;
  observed_action: string | null;
  observed_band: string | null;
  salesperson_feedback: string | null;
  created_at: string;
}

export interface LeadDetailResponse {
  profile: LeadProfile;
  decision: DecisionPackage | null;
  behavior_events: BehaviorEvent[];
  feedback_history: FeedbackRecord[];
}

export interface BandDistributionItem {
  band: string;
  count: number;
  conversion_rate: number;
}

export interface ActionBreakdownItem {
  action: string;
  count: number;
  avg_conversion_rate: number;
}

export interface FeedbackSuggestion {
  title: string;
  description: string;
  impact: string;
}

export interface ConfidenceSummary {
  average_confidence: number;
  high_confidence_share: number;
  low_confidence_share: number;
}

export interface FeedbackLoopStatus {
  total_feedback_records: number;
  high_score_non_converted: number;
  low_score_converted: number;
  drift_warnings: string[];
  threshold_change_suggestions: FeedbackSuggestion[];
}

export interface DashboardSummaryResponse {
  total_leads_scored: number;
  open_leads: number;
  converted_leads: number;
  score_distribution: BandDistributionItem[];
  action_breakdown: ActionBreakdownItem[];
  confidence_summary: ConfidenceSummary;
  feedback_loop_status: FeedbackLoopStatus;
}

export interface AgentStatusItem {
  agent_name: string;
  status: string;
  description: string;
  avg_latency_ms: number;
  avg_confidence: number;
  last_output_preview: Record<string, unknown>;
  last_reasoning_summary: string;
  last_action_implication: string;
}

export interface AgentStatusResponse {
  supervisor_status: string;
  agents: AgentStatusItem[];
}

export interface StrategyPerformanceItem {
  action: string;
  recommendation_count: number;
  converted_count: number;
  conversion_rate: number;
}

export interface LeadInsightSummary {
  lead_id: number;
  company_name: string;
  full_name: string;
  current_status: string;
  score_band: string;
  multimodal_score: number;
  note: string;
}

export interface RetrainingCandidateSample {
  lead_id: number;
  company_name: string;
  reason: string;
  recommended_label: string;
}

export interface StrategyPerformanceResponse {
  action_performance: StrategyPerformanceItem[];
  score_band_performance: BandDistributionItem[];
  drift_warnings: string[];
  threshold_change_suggestions: FeedbackSuggestion[];
  retraining_candidates: number[];
  high_score_non_converted_leads: number[];
  low_score_converted_leads: number[];
  executive_summary: string;
  learned_patterns: string[];
  governance_notes: string[];
  high_score_non_converted_details: LeadInsightSummary[];
  low_score_converted_details: LeadInsightSummary[];
  retraining_candidate_samples: RetrainingCandidateSample[];
}

export interface SimulationMetricSet {
  expected_conversions: number;
  human_calls: number;
  ai_calls: number;
  nurture_pool: number;
  weighted_workload: number;
}

export interface SimulationComparison {
  current: SimulationMetricSet;
  proposed: SimulationMetricSet;
  delta_expected_conversions: number;
  delta_weighted_workload: number;
}

export interface SimulationOperationalInsight {
  projected_conversions: number;
  human_workload: number;
  ai_call_workload: number;
  expected_uplift: number;
  conversion_delta: number;
  workload_delta: number;
  risk_warning: string;
  recommended_threshold_adjustment: string;
}

export interface ThresholdSensitivityItem {
  threshold: string;
  current_value: number;
  proposed_value: number;
  directional_effect: string;
  explanation: string;
}

export interface StrategyScenarioSummary {
  label: string;
  expected_conversions: number;
  human_workload: number;
  ai_call_workload: number;
  weighted_workload: number;
  routing_profile: string;
  explanation: string;
}

export interface SimulationRequest {
  thresholds: {
    s: number;
    a: number;
    b: number;
    c: number;
  };
  action_rules: {
    s_band_action: string;
    a_band_action: string;
    b_band_action: string;
    c_band_action: string;
    d_band_action: string;
  };
  human_capacity_limit: number;
  ai_call_capacity_limit: number;
}

export interface SimulationResponse {
  comparison: SimulationComparison;
  proposed_thresholds: SimulationRequest["thresholds"];
  proposed_rules: SimulationRequest["action_rules"];
  assumptions: string[];
  operational_insight: SimulationOperationalInsight;
  why_result: string;
  conversion_uplift_explanation: string;
  threshold_sensitivity_analysis: ThresholdSensitivityItem[];
  recommended_next_policy: string;
  export_summary: string;
  current_strategy_summary: StrategyScenarioSummary;
  proposed_strategy_summary: StrategyScenarioSummary;
}

export interface FeedbackResponse {
  feedback: FeedbackRecord;
  drift_warnings: string[];
  threshold_change_suggestions: FeedbackSuggestion[];
  retraining_candidates: number[];
}
