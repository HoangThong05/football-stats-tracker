import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { formatKickoff } from '../utils'
import { useTranslation } from '../i18n'

/** 5 tran gan nhat giua 2 doi. perspectiveTeamId (tuy chon) dung de to mau W/D/L. */
export default function HeadToHead({ teamAId, teamBId, perspectiveTeamId }) {
  const { t, lang } = useTranslation()
  const [matches, setMatches] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!teamAId || !teamBId || teamAId === teamBId) {
      setMatches(null)
      return
    }
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/matches/head-to-head?teamA=${teamAId}&teamB=${teamBId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setMatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [teamAId, teamBId])

  if (!teamAId || !teamBId || teamAId === teamBId) return null
  if (loading) return <div className="text-secondary small mt-3">{t('h2h_loading')}</div>
  if (error || !matches) return null

  return (
    <div className="ft-card p-3 mt-3">
      <div className="fw-semibold mb-2">{t('h2h_title')}</div>
      {matches.length === 0 ? (
        <div className="text-secondary small">{t('h2h_empty')}</div>
      ) : (
        <div className="d-flex flex-column gap-2 ft-stagger">
          {matches.map((m) => {
            const ref = perspectiveTeamId ?? teamAId
            const refIsHome = m.homeTeamId === ref
            const refScore = refIsHome ? m.homeScore : m.awayScore
            const oppScore = refIsHome ? m.awayScore : m.homeScore
            const outcomeClass =
              refScore == null || oppScore == null
                ? ''
                : refScore > oppScore
                  ? 'text-success'
                  : refScore < oppScore
                    ? 'text-danger'
                    : 'text-secondary'

            return (
              <div key={m.id} className="d-flex align-items-center justify-content-between small">
                <span className="text-secondary" style={{ minWidth: 150 }}>
                  {formatKickoff(m.utcDate, lang, { includeYear: true })}
                </span>
                <span className="flex-grow-1 text-center">
                  {m.homeTeam} <span className={`fw-bold ${outcomeClass}`}>{m.homeScore} - {m.awayScore}</span> {m.awayTeam}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
