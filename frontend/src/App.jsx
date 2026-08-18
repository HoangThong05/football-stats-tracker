import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  endpointFor,
  authHeaders,
  isTokenExpired,
  loadSavedSession,
  clearSavedSession,
} from "./api";
import { LEAGUES, VIEWS } from "./constants";
import { LanguageContext, translations } from "./i18n";
import { useSlidingIndicator } from "./useSlidingIndicator";
import { usePendingPredictions } from "./usePendingPredictions";
import Loading from "./components/Loading";
import AuthPanel from "./components/AuthPanel";
import AdminUsers from "./components/AdminUsers";
import FavoritesList from "./components/FavoritesList";
import LeaderboardView from "./components/LeaderboardView";
import MyPredictionsHistory from "./components/MyPredictionsHistory";
import StandingsTable from "./components/StandingsTable";
import CompareTeams from "./components/CompareTeams";
import ScorersTable from "./components/ScorersTable";
import TeamDetail from "./components/TeamDetail";
import MatchDetail from "./components/MatchDetail";
import MatchList from "./components/MatchList";
import PredictionsView from "./components/PredictionsView";
import MiniLeague from "./components/MiniLeague";
import Profile from "./components/Profile";
import TodayMatches from "./components/TodayMatches";
import Football3D from "./components/Football3D";
import StatueDrawer from "./components/StatueDrawer";
import Modal from "./components/Modal";
import PitchBackdrop from "./components/PitchBackdrop";
import LiveTicker from "./components/LiveTicker";
import SeasonBreak from "./components/SeasonBreak";
import DataFreshness from "./components/DataFreshness";

