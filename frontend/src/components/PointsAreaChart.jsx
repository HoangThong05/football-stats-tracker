/**
 * Bieu do VUNG tong diem tich luy.
 *
 * @param {number[]} points diem tung du doan da cham, theo thu tu cu -> moi.
 *                          Ham tu cong don thanh duong tich luy.
 *
 * Dung chung cho ho so cua chinh minh va ho so cong khai cua nguoi khac.
 * Truc Y tu co gian theo tong diem nen duong LUON lap day chieu cao, du du lieu thua.
 */
export default function PointsAreaChart({ points, ariaLabel }) {
  let running = 0
  const cumulative = points.map((p) => {
    running += p
    return running
  })
  const total = running
  const maxY = Math.max(total, 1)
  const n = cumulative.length

  const W = 600
  const H = 150
  const padX = 10
  const top = 14
  const bottom = 132
  const x = (i) => (n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - 2 * padX))
  const y = (v) => bottom - (v / maxY) * (bottom - top)

  const pts = cumulative.map((v, i) => [x(i), y(v)])
  const line = 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ')
  const area = `M ${pts[0][0]} ${bottom} `
    + pts.map((p) => `L ${p[0]} ${p[1]} `).join('')
    + `L ${pts[n - 1][0]} ${bottom} Z`

  return (
    <div className="ft-area-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ft-area-svg"
        role="img" aria-label={ariaLabel}>
        <line className="ft-area-grid" x1="0" y1={top} x2={W} y2={top} vectorEffect="non-scaling-stroke" />
        <line className="ft-area-grid" x1="0" y1={bottom} x2={W} y2={bottom} vectorEffect="non-scaling-stroke" />
        <path className="ft-area-fill" d={area} />
        <path className="ft-area-line" d={line} vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Nhan truc Y la HTML de font khong bi keo dan theo SVG */}
      <span className="ft-area-ylabel ft-num" style={{ top: `${top}px` }}>{maxY}</span>
      <span className="ft-area-ylabel ft-num" style={{ top: `${bottom}px` }}>0</span>
    </div>
  )
}
