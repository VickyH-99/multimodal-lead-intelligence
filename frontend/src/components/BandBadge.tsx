const styles: Record<string, string> = {
  S: "bg-emerald-100 text-emerald-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-cyan-100 text-cyan-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-rose-100 text-rose-700"
};

export default function BandBadge({ band }: { band: string | null | undefined }) {
  const resolved = band ?? "N/A";
  const className = styles[resolved] ?? "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {resolved}
    </span>
  );
}

