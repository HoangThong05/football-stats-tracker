import { formatKickoff } from '../utils'
import { useTranslation } from '../i18n'

export default function MatchList({ matches, showScore, onSelectMatch }) {
  const { t, lang } = useTranslation()

  if (matches.length === 0) {
    return (
      <div className="alert alert-secondary d-flex align-items-center gap-2">
        <span style={{ fontSize: '1.3rem' }}>📅</span>
        <span>{t('matches_empty')}</span>
      </div>
    )
  }

  return (
    <div className="ft-card">
      <ul className="list-group list-group-flush ft-stagger">
        {matches.map((m) => (
          <li
            key={m.id}
            className="list-group-item d-flex align-items-center flex-wrap gap-2 py-3"
            role="button"
            onClick={() => onSelectMatch(m.id)}
          >
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

            <span className={showScore ? 'ft-score-badge played text-center' : 'ft-score-badge upcoming text-center'}>
              {showScore ? `${m.homeScore} - ${m.awayScore}` : t('matches_vs')}
            </span>

            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
              {m.awayCrest && <img src={m.awayCrest} alt="" width="22" height="22" loading="lazy" />}
              <span className="text-truncate fw-medium">{m.awayTeam}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
