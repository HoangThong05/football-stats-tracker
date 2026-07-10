import { RANK_MEDALS } from '../constants'
import { useTranslation } from '../i18n'

export default function ScorersTable({ scorers, onSelectTeam }) {
  const { t } = useTranslation()

  if (scorers.length === 0) {
    return <div className="alert alert-secondary">{t('scorers_empty')}</div>
  }

  return (
    <div className="ft-card table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>{t('scorers_col_rank')}</th>
            <th>{t('scorers_col_player')}</th>
            <th>{t('scorers_col_team')}</th>
            <th className="text-center">{t('scorers_col_played')}</th>
            <th className="text-center">{t('scorers_col_goals')}</th>
            <th className="text-center">{t('scorers_col_assists')}</th>
          </tr>
        </thead>
        <tbody className="ft-stagger">
          {scorers.map((s) => (
            <tr key={s.playerId}>
              <td>
                {RANK_MEDALS[s.rank] ? (
                  <span className="ft-rank-medal">{RANK_MEDALS[s.rank]}</span>
                ) : (
                  <span className="ft-pos">{s.rank}</span>
                )}
              </td>
              <td>
                <div className="fw-semibold">{s.playerName}</div>
                {s.nationality && <div className="text-secondary small">{s.nationality}</div>}
              </td>
              <td>
                <div
                  className="d-flex align-items-center gap-2"
                  role="button"
                  onClick={() => onSelectTeam(s.teamId)}
                >
                  {s.teamCrest && <img src={s.teamCrest} alt="" width="22" height="22" loading="lazy" />}
                  <span>{s.teamName}</span>
                </div>
              </td>
              <td className="text-center">{s.playedMatches ?? '—'}</td>
              <td className="text-center fw-bold fs-6">{s.goals ?? '—'}</td>
              <td className="text-center">{s.assists ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
