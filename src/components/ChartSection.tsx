import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { Player, RoundResult } from "../../types";

export function ChartSection({roundResults, players}: {roundResults: RoundResult[], players: Player[]}) {
  const roundChartData = roundResults.map((r) => {
    const data: Record<string, number> = { round: r.round };
    players.forEach((p, idx) => {
      data[p.name] = Math.abs(r.penalties[idx]);
    });
    return data;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={roundChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="round"
          label={{
            value: "Número de Ronda",
            position: "insideBottom",
            offset: -5,
          }}
        />
        <YAxis
          label={{
            value: "Años de penalidad en la ronda",
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip />
        <Legend />
        {players.map((p, idx) => (
          <Line
            key={p.id}
            type="monotone"
            dataKey={p.name}
            stroke={`hsl(${(idx * 360) / players.length}, 70%, 50%)`}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
