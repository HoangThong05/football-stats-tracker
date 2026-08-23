import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import PointsAreaChart from './PointsAreaChart'

/** Bieu do tong diem tich luy cua CHINH MINH (o trang Ho so). */
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

  // Diem tung du doan da cham, cu -> moi
  const points = [...history]
    .filter((h) => h.points != null)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .map((h) => h.points)

  // Duoi 3 diem du lieu thi duong ke chua thanh hinh, an di cho gon
  if (points.length < 3) return null

  const total = points.reduce((sum, p) => sum + p, 0)

  return (
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-1">{t('myp_chart_points_title')}</div>
      <PointsAreaChart points={points} ariaLabel={t('myp_chart_points_title')} />
      <div className="text-secondary small mt-2">
        {t('myp_points_cumulative_total')}{' '}
        <strong className="text-body ft-num">{total} {t('myp_points_suffix')}</strong>
      </div>
    </div>
  )
}