export default function App() {
  const [league, setLeague] = useState("PL");
  const [view, setView] = useState("standings");
  const [data, setData] = useState([]);
  // season = null -> "mua hien tai" (tu dong). autoSeasonYear = nam bat dau mua hien tai
  // (suy tu seasonLabel cua lan fetch tu dong gan nhat), dung de dung danh sach 2 mua truoc do.
  const [season, setSeason] = useState(null);
  const [autoSeasonYear, setAutoSeasonYear] = useState(null);
  const [seasonStart, setSeasonStart] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMyPredictions, setShowMyPredictions] = useState(false);
  const [showMiniLeague, setShowMiniLeague] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Doc phien da luu MOT LAN khi mount; tu xoa neu JWT da het han (mac dinh 24h),
  // tranh giao dien hien "dang dang nhap" nhung moi request deu bi tra 403.
  const [initialSession] = useState(loadSavedSession);
  const [token, setToken] = useState(initialSession.token);
  const [userEmail, setUserEmail] = useState(initialSession.email);
  const [userRole, setUserRole] = useState(initialSession.role);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ft_theme") || "light",
  );
  const [scrolled, setScrolled] = useState(false);
  const navbarRef = useRef(null);
  const [lang, setLang] = useState(
    () => localStorage.getItem("ft_lang") || "vi",
  );

  // Tra tu dien theo ngon ngu hien tai; rot ve tieng Viet neu thieu key, roi rot ve chinh key
  const t = (key) => translations[lang]?.[key] ?? translations.vi[key] ?? key;

  // Vien truot trong thanh chon che do xem. Do lai khi doi tab HOAC doi ngon ngu
  // (nhan tieng Anh dai ngan khac tieng Viet -> nut rong khac -> vien phai chinh theo).
  const viewTabsRef = useSlidingIndicator(`${view}-${lang}`);

  // So tran sap da ma chua du doan -> huy hieu tren tab "Du doan"
  const { count: pendingPredictions, refresh: refreshPendingPredictions } =
    usePendingPredictions(league, token);

  // Bootstrap 5.3 doi giao dien toi khi <html data-bs-theme="dark">
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("ft_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ft_lang", lang);
  }, [lang]);

  // Navbar do bong sau hon khi cuon trang xuong, cho cam giac "noi" tren noi dung
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Do chieu cao that cua navbar -> bien --ft-navbar-h.
   * Tieu de bang xep hang dinh (sticky) dua vao bien nay de dung ngay duoi navbar,
   * thay vi bi navbar de len. Navbar cao thap khac nhau tuy so nut / co xuong dong.
   */
  useEffect(() => {
    const nav = navbarRef.current;
    if (!nav) return undefined;

    const apply = () => {
      document.documentElement.style.setProperty(
        "--ft-navbar-h",
        `${Math.round(nav.getBoundingClientRect().height)}px`,
      );
    };
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  /**
   * Vet sang den pha di theo con tro tren navbar.
   * Chi ghi 2 bien CSS (--ft-glow-x/y), phan ve de CSS lo -> khong gay reflow.
   * Bo qua o may khong co chuot that hoac khi nguoi dung bat "giam chuyen dong".
   */
  useEffect(() => {
    const nav = navbarRef.current;
    if (!nav) return undefined;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return undefined;

    let frame = 0;

    // Gop nhieu su kien chuot vao 1 khung hinh -> khong tinh toan thua
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = nav.getBoundingClientRect();
        nav.style.setProperty("--ft-glow-x", `${e.clientX - r.left}px`);
        nav.style.setProperty("--ft-glow-y", `${e.clientY - r.top}px`);
      });
    };

    nav.addEventListener("pointermove", onMove);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      nav.removeEventListener("pointermove", onMove);
    };
  }, []);

  /**
   * Ghi diem bam vao --ft-rx/--ft-ry de gon song lan ra tu dung ngon tay/con tro
   * (xem .btn::after), thay vi luc nao cung tu tam nut.
   *
   * Bat o cap document nen nut nao them sau nay cung tu co, khong phai sua gi.
   * Bam bang ban phim khong co toa do -> bo qua, CSS tu rot ve tam nut.
   */
  useEffect(() => {
    const onPointerDown = (e) => {
      const btn = e.target.closest?.(".btn");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--ft-rx", `${e.clientX - r.left}px`);
      btn.style.setProperty("--ft-ry", `${e.clientY - r.top}px`);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const loadViewData = () => {
    setLoading(true);
    setError(null);

    // Gan them token (neu co) cho moi request: cac endpoint cong khai bo qua header nay,
    // rieng "predict" dung no de biet du doan hien tai cua nguoi dung.
    fetch(endpointFor(view, league, season), { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`);
        // Standings/Scorers kem header nay: football-data.org tu chon "mua hien tai"
        // theo tung giai (khong nhan tham so season). Chi cap nhat moc "mua hien tai"
        // khi dang o che do tu dong (season=null) - dung de dung 2 lua chon mua truoc do.
        if (season === null) {
          const label = res.headers.get("X-Season-Label") || null;
          const year = label ? parseInt(label.split("/")[0], 10) : NaN;
          if (!Number.isNaN(year)) setAutoSeasonYear(year);
          // Ngay khai mac mua giai, dung de dem nguoc luc trai mua (xem SeasonBreak)
          setSeasonStart(res.headers.get("X-Season-Start") || null);
        }
        // Gio backend THUC SU goi nguon du lieu. Chi bang xep hang / lich / ket qua
        // moi gan header nay; cac view khac tra null va dong "cap nhat" se an di.
        setFetchedAt(res.headers.get("X-Data-Fetched-At") || null);
        return res.json();
      })
      .then((data) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadViewData, [league, view, token, season]);

  // Doi giai -> quay ve mua hien tai (mua "gan nhat" co the khac giua cac giai)
  const changeLeague = (code) => {
    setSeason(null);
    setAutoSeasonYear(null);
    setLeague(code);
  };

  const refreshFavorites = (currentToken) => {
    fetch(`${API_BASE}/favorites`, { headers: authHeaders(currentToken) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`);
        return res.json();
      })
      .then((data) => setFavorites(data))
      .catch(() => setFavorites([]));
  };

  useEffect(() => {
    if (token) refreshFavorites(token);
    else setFavorites([]);
  }, [token]);

  const handleAuthSuccess = (newToken, email, role) => {
    localStorage.setItem("ft_token", newToken);
    localStorage.setItem("ft_email", email);
    localStorage.setItem("ft_role", role);
    setToken(newToken);
    setUserEmail(email);
    setUserRole(role);
    setSessionExpired(false);
    setShowAuthForm(false);
  };

  /**
   * Dong het cac trang phu (moi trang la 1 co rieng). Goi truoc khi mo 1 trang moi,
   * de khong phai liet ke lai tung co o moi nut dieu huong - va khong bi sot co nao
   * khi them trang moi ve sau.
   */
  const closeAllPages = () => {
    setSelectedTeamId(null);
    setSelectedMatchId(null);
    setShowFavorites(false);
    setShowAdmin(false);
    setShowLeaderboard(false);
    setShowMyPredictions(false);
    setShowMiniLeague(false);
    setShowProfile(false);
    setShowToday(false);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    clearSavedSession();
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
    closeAllPages();
  };

  // Token het han GIUA CHUNG luc dang dung: tu dang xuat + bao cho nguoi dung,
  // thay vi de ho bam mai ma chi nhan loi 403 khong ro nguyen nhan.
  useEffect(() => {
    if (!token) return undefined;
    const timer = setInterval(() => {
      if (isTokenExpired(token)) {
        handleLogout();
        setSessionExpired(true);
      }
    }, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const goToTeam = (teamId) => {
    closeAllPages();
    setSelectedTeamId(teamId);
  };

  // KHONG dong trang "Hom nay" o day: MatchDetail duoc uu tien hien truoc trong chuoi
  // ternary ben duoi, nen giu showToday=true de bam "Quay lai" se ve dung trang Hom nay.
  const goToMatch = (matchId) => {
    setShowFavorites(false);
    setShowLeaderboard(false);
    setShowMyPredictions(false);
    setShowProfile(false);
    setSelectedTeamId(null);
    setSelectedMatchId(matchId);
  };

  const currentLeague = LEAGUES.find((l) => l.code === league);
  // Vd 2025 -> "2025/26"
  const formatSeasonRange = (startYear) => `${startYear}/${String(startYear + 1).slice(2)}`;

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      <>
        <PitchBackdrop />

        {/* ===== Thanh dieu huong ===== */}
        <nav
          ref={navbarRef}
          className={
            scrolled ? "ft-navbar py-2 scrolled" : "ft-navbar py-2"
          }
        >
          <div className="container" style={{ maxWidth: 960 }}>
            {/*
             * Hai ben ro rang: BEN TRAI la moi thu thuoc ve trang web (thuong hieu,
             * cac trang con, tuy chon hien thi), BEN PHAI chi danh cho tai khoan.
             * Nut cung nhom duoc gop thanh mot cum lien mach de bot vien vun vat.
             */}
            <div className="ft-navbar-row">
              <div className="ft-navbar-left">
                <div className="ft-navbar-brand d-flex align-items-center gap-2">
                  <span className="ft-ball">
                    <Football3D size={26} />
                  </span>
                  <div className="ft-brand-text">
                    <div className="ft-brand">Football Stats Tracker</div>
                    <div className="ft-brand-sub">{t("app_subtitle")}</div>
                  </div>
                </div>

                {/* Cum 1: cac trang con */}
                <div className="ft-nav-group">
                  <button
                    className="ft-nav-btn"
                    onClick={() => {
                      closeAllPages();
                      setShowToday(true);
                    }}
                  >
                    {t("nav_today")}
                  </button>
                  <button
                    className="ft-nav-btn"
                    onClick={() => {
                      closeAllPages();
                      setShowLeaderboard(true);
                    }}
                  >
                    {t("nav_leaderboard")}
                  </button>
                  <button
                    className="ft-nav-btn"
                    onClick={() => {
                      closeAllPages();
                      setShowMiniLeague(true);
                    }}
                  >
                    {t("nav_mini_league")}
                  </button>
                </div>

                {/* Cum 2: tuy chon hien thi (ngon ngu + sang/toi) */}
                <div className="ft-nav-group">
                  <button
                    className="ft-nav-btn"
                    onClick={() => setLang((l) => (l === "vi" ? "en" : "vi"))}
                    title={t("lang_toggle_title")}
                  >
                    {lang === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
                  </button>
                  <button
                    className="ft-nav-btn ft-nav-btn-icon"
                    onClick={() =>
                      setTheme((th) => (th === "dark" ? "light" : "dark"))
                    }
                    title={t("theme_toggle_title")}
                  >
                    {theme === "dark" ? "☀️" : "🌙"}
                  </button>
                </div>
              </div>

              <div className="ft-navbar-right">
                {userEmail ? (
                  <div
                    className="ft-user-menu"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setShowUserMenu(false);
                      }
                    }}
                  >
                    {/*
                     * Email dai lam phinh ca thanh nav -> chi hien avatar o day,
                     * dia chi day du nam trong dau muc cua menu khi mo ra.
                     */}
                    <button
                      className="ft-user-btn"
                      onClick={() => setShowUserMenu((v) => !v)}
                      title={userEmail}
                    >
                      <span className="ft-user-avatar">
                        {userEmail.charAt(0).toUpperCase()}
                      </span>
                      {userRole === "ADMIN" && (
                        <span className="ft-user-role">ADMIN</span>
                      )}
                      <span className="ft-user-caret">▾</span>
                    </button>

                    {showUserMenu && (
                      <div className="ft-user-menu-panel ft-fade">
                        <div className="ft-user-menu-header">{userEmail}</div>
                        <button
                          className="ft-user-menu-item"
                          onClick={() => {
                            closeAllPages();
                            setShowProfile(true);
                          }}
                        >
                          {t("nav_profile")}
                        </button>
                        <button
                          className="ft-user-menu-item"
                          onClick={() => {
                            closeAllPages();
                            setShowFavorites(true);
                          }}
                        >
                          {t("nav_favorites")} ({favorites.length})
                        </button>
                        <button
                          className="ft-user-menu-item"
                          onClick={() => {
                            closeAllPages();
                            setShowMyPredictions(true);
                          }}
                        >
                          {t("nav_history")}
                        </button>
                        {userRole === "ADMIN" && (
                          <button
                            className="ft-user-menu-item"
                            onClick={() => {
                              closeAllPages();
                              setShowAdmin(true);
                            }}
                          >
                            {t("nav_admin")}
                          </button>
                        )}
                        <div className="ft-user-menu-divider" />
                        <button
                          className="ft-user-menu-item ft-user-menu-item-danger"
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                        >
                          {t("nav_logout")}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="btn btn-nav-solid btn-sm"
                    onClick={() => setShowAuthForm((v) => !v)}
                  >
                    {t("nav_login")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Dan ngay duoi navbar, khong co khe ho - navbar da bo mb-4 de nhuong cho.
            Trai mua giai thi LiveTicker tu tra null, luc do khoang cach van nhu cu
            nho mt-4 cua khoi noi dung ben duoi. */}
        <LiveTicker onSelectMatch={goToMatch} />

        <div className="container mt-4 pb-4" style={{ maxWidth: 960 }}>
          {sessionExpired && !userEmail && (
            <div className="alert alert-warning d-flex align-items-center gap-2 ft-fade">
              <span style={{ fontSize: "1.2rem" }}>🔒</span>
              <span className="flex-grow-1">{t("session_expired")}</span>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setSessionExpired(false);
                  setShowAuthForm(true);
                }}
              >
                {t("auth_login_btn")}
              </button>
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
            <MatchDetail
              matchId={selectedMatchId}
              onBack={() => setSelectedMatchId(null)}
            />
          ) : showFavorites ? (
            <FavoritesList
              favorites={favorites}
              onSelectTeam={goToTeam}
              onBack={() => setShowFavorites(false)}
            />
          ) : showAdmin ? (
            <AdminUsers
              token={token}
              currentEmail={userEmail}
              onBack={() => setShowAdmin(false)}
            />
          ) : showLeaderboard ? (
            <LeaderboardView
              token={token}
              userEmail={userEmail}
              onBack={() => setShowLeaderboard(false)}
            />
          ) : showMyPredictions ? (
            <MyPredictionsHistory
              token={token}
              onBack={() => setShowMyPredictions(false)}
            />
          ) : showMiniLeague ? (
            <MiniLeague token={token} onBack={() => setShowMiniLeague(false)} />
          ) : showProfile ? (
            <Profile
              token={token}
              userEmail={userEmail}
              favorites={favorites}
              onBack={() => setShowProfile(false)}
              onSelectTeam={goToTeam}
              onGoToMiniLeague={() => {
                setShowProfile(false);
                setShowMiniLeague(true);
              }}
            />
          ) : showToday ? (
            <TodayMatches
              onBack={() => setShowToday(false)}
              onSelectMatch={goToMatch}
            />
          ) : (
            <>
              <div className="ft-league-tabs mb-3">
                {LEAGUES.map((l) => (
                  <button
                    key={l.code}
                    className={
                      l.code === league ? "btn btn-sm active" : "btn btn-sm"
                    }
                    onClick={() => changeLeague(l.code)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>

              <div className="d-flex align-items-center flex-wrap gap-2 mb-4">
                <div className="ft-view-tabs" ref={viewTabsRef}>
                  {VIEWS.map((v) => (
                    <button
                      key={v.key}
                      className={
                        v.key === view ? "btn btn-sm active" : "btn btn-sm"
                      }
                      onClick={() => setView(v.key)}
                    >
                      {t(v.nameKey)}
                      {/* Chi tab Du doan moi co huy hieu, va chi khi that su con tran chua doan */}
                      {v.key === "predict" && pendingPredictions > 0 && (
                        <span
                          className="ft-tab-badge"
                          title={t("predict_pending_hint")}
                        >
                          {pendingPredictions}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {autoSeasonYear != null &&
                  (view === "standings" || view === "scorers" || view === "compare") && (
                  <select
                    className="ft-season-badge"
                    value={season ?? ""}
                    onChange={(e) =>
                      setSeason(e.target.value ? Number(e.target.value) : null)
                    }
                    title={t("season_label_prefix")}
                  >
                    <option value="">
                      🗓 {formatSeasonRange(autoSeasonYear)} ({t("season_current_suffix")})
                    </option>
                    <option value={autoSeasonYear - 1}>{formatSeasonRange(autoSeasonYear - 1)}</option>
                    <option value={autoSeasonYear - 2}>{formatSeasonRange(autoSeasonYear - 2)}</option>
                  </select>
                )}
              </div>

              {/* Chi hien trong ky nghi giua hai mua - tu an khi giai da khoi tranh */}
              <SeasonBreak
                league={league}
                seasonStart={seasonStart}
                onSelectTeam={setSelectedTeamId}
              />

              {loading && <Loading />}
              {error && (
                <div className="alert alert-danger">
                  {t("error_prefix")} {error}
                </div>
              )}

              {/* Doi key -> React thay the ca cay con -> hieu ung xuat hien chay lai.
                  Co ca season, neu khong thi doi mua giai se thay so lang le, khong co chuyen canh. */}
              {!loading && !error && (
                <div className="ft-fade" key={`${league}-${view}-${season ?? "auto"}`}>
                  {view === "standings" && (
                    <StandingsTable
                      rows={data}
                      zones={currentLeague?.zones}
                      onSelectTeam={setSelectedTeamId}
                    />
                  )}
                  {view === "scorers" && (
                    <ScorersTable
                      scorers={data}
                      onSelectTeam={setSelectedTeamId}
                    />
                  )}
                  {view === "compare" && (
                    <CompareTeams
                      rows={data}
                      onSelectTeam={setSelectedTeamId}
                    />
                  )}
                  {view === "predict" && (
                    <PredictionsView
                      matches={data}
                      token={token}
                      onRefresh={() => {
                        loadViewData();
                        // Dat xong mot du doan -> huy hieu phai giam ngay, khong doi doi giai
                        refreshPendingPredictions();
                      }}
                      onSelectMatch={goToMatch}
                    />
                  )}
                  {(view === "upcoming" || view === "results") && (
                    <MatchList
                      matches={data}
                      showScore={view === "results"}
                      onSelectMatch={goToMatch}
                    />
                  )}

                  {/* Tu an o cac view backend khong gan header (vd So sanh doi, Du doan) */}
                  <DataFreshness fetchedAt={fetchedAt} />
                </div>
              )}
            </>
          )}

          <footer className="ft-footer mt-5 pt-4 border-top">
            © {new Date().getFullYear()} Football Stats Tracker
          </footer>
        </div>

        {/*
          Tuong CR7 nam trong ngan keo, mac dinh DONG.
          Khong mount Statue3D thi ca goi three.js (578KB) lan file .glb (8,25MB) deu
          khong duoc tai - do la ly do chinh de cat no di, ngoai chuyen no xoay lien
          tuc gay xao nhang khi dang doc so lieu.
        */}
        {/*
          Dang nhap nam trong hop thoai chu khong chen giua trang: chen vao thi form
          day bang xep hang xuong duoi va nguoi dung mat cho dang doc.
        */}
        {showAuthForm && !userEmail && (
          <Modal
            onClose={() => setShowAuthForm(false)}
            label={t("nav_login")}
            size="md"
          >
            <AuthPanel onSuccess={handleAuthSuccess} />
          </Modal>
        )}

        <StatueDrawer />
      </>
    </LanguageContext.Provider>
  );
}
