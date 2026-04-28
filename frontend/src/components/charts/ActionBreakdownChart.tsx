import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ActionBreakdownItem } from "../../types/api";

export default function ActionBreakdownChart({ data }: { data: ActionBreakdownItem[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="#E2E8F0" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis dataKey="action" type="category" tickLine={false} axisLine={false} width={140} />
          <Tooltip />
          <Bar dataKey="count" fill="#0F766E" radius={[0, 12, 12, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

