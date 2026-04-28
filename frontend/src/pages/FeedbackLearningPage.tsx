import { Link } from "react-router-dom";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import { useApi } from "../hooks/useApi";
import { StrategyPerformanceResponse } from "../types/api";
import { formatPercent, formatScore } from "../utils/format";

export default function FeedbackLearningPage() {
  const { data, loading, error, isFallback } = useApi<StrategyPerformanceResponse>(
    "/strategies/performance"
  );

  if (loading && !data) {
    return <LoadingState label="Loading feedback learning analytics..." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Feedback intelligence unavailable"
        description={error ?? "Feedback-learning analytics could not be loaded."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Feedback Learning"
        title="Closed-loop outcome learning and governance intelligence"
        description="Track high-score misses, low-score wins, drift signals, retraining candidates, and action-level performance so the lead decision platform improves over time."
        badge={isFallback ? <ConnectionStatusBadge mode="fallback" /> : null}
      />

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-950">Learning summary</div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              {data.executive_summary}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-rose-50 p-4">
              <div className="eyebrow text-rose-600">High-score misses</div>
              <div className="mt-2 text-2xl font-semibold text-rose-700">
                {data.high_score_non_converted_leads.length}
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="eyebrow text-amber-600">Low-score wins</div>
              <div className="mt-2 text-2xl font-semibold text-amber-700">
                {data.low_score_converted_leads.length}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="eyebrow">Retraining samples</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {data.retraining_candidate_samples.length}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">Action performance by strategy type</div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Recommendations</th>
                  <th className="pb-3">Converted</th>
                  <th className="pb-3">Conversion rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {data.action_performance.map((row) => (
                  <tr key={row.action}>
                    <td className="py-4 font-medium text-slate-950">{row.action}</td>
                    <td className="py-4">{row.recommendation_count}</td>
                    <td className="py-4">{row.converted_count}</td>
                    <td className="py-4">{formatPercent(row.conversion_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">What the system learned from outcomes</div>
          <div className="mt-5 space-y-3">
            {data.learned_patterns.map((pattern) => (
              <div
                key={pattern}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
              >
                {pattern}
              </div>
            ))}
          </div>

          <div className="mt-6 text-lg font-semibold text-slate-950">Drift warnings</div>
          <div className="mt-4 space-y-3">
            {data.drift_warnings.length ? (
              data.drift_warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                >
                  {warning}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                No drift warnings are active in the current sample.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.95fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">
            High-score non-converted leads
          </div>
          <div className="mt-4 space-y-3">
            {data.high_score_non_converted_details.map((lead) => (
              <Link
                key={lead.lead_id}
                to={`/leads/${lead.lead_id}`}
                className="block rounded-3xl border border-rose-100 bg-rose-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-rose-900">{lead.company_name}</div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">
                    {lead.score_band}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-rose-800">{lead.note}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-rose-600">
                  {lead.full_name} | Score {formatScore(lead.multimodal_score)}
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Low-score converted leads</div>
          <div className="mt-4 space-y-3">
            {data.low_score_converted_details.map((lead) => (
              <Link
                key={lead.lead_id}
                to={`/leads/${lead.lead_id}`}
                className="block rounded-3xl border border-amber-100 bg-amber-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-amber-900">{lead.company_name}</div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                    {lead.score_band}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-800">{lead.note}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-600">
                  {lead.full_name} | Score {formatScore(lead.multimodal_score)}
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Retraining candidate samples</div>
          <div className="mt-4 space-y-3">
            {data.retraining_candidate_samples.map((sample) => (
              <div
                key={`${sample.lead_id}-${sample.recommended_label}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-semibold text-slate-950">{sample.company_name}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{sample.reason}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {sample.recommended_label}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">Threshold suggestions</div>
          <div className="mt-4 space-y-3">
            {data.threshold_change_suggestions.map((suggestion) => (
              <div
                key={suggestion.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-semibold text-slate-950">{suggestion.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{suggestion.description}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {suggestion.impact}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Model governance notes</div>
          <div className="mt-4 space-y-3">
            {data.governance_notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
              >
                {note}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
