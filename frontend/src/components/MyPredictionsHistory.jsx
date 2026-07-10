import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { formatKickoff } from '../utils'
import { useTranslation } from '../i18n'
import Loading from './Loading'

export default function MyPredictionsHistory({ token, onBack }) {
  const { t, lang } = useTranslation()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/predictions/mine`, { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setHistory(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const scored = history.filter((h) => h.points != null)
  const totalPoints = scored.reduce((sum, h) => sum + h.points, 0)

  const pointsBadgeClass = (points) => {
    if (points === 3) return 'badge text-bg-success'
    if (points === 1) return 'badge text-bg-warning'
    return 'badge text-bg-secondary'
  }

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <h3 className="h5 mb-1">{t('myp_title')}</h3>
      {scored.length > 0 && (
        <p className="text-secondary small mb-3">
          {t('myp_scored_prefix')} <strong>{scored.length}</strong> {t('myp_scored_mid')}{' '}
          <strong className="text-success">{totalPoints} {t('myp_scored_suffix')}</strong>
        </p>
      )}

      {loading && <Loading />}
      {error && (
        <div className="alert alert-danger">
          {t('error_generic')} {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="alert alert-secondary">{t('myp_empty')}</div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="ft-card">
          <ul className="list-group list-group-flush ft-stagger">
            {history.map((h) => (
              <li key={h.matchId} className="list-group-item py-3">
                <div className="d-flex align-items-center flex-wrap gap-3">
                  <small className="text-secondary" style={{ minWidth: 132 }}>
                    {formatKickoff(h.utcDate, lang)}
                    <div className="text-body-tertiary">{h.competition}</div>
                  </small>

                  <div
                    className="d-flex align-items-center justify-content-end gap-2 flex-grow-1"
                    style={{ minWidth: 0 }}
                  >
                    <span className="text-truncate fw-medium">{h.homeTeam}</span>
                    {h.homeCrest && <img src={h.homeCrest} alt="" width="20" height="20" loading="lazy" />}
                  </div>

                  <div className="text-center" style={{ minWidth: 90 }}>
                    <div className="small text-secondary">{t('myp_your_guess')}</div>
                    <div className="fw-bold">
                      {h.predictedHomeScore} - {h.predictedAwayScore}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                    {h.awayCrest && <img src={h.awayCrest} alt="" width="20" height="20" loading="lazy" />}
                    <span className="text-truncate fw-medium">{h.awayTeam}</span>
                  </div>

                  <div style={{ minWidth: 96 }} className="text-center">
                    {h.points != null ? (
                      <>
                        <div className="small text-secondary">
                          {t('myp_result_prefix')} {h.actualHomeScore}-{h.actualAwayScore}
                        </div>
                        <span className={pointsBadgeClass(h.points)}>+{h.points} {t('myp_points_suffix')}</span>
                      </>
                    ) : (
                      <span className="badge text-bg-light text-muted border">{t('myp_not_played')}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
