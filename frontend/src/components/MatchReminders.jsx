import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { relativeTime, shortTeamName } from '../utils'
import { REACTION_EMOJI, BADGE_META } from '../constants'
import Avatar from './Avatar'

/*
 * Con so tren chuong chi dem tran trong 48 gio toi.
 *
 * Dem het 7 ngay thi con so luon o muc cao, nhin mai thanh quen va het tac dung
 * nhac nho. Danh sach ben trong van hien du 7 ngay.
 */
const BADGE_WINDOW_HOURS = 48
/*
 * Hai nhip goi lai, tach de "nhanh ma van nhe":
 * - FAST (10s): viec huong THANG den minh, muon thay gan nhu ngay - nhac @, binh luan /
 *   tra loi / cam xuc bai minh, loi moi ket ban, duoc chap nhan.
 * - SLOW (60s): thu it doi - nhac tran, admin go bai, "nhat tuan", huy hieu.
 * Deu doc DB (khong ton han muc API), va deu dung khi tab an.
 */
const FAST_MS = 10 * 1000
const SLOW_MS = 60 * 1000
const SEEN_KEY = 'ft_seen_matches'

/*
 * Moc "da xem thong bao dien dan den dau", rieng voi moc cua tab Cong dong
 * (ft_forum_seen). Hai cho dem hai thu khac nhau - tab dem bai moi, chuong dem viec
 * dinh den minh - nen dung chung mot moc thi mo cho nay se tat so cua cho kia.
 */
const NOTIF_SEEN_KEY = 'ft_forum_notif_seen'

