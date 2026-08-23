import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { RANK_MEDALS } from '../constants'
import { useTranslation } from '../i18n'
import Avatar from './Avatar'
import Loading from './Loading'

/**
 * Moc dau (thu 2, 00:00) va cuoi (thu 2 tuan sau) cua tuan, theo MUI GIO nguoi xem.
 *
 * offset: 0 = tuan nay, -1 = tuan truoc... Tinh o frontend roi gui moc ISO len backend
 * (toISOString tu doi ve UTC) nen "tuan" khop voi lich nguoi dung nhin thay.
 */
function weekRange(offset) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = CN, 1 = T2, ... 6 = T7
  const toMonday = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + toMonday + offset * 7)
  const from = new Date(d)
  const to = new Date(d)
  to.setDate(to.getDate() + 7)
  const sunday = new Date(to)
  sunday.setDate(sunday.getDate() - 1)
  return { from, to, monday: from, sunday }
}

export default function LeaderboardView({ token, myName, onBack, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // 'week' = theo tuan (mac dinh, la diem moi cua tinh nang), 'all' = toan mua
  const [period, setPeriod] = useState('week')
  // 0 = tuan nay, -1 = tuan truoc... (chi dung khi period === 'week')
  const [weekOffset, setWeekOffset] = useState(0)

  const week = weekRange(weekOffset)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const url = period === 'week'
      ? `${API_BASE}/predictions/leaderboard/period?from=${encodeURIComponent(week.from.toISOString())}&to=${encodeURIComponent(week.to.toISOString())}`
      : `${API_BASE}/predictions/leaderboard`

    fetch(url, { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    // week.from/to doi theo weekOffset nen dua weekOffset vao dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, period, weekOffset])

  const dm = (d) => d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' })
  const weekLabel = `${dm(week.monday)} – ${dm(week.sunday)}`

  const emptyMessage = period === 'week' ? t('lb_week_empty') : t('lb_empty')

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <h3 className="h5 mb-3">{t('lb_title')}</h3>
      <p className="text-secondary small">
        {t('lb_scoring_rule_prefix')} <strong>{t('lb_scoring_rule_exact')}</strong> {t('lb_scoring_rule_mid')}{' '}
        <strong>{t('lb_scoring_rule_partial')}</strong>
      </p>

      {/* Nut chuyen Toan mua / Tuan nay */}
      <div className="btn-group mb-3" role="group">
        <button
          className={`btn btn-sm ${period === 'week' ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => setPeriod('week')}
        >
          {t('lb_period_week')}
        </button>
        <button
          className={`btn btn-sm ${period === 'all' ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => setPeriod('all')}
        >
          {t('lb_period_all')}
        </button>
      </div>

      {/* Dieu huong tuan - chi hien khi dang xem theo tuan */}
      {period === 'week' && (
        <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
          <button className="btn btn-sm btn-outline-secondary"
            title={t('lb_week_prev')}
            onClick={() => setWeekOffset((w) => w - 1)}>
            ‹
          </button>
          <span className="fw-medium ft-num">{weekLabel}</span>
          <button className="btn btn-sm btn-outline-secondary"
            title={t('lb_week_next')}
            disabled={weekOffset >= 0}
            onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}>
            ›
          </button>
        </div>
      )}

      {loading && <Loading />}
      {error && (
        <div className="alert alert-danger">
          {t('error_generic')} {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="alert alert-secondary">{emptyMessage}</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="ft-card table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>{t('lb_col_rank')}</th>
                <th>{t('lb_col_player')}</th>
                <th className="text-center">{t('lb_col_predictions')}</th>
                <th className="text-center">{t('lb_col_points')}</th>
              </tr>
            </thead>
            <tbody className="ft-stagger">
              {rows.map((r) => (
                <tr key={r.name} className={r.name === myName ? 'table-active' : ''}>
                  <td>
                    {RANK_MEDALS[r.rank] ? (
                      <span className="ft-rank-medal">{RANK_MEDALS[r.rank]}</span>
                    ) : (
                      <span className="ft-pos">{r.rank}</span>
                    )}
                  </td>
                  <td className="fw-medium">
                    <span className="d-inline-flex align-items-center gap-2" style={{ maxWidth: '100%' }}>
                      {/* width auto: nut khong chiem het hang nen huy hieu "Ban" nam sat canh ten, khong bi day xuong dong */}
                      <button type="button" className="ft-lb-player" style={{ width: 'auto' }}
                        onClick={() => onSelectUser(r.userId)}>
                        <Avatar name={r.name} src={r.avatarUrl} size={28} />
                        <span className="ft-name-link fw-medium text-truncate">{r.name}</span>
                      </button>
                      {r.name === myName && <span className="badge text-bg-success flex-shrink-0">{t('lb_you')}</span>}
                    </span>
                  </td>
                  <td className="text-center">{r.totalPredictions}</td>
                  <td className="text-center fw-bold fs-6">{r.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
