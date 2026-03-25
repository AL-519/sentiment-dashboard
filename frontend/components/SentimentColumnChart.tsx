import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

export default function SentimentColumnChart({ data, platforms }: { data: any[], platforms: string[] }) {
  const compareColors = ["#8B5CF6", "#3B82F6", "#EC4899", "#F59E0B"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
        
        <ReferenceLine y={0} stroke="#FFFFFF" strokeWidth={2} opacity={0.9} />

        <XAxis dataKey="sentiment" stroke="#fff" tick={{ fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} dy={10} />
        <YAxis stroke="#fff" tick={{ fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
        
        {/* 🛠️ UPGRADE: Added the slick cursor and custom formatter for platform comparison */}
        <Tooltip 
          cursor={{ fill: '#1F2937', opacity: 0.4 }}
          formatter={(value: any, name: any) => [value, `${name} Comments`]}
          contentStyle={{ 
            backgroundColor: "#000", 
            borderColor: "#374151", 
            color: "#fff", 
            fontWeight: "900",
            fontSize: "12px",
            borderRadius: "8px"
          }} 
        />
        
        <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "900", color: "#fff", bottom: -5 }} />
        
        {/* Auto-capitalize the platform name for a cleaner tooltip/legend */}
        {platforms.map((p, idx) => (
          <Bar 
            key={p} 
            dataKey={p} 
            name={p.charAt(0).toUpperCase() + p.slice(1)} 
            fill={compareColors[idx % compareColors.length]} 
            radius={[4, 4, 0, 0]} 
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}