/** Cau mo ta cho tung loai thong bao. */
const NOTIF_TEXT = {
  COMMENT: 'notif_comment', REPLY: 'notif_reply',
  REACT_POST: 'notif_react_post', REACT_COMMENT: 'notif_react_comment',
  MENTION: 'notif_mention',
  LIKE: 'notif_react_post', // du lieu cu (neu con) coi nhu tha cam xuc bai viet
}

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
  // Loi moi cua MINH vua duoc nguoi khac chap nhan (14 ngay gan nhat)
  const [accepted, setAccepted] = useState([])
  // Ai vua binh luan / tra loi / thich bai cua minh
  const [notifs, setNotifs] = useState([])
  // Admin da go bai/cmt cua minh (kem ly do)
  const [modNotices, setModNotices] = useState([])
  // Cac lan minh "Nhat tuan" (dan dau BXH du doan mot tuan)
  const [champions, setChampions] = useState([])
  // Huy hieu vua dat -> dong "chuc mung" tren chuong
  const [badgesEarned, setBadgesEarned] = useState([])
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

  /*
   * Tach rieng thanh useCallback de goi duoc ca luc MO CHUONG, khong chi mount + dinh ky.
   * Khong co no thi sau khi ban minh vua dong y, phai doi toi 10 phut hoac tai lai trang
   * moi thay thong bao - bam mo chuong khong lam gi ca.
   */
  // Nhom NHANH (10s): viec huong thang den minh. Hong thi im lang, khong lam phien.
  const loadFast = useCallback(() => {
    if (!token) return
    const opts = { headers: authHeaders(token) }
    fetch(`${API_BASE}/forum/notifications`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotifs)
      .catch(() => {})
    fetch(`${API_BASE}/friends/requests`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRequests)
      .catch(() => {})
    fetch(`${API_BASE}/friends/accepted`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setAccepted)
      .catch(() => {})
  }, [token])

  // Nhom CHAM (60s): thu it doi.
  const loadSlow = useCallback(() => {
    if (!token) return
    const opts = { headers: authHeaders(token) }
    fetch(`${API_BASE}/favorites/upcoming`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setMatches)
      .catch(() => {})
    fetch(`${API_BASE}/forum/moderation-notices`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setModNotices)
      .catch(() => {})
    fetch(`${API_BASE}/predictions/champions/mine`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setChampions)
      .catch(() => {})
    fetch(`${API_BASE}/predictions/badges/recent`, opts)
      .then((res) => (res.ok ? res.json() : []))
      .then(setBadgesEarned)
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) {
      setMatches([])
      return undefined
    }
    loadFast()
    loadSlow()
    const fast = setInterval(() => { if (!document.hidden) loadFast() }, FAST_MS)
    const slow = setInterval(() => { if (!document.hidden) loadSlow() }, SLOW_MS)
    return () => { clearInterval(fast); clearInterval(slow) }
  }, [token, loadFast, loadSlow])

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

  // Chua bao gio mo chuong -> coi nhu chua doc dong nao. Loi moi da chap nhan dung
  // chung moc "da xem hoat dong" voi thong bao dien dan (cung la viec da xay ra voi minh).
  const unreadNotifs = notifs.filter((n) => !notifSeen || n.createdAt > notifSeen)
  const unreadAccepted = accepted.filter((a) => !notifSeen || a.since > notifSeen)
  const unreadMod = modNotices.filter((m) => !notifSeen || m.createdAt > notifSeen)
  const unreadChamp = champions.filter((c) => !notifSeen || c.awardedAt > notifSeen)
  const unreadBadges = badgesEarned.filter((b) => !notifSeen || b.earnedAt > notifSeen)

  // Loi moi DEN luon duoc dem, khong tru theo "da xem"
  const badgeCount = soonCount + requests.length + unreadNotifs.length + unreadAccepted.length
    + unreadMod.length + unreadChamp.length + unreadBadges.length

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

  /*
   * Mot dong tran dau, dung chung cho phan KET QUA (da xong) o tren va NHAC TRAN
   * (sap toi) o duoi. Da xong thi hien ti so + du doan dung/sai; sap toi thi dem gio.
   */
  const renderMatchRow = (m) => (
    <button
      key={`m-${m.matchId}`}
      className="ft-user-menu-item"
      onClick={() => { setOpen(false); onSelectMatch(m.matchId) }}
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
  )

  /* Mot dong thong bao dien dan: ai do binh luan / tra loi / thich bai cua minh. */
  const renderForumNotif = (n) => (
    <button
      key={`n-${n.postId}-${n.actorId}-${n.createdAt}`}
      className="ft-user-menu-item ft-notif-item"
      onClick={() => { setOpen(false); onSelectPost(n.postId) }}
    >
      <Avatar name={n.actorName} src={n.actorAvatar} size={32} />
      <span style={{ minWidth: 0 }}>
        <span className="d-block small">
          {(!notifSeenAtOpen || n.createdAt > notifSeenAtOpen) && <span className="ft-rem-dot" />}
          <strong>{n.actorName}</strong> {t(NOTIF_TEXT[n.kind])}          {n.reactionType && REACTION_EMOJI[n.reactionType] ? ` ${REACTION_EMOJI[n.reactionType]}` : ''}
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
  )

  /* Mot dong: chuc mung minh "Nhat tuan". Hien khoang ngay cua tuan + so diem. */
  const renderChampion = (c, key) => {
    const monday = new Date(c.weekStart)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const dm = (d) => d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' })
    return (
      <div key={key} className="ft-user-menu-item ft-notif-item" style={{ cursor: 'default' }}>
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🏆</span>
        <span style={{ minWidth: 0 }}>
          <span className="d-block small fw-semibold text-warning">
            {(!notifSeenAtOpen || c.awardedAt > notifSeenAtOpen) && <span className="ft-rem-dot" />}
            {t('champ_congrats').replace('{points}', c.points)}
          </span>
          <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
            {dm(monday)} – {dm(sunday)}
          </span>
        </span>
      </div>
    )
  }

  /* Mot dong: chuc mung vua dat huy hieu moi. Chi thong bao, khong bam. */
  const renderBadgeEarned = (b, key) => {
    const meta = BADGE_META[b.code]
    if (!meta) return null
    return (
      <div key={key} className="ft-user-menu-item ft-notif-item" style={{ cursor: 'default' }}>
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{meta.icon}</span>
        <span style={{ minWidth: 0 }}>
          <span className="d-block small fw-semibold text-warning">
            {(!notifSeenAtOpen || b.earnedAt > notifSeenAtOpen) && <span className="ft-rem-dot" />}
            🎉 {t('badge_congrats')} {t(meta.titleKey)}
          </span>
          <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
            {relativeTime(b.earnedAt, t, lang)}
          </span>
        </span>
      </div>
    )
  }

  /* Mot dong: admin da go bai/cmt cua minh, kem ly do. Khong bam duoc (noi dung da mat). */
  const renderModNotice = (m, key) => (
    <div key={key} className="ft-user-menu-item ft-notif-item" style={{ cursor: 'default' }}>
      <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🗑️</span>
      <span style={{ minWidth: 0 }}>
        <span className="d-block small fw-semibold text-danger">
          {(!notifSeenAtOpen || m.createdAt > notifSeenAtOpen) && <span className="ft-rem-dot" />}
          {m.targetType === 'POST' ? t('mod_post_removed') : t('mod_comment_removed')}
        </span>
        {m.reason && (
          <span className="d-block small">{t('mod_reason_label')} {m.reason}</span>
        )}
        {m.excerpt && (
          <span className="d-block text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
            “{m.excerpt}”
          </span>
        )}
        <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
          {relativeTime(m.createdAt, t, lang)}
        </span>
      </span>
    </div>
  )

  /* Mot dong: nguoi khac vua chap nhan loi moi ket ban cua minh. Bam vao mo ho so ho. */
  const renderFriendAccepted = (a) => (
    <button
      key={`a-${a.userId}`}
      className="ft-user-menu-item ft-notif-item"
      onClick={() => { setOpen(false); onSelectUser(a.userId) }}
    >
      <Avatar name={a.name} src={a.avatarUrl} size={32} />
      <span style={{ minWidth: 0 }}>
        <span className="d-block small">
          {(!notifSeenAtOpen || a.since > notifSeenAtOpen) && <span className="ft-rem-dot" />}
          <strong>{a.name}</strong> {t('friend_accepted_you')}
        </span>
        <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
          {relativeTime(a.since, t, lang)}
        </span>
      </span>
    </button>
  )

  /*
   * Mot loi moi ket ban: avatar + cau moi (duoc xuong dong), hai nut o HANG DUOI.
   *
   * Truoc day nhet ca cau va hai nut tren mot hang, cau dai "X muon ket ban voi ban" bi
   * cat cut con "X muon ket..." vi khong du cho. Cho nut xuong hang rieng thi chu thong.
   */
  const renderFriendRequest = (r) => (
    <div key={`r-${r.userId}`} className="ft-notif-item px-2 py-2">
      <button type="button" className="ft-avatar-btn"
        onClick={() => { setOpen(false); onSelectUser(r.userId) }}>
        <Avatar name={r.name} src={r.avatarUrl} size={32} />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <button type="button" className="ft-name-link small d-block text-start"
          style={{ whiteSpace: 'normal' }}
          onClick={() => { setOpen(false); onSelectUser(r.userId) }}>
          {t('friend_wants_to_add').replace('{name}', r.name)}
        </button>
        <div className="d-flex gap-2 mt-1">
          <button className="btn btn-sm btn-success" disabled={busy}
            onClick={() => answer(r.userId, 'POST', '/accept')}>
            {t('friend_accept')}
          </button>
          <button className="btn btn-sm btn-outline-secondary" disabled={busy}
            onClick={() => answer(r.userId, 'DELETE', '')}>
            {t('friend_decline')}
          </button>
        </div>
      </div>
    </div>
  )

  /*
   * Mot luong duy nhat, khong chia khoi.
   *
   * TREN - viec DA xay ra (loi moi, hoat dong ve bai viet, ket qua du doan), moi nhat
   * len dau nhu mot khung chat.
   * DUOI - tran SAP da, gan gio nhat truoc.
   *
   * Tach hai phan vi chung nguoc chieu thoi gian: tron chung mot truc "moi nhat len dau"
   * thi tran tuong lai luon day het thong bao da xay ra xuong duoi.
   */
  const finished = matches.filter((m) => m.status === 'FINISHED')
  const upcoming = matches.filter((m) => m.status !== 'FINISHED')
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))

  const activity = [
    ...requests.map((r) => ({ id: `r-${r.userId}`, time: r.since, node: renderFriendRequest(r) })),
    ...notifs.map((n) => ({ id: `n-${n.postId}-${n.actorId}-${n.createdAt}`, time: n.createdAt, node: renderForumNotif(n) })),
    ...accepted.map((a) => ({ id: `a-${a.userId}`, time: a.since, node: renderFriendAccepted(a) })),
    ...modNotices.map((m, i) => ({ id: `mod-${m.createdAt}-${i}`, time: m.createdAt, node: renderModNotice(m, `mod-${m.createdAt}-${i}`) })),
    ...champions.map((c, i) => ({ id: `champ-${c.weekStart}-${i}`, time: c.awardedAt, node: renderChampion(c, `champ-${c.weekStart}-${i}`) })),
    ...badgesEarned.map((b) => ({ id: `badge-${b.code}`, time: b.earnedAt, node: renderBadgeEarned(b, `badge-${b.code}`) })),
    ...finished.map((m) => ({ id: `f-${m.matchId}`, time: m.utcDate, node: renderMatchRow(m) })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time))

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
            loadFast() // tai lai ngay de thay hoat dong vua xay ra, khong doi het chu ky
            loadSlow()
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
          <div className="ft-bell-scroll">
            {activity.length === 0 && upcoming.length === 0 ? (
              <p className="text-secondary small mb-0 px-2 py-1">{t('rem_empty')}</p>
            ) : (
              <>
                {activity.map((a) => <div key={a.id}>{a.node}</div>)}
                {upcoming.map((m) => renderMatchRow(m))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
