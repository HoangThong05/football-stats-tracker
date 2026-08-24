import { useState } from 'react'
import { normalizeText, shortTeamName } from '../utils'
import { useTranslation } from '../i18n'
import { RANK_MEDALS } from '../constants'
import { useLiveTeamIds } from '../useLiveMatches'
import CountUp from './CountUp'
import FormDots, { parseForm } from './FormDots'

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

export default function StandingsTable({ rows, zones, onSelectTeam }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  /*
   * football-data.org CONG DIEM cho tran ngay khi bong con lan, khong doi het tran.
   * Mot doi vi the co the da nhay len 3 diem trong luc tran chua ket thuc - khong noi
   * ro thi nguoi xem tuong bang bi sai. Danh dau thang vao hang cua doi do.
   */
  const liveTeamIds = useLiveTeamIds()

  const q = normalizeText(query.trim())
  const filtered = q ? rows.filter((r) => normalizeText(r.teamName).includes(q)) : rows
  const isFullTable = !q

  // Chi hien cot phong do khi thuc su co du lieu (dau mua giai se chua co)
  const hasForm = rows.some((r) => parseForm(r.form).length > 0)

  /*
   * Mua giai da khoi tranh chua?
   *
   * Chua doi nao da tran nao thi nguon du lieu tra ve vi tri 1 cho TAT CA cac doi -
   * cu the la ca 20 doi deu deo huy chuong vang, va vung "du cup chau Au" / "xuong hang"
   * deu duoc to mau trong khi chua co gi de xep hang. Cung nguyen tac voi cot phong do
   * o tren: chua co so lieu thi dung ve.
   */
  const seasonStarted = rows.some((r) => r.playedGames > 0)

  /*
   * Vung mau (suat cup chau Au / xuong hang) chi bat khi MOI doi da da it nhat 1 tran.
   *
   * Giua vong dau tien, doi da da thi len tren con lai xep bang diem nhau o duoi - thu tu
   * cua nhom duoi hoan toan khong phan anh gi. To do "khu vuc xuong hang" luc do la bia.
   */
  const allPlayed = rows.length > 0 && rows.every((r) => r.playedGames > 0)
  const activeZones = allPlayed ? zones : null

  /*
   * Huy chuong chi trao cho vi tri co DUY NHAT mot doi.
   *
   * Nguon du lieu xep moi doi chua da vao cung mot thu hang, nen sau vong dau dau tien
   * co 19 doi cung "hang 2" - trao huy chuong bac cho ca 19 doi thi vo nghia. Dieu kien
   * dung khong phai "mua giai da bat dau" ma la "vi tri nay co mot minh doi do".
   */
  const teamsAtPosition = rows.reduce((acc, r) => {
    acc[r.position] = (acc[r.position] || 0) + 1
    return acc
  }, {})

  // Moc de ve thanh diem: doi dan dau = thanh day. Tranh chia 0 luc dau mua.
  const maxPoints = rows.reduce((max, r) => Math.max(max, r.points), 0)

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

      {/*
        Phan biet hai truong hop deu ra danh sach rong, nhung ly do khac han nhau:
        - rows rong: giai/mua nay khong co du lieu (vd mua vua ket thuc, nha cung cap
          da rut khoi goi mien phi). Bao "khong tim thay doi nao khop """ luc do la
          vo nghia, vi nguoi dung co go gi vao o tim dau.
        - rows co nhung loc khong ra: go sai ten doi.
      */}
      {rows.length === 0 ? (
        <div className="alert alert-secondary mb-0">{t('standings_empty_season')}</div>
      ) : filtered.length === 0 ? (
        <div className="alert alert-secondary">
          {t('standings_no_match_prefix')} “{query}”.
        </div>
      ) : (
        <>
          {!seasonStarted && (
            <p className="text-secondary small mb-2">{t('standings_not_started')}</p>
          )}
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
                    className={rowClass(r.position, rows.length, activeZones, isFullTable)}
                  >
                    <td>
                      {/* Top 3 hien huy chuong THAY so o cot thu hang (giong BXH du doan),
                          de cot Doi chi con logo + ten, thang hang voi tieu de */}
                      {teamsAtPosition[r.position] === 1 && RANK_MEDALS[r.position] ? (
                        <span className="ft-rank-medal" aria-hidden="true">{RANK_MEDALS[r.position]}</span>
                      ) : (
                        <span className={posClass(r.position, rows.length, activeZones)}>{r.position}</span>
                      )}
                    </td>
                    <td className="ft-team-cell">
                      <div className="d-flex align-items-center gap-2">
                        {r.crest && <img src={r.crest} alt="" width="22" height="22" loading="lazy" />}
                        <span title={r.teamName}>{shortTeamName(r.teamName)}</span>
                        {liveTeamIds.has(r.teamId) && (
                          <span className="ft-standings-live" title={t('standings_live_hint')}>
                            ● {t('ticker_live')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center ft-num">{r.playedGames}</td>
                    <td className="text-center ft-num">{r.won}</td>
                    <td className="text-center ft-num">{r.draw}</td>
                    <td className="text-center ft-num">{r.lost}</td>
                    <td className="text-center ft-num">{r.goalsFor}</td>
                    <td className="text-center ft-num">{r.goalsAgainst}</td>
                    <td className="text-center ft-num">{r.goalDifference}</td>
                    {/*
                      Chi cot DIEM dem tang dan: dem het moi cot se thanh mo mat.
                      Thanh mo duoi con so cho thay khoang cach diem so voi doi dau bang -
                      doc duoc ca bang trong mot cai liec, khong phai tru nham.
                    */}
                    <td
                      className="text-center fw-bold ft-num fs-5 ft-points-cell"
                      style={{ '--ft-pts-ratio': maxPoints ? r.points / maxPoints : 0 }}
                    >
                      <CountUp value={r.points} />
                    </td>
                    {hasForm && (
                      <td className="text-center">
                        <FormDots form={r.form} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeZones && !q && (
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
