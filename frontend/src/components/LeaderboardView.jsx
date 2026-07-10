import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { RANK_MEDALS } from '../constants'
import { useTranslation } from '../i18n'
import Loading from './Loading'

export default function LeaderboardView({ token, userEmail, onBack }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/predictions/leaderboard`, { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

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

      {loading && <Loading />}
      {error && (
        <div className="alert alert-danger">
          {t('error_generic')} {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && <div className="alert alert-secondary">{t('lb_empty')}</div>}

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
                <tr key={r.email} className={r.email === userEmail ? 'table-active' : ''}>
                  <td>
                    {RANK_MEDALS[r.rank] ? (
                      <span className="ft-rank-medal">{RANK_MEDALS[r.rank]}</span>
                    ) : (
                      <span className="ft-pos">{r.rank}</span>
                    )}
                  </td>
                  <td className="fw-medium">
                    {r.email}
                    {r.email === userEmail && <span className="badge text-bg-success ms-2">{t('lb_you')}</span>}
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
