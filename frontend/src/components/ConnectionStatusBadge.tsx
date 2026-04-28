import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

type ConnectionMode = "checking" | "connected" | "fallback";

const badgeStyles: Record<ConnectionMode, string> = {
  checking: "border-slate-200 bg-white text-slate-600",
  connected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  fallback: "border-amber-200 bg-amber-50 text-amber-800"
};

const badgeLabels: Record<ConnectionMode, string> = {
  checking: "Checking backend",
  connected: "Backend connected",
  fallback: "Demo fallback mode"
};

const badgeIcons = {
  checking: LoaderCircle,
  connected: CheckCircle2,
  fallback: AlertTriangle
} satisfies Record<ConnectionMode, typeof LoaderCircle>;

export default function ConnectionStatusBadge({
  mode,
  className = ""
}: {
  mode: ConnectionMode;
  className?: string;
}) {
  const Icon = badgeIcons[mode];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeStyles[mode]} ${className}`.trim()}
    >
      <Icon className={`h-3.5 w-3.5 ${mode === "checking" ? "animate-spin" : ""}`} />
      {badgeLabels[mode]}
    </div>
  );
}
