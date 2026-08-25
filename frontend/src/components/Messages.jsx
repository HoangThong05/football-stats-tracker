import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { relativeTime } from '../utils'
import Avatar from './Avatar'
import BadgeFlair from './BadgeFlair'
import DmChat from './DmChat'
import Loading from './Loading'

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

  if (open) {
    return (
      <div className="ft-fade">
        <DmChat token={token} other={open} myName={myName} myAvatar={myAvatar}
          onBack={() => { setOpen(null); load() }} onSelectUser={onSelectUser} />
      </div>
    )
  }

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>{t('back')}</button>
      <h3 className="h5 mb-3">💬 {t('dm_title')}</h3>

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
                <Avatar name={c.name} src={c.avatarUrl} size={44} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <span className="fw-semibold text-truncate">
                      {c.name}<BadgeFlair code={c.featuredBadge} />
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
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
