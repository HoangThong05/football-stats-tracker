import { useEffect, useState } from 'react'
import { COMPARE_METRICS } from '../constants'
import { useTranslation } from '../i18n'

export default function CompareTeams({ rows, onSelectTeam }) {
  const { t } = useTranslation()
  const [idA, setIdA] = useState(null)
  const [idB, setIdB] = useState(null)

  // Doi giai -> chon lai 2 doi dau bang lam mac dinh
  useEffect(() => {
    setIdA(rows[0]?.teamId ?? null)
    setIdB(rows[1]?.teamId ?? null)
  }, [rows])

  if (rows.length < 2) {
    return <div className="alert alert-secondary">{t('compare_not_enough_data')}</div>
  }

  const teamA = rows.find((r) => r.teamId === idA)
  const teamB = rows.find((r) => r.teamId === idB)
  if (!teamA || !teamB) return null

  // Tra ve 'A' | 'B' | null: ben nao tot hon o chi so nay
  const winnerOf = (metric) => {
    if (!metric.better) return null
    const a = teamA[metric.key]
    const b = teamB[metric.key]
    if (a === b) return null
    const aWins = metric.better === 'high' ? a > b : a < b
    return aWins ? 'A' : 'B'
  }

  const cellClass = (metric, side) =>
    winnerOf(metric) === side ? 'fw-bold text-success' : 'text-secondary'

  return (
    <div>
      <div className="row g-2 mb-3">
        <div className="col-6">
          <select className="form-select" value={idA ?? ''} onChange={(e) => setIdA(Number(e.target.value))}>
            {rows.map((r) => (
              <option key={r.teamId} value={r.teamId}>
                {r.teamName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <select className="form-select" value={idB ?? ''} onChange={(e) => setIdB(Number(e.target.value))}>
            {rows.map((r) => (
              <option key={r.teamId} value={r.teamId}>
                {r.teamName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {idA === idB && (
        <div className="alert alert-warning py-2">{t('compare_same_team_warning')}</div>
      )}

      <div className="ft-card table-responsive">
        <table className="table align-middle text-center mb-0">
          <thead>
            <tr>
              <th style={{ width: '35%' }} role="button" onClick={() => onSelectTeam(teamA.teamId)}>
                <div className="d-flex align-items-center justify-content-center gap-2">
                  {teamA.crest && <img src={teamA.crest} alt="" width="26" height="26" />}
                  <span>{teamA.teamName}</span>
                </div>
              </th>
              <th style={{ width: '30%' }}>{t('compare_metric_col')}</th>
              <th style={{ width: '35%' }} role="button" onClick={() => onSelectTeam(teamB.teamId)}>
                <div className="d-flex align-items-center justify-content-center gap-2">
                  {teamB.crest && <img src={teamB.crest} alt="" width="26" height="26" />}
                  <span>{teamB.teamName}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="ft-stagger">
            {COMPARE_METRICS.map((m) => (
              <tr key={m.key}>
                <td className={cellClass(m, 'A')}>{teamA[m.key]}</td>
                <td className="text-secondary small text-uppercase" style={{ letterSpacing: '0.04em' }}>
                  {t(m.labelKey)}
                </td>
                <td className={cellClass(m, 'B')}>{teamB[m.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ft-legend text-secondary mt-2 ps-1">
        {t('compare_legend_prefix')} <span className="fw-bold text-success">{t('compare_legend_highlight')}</span>
        {t('compare_legend_suffix')}
      </p>
    </div>
  )
}
