import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Bieu do VUNG tong diem tich luy theo thoi gian (cu -> moi).
 *
 * Vi sao khong dung bieu do cot tung tran: da so du doan chi duoc 0-1 diem, ma truc cot
 * co dinh toi 3, nen cot lun tit nhin nhu trong. Tong tich luy thi truc Y tu co gian
 * theo tong diem -> duong LUON lap day chieu cao, du du lieu thua hay day.
 */
export default function PredictionPointsChart({ token }) {
  const { t } = useTranslation()
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!token) {
      setHistory([])
      return
    }
    fetch(`${API_BASE}/predictions/mine`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHistory(data))
      .catch(() => setHistory([]))
  }, [token])

  // Chi tinh du doan DA duoc cham diem, cu -> moi
  const scored = [...history]
    .filter((h) => h.points != null)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))

  // Duoi 3 diem du lieu thi duong ke chua thanh hinh, an di cho gon
  if (scored.length < 3) return null

  // Cong don diem qua tung tran
  let running = 0
  const cumulative = scored.map((h) => {
    running += h.points
    return running
  })
  const total = running
  const maxY = Math.max(total, 1)
  const n = cumulative.length

  /*
   * SVG keo dan het be ngang the (preserveAspectRatio none): truc X gian theo do rong,
   * truc Y giu nguyen 150 don vi = 150px, nen KHONG bi meo theo chieu doc. Net ke giu
   * deu bang vector-effect non-scaling-stroke.
   */
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
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-1">{t('myp_chart_points_title')}</div>

      <div className="ft-area-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ft-area-svg"
          role="img" aria-label={t('myp_chart_points_title')}>
          <line className="ft-area-grid" x1="0" y1={top} x2={W} y2={top} vectorEffect="non-scaling-stroke" />
          <line className="ft-area-grid" x1="0" y1={bottom} x2={W} y2={bottom} vectorEffect="non-scaling-stroke" />
          <path className="ft-area-fill" d={area} />
          <path className="ft-area-line" d={line} vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Nhan truc Y la HTML de font khong bi keo dan theo SVG */}
        <span className="ft-area-ylabel ft-num" style={{ top: `${top}px` }}>{maxY}</span>
        <span className="ft-area-ylabel ft-num" style={{ top: `${bottom}px` }}>0</span>
      </div>

      <div className="text-secondary small mt-2">
        {t('myp_points_cumulative_total')}{' '}
        <strong className="text-body ft-num">{total} {t('myp_points_suffix')}</strong>
      </div>
    </div>
  )
}
