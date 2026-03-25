import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function SentimentPieChart({ data }: { data: any[] }) {
  const colors: Record<string, string> = { Positive: "#10B981", Neutral: "#6B7280", Negative: "#EF4444" };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={{ backgroundColor: "#000", borderColor: "#374151", color: "#fff", fontWeight: "bold" }} />
        <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "900", color: "#fff" }} />
        <Pie data={data} dataKey="count" nameKey="sentiment" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" paddingAngle={5} stroke="none">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[entry.sentiment] || "#3B82F6"} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}