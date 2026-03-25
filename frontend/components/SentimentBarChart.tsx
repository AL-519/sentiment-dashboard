import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from "recharts";

export default function SentimentBarChart({ data }: { data: any[] }) {
  const colors: Record<string, string> = { Positive: "#10B981", Neutral: "#6B7280", Negative: "#EF4444" };
  
  // 🛠️ Transform the data to inject the count directly into the X-Axis label
  const formattedData = data.map(item => ({
    ...item,
    displayLabel: `${item.sentiment} (${item.count})`
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
        
        <ReferenceLine y={0} stroke="#FFFFFF" strokeWidth={2} opacity={0.9} />

        {/* 🛠️ Map the X-Axis to our new custom label */}
        <XAxis 
          dataKey="displayLabel" 
          stroke="#fff" 
          tick={{ fontSize: 11, fontWeight: 900 }} 
          axisLine={false} 
          tickLine={false} 
          dy={10} 
        />
        
        <YAxis 
          stroke="#fff" 
          tick={{ fontSize: 11, fontWeight: 900 }} 
          axisLine={false} 
          tickLine={false} 
        />
        
        <Tooltip 
          cursor={{ fill: '#1F2937', opacity: 0.4 }}
          contentStyle={{ 
            backgroundColor: "#000", 
            borderColor: "#374151", 
            color: "#fff", 
            fontWeight: "900",
            fontSize: "12px",
            borderRadius: "8px"
          }} 
        />
        
        <Bar dataKey="count" name="Comments" radius={[4, 4, 0, 0]}>
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[entry.sentiment] || "#3B82F6"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}