"use client";

import {
  Area,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { bandOf, type Band } from "@/lib/alertness";
import type { Forecast } from "@/lib/forecast";
import type { EventType } from "@/lib/schedule";
import { formatClock } from "@/lib/time";

type Row = { x: number; t: number; index: number | null; band: Band | null };

const EVENT_COLOUR: Record<EventType, string> = {
  class: "var(--color-sage)",
  exam: "var(--color-coral)",
  work: "var(--color-lilac)",
  other: "var(--color-haze)",
};

const minutesInto = (t: number, dayStart: number) => Math.round((t - dayStart) / 60_000);

/** Contiguous [start, end) runs (in minutes) where `test` holds. */
function runs(rows: Row[], test: (r: Row) => boolean): [number, number][] {
  const out: [number, number][] = [];
  let start: number | null = null;
  rows.forEach((r, i) => {
    if (test(r) && start === null) start = r.x;
    if ((!test(r) || i === rows.length - 1) && start !== null) {
      out.push([start, test(r) ? r.x + 15 : r.x]);
      start = null;
    }
  });
  return out;
}

const hourLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24;
  if (h === 0) return "12 a.m.";
  if (h === 12) return "Noon";
  return h < 12 ? `${h} a.m.` : `${h - 12} p.m.`;
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0e1329]/95 px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-starlight tabular">{formatClock(row.t)}</p>
      <p className="text-haze">
        {row.index === null
          ? "Asleep"
          : `Alertness ${Math.round(row.index)}${row.band ? ` (${row.band})` : ""}`}
      </p>
    </div>
  );
}

export function AlertnessChart({
  forecast,
  compact = false,
}: {
  forecast: Forecast;
  compact?: boolean;
}) {
  const dayStart = forecast.points[0]?.t ?? 0;
  const rows: Row[] = forecast.points.map((p) => ({
    x: minutesInto(p.t, dayStart),
    t: p.t,
    index: p.asleep || !Number.isFinite(p.index) ? null : Math.round(p.index * 10) / 10,
    band:
      !p.asleep && forecast.bands && Number.isFinite(p.index)
        ? bandOf(p.index, forecast.bands)
        : null,
  }));
  const lowRuns = runs(rows, (r) => r.band === "low");
  const sleepRuns = runs(rows, (r) => r.index === null);
  const gradientId = compact ? "alert-fill-compact" : "alert-fill";

  return (
    <div className={compact ? "h-36" : "h-64 sm:h-72 lg:h-80"}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(243 223 165)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(243 223 165)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {sleepRuns.map(([a, b]) => (
            <ReferenceArea
              key={`s${a}`}
              x1={a}
              x2={b}
              y1={0}
              y2={100}
              fill="rgb(230 194 222)"
              fillOpacity={0.1}
              ifOverflow="hidden"
            />
          ))}
          {lowRuns.map(([a, b]) => (
            <ReferenceArea
              key={`l${a}`}
              x1={a}
              x2={b}
              y1={0}
              y2={100}
              fill="rgb(253 94 72)"
              fillOpacity={0.13}
              stroke="rgb(253 94 72)"
              strokeOpacity={0.35}
              strokeDasharray="3 4"
              ifOverflow="hidden"
            />
          ))}
          {!compact && forecast.bands && (
            <ReferenceLine
              y={forecast.bands.lowBelow}
              stroke="rgb(253 94 72)"
              strokeOpacity={0.4}
              strokeDasharray="2 4"
            />
          )}

          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 1440]}
            ticks={compact ? [360, 720, 1080] : [0, 360, 720, 1080, 1440]}
            tickFormatter={hourLabel}
            tick={{ fill: "rgb(201 204 227 / 0.75)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgb(255 255 255 / 0.1)" }}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={compact ? false : { fill: "rgb(201 204 227 / 0.6)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={compact ? 4 : 32}
          />
          {!compact && (
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgb(255 255 255 / 0.25)" }} />
          )}

          <Area
            type="monotone"
            dataKey="index"
            stroke="var(--color-moon)"
            strokeWidth={compact ? 1.75 : 2.25}
            fill={`url(#${gradientId})`}
            connectNulls={false}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-moon)", stroke: "none" }}
            style={{ filter: "drop-shadow(0 0 6px rgb(243 223 165 / 0.45))" }}
          />

          {/* Schedule events as bars along the bottom of the chart. */}
          {forecast.events.map((e) => (
            <ReferenceArea
              key={e.id}
              x1={Math.max(0, minutesInto(Date.parse(e.start), dayStart))}
              x2={Math.min(1440, minutesInto(Date.parse(e.end), dayStart))}
              y1={0}
              y2={compact ? 8 : 6}
              fill={EVENT_COLOUR[e.type]}
              fillOpacity={0.85}
              ifOverflow="hidden"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Accessible alternative: hourly values as a table. */
export function AlertnessTable({ forecast }: { forecast: Forecast }) {
  const hourly = forecast.points.filter((_, i) => i % 4 === 0);
  return (
    <table className="mt-3 w-full text-left text-sm">
      <caption className="sr-only">Predicted alertness tomorrow, hourly</caption>
      <thead className="text-haze">
        <tr>
          <th scope="col" className="py-1 font-medium">
            Time
          </th>
          <th scope="col" className="py-1 font-medium">
            Alertness (0–100)
          </th>
          <th scope="col" className="py-1 font-medium">
            Band
          </th>
        </tr>
      </thead>
      <tbody className="tabular">
        {hourly.map((p) => (
          <tr key={p.t} className="border-t border-white/5">
            <td className="py-1">{formatClock(p.t)}</td>
            <td className="py-1">
              {p.asleep || !Number.isFinite(p.index) ? "Asleep" : Math.round(p.index)}
            </td>
            <td className="py-1 capitalize">
              {p.asleep || !forecast.bands || !Number.isFinite(p.index)
                ? "–"
                : bandOf(p.index, forecast.bands)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
