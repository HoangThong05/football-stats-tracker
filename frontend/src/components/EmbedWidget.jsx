import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { LEAGUES } from '../constants'
import { shortTeamName, formatKickoff } from '../utils'

/*
 * Trang widget nhung (iframe): chi doc, gon nhe, khong navbar/3D/dang nhap.
 *
 * Duong dan: /embed/standings hoac /embed/fixtures
 * Tham so:   ?league=PL&theme=dark&lang=vi   (fixtures them &show=results de xem ket qua)
 *
 * Duoc main.jsx dung thay cho App khi URL bat dau bang /embed.
 */
export default function EmbedWidget() {
  const params = new URLSearchParams(window.location.search)
  const kind = window.location.pathname.includes('/fixtures') ? 'fixtures' : 'standings'
  const league = (params.get('league') || 'PL').toUpperCase()
  const theme = params.get('theme') === 'dark' ? 'dark' : 'light'
  const lang = params.get('lang') === 'en' ? 'en' : 'vi'
  const show = params.get('show') === 'results' ? 'results' : 'upcoming'

  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  const leagueName = LEAGUES.find((l) => l.code === league)?.name || league

  useEffect(() => {
    // Ap giao dien sang/toi cho ca trang embed
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  useEffect(() => {
    const url =
      kind === 'standings'
        ? `${API_BASE}/standings/${league}`
        : `${API_BASE}/matches/${league}/${show}`
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
  }, [kind, league, show])

  const homeUrl = `${window.location.origin}/?utm=embed`
  const dict = {
    vi: { p: 'Trận', gd: 'HS', pts: 'Điểm', vs: 'vs', empty: 'Chưa có dữ liệu', err: 'Không tải được dữ liệu', by: 'Nguồn' },
    en: { p: 'P', gd: 'GD', pts: 'Pts', vs: 'vs', empty: 'No data yet', err: 'Could not load data', by: 'Source' },
  }[lang]

  return (
    <div className="ft-embed">
      <div className="ft-embed-head">
        <span className="ft-embed-title">{leagueName}</span>
        <span className="ft-embed-sub">{kind === 'standings' ? (lang === 'vi' ? 'Bảng xếp hạng' : 'Standings') : (lang === 'vi' ? 'Lịch thi đấu' : 'Fixtures')}</span>
      </div>

      <div className="ft-embed-body">
        {error ? (
          <p className="ft-embed-msg">{dict.err}</p>
        ) : data === null ? (
          <p className="ft-embed-msg">…</p>
        ) : data.length === 0 ? (
          <p className="ft-embed-msg">{dict.empty}</p>
        ) : kind === 'standings' ? (
          <table className="ft-embed-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="ft-embed-team"></th>
                <th>{dict.p}</th>
                <th>{dict.gd}</th>
                <th>{dict.pts}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.teamId}>
                  <td className="ft-embed-pos">{r.position}</td>
                  <td className="ft-embed-team">
                    {r.crest && <img src={r.crest} alt="" width="18" height="18" loading="lazy" />}
                    <span>{shortTeamName(r.teamName)}</span>
                  </td>
                  <td>{r.playedGames}</td>
                  <td>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
                  <td className="ft-embed-pts">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="ft-embed-fixtures">
            {data.map((m) => {
              const done = m.homeScore != null && m.awayScore != null
              return (
                <li key={m.matchId ?? `${m.homeTeam}-${m.utcDate}`}>
                  <span className="ft-embed-when">{formatKickoff(m.utcDate, lang)}</span>
                  <span className="ft-embed-match">
                    <span className="ft-embed-side ft-embed-home">
                      <span className="ft-embed-tn">{shortTeamName(m.homeTeam)}</span>
                      {m.homeCrest && <img src={m.homeCrest} alt="" width="16" height="16" loading="lazy" />}
                    </span>
                    <span className="ft-embed-score">{done ? `${m.homeScore} - ${m.awayScore}` : dict.vs}</span>
                    <span className="ft-embed-side ft-embed-away">
                      {m.awayCrest && <img src={m.awayCrest} alt="" width="16" height="16" loading="lazy" />}
                      <span className="ft-embed-tn">{shortTeamName(m.awayTeam)}</span>
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <a className="ft-embed-foot" href={homeUrl} target="_blank" rel="noopener noreferrer">
        ⚽ Football Stats Tracker
      </a>
    </div>
  )
}
