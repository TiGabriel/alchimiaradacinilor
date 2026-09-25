import { cn } from "@/lib/utils";

/**
 * Small, dependency-free charts. Each renders the data as an SVG/CSS figure for
 * sighted users and as a table for screen readers.
 */
export function ColumnChart({
  data,
  format,
  caption,
  className,
}: {
  data: Array<{ label: string; value: number; tooltip: string }>;
  format: (value: number) => string;
  caption: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 600;
  const height = 180;
  const gap = 3;
  const barWidth = (width - gap * (data.length - 1)) / Math.max(1, data.length);
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        className="h-52 w-full"
        role="img"
        aria-label={caption}
        preserveAspectRatio="none"
      >
        <line x1="0" x2={width} y1={height} y2={height} className="stroke-line" strokeWidth="1" />
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 8);
          return (
            <rect
              key={d.label}
              x={i * (barWidth + gap)}
              y={height - h}
              width={barWidth}
              height={Math.max(h, d.value > 0 ? 2 : 0)}
              rx="2"
              className="fill-forest/80 hover:fill-forest"
            >
              <title>{d.tooltip}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="flex justify-between text-xs text-ink-muted">
        <span>{data[0]?.label}</span>
        <span>maxim {format(max)}</span>
        <span>{data.at(-1)?.label}</span>
      </figcaption>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function BarList({
  data,
  format = String,
  caption,
  empty = "Nu există date încă.",
}: {
  data: Array<{ label: string; value: number; note?: string }>;
  format?: (value: number) => string;
  caption: string;
  empty?: string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0))
    return <p className="text-sm text-ink-muted">{empty}</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody className="flex flex-col gap-3">
        {data.map((d) => (
          <tr key={d.label} className="flex flex-col gap-1">
            <th scope="row" className="flex justify-between gap-3 text-left font-normal">
              <span className="truncate font-semibold">{d.label}</span>
              <span className="shrink-0 text-ink-muted tabular-nums">
                {format(d.value)}
                {d.note ? ` · ${d.note}` : ""}
              </span>
            </th>
            <td aria-hidden className="h-2 overflow-hidden rounded-full bg-paper-deep">
              <span
                className="block h-full rounded-full bg-sage"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
