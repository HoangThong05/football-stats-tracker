import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { shortTeamName } from '../utils'
import { useTranslation } from '../i18n'

/**
 * Tran da xong / sap da cua mot doi.
 *
 * Doc tu database qua /api/teams/{id}/matches nen khong ton han muc API.
 * Hong hoac chua co du lieu thi khong hien gi - day la phan bo tro, khong duoc
 * lam vo trang doi bong.
 */
export default function TeamMatches({ teamId, teamName, onSelectMatch }) {
  const { t, lang } = useTranslation()
  const [data, setData] = useState({ recent: [], upcoming: [] })

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/teams/${teamId}/matches`)
      .then((res) => (res.ok ? res.json() : { recent: [], upcoming: [] }))
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [teamId])

  /** Thang/hoa/thua DUOI GOC NHIN cua doi dang xem, khong phai cua doi chu nha. */
  const outcomeOf = (m) => {
    if (m.homeScore == null || m.awayScore == null) return null
    const isHome = m.homeTeamId === teamId
    const mine = isHome ? m.homeScore : m.awayScore
    const theirs = isHome ? m.awayScore : m.homeScore
    if (mine > theirs) return 'W'
    if (mine < theirs) return 'L'
    return 'D'
  }

  const when = (utcDate) =>
    new Date(utcDate).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })

  const row = (m) => {
    const outcome = outcomeOf(m)
    const badge = { W: 'text-bg-success', D: 'text-bg-secondary', L: 'text-bg-danger' }[outcome]
    return (
      <li
        key={m.id}
        className="list-group-item d-flex align-items-center gap-2 py-2"
        role="button"
        onClick={() => onSelectMatch(m.id)}
      >
        <small className="text-secondary ft-num flex-shrink-0" style={{ minWidth: 88 }}>
          {when(m.utcDate)}
        </small>
        <span className="text-truncate flex-grow-1 small" style={{ minWidth: 0 }}>
          {shortTeamName(m.homeTeam)} — {shortTeamName(m.awayTeam)}
        </span>
        {outcome ? (
          <>
            <span className="ft-num fw-semibold flex-shrink-0">
              {m.homeScore} - {m.awayScore}
            </span>
            <span className={`badge ${badge} flex-shrink-0`} style={{ minWidth: 26 }}>
              {t(`standings_form_${outcome === 'W' ? 'win' : outcome === 'D' ? 'draw' : 'loss'}`).charAt(0)}
            </span>
          </>
        ) : (
          <span className="badge text-bg-secondary flex-shrink-0">{t('matches_vs')}</span>
        )}
      </li>
    )
  }

  const block = (title, matches) =>
    matches.length > 0 && (
      <div className="mt-4">
        <h3 className="h6 mb-2">{title}</h3>
        <div className="ft-card">
          <ul className="list-group list-group-flush">{matches.map(row)}</ul>
        </div>
      </div>
    )

  if (data.recent.length === 0 && data.upcoming.length === 0) {
    return null
  }

  return (
    <div aria-label={teamName}>
      {block(t('team_upcoming_title'), data.upcoming)}
      {block(t('team_recent_title'), data.recent)}
    </div>
  )
}
