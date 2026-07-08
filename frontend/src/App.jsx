import { useEffect, useState } from 'react'

const API_BASE = 'http://localhost:8080/api'

const LEAGUES = [
  { code: 'PL', name: 'Premier League' },
  { code: 'PD', name: 'La Liga' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'FL1', name: 'Ligue 1' },
  { code: 'CL', name: 'Champions League' },
]

export default function App() {
  const [league, setLeague] = useState('PL')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/standings/${league}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [league])

  return (
    <div className="container">
      <header>
        <h1>⚽ Football Stats Tracker</h1>
        <p className="subtitle">Bảng xếp hạng các giải đấu hàng đầu</p>
      </header>

      <div className="controls">
        {LEAGUES.map((l) => (
          <button
            key={l.code}
            className={l.code === league ? 'tab active' : 'tab'}
            onClick={() => setLeague(l.code)}
          >
            {l.name}
          </button>
        ))}
      </div>

      {loading && <p className="status">Đang tải...</p>}
      {error && <p className="status error">Không tải được dữ liệu: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th className="team-col">Đội</th>
              <th>Trận</th>
              <th>T</th>
              <th>H</th>
              <th>B</th>
              <th>BT</th>
              <th>BB</th>
              <th>HS</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.position}>
                <td>{r.position}</td>
                <td className="team-col">
                  {r.crest && <img src={r.crest} alt="" className="crest" />}
                  <span>{r.teamName}</span>
                </td>
                <td>{r.playedGames}</td>
                <td>{r.won}</td>
                <td>{r.draw}</td>
                <td>{r.lost}</td>
                <td>{r.goalsFor}</td>
                <td>{r.goalsAgainst}</td>
                <td>{r.goalDifference}</td>
                <td className="points">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
