import { useEffect, useState } from 'react'

const API_BASE = 'http://localhost:8080/api'

// zones: to mau vi tri tren BXH (top = suat du cup chau Au / vong sau, bottom = nguy hiem/xuong hang)
const LEAGUES = [
  { code: 'PL', name: 'Premier League', zones: { top: 4, bottom: 3 } },
  { code: 'PD', name: 'La Liga', zones: { top: 4, bottom: 3 } },
  { code: 'BL1', name: 'Bundesliga', zones: { top: 4, bottom: 3 } },
  { code: 'SA', name: 'Serie A', zones: { top: 4, bottom: 3 } },
  { code: 'FL1', name: 'Ligue 1', zones: { top: 4, bottom: 3 } },
  // League phase CL: top 8 vao thang vong 1/8, tu 25 tro xuong bi loai
  { code: 'CL', name: 'Champions League', zones: { top: 8, bottom: 12 } },
]

const VIEWS = [
  { key: 'standings', name: 'Bảng xếp hạng' },
  { key: 'upcoming', name: 'Lịch thi đấu' },
  { key: 'results', name: 'Kết quả' },
  { key: 'scorers', name: 'Vua phá lưới' },
  { key: 'compare', name: 'So sánh đội' },
]

// view -> đường dẫn API tương ứng.
// "compare" dùng lại chính dữ liệu bảng xếp hạng, không tốn thêm request.
function endpointFor(view, league) {
  if (view === 'standings' || view === 'compare') return `${API_BASE}/standings/${league}`
  if (view === 'scorers') return `${API_BASE}/scorers/${league}`
  return `${API_BASE}/matches/${league}/${view}`
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Bo dau + chuyen thuong, de go "munchen" van tim ra "FC Bayern München"
function normalizeText(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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

function Loading() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-success" role="status" style={{ width: 44, height: 44 }}>
        <span className="visually-hidden">Đang tải...</span>
      </div>
      <div className="text-secondary small mt-3">Đang tải dữ liệu...</div>
    </div>
  )
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
  const [userRole, setUserRole] = useState(() => localStorage.getItem('ft_role'))
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('ft_theme') || 'light')

  // Bootstrap 5.3 doi giao dien toi khi <html data-bs-theme="dark">
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem('ft_theme', theme)
  }, [theme])

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

  const handleAuthSuccess = (newToken, email, role) => {
    localStorage.setItem('ft_token', newToken)
    localStorage.setItem('ft_email', email)
    localStorage.setItem('ft_role', role)
    setToken(newToken)
    setUserEmail(email)
    setUserRole(role)
    setShowAuthForm(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('ft_token')
    localStorage.removeItem('ft_email')
    localStorage.removeItem('ft_role')
    setToken(null)
    setUserEmail(null)
    setUserRole(null)
    setShowFavorites(false)
    setShowAdmin(false)
    setSelectedTeamId(null)
  }

  const goToTeam = (teamId) => {
    setShowFavorites(false)
    setSelectedTeamId(teamId)
  }

  const currentLeague = LEAGUES.find((l) => l.code === league)

  return (
    <>
      {/* ===== Thanh dieu huong ===== */}
      <nav className="ft-navbar py-3 mb-4">
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <span className="ft-ball">⚽</span>
              <div>
                <div className="ft-brand fs-5">Football Stats Tracker</div>
                <div className="ft-brand-sub">Bảng xếp hạng · Lịch thi đấu · Kết quả · Vua phá lưới</div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-nav btn-sm"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                title="Chuyển giao diện sáng/tối"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {userEmail ? (
                <>
                  <button
                    className="btn btn-nav btn-sm"
                    onClick={() => {
                      setSelectedTeamId(null)
                      setShowAdmin(false)
                      setShowFavorites(true)
                    }}
                  >
                    ★ Yêu thích ({favorites.length})
                  </button>
                  {userRole === 'ADMIN' && (
                    <button
                      className="btn btn-nav btn-sm"
                      onClick={() => {
                        setSelectedTeamId(null)
                        setShowFavorites(false)
                        setShowAdmin(true)
                      }}
                    >
                      🛡 Quản trị
                    </button>
                  )}
                  <span className="ft-user-email d-none d-md-inline">
                    {userEmail}
                    {userRole === 'ADMIN' && <span className="badge text-bg-danger ms-1">ADMIN</span>}
                  </span>
                  <button className="btn btn-nav btn-sm" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button className="btn btn-nav-solid btn-sm" onClick={() => setShowAuthForm((v) => !v)}>
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container pb-4" style={{ maxWidth: 960 }}>
        {showAuthForm && !userEmail && (
          <div className="mb-4 ft-fade">
            <AuthPanel onSuccess={handleAuthSuccess} />
          </div>
        )}

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
        ) : showAdmin ? (
          <AdminUsers token={token} onBack={() => setShowAdmin(false)} />
        ) : (
          <>
            <div className="ft-league-tabs mb-3">
              {LEAGUES.map((l) => (
                <button
                  key={l.code}
                  className={l.code === league ? 'btn btn-sm active' : 'btn btn-sm'}
                  onClick={() => setLeague(l.code)}
                >
                  {l.name}
                </button>
              ))}
            </div>

            <div className="ft-view-tabs mb-4">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  className={v.key === view ? 'btn btn-sm active' : 'btn btn-sm'}
                  onClick={() => setView(v.key)}
                >
                  {v.name}
                </button>
              ))}
            </div>

            {loading && <Loading />}
            {error && <div className="alert alert-danger">Không tải được dữ liệu: {error}</div>}

            {!loading && !error && (
              <div className="ft-fade" key={`${league}-${view}`}>
                {view === 'standings' && (
                  <StandingsTable rows={data} zones={currentLeague?.zones} onSelectTeam={setSelectedTeamId} />
                )}
                {view === 'scorers' && <ScorersTable scorers={data} onSelectTeam={setSelectedTeamId} />}
                {view === 'compare' && <CompareTeams rows={data} onSelectTeam={setSelectedTeamId} />}
                {(view === 'upcoming' || view === 'results') && (
                  <MatchList matches={data} showScore={view === 'results'} />
                )}
              </div>
            )}
          </>
        )}

        <footer className="ft-footer text-center mt-5 pt-4 border-top">
          Dữ liệu từ{' '}
          <a href="https://www.football-data.org" target="_blank" rel="noreferrer">
            football-data.org
          </a>{' '}
          · Cập nhật mỗi 30 phút · Xây dựng bằng Spring Boot &amp; React
        </footer>
      </div>
    </>
  )
}

