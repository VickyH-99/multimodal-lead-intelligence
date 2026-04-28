import Panel from "./Panel";

export default function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Panel className="h-full">
      <div className="eyebrow">{label}</div>
      <div className="mt-4 text-3xl font-semibold text-slate-950">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{hint}</p>
    </Panel>
  );
}

