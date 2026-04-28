import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { SimulationComparison } from "../../types/api";

export default function SimulationComparisonChart({
  comparison
}: {
  comparison: SimulationComparison;
}) {
  const data = [
    {
      metric: "Expected conversions",
      current: comparison.current.expected_conversions,
      proposed: comparison.proposed.expected_conversions
    },
    {
      metric: "Human calls",
      current: comparison.current.human_calls,
      proposed: comparison.proposed.human_calls
    },
    {
      metric: "AI calls",
      current: comparison.current.ai_calls,
      proposed: comparison.proposed.ai_calls
    },
    {
      metric: "Workload",
      current: comparison.current.weighted_workload,
      proposed: comparison.proposed.weighted_workload
    }
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="metric" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="current" fill="#94A3B8" radius={[12, 12, 0, 0]} />
          <Bar dataKey="proposed" fill="#0B5FFF" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
