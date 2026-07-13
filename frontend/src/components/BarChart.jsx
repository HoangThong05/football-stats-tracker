/**
 * Bieu do cot don gian bang HTML/CSS (khong dung thu vien ngoai).
 * 1 chuoi du lieu duy nhat -> khong can chu thich mau, truc X da mang danh tinh.
 * Tooltip hien qua CSS :hover/:focus-visible, khong can JS state.
 */
export default function BarChart({
  data,
  color = 'var(--ft-accent)',
  max,
  height = 140,
  showXLabels = true,
  showValueCap = false,
  gridLines = [],
  valueFormatter = (v) => v,
  tooltipLabel = (d) => d.label,
  ariaLabel,
}) {
  const maxValue = max ?? Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="ft-barchart" role="img" aria-label={ariaLabel}>
      <div className="ft-barchart-plot" style={{ height }}>
        {gridLines.map((g) => (
          <div key={g} className="ft-barchart-gridline" style={{ bottom: `${(g / maxValue) * 100}%` }}>
            <span>{g}</span>
          </div>
        ))}
        {data.map((d, i) => {
          const pct = d.value > 0 ? Math.max((d.value / maxValue) * 100, 3) : 0
          return (
            <div className="ft-bar-col" key={i} tabIndex={0}>
              <div className="ft-bar-tooltip">
                <strong>{valueFormatter(d.value)}</strong>
                <span>{tooltipLabel(d)}</span>
              </div>
              {showValueCap && <div className="ft-bar-value-cap">{valueFormatter(d.value)}</div>}
              <div className="ft-bar" style={{ height: `${pct}%`, background: d.color || color }} />
              {showXLabels && <div className="ft-bar-axis-label">{d.label}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
