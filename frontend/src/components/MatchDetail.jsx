import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { formatKickoff, shortTeamName } from '../utils'
import { useTranslation } from '../i18n'
import Loading from './Loading'
import HeadToHead from './HeadToHead'
import Pitch3D from './Pitch3D'

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

          {/* San 3D lam nen; logo + ti so la HTML phu len tren cho sac net */}
          <Pitch3D height={210} className="mb-3">
            <div className="d-flex align-items-center justify-content-center gap-3 gap-md-4 w-100 px-3">
              <div className="text-center" style={{ minWidth: 0, flex: '1 1 0' }}>
                {match.homeCrest && (
                  <img src={match.homeCrest} alt="" width="44" height="44" loading="lazy" />
                )}
                <div className="ft-pitch-team text-truncate mt-1" title={match.homeTeam}>{shortTeamName(match.homeTeam)}</div>
              </div>

              <div className="text-center" style={{ flex: '0 0 auto' }}>
                <div className="ft-pitch-score">
                  {hasFullScore ? `${match.homeScore} - ${match.awayScore}` : t('matches_vs')}
                </div>
              </div>

              <div className="text-center" style={{ minWidth: 0, flex: '1 1 0' }}>
                {match.awayCrest && (
                  <img src={match.awayCrest} alt="" width="44" height="44" loading="lazy" />
                )}
                <div className="ft-pitch-team text-truncate mt-1" title={match.awayTeam}>{shortTeamName(match.awayTeam)}</div>
              </div>
            </div>
          </Pitch3D>

          {hasHalfScore && (
            <div className="text-center text-secondary small mb-3">
              {t('match_halftime')}: <span className="ft-num">{match.homeHalfScore} - {match.awayHalfScore}</span>
            </div>
          )}

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
