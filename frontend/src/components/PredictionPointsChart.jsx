import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { formatKickoff } from '../utils'
import { useTranslation } from '../i18n'
import BarChart from './BarChart'

/** Bieu do cot: diem tung du doan da cham theo thoi gian (cu -> moi), toi da 20 tran gan nhat. */
export default function PredictionPointsChart({ token }) {
  const { t, lang } = useTranslation()
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

  const pointsOverTime = [...history]
    .filter((h) => h.points != null)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(-20)
    .map((h) => ({
      label: formatKickoff(h.utcDate, lang),
      value: h.points,
      homeTeam: h.homeTeam,
      awayTeam: h.awayTeam,
    }))

  if (pointsOverTime.length < 3) return null

  return (
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-1">{t('myp_chart_points_title')}</div>
      <BarChart
        data={pointsOverTime}
        max={3}
        gridLines={[1, 3]}
        showXLabels={false}
        valueFormatter={(v) => `${v} ${t('myp_points_suffix')}`}
        tooltipLabel={(d) => `${d.homeTeam} - ${d.awayTeam} · ${d.label}`}
        ariaLabel={t('myp_chart_points_title')}
      />
    </div>
  )
}
