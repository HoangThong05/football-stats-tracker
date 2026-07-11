import { useEffect, useState } from 'react'
import { API_BASE, endpointFor, authHeaders } from './api'
import { LEAGUES, VIEWS } from './constants'
import { LanguageContext, translations } from './i18n'
import Loading from './components/Loading'
import AuthPanel from './components/AuthPanel'
import AdminUsers from './components/AdminUsers'
import FavoritesList from './components/FavoritesList'
import LeaderboardView from './components/LeaderboardView'
import MyPredictionsHistory from './components/MyPredictionsHistory'
import StandingsTable from './components/StandingsTable'
import CompareTeams from './components/CompareTeams'
import ScorersTable from './components/ScorersTable'
import TeamDetail from './components/TeamDetail'
import MatchDetail from './components/MatchDetail'
import MatchList from './components/MatchList'
import PredictionsView from './components/PredictionsView'
import MiniLeague from './components/MiniLeague'

export default function App() {
  const [league, setLeague] = useState('PL')
  const [view, setView] = useState('standings')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showMyPredictions, setShowMyPredictions] = useState(false)
  const [showMiniLeague, setShowMiniLeague] = useState(false)

  const [token, setToken] = useState(() => localStorage.getItem('ft_token'))
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('ft_email'))
  const [userRole, setUserRole] = useState(() => localStorage.getItem('ft_role'))
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('ft_theme') || 'light')
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState(() => localStorage.getItem('ft_lang') || 'vi')

  // Tra tu dien theo ngon ngu hien tai; rot ve tieng Viet neu thieu key, roi rot ve chinh key
  const t = (key) => translations[lang]?.[key] ?? translations.vi[key] ?? key

  // Bootstrap 5.3 doi giao dien toi khi <html data-bs-theme="dark">
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem('ft_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('ft_lang', lang)
  }, [lang])

  // Navbar do bong sau hon khi cuon trang xuong, cho cam giac "noi" tren noi dung
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const loadViewData = () => {
    setLoading(true)
    setError(null)

    // Gan them token (neu co) cho moi request: cac endpoint cong khai bo qua header nay,
    // rieng "predict" dung no de biet du doan hien tai cua nguoi dung.
    fetch(endpointFor(view, league), { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadViewData, [league, view, token])

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
    setShowLeaderboard(false)
    setShowMyPredictions(false)
    setSelectedTeamId(null)
    setSelectedMatchId(null)
    setShowMiniLeague(false)
  }

  const goToTeam = (teamId) => {
    setShowFavorites(false)
    setShowLeaderboard(false)
    setShowMyPredictions(false)
    setSelectedMatchId(null)
    setSelectedTeamId(teamId)
  }

  const goToMatch = (matchId) => {
    setShowFavorites(false)
    setShowLeaderboard(false)
    setShowMyPredictions(false)
    setSelectedTeamId(null)
    setSelectedMatchId(matchId)
  }

  const currentLeague = LEAGUES.find((l) => l.code === league)

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      <>
        {/* ===== Thanh dieu huong ===== */}
        <nav className={scrolled ? 'ft-navbar py-3 mb-4 scrolled' : 'ft-navbar py-3 mb-4'}>
          <div className="container" style={{ maxWidth: 960 }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="ft-ball">⚽</span>
                <div>
                  <div className="ft-brand fs-5">Football Stats Tracker</div>
                  <div className="ft-brand-sub">{t('app_subtitle')}</div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  className="btn btn-nav btn-sm"
                  onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
                  title={t('lang_toggle_title')}
                >
                  {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                </button>

                <button
                  className="btn btn-nav btn-sm"
                  onClick={() => setTheme((th) => (th === 'dark' ? 'light' : 'dark'))}
                  title={t('theme_toggle_title')}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                <button
                  className="btn btn-nav btn-sm"
                  onClick={() => {
                    setSelectedTeamId(null)
                    setShowFavorites(false)
                    setShowAdmin(false)
                    setShowMyPredictions(false)
                    setShowLeaderboard(true)
                  }}
                >
                  {t('nav_leaderboard')}
                </button>
                <button
  className="btn btn-nav btn-sm"
  onClick={() => {
    setSelectedTeamId(null)
    setSelectedMatchId(null)
    setShowFavorites(false)
    setShowAdmin(false)
    setShowLeaderboard(false)
    setShowMyPredictions(false)
    setShowMiniLeague(true)
  }}
>
  🏆 Mini League
</button>

                {userEmail ? (
                  <>
                    <button
                      className="btn btn-nav btn-sm"
                      onClick={() => {
                        setSelectedTeamId(null)
                        setSelectedMatchId(null)
                        setShowAdmin(false)
                        setShowLeaderboard(false)
                        setShowMyPredictions(false)
                        setShowFavorites(true)
                      }}
                    >
                      {t('nav_favorites')} ({favorites.length})
                    </button>
                    <button
                      className="btn btn-nav btn-sm"
                      onClick={() => {
                        setSelectedTeamId(null)
                        setSelectedMatchId(null)
                        setShowAdmin(false)
                        setShowLeaderboard(false)
                        setShowFavorites(false)
                        setShowMyPredictions(true)
                      }}
                    >
                      {t('nav_history')}
                    </button>
                    {userRole === 'ADMIN' && (
                      <button
                        className="btn btn-nav btn-sm"
                        onClick={() => {
                          setSelectedTeamId(null)
                        setSelectedMatchId(null)
                          setShowFavorites(false)
                          setShowLeaderboard(false)
                          setShowMyPredictions(false)
                          setShowAdmin(true)
                        }}
                      >
                        {t('nav_admin')}
                      </button>
                    )}
                    <span className="ft-user-email d-none d-md-inline">
                      {userEmail}
                      {userRole === 'ADMIN' && <span className="badge text-bg-danger ms-1">ADMIN</span>}
                    </span>
                    <button className="btn btn-nav btn-sm" onClick={handleLogout}>
                      {t('nav_logout')}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-nav-solid btn-sm" onClick={() => setShowAuthForm((v) => !v)}>
                    {t('nav_login')}
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
          ) : selectedMatchId != null ? (
            <MatchDetail matchId={selectedMatchId} onBack={() => setSelectedMatchId(null)} />
          ) : showFavorites ? (
            <FavoritesList favorites={favorites} onSelectTeam={goToTeam} onBack={() => setShowFavorites(false)} />
          ) : showAdmin ? (
            <AdminUsers token={token} onBack={() => setShowAdmin(false)} />
          ) : showLeaderboard ? (
            <LeaderboardView token={token} userEmail={userEmail} onBack={() => setShowLeaderboard(false)} />
          ) : showMyPredictions ? (
            <MyPredictionsHistory token={token} onBack={() => setShowMyPredictions(false)} />
            ) : showMiniLeague ? (
            <MiniLeague token={token} />
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
                    {t(v.nameKey)}
                  </button>
                ))}
              </div>

              {loading && <Loading />}
              {error && (
                <div className="alert alert-danger">
                  {t('error_prefix')} {error}
                </div>
              )}

              {!loading && !error && (
                <div className="ft-fade" key={`${league}-${view}`}>
                  {view === 'standings' && (
                    <StandingsTable rows={data} zones={currentLeague?.zones} onSelectTeam={setSelectedTeamId} />
                  )}
                  {view === 'scorers' && <ScorersTable scorers={data} onSelectTeam={setSelectedTeamId} />}
                  {view === 'compare' && <CompareTeams rows={data} onSelectTeam={setSelectedTeamId} />}
                  {view === 'predict' && (
                    <PredictionsView matches={data} token={token} onRefresh={loadViewData} onSelectMatch={goToMatch} />
                  )}
                  {(view === 'upcoming' || view === 'results') && (
                    <MatchList matches={data} showScore={view === 'results'} onSelectMatch={goToMatch} />
                  )}
                </div>
              )}
            </>
          )}

          <footer className="ft-footer text-center mt-5 pt-4 border-top">
            {t('footer_data_from')}{' '}
            <a href="https://www.football-data.org" target="_blank" rel="noreferrer">
              football-data.org
            </a>{' '}
            {t('footer_updated')}
          </footer>
        </div>
      </>
    </LanguageContext.Provider>
  )
}
