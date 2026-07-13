import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { formatKickoff } from '../utils'
import { useTranslation } from '../i18n'
import Loading from './Loading'
import HeadToHead from './HeadToHead'

export default function MatchDetail({ matchId, onBack }) {
  const { t, lang } = useTranslation()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setMatch(null)

    fetch(`${API_BASE}/matches/${matchId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setMatch(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [matchId])

  const hasFullScore = match && match.homeScore != null && match.awayScore != null
  const hasHalfScore = match && match.homeHalfScore != null && match.awayHalfScore != null

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      {loading && <Loading />}
      {error && (
        <div className="alert alert-danger">
          {t('match_detail_error')} {error}
        </div>
      )}

      {!loading && !error && match && (
        <div className="ft-card p-4">
          <div className="text-center text-secondary small mb-3">
            {match.competition}
            {match.matchday != null && <> · {t('matches_matchday_prefix')} {match.matchday}</>}
            <div>{formatKickoff(match.utcDate, lang)}</div>
            <span className="badge text-bg-secondary mt-1">
              {t(`match_status_${match.status}`) !== `match_status_${match.status}`
                ? t(`match_status_${match.status}`)
                : match.status}
            </span>
          </div>

          <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap mb-3">
            <div className="text-center" style={{ minWidth: 140 }}>
              {match.homeCrest && <img src={match.homeCrest} alt="" width="48" height="48" />}
              <div className="fw-semibold mt-1">{match.homeTeam}</div>
            </div>

            <div className="text-center">
              <div className="fs-3 fw-bold">
                {hasFullScore ? `${match.homeScore} - ${match.awayScore}` : t('matches_vs')}
              </div>
              {hasHalfScore && (
                <div className="text-secondary small">
                  {t('match_halftime')}: {match.homeHalfScore} - {match.awayHalfScore}
                </div>
              )}
            </div>

            <div className="text-center" style={{ minWidth: 140 }}>
              {match.awayCrest && <img src={match.awayCrest} alt="" width="48" height="48" />}
              <div className="fw-semibold mt-1">{match.awayTeam}</div>
            </div>
          </div>

          {(match.venue || match.referees?.length > 0) && (
            <div className="d-flex flex-column gap-1 text-secondary small border-top pt-3">
              {match.venue && (
                <div>
                  {t('match_venue')}: {match.venue}
                </div>
              )}
              {match.referees?.length > 0 && (
                <div>
                  {match.referees.length > 1 ? t('match_referees') : t('match_referee')}: {match.referees.join(', ')}
                </div>
              )}
            </div>
          )}

          <HeadToHead teamAId={match.homeTeamId} teamBId={match.awayTeamId} perspectiveTeamId={match.homeTeamId} />
        </div>
      )}
    </div>
  )
}
