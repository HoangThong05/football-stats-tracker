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

const VIEWS = [
  { key: 'standings', name: 'Bảng xếp hạng' },
  { key: 'upcoming', name: 'Lịch thi đấu' },
  { key: 'results', name: 'Kết quả' },
]

// view -> đường dẫn API tương ứng
function endpointFor(view, league) {
  if (view === 'standings') return `${API_BASE}/standings/${league}`
  return `${API_BASE}/matches/${league}/${view}`
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatKickoff(utcDate) {
  return new Date(utcDate).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function App() {
  const [league, setLeague] = useState('PL')
  const [view, setView] = useState('standings')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)

  const [token, setToken] = useState(() => localStorage.getItem('ft_token'))
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('ft_email'))
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(endpointFor(view, league))
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [league, view])

  const refreshFavorites = (currentToken) => {
    fetch(`${API_BASE}/favorites`, { headers: authHeaders(currentToken) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setFavorites(data))
      .catch(() => setFavorites([]))
  }

  useEffect(() => {
    if (token) refreshFavorites(token)
    else setFavorites([])
  }, [token])

  const handleAuthSuccess = (newToken, email) => {
    localStorage.setItem('ft_token', newToken)
    localStorage.setItem('ft_email', email)
    setToken(newToken)
    setUserEmail(email)
    setShowAuthForm(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('ft_token')
    localStorage.removeItem('ft_email')
    setToken(null)
    setUserEmail(null)
    setShowFavorites(false)
    setSelectedTeamId(null)
  }

  const goToTeam = (teamId) => {
    setShowFavorites(false)
    setSelectedTeamId(teamId)
  }

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <header className="mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h1 className="h3 mb-1">⚽ Football Stats Tracker</h1>
            <p className="text-muted mb-0">Bảng xếp hạng, lịch thi đấu &amp; kết quả các giải hàng đầu</p>
          </div>

          {userEmail ? (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-outline-warning btn-sm"
                onClick={() => {
                  setSelectedTeamId(null)
                  setShowFavorites(true)
                }}
              >
                ★ Đội yêu thích ({favorites.length})
              </button>
              <span className="text-muted small">{userEmail}</span>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAuthForm((v) => !v)}>
              Đăng nhập / Đăng ký
            </button>
          )}
        </div>

        {showAuthForm && !userEmail && <AuthPanel onSuccess={handleAuthSuccess} />}
      </header>

      {selectedTeamId != null ? (
        <TeamDetail
          teamId={selectedTeamId}
          onBack={() => setSelectedTeamId(null)}
          token={token}
          favorites={favorites}
          onFavoritesChange={() => refreshFavorites(token)}
        />
      ) : showFavorites ? (
        <FavoritesList favorites={favorites} onSelectTeam={goToTeam} onBack={() => setShowFavorites(false)} />
      ) : (
        <>
          <ul className="nav nav-pills mb-2">
            {LEAGUES.map((l) => (
              <li className="nav-item" key={l.code}>
                <button
                  className={l.code === league ? 'nav-link active' : 'nav-link'}
                  onClick={() => setLeague(l.code)}
                >
                  {l.name}
                </button>
              </li>
            ))}
          </ul>

          <ul className="nav nav-pills mb-3">
            {VIEWS.map((v) => (
              <li className="nav-item" key={v.key}>
                <button
                  className={v.key === view ? 'nav-link active py-1 small' : 'nav-link py-1 small'}
                  onClick={() => setView(v.key)}
                >
                  {v.name}
                </button>
              </li>
            ))}
          </ul>

          {loading && <div className="text-center text-muted py-4">Đang tải...</div>}
          {error && <div className="alert alert-danger">Không tải được dữ liệu: {error}</div>}

          {!loading && !error && view === 'standings' && (
            <StandingsTable rows={data} onSelectTeam={setSelectedTeamId} />
          )}
          {!loading && !error && view !== 'standings' && (
            <MatchList matches={data} showScore={view === 'results'} />
          )}
        </>
      )}
    </div>
  )
}

