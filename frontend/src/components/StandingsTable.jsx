import { useState } from 'react'
import { normalizeText } from '../utils'
import { useTranslation } from '../i18n'

// Tra ve class huy hieu vi tri theo vung (suat cup chau Au / nguy hiem)
function posClass(position, total, zones) {
  if (!zones) return 'ft-pos'
  if (position <= zones.top) return 'ft-pos ft-pos-top'
  if (position > total - zones.bottom) return 'ft-pos ft-pos-bottom'
  return 'ft-pos'
}

export default function StandingsTable({ rows, zones, onSelectTeam }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const q = normalizeText(query.trim())
  const filtered = q ? rows.filter((r) => normalizeText(r.teamName).includes(q)) : rows

  return (
    <div>
      <input
        type="search"
        className="form-control mb-3"
        style={{ maxWidth: 300 }}
        placeholder={t('standings_search_placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="alert alert-secondary">
          {t('standings_no_match_prefix')} “{query}”.
        </div>
      ) : (
        <>
          <div className="ft-card table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>{t('standings_col_pos')}</th>
                  <th>{t('standings_col_team')}</th>
                  <th className="text-center">{t('standings_col_played')}</th>
                  <th className="text-center">{t('standings_col_won')}</th>
                  <th className="text-center">{t('standings_col_draw')}</th>
                  <th className="text-center">{t('standings_col_lost')}</th>
                  <th className="text-center">{t('standings_col_gf')}</th>
                  <th className="text-center">{t('standings_col_ga')}</th>
                  <th className="text-center">{t('standings_col_gd')}</th>
                  <th className="text-center">{t('standings_col_points')}</th>
                </tr>
              </thead>
              <tbody className="ft-stagger">
                {filtered.map((r) => (
                  <tr key={r.teamId} role="button" onClick={() => onSelectTeam(r.teamId)}>
                    <td>
                      <span className={posClass(r.position, rows.length, zones)}>{r.position}</span>
                    </td>
                    <td className="ft-team-cell">
                      <div className="d-flex align-items-center gap-2">
                        {r.crest && <img src={r.crest} alt="" width="22" height="22" loading="lazy" />}
                        <span>{r.teamName}</span>
                      </div>
                    </td>
                    <td className="text-center">{r.playedGames}</td>
                    <td className="text-center">{r.won}</td>
                    <td className="text-center">{r.draw}</td>
                    <td className="text-center">{r.lost}</td>
                    <td className="text-center">{r.goalsFor}</td>
                    <td className="text-center">{r.goalsAgainst}</td>
                    <td className="text-center">{r.goalDifference}</td>
                    <td className="text-center fw-bold">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {zones && !q && (
            <div className="ft-legend d-flex gap-4 mt-2 ps-1 text-secondary">
              <span>
                <span className="dot" style={{ background: 'var(--ft-accent)' }} />
                {zones.top === 8 ? t('standings_legend_ucl_top') : t('standings_legend_euro_top')}
              </span>
              <span>
                <span className="dot" style={{ background: '#dc2626' }} />
                {zones.top === 8 ? t('standings_legend_eliminated') : t('standings_legend_relegation')}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
