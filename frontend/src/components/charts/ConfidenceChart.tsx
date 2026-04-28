import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell
} from "recharts";
import { ConfidenceSummary } from "../../types/api";

export default function ConfidenceChart({ summary }: { summary: ConfidenceSummary }) {
  const data = [
    { name: "High confidence", value: summary.high_confidence_share, color: "#0B5FFF" },
    { name: "Low confidence", value: summary.low_confidence_share, color: "#D97706" },
    {
      name: "Mid confidence",
      value: Math.max(0, 1 - summary.high_confidence_share - summary.low_confidence_share),
      color: "#CBD5E1"
    }
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

