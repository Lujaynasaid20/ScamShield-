"use client";

import { useState } from "react";

// Status colors are reserved for verdicts and always shown with a label in the legend and tooltip.
const SERIES = [
  { key: "scam", label: "Scam", color: "var(--danger-mark)", icon: "bi-x-octagon-fill" },
  { key: "suspicious", label: "Suspicious", color: "var(--warn-mark)", icon: "bi-exclamation-triangle-fill" },
  { key: "safe", label: "Safe", color: "var(--safe-mark)", icon: "bi-check-circle-fill" }
];

function niceMax(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].map(multiple => multiple * magnitude).find(candidate => candidate * 4 >= value);
  return step * 4;
}

const dayLabel = day => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${day}T00:00:00`));

export function ActivityChart({ daily, title = "Activity over the last 14 days" }) {
  const [hover, setHover] = useState(null);
  const totals = daily.map(day => SERIES.reduce((sum, series) => sum + day[series.key], 0));
  const max = niceMax(Math.max(0, ...totals));
  const ticks = [0, max / 2, max];

  return (
    <figure className="chart m-0" aria-label={title}>
      <div className="chart-legend" aria-hidden="true">
        {SERIES.map(series => <span key={series.key}><span className="swatch" style={{ background: series.color }} />{series.label}</span>)}
      </div>
      <div className="chart-plot" onMouseLeave={() => setHover(null)}>
        {ticks.map(tick => <div key={tick} className="chart-gridline" style={{ bottom: `${(tick / max) * 100}%` }}><span>{tick}</span></div>)}
        {daily.map((day, index) => (
          <button
            type="button"
            key={day.day}
            className="chart-col"
            aria-label={`${dayLabel(day.day)}: ${SERIES.map(series => `${day[series.key]} ${series.label.toLowerCase()}`).join(", ")}`}
            onMouseEnter={() => setHover(index)}
            onFocus={() => setHover(index)}
            onBlur={() => setHover(null)}
          >
            {SERIES.map(series => day[series.key] > 0 && (
              <span key={series.key} className="chart-seg" style={{ height: `calc(${(day[series.key] / max) * 100}% - 2px)`, minHeight: 3, background: series.color }} />
            ))}
          </button>
        ))}
        {hover !== null && (
          <div className="chart-tooltip" style={{ left: `calc(2.2rem + (100% - 2.2rem) * ${(hover + 0.5) / daily.length})`, bottom: `${Math.min(100, (totals[hover] / max) * 100)}%` }}>
            <div className="fw-bold mb-1">{dayLabel(daily[hover].day)} · {totals[hover]} check{totals[hover] === 1 ? "" : "s"}</div>
            {SERIES.map(series => <div className="row-line" key={series.key}><span className="swatch" style={{ background: series.color }} />{series.label}: {daily[hover][series.key]}</div>)}
          </div>
        )}
      </div>
      <div className="chart-x" aria-hidden="true">
        {daily.map((day, index) => <span key={day.day}>{(daily.length - 1 - index) % 4 === 0 ? dayLabel(day.day) : ""}</span>)}
      </div>
      <details className="table-toggle">
        <summary>Show as table</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th scope="col">Day</th>{SERIES.map(series => <th scope="col" key={series.key}>{series.label}</th>)}<th scope="col">Total</th></tr></thead>
            <tbody>{daily.map((day, index) => <tr key={day.day}><td>{dayLabel(day.day)}</td>{SERIES.map(series => <td key={series.key}>{day[series.key]}</td>)}<td>{totals[index]}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function BarList({ items, emptyText = "No data yet." }) {
  if (!items.length) return <p className="muted mb-0">{emptyText}</p>;
  const max = Math.max(...items.map(item => item.count));
  return (
    <ul className="bar-list">
      {items.map(item => (
        <li key={item.label}>
          <div className="bar-list-label"><span>{item.label}</span><strong>{item.count}</strong></div>
          <div className="bar-track" aria-hidden="true"><div className="bar-fill" style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
