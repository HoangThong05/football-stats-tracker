import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'

/*
 * Con so tren chuong chi dem tran trong 48 gio toi.
 *
 * Dem het 7 ngay thi con so luon o muc cao, nhin mai thanh quen va het tac dung
 * nhac nho. Danh sach ben trong van hien du 7 ngay.
 */
const BADGE_WINDOW_HOURS = 48
const REFRESH_MS = 10 * 60 * 1000
const SEEN_KEY = 'ft_seen_matches'

/*
 * Cac tran da xem duoc ghi o localStorage chu khong luu tren may chu.
 *
 * Day chi la loi nhac, khong phai du lieu: doc tren may nay ma may khac van con bao
 * thi cung khong sao, doi lai khong phai them bang, them endpoint, them dong bo.
 */
function loadSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
    return Array.isArray(raw) ? new Set(raw) : new Set()
  } catch {
    return new Set()
  }
}

/**
 * Chuong nhac tran: cac tran sap dien ra cua doi dang theo doi.
 *
 * Thay cho email nhac tran (da tat qua app.notify.email-enabled). Doc tu database
 * nen khong ton han muc API - goi lai dinh ky thoai mai.
 */
export default function MatchReminders({ token, onSelectMatch }) {
  const { t, lang } = useTranslation()
  const [matches, setMatches] = useState([])
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(loadSeen)
  /*
   * Chup lai nhung tran CHUA xem ngay truoc khi danh dau da xem.
   * Khong co no thi mo bang ra la cham xanh bien mat cung luc - nguoi dung khong kip
   * thay cai nao la moi.
   */
  const [newAtOpen, setNewAtOpen] = useState(new Set())

  useEffect(() => {
    if (!token) {
      setMatches([])
      return undefined
    }

    let cancelled = false
    const load = () => {
      fetch(`${API_BASE}/favorites/upcoming`, { headers: authHeaders(token) })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setMatches(data)
        })
        // Nhac nho chi la tro giup: hong thi im lang, khong lam phien nguoi dung
        .catch(() => {})
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [token])

  if (!token) {
    return null
  }

  /*
   * Con so tren chuong chi dem tran SAP DA, khong dem tran da xong.
   * Ket qua van nam trong danh sach de xem lai, nhung no khong phai viec can lam gap -
   * de no keu so do thi con so mat y nghia "sap den gio".
   */
  const soonLimit = Date.now() + BADGE_WINDOW_HOURS * 3600 * 1000
  const soonCount = matches.filter((m) => {
    if (seen.has(m.matchId)) return false
    /*
     * Du doan vua duoc cham diem CUNG duoc dem, du tran da xong.
     * Diem so la thu nguoi dung cho doi - im lang o day thi ho phai tu vao trang
     * lich su moi biet minh duoc bao nhieu.
     */
    if (m.myPoints != null) return true
    return m.status !== 'FINISHED' && new Date(m.utcDate).getTime() <= soonLimit
  }).length

  const markAllSeen = () => {
    /*
     * Chi giu id cua cac tran DANG trong danh sach. Tran da da xong thi bo ra,
     * khong thi danh sach nay phinh mai khong bao gio nho lai.
     */
    const ids = matches.map((m) => m.matchId)
    setSeen(new Set(ids))
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
    } catch {
      // Trinh duyet chan localStorage (che do rieng tu) -> bo qua, chuong van chay
    }
  }

  const formatKickoff = (utcDate) => {
    const d = new Date(utcDate)
    const hours = Math.round((d.getTime() - Date.now()) / 3600000)
    const clock = d.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
    // Duoi 1 ngay thi "con X gio" de doc nhanh hon la ngay thang
    return hours <= 24 ? `${clock} · ${t('rem_in_hours').replace('{h}', Math.max(0, hours))}` : clock
  }

  return (
    <div
      className="ft-user-menu"
      tabIndex={-1}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        className="ft-nav-btn ft-nav-btn-icon"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) {
            setNewAtOpen(new Set(matches.filter((m) => !seen.has(m.matchId)).map((m) => m.matchId)))
            markAllSeen()
          }
        }}
        title={t('rem_title')}
        style={{ position: 'relative' }}
      >
        🔔
        {soonCount > 0 && <span className="ft-rem-badge">{soonCount}</span>}
      </button>

      {open && (
        <div className="ft-user-menu-panel ft-fade" style={{ minWidth: 300, maxWidth: 360 }}>
          <div className="ft-user-menu-header">{t('rem_title')}</div>

          {matches.length === 0 ? (
            <p className="text-secondary small mb-0 px-2 py-1">{t('rem_empty')}</p>
          ) : (
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {matches.map((m) => (
                <button
                  key={m.matchId}
                  className="ft-user-menu-item"
                  onClick={() => {
                    setOpen(false)
                    onSelectMatch(m.matchId)
                  }}
                >
                  <span className="d-block small fw-semibold">
                    {newAtOpen.has(m.matchId) && <span className="ft-rem-dot" />}
                    {shortTeamName(m.homeTeam)}
                    {m.status === 'FINISHED'
                      ? ` ${m.homeScore ?? '-'} - ${m.awayScore ?? '-'} `
                      : ' vs '}
                    {shortTeamName(m.awayTeam)}
                  </span>
                  <span className="d-block text-secondary" style={{ fontSize: '0.75rem' }}>
                    {m.status === 'FINISHED' ? t('rem_finished') : formatKickoff(m.utcDate)}
                  </span>
                  {m.followedTeamName && (
                    <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
                      ★ {shortTeamName(m.followedTeamName)}
                    </span>
                  )}
                  {m.myHomeScore != null && (
                    <span className="d-block" style={{ fontSize: '0.72rem' }}>
                      <span className="text-secondary">
                        {t('rem_my_pick')} {m.myHomeScore}-{m.myAwayScore}
                      </span>
                      {m.myPoints != null && (
                        <span
                          className={`badge ms-2 ${
                            m.myPoints === 3 ? 'text-bg-success'
                              : m.myPoints === 1 ? 'text-bg-warning' : 'text-bg-secondary'
                          }`}
                        >
                          +{m.myPoints}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
