"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartPoint {
  timestamp: number;
  value: number | null;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function TimeSeriesChart({
  points,
  label,
  color = "#2563eb",
}: {
  points: ChartPoint[];
  label: string;
  color?: string;
}) {
  const hasData = points.some((p) => p.value !== null);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        No historical data yet for {label}.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          tick={{ fontSize: 11 }}
          minTickGap={40}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={["auto", "auto"]}
          width={56}
        />
        <Tooltip
          labelFormatter={(ts) => (typeof ts === "number" ? formatTime(ts) : "")}
          formatter={(value) => [value === null || value === undefined ? "—" : value, label]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
