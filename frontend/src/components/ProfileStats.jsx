import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Dai so lieu tom tat, nam trong the dau trang Ho so.
 *
 * Tinh tu /predictions/mine - cung nguon voi trang Lich su, khong them endpoint moi.
 * Chua du doan tran nao thi khong hien gi ca, tranh mot hang toan so 0.
 *
 * Khong tu boc .ft-card: no la mot dai nam BEN TRONG the ho so, khong phai the rieng.
 */
export default function ProfileStats({ token }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    fetch(`${API_BASE}/predictions/mine`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [token])

  if (rows.length === 0) return null

  const scored = rows.filter((r) => r.points != null)
  const points = scored.reduce((sum, r) => sum + r.points, 0)
  const exact = scored.filter((r) => r.points === 3).length
  // Ti le "co diem", khong phai ti le trung ti so - gom ca doan dung thang/hoa/thua
  const hitRate = scored.length ? Math.round((scored.filter((r) => r.points > 0).length / scored.length) * 100) : 0

  const cell = (label, value) => (
    <div className="ft-profile-stat">
      <span className="ft-num fw-bold">{value}</span>
      <span className="ft-profile-stat-label">{label}</span>
    </div>
  )

  return (
    <div className="ft-profile-stats">
      {cell(t('stats_points'), points)}
      {cell(t('stats_predicted'), rows.length)}
      {cell(t('stats_exact'), exact)}
      {cell(t('stats_hit_rate'), `${hitRate}%`)}
    </div>
  )
}
