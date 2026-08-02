import { useState } from 'react'
import { normalizeText } from '../utils'
import { useTranslation } from '../i18n'
import { RANK_MEDALS } from '../constants'
import CountUp from './CountUp'

// Tra ve class huy hieu vi tri theo vung (suat cup chau Au / nguy hiem)
function posClass(position, total, zones) {
  if (!zones) return 'ft-pos'
  if (position <= zones.top) return 'ft-pos ft-pos-top'
  if (position > total - zones.bottom) return 'ft-pos ft-pos-bottom'
  return 'ft-pos'
}

/**
 * Class cho ca HANG: ke duong ranh gioi o day vung (sau suat cup / truoc nhom xuong hang)
 * va to nen mo cho nhung doi dang o vung nguy hiem.
 * Chi ap dung khi dang xem DAY DU bang (khong loc tim kiem) - loc roi thi thu tu khong con lien tuc.
 */
function rowClass(position, total, zones, isFullTable) {
  if (!zones || !isFullTable) return ''
  const classes = []
  if (position === zones.top) classes.push('ft-zone-edge-top')
  if (position === total - zones.bottom) classes.push('ft-zone-edge-bottom')
  if (position > total - zones.bottom) classes.push('ft-zone-danger')
  return classes.join(' ')
}

/** "W,D,L,W,W" -> mang ky tu, bo qua gia tri la. Tra ve [] neu chua co du lieu. */
function parseForm(form) {
  if (!form) return []
  return form
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s === 'W' || s === 'D' || s === 'L')
    .slice(-5)
}

export default function StandingsTable({ rows, zones, onSelectTeam }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const q = normalizeText(query.trim())
  const filtered = q ? rows.filter((r) => normalizeText(r.teamName).includes(q)) : rows
  const isFullTable = !q

  // Chi hien cot phong do khi thuc su co du lieu (dau mua giai se chua co)
  const hasForm = rows.some((r) => parseForm(r.form).length > 0)

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
          <div className="ft-card table-responsive ft-sticky-head">
            <table className="table table-hover align-middle ft-standings">
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
                  {hasForm && <th className="text-center">{t('standings_col_form')}</th>}
                </tr>
              </thead>
              <tbody className="ft-stagger">
                {filtered.map((r) => (
                  <tr
                    key={r.teamId}
                    role="button"
                    onClick={() => onSelectTeam(r.teamId)}
                    className={rowClass(r.position, rows.length, zones, isFullTable)}
                  >
                    <td>
                      <span className={posClass(r.position, rows.length, zones)}>{r.position}</span>
                    </td>
                    <td className="ft-team-cell">
                      <div className="d-flex align-items-center gap-2">
                        {RANK_MEDALS[r.position] && (
                          <span className="ft-rank-medal" aria-hidden="true">
                            {RANK_MEDALS[r.position]}
                          </span>
                        )}
                        {r.crest && <img src={r.crest} alt="" width="22" height="22" loading="lazy" />}
                        <span>{r.teamName}</span>
                      </div>
                    </td>
                    <td className="text-center ft-num">{r.playedGames}</td>
                    <td className="text-center ft-num">{r.won}</td>
                    <td className="text-center ft-num">{r.draw}</td>
                    <td className="text-center ft-num">{r.lost}</td>
                    <td className="text-center ft-num">{r.goalsFor}</td>
                    <td className="text-center ft-num">{r.goalsAgainst}</td>
                    <td className="text-center ft-num">{r.goalDifference}</td>
                    {/* Chi cot DIEM dem tang dan: dem het moi cot se thanh mo mat */}
                    <td className="text-center fw-bold ft-num fs-5">
                      <CountUp value={r.points} />
                    </td>
                    {hasForm && (
                      <td className="text-center">
                        <FormDots form={r.form} t={t} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {zones && !q && (
            <div className="ft-legend d-flex gap-4 mt-2 ps-1 text-secondary flex-wrap">
              <span>
                <span className="dot" style={{ background: 'var(--ft-accent)' }} />
                {zones.top === 8 ? t('standings_legend_ucl_top') : t('standings_legend_euro_top')}
              </span>
              <span>
                <span className="dot" style={{ background: '#dc2626' }} />
                {zones.top === 8 ? t('standings_legend_eliminated') : t('standings_legend_relegation')}
              </span>
              {hasForm && <span>{t('standings_form_legend')}</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Chuoi 5 tran gan nhat, cu -> moi. Mau la phu tro; chu cai ben trong moi la thong tin chinh. */
function FormDots({ form, t }) {
  const results = parseForm(form)
  if (results.length === 0) return <span className="text-secondary">–</span>

  const label = { W: t('standings_form_win'), D: t('standings_form_draw'), L: t('standings_form_loss') }

  return (
    <span className="ft-form" role="img" aria-label={results.map((r) => label[r]).join(', ')}>
      {results.map((r, i) => (
        <span key={i} className={`ft-form-dot ft-form-${r.toLowerCase()}`} title={label[r]}>
          {label[r].charAt(0)}
        </span>
      ))}
    </span>
  )
}
