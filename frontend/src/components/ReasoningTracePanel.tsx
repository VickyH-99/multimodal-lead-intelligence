import { BrainCircuit, ShieldAlert, TimerReset } from "lucide-react";
import { ReasoningTraceStep } from "../types/api";
import { formatPercent } from "../utils/format";

function formatSignalValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value == null) {
    return "N/A";
  }

  return String(value);
}

export default function ReasoningTracePanel({
  trace,
  compact = false
}: {
  trace: ReasoningTraceStep[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {trace.map((step, index) => {
        const inputSignals = Object.entries(step.input_signals);
        const outputSignals = Object.entries(step.output_signals);

        return (
          <div
            key={`${step.agent_name}-${index}`}
            className={`rounded-3xl border border-slate-200 bg-slate-50 p-5 ${compact ? "" : "shadow-[0_16px_50px_rgba(15,23,42,0.05)]"}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Step {index + 1}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    {step.agent_name}
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {step.reasoning_summary}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500">
                  Confidence
                  <div className="mt-1 text-base font-semibold text-slate-950">
                    {formatPercent(step.confidence)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500">
                  Contribution
                  <div className="mt-1 text-base font-semibold text-slate-950">
                    {step.contribution >= 0 ? "+" : ""}
                    {step.contribution.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500">
                  Latency
                  <div className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-slate-950">
                    <TimerReset className="h-4 w-4 text-slate-400" />
                    {step.latency_ms.toFixed(1)} ms
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Input signals
                </div>
                <div className="mt-3 space-y-2">
                  {inputSignals.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="text-slate-500">{key.replace(/_/g, " ")}</span>
                      <span className="max-w-[55%] text-right font-medium text-slate-950">
                        {formatSignalValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Decision output
                </div>
                <div className="mt-3 space-y-2">
                  {outputSignals.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="text-slate-500">{key.replace(/_/g, " ")}</span>
                      <span className="max-w-[55%] text-right font-medium text-slate-950">
                        {formatSignalValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Action implication
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.action_implication}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {step.risk_flags.length ? (
                    step.risk_flags.map((flag) => (
                      <span
                        key={flag}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {flag.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      No incremental risk flags
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
