import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartSkeleton, EmptyState } from "./ChartCard";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
];

const axisProps = {
  stroke: "var(--color-border)",
  tick: { fill: "var(--color-muted-foreground)", fontSize: 11 },
  tickLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "var(--color-popover-foreground)",
    boxShadow: "var(--shadow-card)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: "11px" },
} as const;

function Frame({
  height,
  empty,
  emptyMessage,
  children,
}: {
  height: number;
  empty: boolean;
  emptyMessage?: string | undefined;
  children: React.ReactElement;
}) {
  const hydrated = useHydrated();
  if (empty) return <EmptyState height={height} {...(emptyMessage ? { message: emptyMessage } : {})} />;
  if (!hydrated) return <ChartSkeleton height={height} />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

export function TrendChart({
  data,
  series,
  height = 300,
  type = "area",
}: {
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  height?: number | undefined;
  type?: "area" | "line" | undefined;
}) {
  const empty = data.every((d) => series.every((s) => !(d[s.key] as number)));
  const Chart = type === "area" ? AreaChart : LineChart;
  return (
    <Frame height={height} empty={empty}>
      <Chart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axisProps} width={48} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
        />
        {series.map((s) =>
          type === "area" ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ),
        )}
      </Chart>
    </Frame>
  );
}

export function ColumnChart({
  data,
  height = 260,
  color = "var(--color-chart-1)",
  onSelect,
  activeName,
}: {
  data: { name?: string; label?: string; value: number }[];
  height?: number | undefined;
  color?: string | undefined;
  onSelect?: ((name: string) => void) | undefined;
  activeName?: string | null | undefined;
}) {
  const empty = data.every((d) => !d.value);
  const key = data[0] && "label" in data[0] ? "label" : "name";
  return (
    <Frame height={height} empty={empty}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={key} {...axisProps} interval="preserveStartEnd" minTickGap={16} />
        <YAxis {...axisProps} width={48} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
        <Bar
          dataKey="value"
          name="Enquiries"
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
          {...(onSelect
            ? {
                onClick: (d: { name?: string; label?: string }) =>
                  onSelect(String(d.name ?? d.label)),
                cursor: "pointer",
              }
            : {})}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={color}
              opacity={activeName && activeName !== (d.name ?? d.label) ? 0.35 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function HorizontalBarChart({
  data,
  height = 280,
  color = "var(--color-chart-1)",
  onSelect,
  activeName,
  valueLabel = "Customers",
}: {
  data: { name: string; value: number; pct?: number }[];
  height?: number | undefined;
  color?: string | undefined;
  onSelect?: ((name: string) => void) | undefined;
  activeName?: string | null | undefined;
  valueLabel?: string | undefined;
}) {
  const empty = data.length === 0 || data.every((d) => !d.value);
  return (
    <Frame height={height} empty={empty}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axisProps} width={130} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
        <Bar
          dataKey="value"
          name={valueLabel}
          radius={[0, 6, 6, 0]}
          maxBarSize={22}
          {...(onSelect ? { onClick: (d: { name: string }) => onSelect(d.name), cursor: "pointer" } : {})}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={color} opacity={activeName && activeName !== d.name ? 0.35 : 1} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function DonutChart({
  data,
  height = 280,
  onSelect,
  activeName,
}: {
  data: { name: string; value: number }[];
  height?: number | undefined;
  onSelect?: ((name: string) => void) | undefined;
  activeName?: string | null | undefined;
}) {
  const empty = data.length === 0 || data.every((d) => !d.value);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="lg:w-1/2">
        <Frame height={height} empty={empty}>
          <PieChart>
            <Tooltip {...tooltipStyle} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
              {...(onSelect
                ? { onClick: (d: { name: string }) => onSelect(d.name), cursor: "pointer" }
                : {})}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={PALETTE[i % PALETTE.length]}
                  opacity={activeName && activeName !== d.name ? 0.35 : 1}
                />
              ))}
            </Pie>
          </PieChart>
        </Frame>
      </div>
      {!empty && (
        <ul className="flex flex-1 flex-col gap-2">
          {data.map((d, i) => (
            <li key={d.name}>
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(d.name)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  onSelect && "hover:bg-secondary",
                  activeName === d.name && "bg-secondary",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <span className="flex-1 truncate">{d.name}</span>
                <span className="tabular font-semibold">{d.value}</span>
                <span className="tabular w-12 text-right text-xs text-muted-foreground">
                  {total ? ((d.value / total) * 100).toFixed(1) : "0.0"}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { PALETTE };
