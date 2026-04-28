import { FormEvent, useEffect, useState } from "react";
import { apiPost } from "../api/client";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import EmptyState from "../components/EmptyState";
import SimulationComparisonChart from "../components/charts/SimulationComparisonChart";
import LoadingState from "../components/LoadingState";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import { SimulationRequest, SimulationResponse } from "../types/api";
import { formatPercent } from "../utils/format";

const initialRequest: SimulationRequest = {
  thresholds: {
    s: 0.85,
    a: 0.72,
    b: 0.58,
    c: 0.42
  },
  action_rules: {
    s_band_action: "senior human call",
    a_band_action: "normal human call",
    b_band_action: "AI outbound call",
    c_band_action: "delayed follow-up",
    d_band_action: "nurture pool"
  },
  human_capacity_limit: 18,
  ai_call_capacity_limit: 40
};

function formatSignedValue(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

export default function StrategySimulationPage() {
  const [payload, setPayload] = useState<SimulationRequest>(initialRequest);
  const [data, setData] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  async function runSimulation(nextPayload: SimulationRequest) {
    setLoading(true);
    setError(null);

    try {
      const response = await apiPost<SimulationResponse, SimulationRequest>(
        "/simulation/run",
        nextPayload
      );
      setData(response.data);
      setIsFallback(response.isFallback);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runSimulation(initialRequest);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSimulation(payload);
  }

  if (loading && !data) {
    return <LoadingState label="Running baseline strategy simulation..." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Simulation unavailable"
        description={error ?? "Simulation output could not be generated."}
      />
    );
  }

  const insight = data.operational_insight;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Strategy Simulation"
        title="Policy optimization engine for thresholds and routing strategy"
        description="Test threshold and routing changes, compare current versus proposed policy, and understand the workload and conversion consequences before operational rollout."
        badge={isFallback ? <ConnectionStatusBadge mode="fallback" /> : null}
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.28fr]">
        <Panel>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="text-lg font-semibold text-slate-950">Simulation controls</div>
            <p className="text-sm text-slate-500">
              Configure score cutoffs, routing rules, and capacity constraints to test a candidate operating policy.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "s", label: "S threshold" },
                { key: "a", label: "A threshold" },
                { key: "b", label: "B threshold" },
                { key: "c", label: "C threshold" }
              ].map((field) => (
                <label key={field.key} className="text-sm text-slate-600">
                  {field.label}
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={payload.thresholds[field.key as keyof SimulationRequest["thresholds"]]}
                    onChange={(event) =>
                      setPayload({
                        ...payload,
                        thresholds: {
                          ...payload.thresholds,
                          [field.key]: Number(event.target.value)
                        }
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-4">
              {[
                ["s_band_action", "S band action"],
                ["a_band_action", "A band action"],
                ["b_band_action", "B band action"],
                ["c_band_action", "C band action"],
                ["d_band_action", "D band action"]
              ].map(([key, label]) => (
                <label key={key} className="text-sm text-slate-600">
                  {label}
                  <select
                    value={payload.action_rules[key as keyof SimulationRequest["action_rules"]]}
                    onChange={(event) =>
                      setPayload({
                        ...payload,
                        action_rules: {
                          ...payload.action_rules,
                          [key]: event.target.value
                        }
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <option value="senior human call">Senior human call</option>
                    <option value="normal human call">Normal human call</option>
                    <option value="AI outbound call">AI outbound call</option>
                    <option value="delayed follow-up">Delayed follow-up</option>
                    <option value="nurture pool">Nurture pool</option>
                    <option value="do-not-contact review">Do-not-contact review</option>
                  </select>
                </label>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                Human capacity
                <input
                  type="number"
                  min="1"
                  value={payload.human_capacity_limit}
                  onChange={(event) =>
                    setPayload({
                      ...payload,
                      human_capacity_limit: Number(event.target.value)
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="text-sm text-slate-600">
                AI call capacity
                <input
                  type="number"
                  min="1"
                  value={payload.ai_call_capacity_limit}
                  onChange={(event) =>
                    setPayload({
                      ...payload,
                      ai_call_capacity_limit: Number(event.target.value)
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Run simulation
            </button>
            {error ? <div className="text-sm text-rose-600">{error}</div> : null}
          </form>
        </Panel>

        <div className="space-y-6">
          {loading && data ? <LoadingState label="Refreshing simulation..." /> : null}

          <Panel>
            <div className="text-lg font-semibold text-slate-950">Current vs proposed strategy</div>
            <p className="mt-2 text-sm text-slate-500">
              Compare the current operating policy against the proposed scenario before rollout.
            </p>
            <div className="mt-5">
              <SimulationComparisonChart comparison={data.comparison} />
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Panel>
              <div className="eyebrow">Projected conversions</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {insight.projected_conversions.toFixed(2)}
              </div>
            </Panel>
            <Panel>
              <div className="eyebrow">Human workload</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {insight.human_workload}
              </div>
            </Panel>
            <Panel>
              <div className="eyebrow">AI call workload</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {insight.ai_call_workload}
              </div>
            </Panel>
            <Panel>
              <div className="eyebrow">Expected uplift</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {formatPercent(insight.expected_uplift)}
              </div>
            </Panel>
            <Panel>
              <div className="eyebrow">Conversion delta</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {formatSignedValue(insight.conversion_delta)}
              </div>
            </Panel>
            <Panel>
              <div className="eyebrow">Workload delta</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {formatSignedValue(insight.workload_delta)}
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel>
              <div className="text-lg font-semibold text-slate-950">Why this result?</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{data.why_result}</p>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Conversion uplift explanation
                </div>
                <p className="mt-3 leading-6 text-slate-700">
                  {data.conversion_uplift_explanation}
                </p>
              </div>
            </Panel>

            <Panel>
              <div className="text-lg font-semibold text-slate-950">Workload risk warning</div>
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                {insight.risk_warning}
              </div>

              <div className="mt-5 text-lg font-semibold text-slate-950">
                Recommended threshold adjustment
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insight.recommended_threshold_adjustment}
              </p>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel>
              <div className="text-lg font-semibold text-slate-950">
                {data.current_strategy_summary.label}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {data.current_strategy_summary.routing_profile}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                  Expected conversions
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {data.current_strategy_summary.expected_conversions.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                  Weighted workload
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {data.current_strategy_summary.weighted_workload.toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {data.current_strategy_summary.explanation}
              </p>
            </Panel>

            <Panel>
              <div className="text-lg font-semibold text-slate-950">
                {data.proposed_strategy_summary.label}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {data.proposed_strategy_summary.routing_profile}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                  Expected conversions
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {data.proposed_strategy_summary.expected_conversions.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                  Weighted workload
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {data.proposed_strategy_summary.weighted_workload.toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {data.proposed_strategy_summary.explanation}
              </p>
            </Panel>
          </div>

          <Panel>
            <div className="text-lg font-semibold text-slate-950">
              Threshold sensitivity analysis
            </div>
            <div className="mt-5 space-y-3">
              {data.threshold_sensitivity_analysis.map((item) => (
                <div
                  key={item.threshold}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="font-semibold text-slate-950">{item.threshold}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.explanation}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.directional_effect}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      Current value
                      <div className="mt-1 font-semibold text-slate-950">
                        {item.current_value.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      Proposed value
                      <div className="mt-1 font-semibold text-slate-950">
                        {item.proposed_value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel>
              <div className="text-lg font-semibold text-slate-950">Recommended next policy</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {data.recommended_next_policy}
              </p>

              <div className="mt-5 text-lg font-semibold text-slate-950">Assumptions</div>
              <div className="mt-4 space-y-3">
                {data.assumptions.map((assumption) => (
                  <div
                    key={assumption}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600"
                  >
                    {assumption}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="text-lg font-semibold text-slate-950">Exportable simulation summary</div>
              <p className="mt-2 text-sm text-slate-500">
                This summary can be copied into a stakeholder update, operating review, or policy approval note.
              </p>
              <textarea
                readOnly
                value={data.export_summary}
                rows={10}
                className="mt-5 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700"
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
