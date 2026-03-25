import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function SentimentFunnelChart({ data }: { data: any[] }) {
  // Funnel needs sorted data (largest to smallest) to look like a funnel
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const colors: Record<string, string> = { Positive: "#10B981", Neutral: "#6B7280", Negative: "#EF4444" };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip contentStyle={{ backgroundColor: "#000", borderColor: "#374151", color: "#fff", fontWeight: "bold" }} />
        <Funnel dataKey="count" data={sortedData} isAnimationActive={false}>
          <LabelList position="right" fill="#fff" stroke="none" dataKey="sentiment" fontSize={12} fontWeight={900} />
          <LabelList position="center" fill="#fff" stroke="none" dataKey="count" fontSize={14} fontWeight={900} />
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[entry.sentiment] || "#3B82F6"} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}