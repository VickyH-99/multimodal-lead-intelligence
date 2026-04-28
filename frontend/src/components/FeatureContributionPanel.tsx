import { FeatureContribution } from "../types/api";

export default function FeatureContributionPanel({
  contributions
}: {
  contributions: FeatureContribution[];
}) {
  const maxContribution =
    Math.max(...contributions.map((item) => Math.abs(item.contribution)), 0.01) || 0.01;

  return (
    <div className="space-y-4">
      {contributions.map((item) => {
        const width = `${Math.max((Math.abs(item.contribution) / maxContribution) * 100, 12)}%`;
        const isPositive = item.direction !== "negative" && item.contribution >= 0;

        return (
          <div key={item.feature_name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-slate-950">{item.feature_name}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.explanation}</p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {item.contribution >= 0 ? "+" : ""}
                {item.contribution.toFixed(2)}
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
