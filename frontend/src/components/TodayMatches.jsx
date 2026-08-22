import { shortTeamName } from '../utils'
import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { LEAGUES } from '../constants'
import { useTranslation } from '../i18n'
import Loading from './Loading'
import Pitch3D from './Pitch3D'

// Cua so ma MatchSyncService dong bo san trong DB (2 ngay truoc -> 14 ngay toi).
// Ra ngoai khoang nay se khong co du lieu, nen chan luon o UI.
const MIN_OFFSET = -2
const MAX_OFFSET = 14

/** Moc dau/cuoi ngay theo MUI GIO NGUOI DUNG, doi sang ISO de gui len backend. */
function dayRange(offset) {
  const start = new Date()
  start.setDate(start.getDate() + offset)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString(), date: start }
}

/**
 * Tran dau cua MOI giai trong 1 ngay, nhom theo giai.
 * Doc tu DB (MatchSyncService dong bo moi 30 phut) nen ti so co the tre toi 30 phut.
 */
export default function TodayMatches({ onBack, onSelectMatch, favorites = [] }) {
  const { t, lang } = useTranslation()
  const [offset, setOffset] = useState(0)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { from, to, date } = dayRange(offset)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/matches/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setMatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    // from/to duoc tinh tu offset nen chi can theo doi offset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset])

  // Giu dung thu tu giai nhu tab chon giai o trang chinh
  const groups = LEAGUES.map((l) => ({
    code: l.code,
    name: l.name,
    matches: matches.filter((m) => m.competition === l.code),
  })).filter((g) => g.matches.length > 0)

  /*
   * Tran cua doi dang theo doi duoc gom rieng len dau trang.
   *
   * VAN GIU CHUNG trong nhom giai ben duoi chu khong cat ra: mot tran bien mat khoi
   * giai cua no la kho hieu hon nhieu so voi viec no xuat hien hai lan. Dau ★ o duoi
   * cho biet vi sao no duoc dua len tren.
   */
  const followedIds = new Set(favorites.map((f) => f.teamId))
  const myMatches = followedIds.size
    ? matches.filter((m) => followedIds.has(m.homeTeamId) || followedIds.has(m.awayTeamId))
    : []

  const dayLabel =
    offset === 0
      ? t('today_label')
      : date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        })

  const timeOf = (utcDate) =>
    new Date(utcDate).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <Pitch3D height={190} className="mb-3">
        <div className="text-center px-3">
          <div className="ft-pitch-hero-title">{t('today_title')}</div>
          <div className="ft-pitch-hero-sub ft-num">{dayLabel}</div>
        </div>
      </Pitch3D>

      {/* Tieu de da nam tren san bong phia tren -> o day chi con thanh chon ngay */}
      <div className="d-flex justify-content-center mb-3">
        <div className="ft-day-nav">
          <button
            className="btn btn-sm"
            onClick={() => setOffset((o) => o - 1)}
            disabled={offset <= MIN_OFFSET}
            aria-label={t('today_prev_day')}
          >
            ‹
          </button>
          <span className="ft-day-label">{dayLabel}</span>
          <button
            className="btn btn-sm"
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= MAX_OFFSET}
            aria-label={t('today_next_day')}
          >
            ›
          </button>
        </div>
      </div>

      {loading && <Loading rows={4} />}
      {error && (
        <div className="alert alert-danger">
          {t('error_generic')} {error}
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="alert alert-secondary d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.3rem' }}>📅</span>
          <span>{t('today_empty')}</span>
        </div>
      )}

      {!loading &&
        !error &&
        <>
          {myMatches.length > 0 && (
            <div className="mb-3">
              <div className="ft-day-league">★ {t('today_my_teams')}</div>
              <div className="ft-card">
                <ul className="list-group list-group-flush">
                  {myMatches.map((m) => {
                    const hasScore = m.homeScore != null && m.awayScore != null
                    return (
                      <li
                        key={`mine-${m.id}`}
                        className="list-group-item ft-match-row py-3"
                        role="button"
                        onClick={() => onSelectMatch(m.id)}
                      >
                        <small className="text-secondary ft-num">
                          {timeOf(m.utcDate)}
                        </small>
                        <div className="d-flex align-items-center justify-content-end gap-2"
                         >
                          <span className="text-truncate fw-medium" title={m.homeTeam}>
                            {shortTeamName(m.homeTeam)}
                          </span>
                          {m.homeCrest && <img src={m.homeCrest} alt="" width="22" height="22" loading="lazy" />}
                        </div>
                        <span className={hasScore ? 'ft-score-badge played text-center' : 'ft-score-badge upcoming text-center'}>
                          {hasScore ? `${m.homeScore} - ${m.awayScore}` : t('matches_vs')}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          {m.awayCrest && <img src={m.awayCrest} alt="" width="22" height="22" loading="lazy" />}
                          <span className="text-truncate fw-medium" title={m.awayTeam}>
                            {shortTeamName(m.awayTeam)}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}

          {groups.map((g) => (
          <div key={g.code} className="mb-3">
            <div className="ft-day-league">{g.name}</div>
            <div className="ft-card">
              <ul className="list-group list-group-flush ft-stagger">
                {g.matches.map((m) => {
                  const hasScore = m.homeScore != null && m.awayScore != null
                  const mine = followedIds.has(m.homeTeamId) || followedIds.has(m.awayTeamId)
                  return (
                    <li
                      key={m.id}
                      className="list-group-item ft-match-row py-3"
                      role="button"
                      onClick={() => onSelectMatch(m.id)}
                    >
                      <small className="text-secondary ft-num">
                        {mine && <span className="ft-day-star" title={t('today_my_teams')}>★</span>}
                        {timeOf(m.utcDate)}
                      </small>

                      <div
                        className="d-flex align-items-center justify-content-end gap-2"
                      >
                        <span className="text-truncate fw-medium" title={m.homeTeam}>{shortTeamName(m.homeTeam)}</span>
                        {m.homeCrest && <img src={m.homeCrest} alt="" width="22" height="22" loading="lazy" />}
                      </div>

                      <span className={hasScore ? 'ft-score-badge played text-center' : 'ft-score-badge upcoming text-center'}>
                        {hasScore ? `${m.homeScore} - ${m.awayScore}` : t('matches_vs')}
                      </span>

                      <div className="d-flex align-items-center gap-2">
                        {m.awayCrest && <img src={m.awayCrest} alt="" width="22" height="22" loading="lazy" />}
                        <span className="text-truncate fw-medium" title={m.awayTeam}>{shortTeamName(m.awayTeam)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          ))}
        </>}

      {!loading && !error && groups.length > 0 && (
        <p className="ft-legend text-secondary ps-1">{t('today_sync_note')}</p>
      )}
    </div>
  )
}
