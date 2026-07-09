"use client";

/**
 * Radar chart over the six ethical-reasoning dimensions. Renders one or two
 * overlaid polygons (e.g. pretest vs current, or pretest vs posttest). Uses the
 * ATBU green for the "after" series and a muted gold for the pretest baseline.
 * Values are percentages (0–100) so the axes are comparable across dimensions.
 */
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface RadarSeries {
  key: string;
  label: string;
  /** CSS colour. */
  color: string;
}

export interface RadarDatum {
  dimension: string; // short label for the axis
  [seriesKey: string]: string | number;
}

export default function DimensionRadar({
  data,
  series,
  height = 340,
}: {
  data: RadarDatum[];
  series: RadarSeries[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border-color)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
          />
          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.label}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.25}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
