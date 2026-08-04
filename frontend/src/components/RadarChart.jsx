/**
 * Bieu do radar bang SVG thuan, khong dung thu vien ngoai (giong BarChart).
 *
 * Moi chuoi du lieu la mot da giac. Gia tri truyen vao PHAI da chuan hoa ve 0..1;
 * viec chuan hoa de ben goi lo, vi chi ben do moi biet lay moc so sanh o dau.
 *
 * Tuong tac dung <title> cua SVG - trinh duyet tu hien tooltip khi ro chuot, va
 * trinh doc man hinh cung doc duoc. Khong ton mot dong JS state nao.
 *
 * @param {{key: string, label: string}[]} axes
 * @param {{name: string, color: string, values: number[], raw: string[]}[]} series
 */
const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 72
const LABEL_RADIUS = RADIUS + 20
const RINGS = [0.25, 0.5, 0.75, 1]

/** Goc cua truc thu i. Tru PI/2 de truc dau tien chi thang len tren. */
function angleOf(i, total) {
  return -Math.PI / 2 + (i * 2 * Math.PI) / total
}

function pointAt(ratio, i, total) {
  const a = angleOf(i, total)
  return [CENTER + RADIUS * ratio * Math.cos(a), CENTER + RADIUS * ratio * Math.sin(a)]
}

function polygonPoints(values, total) {
  return values.map((v, i) => pointAt(v, i, total).join(',')).join(' ')
}

export default function RadarChart({ axes, series, ariaLabel }) {
  const n = axes.length
  if (n < 3) return null

  return (
    <svg
      className="ft-radar"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Luoi nen: cac vong da giac dong tam */}
      {RINGS.map((r) => (
        <polygon
          key={r}
          className="ft-radar-grid"
          points={polygonPoints(Array(n).fill(r), n)}
        />
      ))}

      {/* Nan hoa tu tam ra tung truc */}
      {axes.map((axis, i) => {
        const [x, y] = pointAt(1, i, n)
        return <line key={axis.key} className="ft-radar-spoke" x1={CENTER} y1={CENTER} x2={x} y2={y} />
      })}

      {/* Da giac cua tung doi. Ve truoc nhan de nhan luon nam tren cung */}
      {series.map((s) => (
        <polygon
          key={s.name}
          className="ft-radar-area"
          points={polygonPoints(s.values, n)}
          style={{ '--ft-radar-color': s.color }}
        />
      ))}

      {/* Dinh: cham tron mang tooltip gia tri THAT (chua chuan hoa) */}
      {series.map((s) =>
        s.values.map((v, i) => {
          const [x, y] = pointAt(v, i, n)
          return (
            <circle
              key={`${s.name}-${axes[i].key}`}
              className="ft-radar-dot"
              cx={x}
              cy={y}
              r="3"
              style={{ '--ft-radar-color': s.color }}
            >
              <title>{`${s.name} — ${axes[i].label}: ${s.raw[i]}`}</title>
            </circle>
          )
        }),
      )}

      {/* Nhan truc, tu canh chan chu theo phia de khong de len da giac */}
      {axes.map((axis, i) => {
        const a = angleOf(i, n)
        const x = CENTER + LABEL_RADIUS * Math.cos(a)
        const y = CENTER + LABEL_RADIUS * Math.sin(a)
        const cos = Math.cos(a)
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text
            key={axis.key}
            className="ft-radar-label"
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            {axis.label}
          </text>
        )
      })}
    </svg>
  )
}
