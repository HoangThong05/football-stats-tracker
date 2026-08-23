import { formatKickoff, shortTeamName } from '../utils'
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
            className="list-group-item ft-fixture-row py-3"
            role="button"
            onClick={() => onSelectMatch(m.id)}
          >
            <small className="text-secondary ft-fixture-time">
              <span className="d-block ft-predict-when">{formatKickoff(m.utcDate, lang)}</span>
              {m.matchday != null && (
                <span className="d-block text-body-tertiary">
                  {t('matchday_label')} {m.matchday}
                </span>
              )}
            </small>

            <div className="ft-fixture-home d-flex align-items-center justify-content-end gap-2">
              <span className="text-truncate fw-medium" title={m.homeTeam}>{shortTeamName(m.homeTeam)}</span>
              {m.homeCrest && <img src={m.homeCrest} alt="" width="22" height="22" loading="lazy" />}
            </div>

            <span className={`ft-fixture-score ft-score-badge text-center ${showScore ? 'played' : 'upcoming'}`}>
              {showScore ? `${m.homeScore} - ${m.awayScore}` : t('matches_vs')}
            </span>

            <div className="ft-fixture-away d-flex align-items-center gap-2">
              {m.awayCrest && <img src={m.awayCrest} alt="" width="22" height="22" loading="lazy" />}
              <span className="text-truncate fw-medium" title={m.awayTeam}>{shortTeamName(m.awayTeam)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
