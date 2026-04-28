import ActionBreakdownChart from "../components/charts/ActionBreakdownChart";
import BandDistributionChart from "../components/charts/BandDistributionChart";
import ConfidenceChart from "../components/charts/ConfidenceChart";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import { useApi } from "../hooks/useApi";
import { DashboardSummaryResponse } from "../types/api";
import { formatPercent } from "../utils/format";

export default function DashboardPage() {
  const { data, loading, error, isFallback } = useApi<DashboardSummaryResponse>("/dashboard/summary");

  if (loading && !data) {
    return <LoadingState label="Loading executive dashboard..." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={error ?? "Executive dashboard data is temporarily unavailable."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Executive Dashboard"
        title="Lead portfolio performance at a glance"
        description="A live operating view of lead scoring volume, decision confidence, action mix, and feedback learning health."
        badge={isFallback ? <ConnectionStatusBadge mode="fallback" /> : null}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total leads scored"
          value={String(data.total_leads_scored)}
          hint="Active and historical leads currently scored by the supervisor."
        />
        <StatCard
          label="Open leads"
          value={String(data.open_leads)}
          hint="Leads still in flight and eligible for strategy optimization."
        />
        <StatCard
          label="Converted leads"
          value={String(data.converted_leads)}
          hint="Observed wins feeding the similarity and feedback-learning loops."
        />
        <StatCard
          label="Average confidence"
          value={formatPercent(data.confidence_summary.average_confidence)}
          hint="Mean confidence across all recent multimodal decisions."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-950">Score distribution</div>
              <p className="mt-1 text-sm text-slate-500">
                Volume by band alongside observed conversion performance.
              </p>
            </div>
          </div>
          <BandDistributionChart data={data.score_distribution} />
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Confidence summary</div>
          <p className="mt-1 text-sm text-slate-500">
            High-confidence routing share versus low-confidence review exposure.
          </p>
          <ConfidenceChart summary={data.confidence_summary} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Average</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {formatPercent(data.confidence_summary.average_confidence)}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">High</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {formatPercent(data.confidence_summary.high_confidence_share)}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Low</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">
                {formatPercent(data.confidence_summary.low_confidence_share)}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel>
          <div className="text-lg font-semibold text-slate-950">Recommended action mix</div>
          <p className="mt-1 text-sm text-slate-500">
            Current action routing across human and AI coverage motions.
          </p>
          <ActionBreakdownChart data={data.action_breakdown} />
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-slate-950">Feedback loop status</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Feedback records</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {data.feedback_loop_status.total_feedback_records}
              </div>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-rose-600">High-score misses</div>
              <div className="mt-2 text-2xl font-semibold text-rose-700">
                {data.feedback_loop_status.high_score_non_converted}
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-amber-600">Low-score wins</div>
              <div className="mt-2 text-2xl font-semibold text-amber-700">
                {data.feedback_loop_status.low_score_converted}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.feedback_loop_status.drift_warnings.length ? (
              data.feedback_loop_status.drift_warnings.map((warning) => (
                <div key={warning} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {warning}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                No significant strategy drift warnings in the current feedback window.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
