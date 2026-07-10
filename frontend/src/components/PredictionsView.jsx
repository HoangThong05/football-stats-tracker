import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { formatKickoff } from '../utils'
import { useTranslation } from '../i18n'

export default function PredictionsView({ matches, token, onRefresh }) {
  const { t, lang } = useTranslation()
  // Luu ti so dang nhap cho tung tran: { [matchId]: { home: '2', away: '1' } }
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [errorId, setErrorId] = useState(null)

  useEffect(() => {
    const initial = {}
    for (const m of matches) {
      initial[m.matchId] = {
        home: m.myHomeScore ?? '',
        away: m.myAwayScore ?? '',
      }
    }
    setDrafts(initial)
  }, [matches])

  const setDraft = (matchId, field, value) => {
    setDrafts((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }))
  }

  const submit = (matchId) => {
    const draft = drafts[matchId]
    const home = Number(draft?.home)
    const away = Number(draft?.away)
    if (draft?.home === '' || draft?.away === '' || Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
      setErrorId(matchId)
      return
    }

    setErrorId(null)
    setSavingId(matchId)

    fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        onRefresh()
      })
      .catch(() => setErrorId(matchId))
      .finally(() => setSavingId(null))
  }

  if (matches.length === 0) {
    return (
      <div className="alert alert-secondary d-flex align-items-center gap-2">
        <span style={{ fontSize: '1.3rem' }}>🎯</span>
        <span>{t('predict_empty')}</span>
      </div>
    )
  }

  return (
    <div>
      {!token && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <span>{t('predict_login_hint')}</span>
        </div>
      )}

      <div className="ft-card">
        <ul className="list-group list-group-flush ft-stagger">
          {matches.map((m) => {
            const draft = drafts[m.matchId] || { home: '', away: '' }
            const already = m.myHomeScore != null

            return (
              <li key={m.matchId} className="list-group-item py-3">
                <div className="d-flex align-items-center flex-wrap gap-3">
                  <small className="text-secondary" style={{ minWidth: 132 }}>
                    {formatKickoff(m.utcDate, lang)}
                    {m.matchday != null && (
                      <span className="text-body-tertiary"> {t('matches_matchday_prefix')} {m.matchday}</span>
                    )}
                  </small>

                  <div className="d-flex align-items-center justify-content-end gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                    <span className="text-truncate fw-medium">{m.homeTeam}</span>
                    {m.homeCrest && <img src={m.homeCrest} alt="" width="22" height="22" loading="lazy" />}
                  </div>

                  {token ? (
                    <div className="d-flex align-items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="form-control form-control-sm text-center"
                        style={{ width: 52 }}
                        value={draft.home}
                        onChange={(e) => setDraft(m.matchId, 'home', e.target.value)}
                      />
                      <span className="text-secondary">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="form-control form-control-sm text-center"
                        style={{ width: 52 }}
                        value={draft.away}
                        onChange={(e) => setDraft(m.matchId, 'away', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="ft-score-badge upcoming text-center">{t('matches_vs')}</span>
                  )}

                  <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                    {m.awayCrest && <img src={m.awayCrest} alt="" width="22" height="22" loading="lazy" />}
                    <span className="text-truncate fw-medium">{m.awayTeam}</span>
                  </div>

                  {token && (
                    <button
                      className={already ? 'btn btn-outline-success btn-sm' : 'btn btn-success btn-sm'}
                      onClick={() => submit(m.matchId)}
                      disabled={savingId === m.matchId}
                    >
                      {savingId === m.matchId ? t('predict_saving') : already ? t('predict_update_btn') : t('predict_submit_btn')}
                    </button>
                  )}
                </div>

                {errorId === m.matchId && (
                  <div className="text-danger small mt-1">{t('predict_invalid_score')}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <p className="ft-legend text-secondary mt-2 ps-1">{t('predict_scoring_rule')}</p>
    </div>
  )
}