function AuthPanel({ onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [forgotHint, setForgotHint] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    setConfirmPassword('')
    setForgotHint(false)
  }

  const submit = (e) => {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setSubmitting(true)

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
      .then((data) => onSuccess(data.token, data.email, data.role))
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="ft-card p-4" style={{ maxWidth: 400 }}>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ width: 56, height: 56, background: 'var(--ft-accent-soft)', fontSize: '1.6rem' }}
        >
          {mode === 'login' ? '👋' : '🎉'}
        </div>
        <h4 className="fw-bold mb-1">{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h4>
        <p className="text-secondary small mb-0">
          {mode === 'login'
            ? 'Đăng nhập để tiếp tục theo dõi đội bóng yêu thích của bạn.'
            : 'Miễn phí — chỉ mất 30 giây để bắt đầu theo dõi đội yêu thích.'}
        </p>
      </div>

      <form onSubmit={submit} className="d-flex flex-column gap-3">
        <div>
          <label className="form-label small fw-medium">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <div className="d-flex justify-content-between align-items-center">
            <label className="form-label small fw-medium mb-1">Mật khẩu</label>
            {mode === 'login' && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 small mb-1"
                onClick={() => setForgotHint(true)}
              >
                Quên mật khẩu?
              </button>
            )}
          </div>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Mật khẩu của bạn'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {forgotHint && (
            <div className="form-text text-warning-emphasis">
              Tính năng khôi phục mật khẩu đang được phát triển. Liên hệ quản trị viên để được hỗ trợ.
            </div>
          )}
        </div>

        {mode === 'register' && (
          <div>
            <label className="form-label small fw-medium">Xác nhận mật khẩu</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger py-2 mb-0 small">{error}</div>}

        <button type="submit" className="btn btn-success w-100 fw-semibold py-2" disabled={submitting}>
          {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản miễn phí'}
        </button>
      </form>

      <div className="text-center small mt-3">
        {mode === 'login' ? (
          <>
            <span className="text-secondary">Chưa có tài khoản? </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => switchMode('register')}>
              Đăng ký ngay
            </button>
          </>
        ) : (
          <>
            <span className="text-secondary">Đã có tài khoản? </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => switchMode('login')}>
              Đăng nhập
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AdminUsers({ token, onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/admin/users`, { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        ← Quay lại
      </button>

      <h3 className="h5 mb-3">🛡 Quản trị — Danh sách người dùng</h3>

      {loading && <Loading />}
      {error && <div className="alert alert-danger">Không tải được: {error}</div>}

      {!loading && !error && (
        <div className="ft-card table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="fw-medium">{u.email}</td>
                  <td>
                    <span className={u.role === 'ADMIN' ? 'badge text-bg-danger' : 'badge text-bg-secondary'}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-secondary small">{new Date(u.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FavoritesList({ favorites, onSelectTeam, onBack }) {
  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        ← Quay lại
      </button>

      <h3 className="h5 mb-3">★ Đội yêu thích</h3>

      {favorites.length === 0 ? (
        <div className="alert alert-secondary">
          Bạn chưa theo dõi đội nào. Vào bảng xếp hạng, bấm vào 1 đội để theo dõi.
        </div>
      ) : (
        <div className="ft-card">
          <ul className="list-group list-group-flush">
            {favorites.map((f) => (
              <li
                key={f.teamId}
                className="list-group-item d-flex align-items-center gap-3 py-3"
                role="button"
                onClick={() => onSelectTeam(f.teamId)}
              >
                {f.teamCrest && <img src={f.teamCrest} alt="" width="28" height="28" loading="lazy" />}
                <span className="fw-medium">{f.teamName}</span>
                <span className="ms-auto text-secondary">›</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Tra ve class huy hieu vi tri theo vung (suat cup chau Au / nguy hiem)
function posClass(position, total, zones) {
  if (!zones) return 'ft-pos'
  if (position <= zones.top) return 'ft-pos ft-pos-top'
  if (position > total - zones.bottom) return 'ft-pos ft-pos-bottom'
  return 'ft-pos'
}

function StandingsTable({ rows, zones, onSelectTeam }) {
  const [query, setQuery] = useState('')

  const q = normalizeText(query.trim())
  const filtered = q ? rows.filter((r) => normalizeText(r.teamName).includes(q)) : rows

  return (
    <div>
      <input
        type="search"
        className="form-control mb-3"
        style={{ maxWidth: 300 }}
        placeholder="🔍 Tìm đội bóng..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="alert alert-secondary">Không tìm thấy đội nào khớp “{query}”.</div>
      ) : (
        <>
          <div className="ft-card table-responsive">
            <table className="table table-hover align-middle">
              <thead>
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
                {zones.top === 8 ? 'Vào thẳng vòng 1/8' : 'Dự cúp châu Âu'}
              </span>
              <span>
                <span className="dot" style={{ background: '#dc2626' }} />
                {zones.top === 8 ? 'Bị loại' : 'Khu vực xuống hạng'}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Chi so so sanh. better: 'high' = cao hon thi tot hon, 'low' = thap hon tot hon, null = khong so sanh
const COMPARE_METRICS = [
  { key: 'position', label: 'Vị trí', better: 'low' },
  { key: 'playedGames', label: 'Số trận', better: null },
  { key: 'won', label: 'Thắng', better: 'high' },
  { key: 'draw', label: 'Hòa', better: null },
  { key: 'lost', label: 'Thua', better: 'low' },
  { key: 'goalsFor', label: 'Bàn thắng', better: 'high' },
  { key: 'goalsAgainst', label: 'Bàn thua', better: 'low' },
  { key: 'goalDifference', label: 'Hiệu số', better: 'high' },
  { key: 'points', label: 'Điểm', better: 'high' },
]

function CompareTeams({ rows, onSelectTeam }) {
  const [idA, setIdA] = useState(null)
  const [idB, setIdB] = useState(null)

  // Doi giai -> chon lai 2 doi dau bang lam mac dinh
  useEffect(() => {
    setIdA(rows[0]?.teamId ?? null)
    setIdB(rows[1]?.teamId ?? null)
  }, [rows])

  if (rows.length < 2) {
    return <div className="alert alert-secondary">Giải này chưa đủ dữ liệu để so sánh.</div>
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
        <div className="alert alert-warning py-2">Bạn đang chọn cùng một đội ở cả hai bên.</div>
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
              <th style={{ width: '30%' }}>Chỉ số</th>
              <th style={{ width: '35%' }} role="button" onClick={() => onSelectTeam(teamB.teamId)}>
                <div className="d-flex align-items-center justify-content-center gap-2">
                  {teamB.crest && <img src={teamB.crest} alt="" width="26" height="26" />}
                  <span>{teamB.teamName}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((m) => (
              <tr key={m.key}>
                <td className={cellClass(m, 'A')}>{teamA[m.key]}</td>
                <td className="text-secondary small text-uppercase" style={{ letterSpacing: '0.04em' }}>
                  {m.label}
                </td>
                <td className={cellClass(m, 'B')}>{teamB[m.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ft-legend text-secondary mt-2 ps-1">
        Chỉ số tốt hơn được <span className="fw-bold text-success">tô xanh</span>. Bấm vào tên đội để xem chi tiết.
      </p>
    </div>
  )
}

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function ScorersTable({ scorers, onSelectTeam }) {
  if (scorers.length === 0) {
    return <div className="alert alert-secondary">Chưa có dữ liệu vua phá lưới cho giải này.</div>
  }

  return (
    <div className="ft-card table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Cầu thủ</th>
            <th>Đội</th>
            <th className="text-center">Trận</th>
            <th className="text-center">Bàn thắng</th>
            <th className="text-center">Kiến tạo</th>
          </tr>
        </thead>
        <tbody>
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
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        ← Quay lại bảng xếp hạng
      </button>

      {loading && <Loading />}
      {error && <div className="alert alert-danger">Không tải được dữ liệu: {error}</div>}

      {!loading && !error && team && (
        <>
          <div className="ft-team-hero p-4 mb-4">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              {team.crest && <img src={team.crest} alt="" className="crest-big" />}
              <div className="flex-grow-1">
                <h2 className="h3 mb-2 fw-bold">{team.name}</h2>
                <div className="d-flex flex-wrap column-gap-4 row-gap-1">
                  {team.venue && <div className="text-muted small">🏟 {team.venue}</div>}
                  {team.founded != null && <div className="text-muted small">📅 Thành lập {team.founded}</div>}
                  {team.clubColors && <div className="text-muted small">🎽 {team.clubColors}</div>}
                  {team.coachName && <div className="text-muted small">👔 HLV: {team.coachName}</div>}
                </div>
                {team.website && (
                  <div className="small mt-2">
                    <a href={team.website} target="_blank" rel="noreferrer">
                      Trang chủ chính thức ↗
                    </a>
                  </div>
                )}
              </div>

              {token ? (
                <button
                  className={isFollowing ? 'btn btn-warning fw-semibold' : 'btn btn-outline-light fw-semibold'}
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

          {/* Goi mien phi cua football-data.org khong tra ve doi hinh (squad luon rong).
              Chi hien muc nay khi that su co du lieu -> tu dong xuat hien neu sau nay nang gop. */}
          {team.squad.length > 0 && (
            <>
              <h3 className="h5 mb-3">Đội hình</h3>
              <div className="ft-card">
                <ul className="list-group list-group-flush">
                  {team.squad.map((p) => (
                    <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span className="fw-medium">{p.name}</span>
                      <span className="text-secondary small">
                        {p.position || '—'} · {p.nationality || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function MatchList({ matches, showScore }) {
  if (matches.length === 0) {
    return (
      <div className="alert alert-secondary d-flex align-items-center gap-2">
        <span style={{ fontSize: '1.3rem' }}>📅</span>
        <span>Không có trận nào trong 14 ngày. Các giải châu Âu thường nghỉ hè từ tháng 6 đến giữa tháng 8.</span>
      </div>
    )
  }

  return (
    <div className="ft-card">
      <ul className="list-group list-group-flush">
        {matches.map((m) => (
          <li key={m.id} className="list-group-item d-flex align-items-center flex-wrap gap-2 py-3">
            <small className="text-secondary" style={{ minWidth: 132 }}>
              {formatKickoff(m.utcDate)}
              {m.matchday != null && <span className="text-body-tertiary"> · Vòng {m.matchday}</span>}
            </small>

            <div className="d-flex align-items-center justify-content-end gap-2 flex-grow-1" style={{ minWidth: 0 }}>
              <span className="text-truncate fw-medium">{m.homeTeam}</span>
              {m.homeCrest && <img src={m.homeCrest} alt="" width="22" height="22" loading="lazy" />}
            </div>

            <span className={showScore ? 'ft-score-badge played text-center' : 'ft-score-badge upcoming text-center'}>
              {showScore ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
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
