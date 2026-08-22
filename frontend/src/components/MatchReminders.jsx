import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { relativeTime, shortTeamName } from '../utils'
import Avatar from './Avatar'

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
 * Moc "da xem thong bao dien dan den dau", rieng voi moc cua tab Cong dong
 * (ft_forum_seen). Hai cho dem hai thu khac nhau - tab dem bai moi, chuong dem viec
 * dinh den minh - nen dung chung mot moc thi mo cho nay se tat so cua cho kia.
 */
const NOTIF_SEEN_KEY = 'ft_forum_notif_seen'

/** Cau mo ta cho tung loai thong bao. */
const NOTIF_TEXT = { COMMENT: 'notif_comment', REPLY: 'notif_reply', LIKE: 'notif_like' }

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
export default function MatchReminders({ token, onSelectMatch, onSelectUser, onSelectPost }) {
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
  /*
   * Loi moi ket ban KHONG dung co che "da xem".
   *
   * Chung la viec can lam chu khong phai tin de doc: van con do la van phai tra loi.
   * Danh dau da xem roi tat so di thi nguoi dung quen mat co ai dang cho minh.
   */
  const [requests, setRequests] = useState([])
  const [busy, setBusy] = useState(false)
  // Ai vua binh luan / tra loi / thich bai cua minh
  const [notifs, setNotifs] = useState([])
  /*
   * Moc doc lay MOT LAN luc mo trang, khong doc lai localStorage o moi lan ve.
   * Doc lai thi ngay sau khi bam mo chuong moc se nhay len "bay gio" va cham xanh
   * cua chinh nhung dong vua hien bien mat truoc mat nguoi dung.
   */
  const [notifSeen, setNotifSeen] = useState(() => localStorage.getItem(NOTIF_SEEN_KEY) || '')
  /*
   * Moc TRUOC LUC MO, giu de ve cham xanh. Ve theo notifSeen thi mo chuong ra la moc
   * nhay len "bay gio" va cham cua chinh nhung dong vua hien tat ngay truoc mat -
   * cung van de ma newAtOpen ben tran dau da phai xu ly.
   */
  const [notifSeenAtOpen, setNotifSeenAtOpen] = useState('')

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

      fetch(`${API_BASE}/friends/requests`, { headers: authHeaders(token) })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setRequests(data)
        })
        .catch(() => {})

      fetch(`${API_BASE}/forum/notifications`, { headers: authHeaders(token) })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setNotifs(data)
        })
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

  // Chua bao gio mo chuong -> coi nhu chua doc dong nao
  const unreadNotifs = notifs.filter((n) => !notifSeen || n.createdAt > notifSeen)

  // Loi moi luon duoc dem, khong tru theo "da xem"
  const badgeCount = soonCount + requests.length + unreadNotifs.length

  const answer = async (userId, method, path) => {
    setBusy(true)
    try {
      await fetch(`${API_BASE}/friends/${userId}${path}`, { method, headers: authHeaders(token) })
      setRequests((list) => list.filter((r) => r.userId !== userId))
    } finally {
      setBusy(false)
    }
  }

  const markNotifsSeen = () => {
    const now = new Date().toISOString()
    setNotifSeen(now)
    try {
      localStorage.setItem(NOTIF_SEEN_KEY, now)
    } catch {
      // Trinh duyet chan localStorage (che do rieng tu) -> bo qua, chuong van chay
    }
  }

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
            setNotifSeenAtOpen(notifSeen)
            markNotifsSeen()
          }
        }}
        title={t('rem_title')}
        style={{ position: 'relative' }}
      >
        🔔
        {badgeCount > 0 && <span className="ft-rem-badge">{badgeCount}</span>}
      </button>

      {open && (
        <div className="ft-user-menu-panel ft-fade" style={{ minWidth: 300, maxWidth: 360 }}>
          {/* Loi moi ket ban len TREN: do la viec can tra loi, tran dau chi de xem */}
          {requests.length > 0 && (
            <>
              <div className="ft-user-menu-header">{t('friends_requests')}</div>
              <div className="d-flex flex-column gap-2 px-2 pb-2">
                {requests.map((r) => (
                  <div key={r.userId} className="d-flex align-items-center gap-2 small">
                    <button type="button"
                      className="ft-name-link text-truncate flex-grow-1"
                      style={{ minWidth: 0 }}
                      onClick={() => { setOpen(false); onSelectUser(r.userId) }}>
                      {r.name}
                    </button>
                    <button className="btn btn-sm btn-success flex-shrink-0" disabled={busy}
                      onClick={() => answer(r.userId, 'POST', '/accept')}>
                      {t('friend_accept')}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary flex-shrink-0" disabled={busy}
                      onClick={() => answer(r.userId, 'DELETE', '')}>
                      {t('friend_decline')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {notifs.length > 0 && (
            <>
              <div className="ft-user-menu-header">{t('notif_title')}</div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifs.map((n) => (
                  <button
                    key={`${n.kind}-${n.postId}-${n.actorId}-${n.createdAt}`}
                    className="ft-user-menu-item ft-notif-item"
                    onClick={() => { setOpen(false); onSelectPost(n.postId) }}
                  >
                    <Avatar name={n.actorName} src={n.actorAvatar} size={32} />
                    <span style={{ minWidth: 0 }}>
                      <span className="d-block small">
                        {(!notifSeenAtOpen || n.createdAt > notifSeenAtOpen) && <span className="ft-rem-dot" />}
                        <strong>{n.actorName}</strong> {t(NOTIF_TEXT[n.kind])}
                      </span>
                      {n.excerpt && (
                        <span className="d-block text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
                          {n.excerpt}
                        </span>
                      )}
                      <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
                        {relativeTime(n.createdAt, t, lang)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

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
                    <>
                      {/* Du doan da duoc cham diem -> bao ro DUNG hay SAI, khong chi mot con so */}
                      {m.myPoints != null && (
                        <span className={`d-block fw-semibold ${
                          m.myPoints === 3 ? 'text-success'
                            : m.myPoints === 1 ? 'text-warning' : 'text-danger'
                        }`} style={{ fontSize: '0.72rem' }}>
                          {m.myPoints === 3 ? t('rem_pred_exact')
                            : m.myPoints === 1 ? t('rem_pred_partial') : t('rem_pred_wrong')}
                          {m.myPoints > 0 && <span className="ft-num ms-1">+{m.myPoints}</span>}
                        </span>
                      )}
                      <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
                        {t('rem_my_pick')} {m.myHomeScore}-{m.myAwayScore}
                      </span>
                    </>
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
