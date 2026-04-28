import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BandDistributionItem } from "../../types/api";

export default function BandDistributionChart({ data }: { data: BandDistributionItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="band" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0B5FFF" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="band" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 1]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="conversion_rate"
              stroke="#0F766E"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

