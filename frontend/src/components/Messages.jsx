import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { relativeTime } from '../utils'
import Avatar from './Avatar'
import BadgeFlair from './BadgeFlair'
import DmChat from './DmChat'
import Loading from './Loading'
import { confirmDialog } from './ConfirmDialog'
import { usePresence, presenceTag } from '../usePresence'

const REFRESH_MS = 10000

/**
 * Hop thu nhan tin rieng: danh sach hoi thoai + mo mot cuoc chat.
 *
 * initialUser (tu nut "Nhan tin" o ho so, hoac deep-link ?dm=) -> mo thang hoi thoai do.
 */
export default function Messages({ token, myName, myAvatar, initialUser, onBack, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(initialUser || null)
  const [composing, setComposing] = useState(false)
  const [friends, setFriends] = useState(null)
  const [menu, setMenu] = useState(null) // { userId, pinned, muted, top, left, up }
  const presence = usePresence(token, (list || []).map((c) => c.userId))

  // Mo che do "chon ban de nhan" -> tai danh sach ban be
  const openCompose = () => {
    setComposing(true)
    setFriends(null)
    fetch(`${API_BASE}/friends`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFriends(Array.isArray(data) ? data : []))
      .catch(() => setFriends([]))
  }

  const load = useCallback(() => {
    if (!token) return
    fetch(`${API_BASE}/messages`, { headers: authHeaders(token), cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
  }, [token])

  useEffect(() => {
    load()
    // Chi hoi lai danh sach khi dang xem danh sach (khong phai dang trong 1 chat)
    const timer = setInterval(() => { if (!document.hidden && !open) load() }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load, open])

  // Mo thang mot hoi thoai khi initialUser doi (deep-link / bam Nhan tin)
  useEffect(() => { if (initialUser) setOpen(initialUser) }, [initialUser])

  // Mo menu ... cua mot hoi thoai (popover noi, canh nut)
  const openMenu = (e, c) => {
    e.stopPropagation()
    if (menu && menu.userId === c.userId) {
      setMenu(null)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    const up = r.bottom + 160 > window.innerHeight
    setMenu({
      userId: c.userId,
      pinned: c.pinned,
      muted: c.muted,
      top: up ? r.top - 6 : r.bottom + 6,
      left: Math.max(8, Math.min(r.left, window.innerWidth - 220)),
      up,
    })
  }

  const convAction = async (userId, path, method, body) => {
    setMenu(null)
    try {
      await fetch(`${API_BASE}/messages/conversation/${userId}${path}`, {
        method,
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      load()
    } catch {
      /* bo qua */
    }
  }

  const deleteConv = async (userId) => {
    setMenu(null)
    const ok = await confirmDialog({
      message: t('dm_conv_delete_confirm'),
      confirmText: t('forum_delete'),
      danger: true,
    })
    if (ok) convAction(userId, '', 'DELETE', null)
  }

  if (open) {
    return (
      <div className="ft-fade">
        <DmChat token={token} other={open} myName={myName} myAvatar={myAvatar}
          onBack={() => { setOpen(null); load() }} onSelectUser={onSelectUser} />
      </div>
    )
  }

  // Chon mot nguoi ban de bat dau nhan tin
  if (composing) {
    return (
      <div className="ft-fade">
        <button className="btn btn-link ps-0 mb-3" onClick={() => setComposing(false)}>{t('back')}</button>
        <h3 className="h5 mb-3">✉️ {t('dm_new')}</h3>
        {friends === null ? (
          <Loading rows={4} />
        ) : friends.length === 0 ? (
          <p className="text-secondary">{t('dm_no_friends')}</p>
        ) : (
          <div className="ft-card">
            <ul className="list-group list-group-flush">
              {friends.map((f) => (
                <li key={f.userId} className="list-group-item d-flex align-items-center gap-3 px-3 py-2 ft-dm-conv"
                  role="button"
                  onClick={() => { setComposing(false); setOpen({ userId: f.userId, name: f.name, avatarUrl: f.avatarUrl }) }}>
                  <Avatar name={f.name} src={f.avatarUrl} size={40} />
                  <span className="fw-medium text-truncate">{f.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>{t('back')}</button>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="h5 mb-0">✉️ {t('dm_title')}</h3>
        <button type="button" className="btn btn-sm btn-success" onClick={openCompose}>
          ✏️ {t('dm_new')}
        </button>
      </div>

      {list === null ? (
        <Loading rows={4} />
      ) : list.length === 0 ? (
        <p className="text-secondary">{t('dm_inbox_empty')}</p>
      ) : (
        <div className="ft-card">
          <ul className="list-group list-group-flush">
            {list.map((c) => (
              <li key={c.userId}
                className="list-group-item d-flex align-items-center gap-3 px-3 py-2 ft-dm-conv"
                role="button"
                onClick={() => setOpen({ userId: c.userId, name: c.name, avatarUrl: c.avatarUrl })}>
                <Avatar name={c.name} src={c.avatarUrl} size={44} presence={presenceTag(presence, c.userId)} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <span className="fw-semibold text-truncate">
                      {c.pinned && <span title={t('dm_conv_unpin')}>📌 </span>}
                      {c.name}<BadgeFlair code={c.featuredBadge} />
                      {c.muted && <span className="ms-1" title={t('dm_conv_unmute')}>🔕</span>}
                    </span>
                    <span className="text-secondary flex-shrink-0" style={{ fontSize: '0.72rem' }}>
                      {relativeTime(c.lastAt, t, lang)}
                    </span>
                  </div>
                  <div className={`text-truncate small ${c.unread > 0 ? 'fw-semibold' : 'text-secondary'}`}>
                    {c.lastFromMe ? `${t('dm_you_prefix')} ` : ''}
                    {c.lastHasImage && !c.lastContent ? t('dm_sent_image') : c.lastContent}
                  </div>
                </div>
                {c.unread > 0 && <span className="ft-dm-unread">{c.unread}</span>}
                <button type="button" className="ft-dm-conv-more flex-shrink-0"
                  title={t('dm_more')} onClick={(e) => openMenu(e, c)}>⋯</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {menu && (
        <>
          <div className="ft-dm-menu-backdrop" onClick={() => setMenu(null)} />
          <div className={`ft-dm-menu${menu.up ? ' up' : ''}`}
            style={{ top: menu.top, left: menu.left }}>
            <button type="button"
              onClick={() => convAction(menu.userId, '/pin', 'POST', { pinned: !menu.pinned })}>
              📌 {menu.pinned ? t('dm_conv_unpin') : t('dm_conv_pin')}
            </button>
            <button type="button"
              onClick={() => convAction(menu.userId, '/mute', 'POST', { muted: !menu.muted })}>
              {menu.muted ? `🔔 ${t('dm_conv_unmute')}` : `🔕 ${t('dm_conv_mute')}`}
            </button>
            <button type="button" className="text-danger" onClick={() => deleteConv(menu.userId)}>
              🗑️ {t('dm_conv_delete')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
