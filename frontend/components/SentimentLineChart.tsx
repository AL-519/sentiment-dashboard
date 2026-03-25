import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

export default function SentimentLineChart({ data, compareMode, platforms }: { data: any[], compareMode: boolean, platforms: string[] }) {
  const compareColors = ["#8B5CF6", "#3B82F6", "#EC4899", "#F59E0B"]; 

  // 🛠️ THE FIX: Map the data to include a strict numerical index
  // This guarantees Recharts will draw the line from left to right, even if timestamps are duplicated
  const chartData = data?.map((d, index) => ({
    ...d,
    stepSequence: index 
  })) || [];

  const calculateOffset = () => {
    if (chartData.length === 0 || compareMode || !platforms || platforms.length === 0) return 0;
    
    const key = platforms[0];
    let max = -Infinity;
    let min = Infinity;
    
    chartData.forEach(d => {
      const val = d[key];
      if (typeof val === 'number') {
        if (val > max) max = val;
        if (val < min) min = val;
      }
    });

    if (max === -Infinity || min === Infinity) return 0.5;

    if (max === min) {
      if (max > 0) return 1;
      if (max < 0) return 0;
      return 0.5;
    }

    if (max <= 0) return 0; 
    if (min >= 0) return 1; 

    return max / (max - min);
  };

  const off = calculateOffset();

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
        
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="#10B981" stopOpacity={1} />
            <stop offset={off} stopColor="#EF4444" stopOpacity={1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
        <ReferenceLine y={0} stroke="#FFFFFF" strokeWidth={2} opacity={0.9} />

        {/* 🛠️ THE FIX: Set type to "number" and dataKey to our sequential index */}
        <XAxis 
          dataKey="stepSequence" 
          type="number" 
          domain={['dataMin', 'dataMax']} 
          tick={false} 
          axisLine={false} 
          tickLine={false} 
        />
        
        <YAxis stroke="#fff" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        
        <Tooltip contentStyle={{ backgroundColor: "#000", borderColor: "#374151", color: "#fff", fontWeight: "bold" }} labelStyle={{ display: "none" }} />
        <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "900", color: "#fff", bottom: 10 }} />
        
        {compareMode ? (
          platforms.map((p, idx) => (
             <Line key={p} type="linear" dataKey={p} name={p} stroke={compareColors[idx % compareColors.length]} strokeWidth={3} dot={false} isAnimationActive={false} />
          ))
        ) : (
          platforms.map((p) => (
             <Line key={p} type="linear" dataKey={p} name="Net Sentiment" stroke="url(#splitColor)" strokeWidth={3} dot={false} isAnimationActive={false} />
          ))
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}