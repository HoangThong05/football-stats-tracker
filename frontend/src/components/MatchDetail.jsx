import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { formatKickoff, shortTeamName } from '../utils'
import { useTranslation } from '../i18n'
import Loading from './Loading'
import HeadToHead from './HeadToHead'
import Pitch3D from './Pitch3D'
import FormDots, { parseForm } from './FormDots'

export default function MatchDetail({ matchId, onBack, token }) {
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

  /*
   * Phong do gan day cua hai doi, TU TINH tu ket qua that (qua /teams/{id}/matches).
   *
   * Khong dung truong "form" cua bang xep hang: dau mua nguon tra ve null cho no nen
   * phong do khong hien duoc. Tu tinh tu ket qua thi co ngay khi vua da vai tran. Bo
   * chinh tran dang xem - day la phong do TRUOC tran nay. Endpoint doc tu DB, khong ton
   * han muc API.
   */
  const [form, setForm] = useState({ home: null, away: null })

  useEffect(() => {
    if (!match?.homeTeamId || !match?.awayTeamId) {
      setForm({ home: null, away: null })
      return undefined
    }
    let cancelled = false

    const formOf = (recent, teamId) => [...(recent || [])]
      .filter((m) => m.id !== matchId && m.homeScore != null && m.awayScore != null)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(-5)
      .map((m) => {
        const isHome = m.homeTeamId === teamId
        const mine = isHome ? m.homeScore : m.awayScore
        const theirs = isHome ? m.awayScore : m.homeScore
        return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D'
      })
      .join(',')

    const load = (id) => fetch(`${API_BASE}/teams/${id}/matches`)
      .then((res) => (res.ok ? res.json() : { recent: [] }))
      .then((d) => d.recent || [])

    Promise.all([load(match.homeTeamId), load(match.awayTeamId)])
      .then(([homeRecent, awayRecent]) => {
        if (cancelled) return
        setForm({
          home: formOf(homeRecent, match.homeTeamId),
          away: formOf(awayRecent, match.awayTeamId),
        })
      })
      // Phong do chi la thong tin them: hong thi im lang bo qua
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [matchId, match?.homeTeamId, match?.awayTeamId])

  // Du doan cua chinh nguoi dung cho tran nay (neu co)
  const [myPrediction, setMyPrediction] = useState(null)

  useEffect(() => {
    if (!token) {
      setMyPrediction(null)
      return undefined
    }
    let cancelled = false
    fetch(`${API_BASE}/predictions/mine`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (!cancelled) setMyPrediction(rows.find((r) => r.matchId === matchId) ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [matchId, token])

  const hasForm = parseForm(form.home).length > 0 || parseForm(form.away).length > 0

  const hasFullScore = match && match.homeScore != null && match.awayScore != null

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

          {hasForm && (
            <div className="border-top pt-3 mt-3">
              <div className="text-secondary small mb-2">{t('match_form_title')}</div>
              {/* Moi doi MOT hang: ten trai, chuoi form phai. Xep chong thi du form thua
                  (1 tran hay chua co) van gon, khong bi day ra hai mep de trong khoang giua. */}
              <div className="d-flex flex-column gap-2">
                {[[match.homeTeam, form.home], [match.awayTeam, form.away]].map(([name, f], i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between gap-3">
                    <span className="text-truncate small fw-medium" style={{ minWidth: 0 }} title={name}>
                      {shortTeamName(name)}
                    </span>
                    <FormDots form={f} />
                  </div>
                ))}
              </div>
              <div className="text-secondary mt-2" style={{ fontSize: '0.72rem' }}>
                {t('standings_form_legend')}
              </div>
            </div>
          )}

          {myPrediction && (
            <div className="border-top pt-3 mt-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <span className="small text-secondary">{t('match_my_prediction')}</span>
              <span className="d-flex align-items-center gap-2">
                <span className="ft-num fw-bold">
                  {myPrediction.predictedHomeScore} - {myPrediction.predictedAwayScore}
                </span>
                {myPrediction.points != null && (
                  <span className={myPrediction.points > 0 ? 'badge text-bg-success' : 'badge text-bg-secondary'}>
                    +{myPrediction.points} {t('myp_points_suffix')}
                  </span>
                )}
              </span>
            </div>
          )}

          <HeadToHead teamAId={match.homeTeamId} teamBId={match.awayTeamId} perspectiveTeamId={match.homeTeamId} />
        </div>
      )}
    </div>
  )
}
