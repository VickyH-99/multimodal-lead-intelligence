import { ArrowRight, ShieldAlert, TimerReset } from "lucide-react";
import { AgentSignal } from "../types/api";
import { formatPercent } from "../utils/format";
import Panel from "./Panel";

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

export default function AgentSignalCard({ signal }: { signal: AgentSignal }) {
  const inputPreview = Object.entries(signal.input_signals).slice(0, 2);
  const outputPreview = Object.entries(signal.output_signals).slice(0, 2);

  return (
    <Panel className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">{signal.agent_name}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{signal.reasoning_summary}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {formatPercent(signal.confidence)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
          <TimerReset className="h-3.5 w-3.5" />
          {signal.latency_ms.toFixed(1)} ms
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
          Contribution {signal.contribution >= 0 ? "+" : ""}
          {signal.contribution.toFixed(2)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {inputPreview.length ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            <div className="font-semibold uppercase tracking-[0.18em] text-slate-400">
              Input signals
            </div>
            <div className="mt-3 space-y-2">
              {inputPreview.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">{key.replace(/_/g, " ")}</span>
                  <span className="text-right font-medium text-slate-900">
                    {formatSignalValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {outputPreview.length ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            <div className="font-semibold uppercase tracking-[0.18em] text-slate-400">
              Output signals
            </div>
            <div className="mt-3 space-y-2">
              {outputPreview.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">{key.replace(/_/g, " ")}</span>
                  <span className="text-right font-medium text-slate-900">
                    {formatSignalValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <div className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <ArrowRight className="h-4 w-4 text-primary" />
          Action implication
        </div>
        <p className="mt-2 leading-6">{signal.action_implication}</p>
      </div>

      {signal.risk_flags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {signal.risk_flags.map((flag) => (
            <span
              key={flag}
              className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {flag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