function AuthPanel({ onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    fetch(`${API_BASE}/auth/${mode === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `Loi ${res.status}`)
        }
        return res.json()
      })
      .then((data) => onSuccess(data.token, data.email))
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="card mt-3" style={{ maxWidth: 360 }}>
      <div className="card-body">
        <ul className="nav nav-pills nav-fill mb-3">
          <li className="nav-item">
            <button
              type="button"
              className={mode === 'login' ? 'nav-link active' : 'nav-link'}
              onClick={() => setMode('login')}
            >
              Đăng nhập
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={mode === 'register' ? 'nav-link active' : 'nav-link'}
              onClick={() => setMode('register')}
            >
              Đăng ký
            </button>
          </li>
        </ul>

        <form onSubmit={submit} className="d-flex flex-column gap-2">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>

          {error && <div className="alert alert-danger py-2 mb-0 small">{error}</div>}
        </form>
      </div>
    </div>
  )
}

function FavoritesList({ favorites, onSelectTeam, onBack }) {
  return (
    <div>
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        ← Quay lại
      </button>

      <h3 className="h5">Đội yêu thích</h3>

      {favorites.length === 0 ? (
        <div className="alert alert-secondary">
          Bạn chưa theo dõi đội nào. Vào bảng xếp hạng, bấm vào 1 đội để theo dõi.
        </div>
      ) : (
        <ul className="list-group">
          {favorites.map((f) => (
            <li
              key={f.teamId}
              className="list-group-item d-flex align-items-center gap-2"
              role="button"
              onClick={() => onSelectTeam(f.teamId)}
            >
              {f.teamCrest && <img src={f.teamCrest} alt="" width="24" height="24" />}
              <span>{f.teamName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StandingsTable({ rows, onSelectTeam }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Đội</th>
            <th className="text-center">Trận</th>
            <th className="text-center">T</th>
            <th className="text-center">H</th>
            <th className="text-center">B</th>
            <th className="text-center">BT</th>
            <th className="text-center">BB</th>
            <th className="text-center">HS</th>
            <th className="text-center">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.teamId} role="button" onClick={() => onSelectTeam(r.teamId)}>
              <td>{r.position}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {r.crest && <img src={r.crest} alt="" width="20" height="20" />}
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
  )
}

function TeamDetail({ teamId, onBack, token, favorites, onFavoritesChange }) {
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setTeam(null)

    fetch(`${API_BASE}/teams/${teamId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setTeam(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [teamId])

  const isFollowing = favorites.some((f) => f.teamId === teamId)

  const toggleFollow = () => {
    if (!team) return
    setFollowBusy(true)

    const request = isFollowing
      ? fetch(`${API_BASE}/favorites/${teamId}`, { method: 'DELETE', headers: authHeaders(token) })
      : fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
          body: JSON.stringify({ teamId, teamName: team.name, teamCrest: team.crest }),
        })

    request
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        onFavoritesChange()
      })
      .finally(() => setFollowBusy(false))
  }

  return (
    <div>
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        ← Quay lại bảng xếp hạng
      </button>

      {loading && <div className="text-center text-muted py-4">Đang tải...</div>}
      {error && <div className="alert alert-danger">Không tải được dữ liệu: {error}</div>}

      {!loading && !error && team && (
        <>
          <div className="card mb-4">
            <div className="card-body d-flex align-items-center gap-3 flex-wrap">
              {team.crest && <img src={team.crest} alt="" width="64" height="64" />}
              <div className="flex-grow-1">
                <h2 className="h4 mb-1">{team.name}</h2>
                {team.venue && <div className="text-muted small">Sân nhà: {team.venue}</div>}
                {team.founded != null && <div className="text-muted small">Thành lập: {team.founded}</div>}
                {team.coachName && <div className="text-muted small">HLV: {team.coachName}</div>}
              </div>

              {token ? (
                <button
                  className={isFollowing ? 'btn btn-warning' : 'btn btn-outline-warning'}
                  onClick={toggleFollow}
                  disabled={followBusy}
                >
                  {isFollowing ? '★ Đang theo dõi' : '☆ Theo dõi'}
                </button>
              ) : (
                <span className="text-muted small">Đăng nhập để theo dõi đội này</span>
              )}
            </div>
          </div>

          <h3 className="h5">Đội hình</h3>
          {team.squad.length === 0 ? (
            <div className="alert alert-secondary">Không có dữ liệu đội hình.</div>
          ) : (
            <ul className="list-group">
              {team.squad.map((p) => (
                <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>{p.name}</span>
                  <span className="text-muted small">
                    {p.position || '—'} · {p.nationality || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function MatchList({ matches, showScore }) {
  if (matches.length === 0) {
    return <div className="alert alert-secondary">Không có trận nào trong 14 ngày.</div>
  }

  return (
    <ul className="list-group">
      {matches.map((m) => (
        <li key={m.id} className="list-group-item d-flex align-items-center flex-wrap gap-2">
          <small className="text-muted" style={{ minWidth: 130 }}>
            {formatKickoff(m.utcDate)}
            {m.matchday != null && <span className="text-body-tertiary"> · Vòng {m.matchday}</span>}
          </small>

          <div className="d-flex align-items-center justify-content-end gap-2 flex-grow-1" style={{ minWidth: 0 }}>
            <span className="text-truncate">{m.homeTeam}</span>
            {m.homeCrest && <img src={m.homeCrest} alt="" width="20" height="20" />}
          </div>

          <span
            className={showScore ? 'badge text-bg-primary' : 'badge text-bg-light text-muted'}
            style={{ minWidth: 52 }}
          >
            {showScore ? `${m.homeScore} - ${m.awayScore}` : 'vs'}
          </span>

          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
            {m.awayCrest && <img src={m.awayCrest} alt="" width="20" height="20" />}
            <span className="text-truncate">{m.awayTeam}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
