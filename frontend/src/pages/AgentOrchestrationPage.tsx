import { useEffect, useMemo, useState } from "react";
import BandBadge from "../components/BandBadge";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Panel from "../components/Panel";
import ReasoningTracePanel from "../components/ReasoningTracePanel";
import SectionHeader from "../components/SectionHeader";
import { useApi } from "../hooks/useApi";
import { AgentStatusResponse, LeadDetailResponse, LeadListItem } from "../types/api";
import { formatPercent, formatScore } from "../utils/format";

export default function AgentOrchestrationPage() {
  const {
    data: leads,
    loading: leadsLoading,
    error: leadsError,
    isFallback: leadsFallback
  } = useApi<LeadListItem[]>("/leads?limit=16");
  const {
    data: status,
    loading: statusLoading,
    error: statusError,
    isFallback: statusFallback
  } = useApi<AgentStatusResponse>("/agents/status");
  const [selectedLeadId, setSelectedLeadId] = useState<number>(1);
  const {
    data: detail,
    loading: detailLoading,
    error: detailError,
    isFallback: detailFallback
  } = useApi<LeadDetailResponse>(`/leads/${selectedLeadId}`);

  useEffect(() => {
    if (leads?.[0] && !leads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const decision = detail?.decision ?? null;
  const isFallback = leadsFallback || statusFallback || detailFallback;

  const selectedLead = useMemo(
    () => leads?.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  if ((leadsLoading && !leads) || (statusLoading && !status) || (detailLoading && !detail)) {
    return <LoadingState label="Loading orchestration telemetry..." />;
  }

  if (!leads?.length || !status || !decision || !selectedLead) {
    return (
      <EmptyState
        title="Orchestration view unavailable"
        description={
          statusError ??
          detailError ??
          leadsError ??
          "Agent status and execution-trace data are temporarily unavailable."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Agent Orchestration"
        title="Supervisor flow and multimodal specialist audit trail"
        description="Inspect live agent health, the selected lead’s decision package, and the exact reasoning steps that produced the final operating recommendation."
        badge={isFallback ? <ConnectionStatusBadge mode="fallback" /> : null}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-slate-950">Live agent status</div>
              <p className="mt-1 text-sm text-slate-500">
                Supervisor status: {status.supervisor_status}
              </p>
            </div>

            <select
              value={selectedLeadId}
              onChange={(event) => setSelectedLeadId(Number(event.target.value))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-3">
            {status.agents.map((agent) => (
              <div
                key={agent.agent_name}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-950">{agent.agent_name}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{agent.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      agent.status === "healthy"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    Avg latency
                    <div className="mt-1 font-semibold text-slate-950">
                      {agent.avg_latency_ms.toFixed(1)} ms
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    Avg confidence
                    <div className="mt-1 font-semibold text-slate-950">
                      {formatPercent(agent.avg_confidence)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Last reasoning summary
                  </div>
                  <p className="mt-2 leading-6 text-slate-700">{agent.last_reasoning_summary}</p>
                </div>

                <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Action implication
                  </div>
                  <p className="mt-2 leading-6 text-slate-700">{agent.last_action_implication}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-950">Selected lead routing package</div>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedLead.company_name} is currently routed through the orchestration stack shown below.
                </p>
              </div>
              <BandBadge band={decision.score_band} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="eyebrow">Structured score</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatScore(decision.base_score)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="eyebrow">Multimodal score</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatScore(decision.multimodal_score)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="eyebrow">Confidence</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatPercent(decision.confidence)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="eyebrow">Recommended action</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {decision.recommended_action}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="eyebrow text-slate-400">SupervisorAgent</div>
                <div className="mt-2 text-xl font-semibold">Multimodal fusion</div>
                <p className="mt-2 text-sm text-slate-300">
                  Combines structured, text, voice, behavior, and analog evidence into one decision package.
                </p>
              </div>
              <div className="hidden items-center justify-center text-3xl text-slate-300 md:flex">
                -&gt;
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-panel">
                <div className="eyebrow">Specialists</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">Signal extraction</div>
                <p className="mt-2 text-sm text-slate-500">
                  Structured scoring, text intent, voice emotion, behavior sequencing, and similar-case retrieval.
                </p>
              </div>
              <div className="hidden items-center justify-center text-3xl text-slate-300 md:flex">
                -&gt;
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-primary to-sky-500 p-5 text-white">
                <div className="eyebrow text-sky-100">Strategy + Explanation</div>
                <div className="mt-2 text-xl font-semibold">Execution-ready action</div>
                <p className="mt-2 text-sm text-sky-50">
                  Produces the final route, time window, and business explanation for sales and RevOps.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {decision.explanation}
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-950">Agent reasoning trace</div>
                <p className="mt-2 text-sm text-slate-500">
                  Step-by-step audit trail for the currently selected lead. Each step shows the evidence examined, the reasoning summary, the confidence level, and the action implication.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                {decision.reasoning_trace.length} logged steps
              </div>
            </div>
            <div className="mt-5">
              <ReasoningTracePanel trace={decision.reasoning_trace} compact />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
