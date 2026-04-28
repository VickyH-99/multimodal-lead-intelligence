import { FormEvent, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiPost } from "../api/client";
import BandBadge from "../components/BandBadge";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import EmptyState from "../components/EmptyState";
import FeatureContributionPanel from "../components/FeatureContributionPanel";
import LoadingState from "../components/LoadingState";
import Panel from "../components/Panel";
import ReasoningTracePanel from "../components/ReasoningTracePanel";
import SectionHeader from "../components/SectionHeader";
import Timeline from "../components/Timeline";
import { useApi } from "../hooks/useApi";
import { FeedbackResponse, LeadDetailResponse } from "../types/api";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatScore
} from "../utils/format";

function readSignalValue(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value == null ? "N/A" : String(value);
}

function humanizeFlag(flag: string): string {
  return flag.replace(/_/g, " ");
}

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const { data, loading, error, isFallback, refresh } = useApi<LeadDetailResponse>(
    `/leads/${leadId}`
  );
  const [outcome, setOutcome] = useState("converted");
  const [reason, setReason] = useState("");
  const [salespersonFeedback, setSalespersonFeedback] = useState("");
  const [submissionState, setSubmissionState] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadId) {
      return;
    }

    setSubmissionState("Submitting feedback...");

    try {
      const response = await apiPost<FeedbackResponse, Record<string, unknown>>(
        `/leads/${leadId}/feedback`,
        {
          outcome,
          reason,
          salesperson_feedback: salespersonFeedback
        }
      );

      setSubmissionState(
        `${response.isFallback ? "Demo feedback captured." : "Feedback captured."} ${
          response.data.threshold_change_suggestions[0]?.title ?? "Closed-loop learning snapshot updated."
        }`
      );
      await refresh();
    } catch (caught) {
      setSubmissionState(caught instanceof Error ? caught.message : "Unable to submit feedback.");
    }
  }

  const decision = data?.decision;

  const signals = useMemo(() => {
    if (!decision) {
      return {
        textSignal: null,
        voiceSignal: null,
        behaviorSignal: null,
        supervisorSignal: null,
        strategySignal: null
      };
    }

    return {
      textSignal:
        decision.reasoning_trace.find((signal) => signal.agent_name === "TextIntentAgent") ?? null,
      voiceSignal:
        decision.reasoning_trace.find((signal) => signal.agent_name === "VoiceEmotionAgent") ?? null,
      behaviorSignal:
        decision.reasoning_trace.find((signal) => signal.agent_name === "BehaviorSequenceAgent") ??
        null,
      supervisorSignal:
        decision.reasoning_trace.find((signal) => signal.agent_name === "SupervisorAgent") ?? null,
      strategySignal:
        decision.reasoning_trace.find((signal) => signal.agent_name === "StrategyAgent") ?? null
    };
  }, [decision]);

  if (loading && !data) {
    return <LoadingState label="Loading lead intelligence..." />;
  }

  if (!data || !decision) {
    return (
      <EmptyState
        title="Lead details unavailable"
        description={error ?? "Lead details could not be loaded for this opportunity."}
      />
    );
  }

  const { profile, feedback_history: feedbackHistory, behavior_events: behaviorEvents } = data;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Lead Decision Profile"
        title={profile.company_name}
        description="A complete multimodal decision intelligence profile showing why the platform scored this lead the way it did, which agent signals mattered, and how the recommendation should be executed."
        badge={isFallback ? <ConnectionStatusBadge mode="fallback" /> : null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-slate-950">{profile.full_name}</div>
              <p className="mt-1 text-sm text-slate-500">
                {profile.title} | {profile.company_name} | {profile.region} | {profile.industry}
              </p>
            </div>
            <BandBadge band={decision.score_band} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-slate-100 p-4">
              <div className="eyebrow">Structured score</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {formatScore(decision.base_score)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <div className="eyebrow">Multimodal score</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {formatScore(decision.multimodal_score)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <div className="eyebrow">Confidence</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {formatPercent(decision.confidence)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <div className="eyebrow">Recommended action</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {decision.recommended_action}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-lg font-semibold text-slate-950">Lead profile</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div>Email: <span className="font-medium text-slate-950">{profile.email}</span></div>
                <div>Phone: <span className="font-medium text-slate-950">{profile.phone}</span></div>
                <div>Source: <span className="font-medium text-slate-950">{profile.source_channel}</span></div>
                <div>Lifecycle stage: <span className="font-medium text-slate-950">{profile.lifecycle_stage}</span></div>
                <div>Employees: <span className="font-medium text-slate-950">{profile.employee_count}</span></div>
                <div>Budget estimate: <span className="font-medium text-slate-950">{formatCurrency(profile.budget_estimate)}</span></div>
                <div>Revenue band: <span className="font-medium text-slate-950">{profile.annual_revenue_band}</span></div>
                <div>Current status: <span className="font-medium text-slate-950">{profile.current_status}</span></div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-lg font-semibold text-slate-950">Decision package</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3">
                  Score band <span className="font-semibold text-slate-950">{decision.score_band}</span>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Recommended time window{" "}
                  <span className="font-semibold text-slate-950">
                    {decision.recommended_time_window}
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Feedback required{" "}
                  <span className="font-semibold text-slate-950">
                    {decision.feedback_required ? "Yes" : "No"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Supervisor implication{" "}
                  <span className="font-semibold text-slate-950">
                    {signals.supervisorSignal?.action_implication ?? "No supervisor implication available."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Final decision narrative</div>
          <p className="mt-3 text-sm leading-7 text-slate-600">{decision.explanation}</p>

          <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
            <div className="eyebrow text-slate-400">Recommended next policy</div>
            <div className="mt-2 text-2xl font-semibold">{decision.recommended_action}</div>
            <p className="mt-2 text-sm text-slate-300">{decision.recommended_time_window}</p>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-950">Risk flags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {decision.risk_flags.length ? (
                decision.risk_flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                  >
                    {humanizeFlag(flag)}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  No major risk flags
                </span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-950">Compliance and governance notes</div>
            <div className="mt-3 space-y-3">
              {decision.governance_notes.map((note) => (
                <div
                  key={note}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">SHAP-style feature contribution</div>
          <p className="mt-2 text-sm text-slate-500">
            These feature-level contributions explain which structured and multimodal signals moved the final recommendation up or down.
          </p>
          <div className="mt-5">
            <FeatureContributionPanel contributions={decision.feature_contributions} />
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Top business reasons</div>
          <div className="mt-5 space-y-3">
            {decision.top_feature_reasons.map((reasonItem) => (
              <div
                key={reasonItem}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                {reasonItem}
              </div>
            ))}
          </div>

          <div className="mt-6 text-lg font-semibold text-slate-950">Strategy implication</div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {signals.strategySignal?.reasoning_summary ??
              "The strategy agent summary is not available for this lead."}
          </p>
          <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            {signals.strategySignal?.action_implication ??
              "No action implication is available for the current route."}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">Text intent extraction</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {signals.textSignal?.reasoning_summary ?? "Text signal unavailable."}
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM notes</div>
              <p className="mt-3 leading-6 text-slate-700">{profile.crm_notes}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Call transcript</div>
              <p className="mt-3 leading-6 text-slate-700">{profile.call_transcript}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
              Dominant theme
              <div className="mt-2 font-semibold text-slate-950">
                {signals.textSignal
                  ? readSignalValue(signals.textSignal.output_signals, "dominant_theme")
                  : "N/A"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
              Buying stage
              <div className="mt-2 font-semibold text-slate-950">
                {signals.textSignal
                  ? readSignalValue(signals.textSignal.output_signals, "buying_stage")
                  : "N/A"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
              Action implication
              <div className="mt-2 font-semibold text-slate-950">
                {signals.textSignal?.action_implication ?? "N/A"}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Voice emotion signals</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {signals.voiceSignal?.reasoning_summary ?? "Voice signal unavailable."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="eyebrow">Speaking speed</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {profile.speaking_speed.toFixed(0)}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="eyebrow">Pause duration</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {profile.average_pause_duration.toFixed(1)}s
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="eyebrow">Sentiment</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {profile.voice_sentiment_score.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="eyebrow">Hesitation</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {profile.hesitation_score.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Voice implication</div>
            <p className="mt-3 leading-6 text-slate-700">
              {signals.voiceSignal?.action_implication ?? "Voice action implication unavailable."}
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">Behavior timeline</div>
          <p className="mt-2 text-sm text-slate-500">
            Sequence evidence shows how the opportunity progressed through engagement events and where the platform detected momentum or stall risk.
          </p>
          <div className="mt-5">
            <Timeline events={behaviorEvents} />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            {signals.behaviorSignal?.action_implication ??
              "No sequence implication is available for this lead."}
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Similar converted cases</div>
          <div className="mt-5 space-y-3">
            {decision.similar_cases.map((caseItem) => (
              <div
                key={caseItem.lead_id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-950">{caseItem.company_name}</div>
                  <BandBadge band={caseItem.score_band} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{caseItem.summary}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {caseItem.industry} | Similarity {(caseItem.similarity_score * 100).toFixed(0)}% |{" "}
                  {caseItem.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-950">Agent reasoning trace</div>
            <p className="mt-2 text-sm text-slate-500">
              This audit trail shows how the supervisor and specialist agents contributed to the final decision, what evidence each one saw, and how each step changed the recommended operating motion.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
            {decision.reasoning_trace.length} agent steps logged
          </div>
        </div>
        <div className="mt-5">
          <ReasoningTracePanel trace={decision.reasoning_trace} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">Feedback submission form</div>
          <p className="mt-2 text-sm text-slate-500">
            Capture conversion outcomes, seller notes, and drift evidence so the feedback-learning loop can refine thresholds and routing policy.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="converted">Converted</option>
              <option value="not_converted">Not converted</option>
              <option value="disqualified">Disqualified</option>
            </select>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Outcome reason"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <textarea
              value={salespersonFeedback}
              onChange={(event) => setSalespersonFeedback(event.target.value)}
              placeholder="Salesperson feedback"
              rows={5}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Submit feedback
            </button>
            {submissionState ? (
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                {submissionState}
              </div>
            ) : null}
          </form>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Outcome feedback history</div>
          <div className="mt-5 space-y-3">
            {feedbackHistory.length ? (
              feedbackHistory.map((record) => (
                <div
                  key={record.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-slate-950">{record.outcome}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {formatDate(record.created_at)}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{record.reason}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      Observed action
                      <div className="mt-1 font-semibold text-slate-950">
                        {record.observed_action ?? "N/A"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      Observed band
                      <div className="mt-1 font-semibold text-slate-950">
                        {record.observed_band ?? "N/A"}
                      </div>
                    </div>
                  </div>
                  {record.salesperson_feedback ? (
                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      {record.salesperson_feedback}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No feedback history is available for this lead yet.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
