import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Ban be va loi moi dang cho, hien trong trang Ho so.
 *
 * Loi moi den dat TREN danh sach ban: do la thu can nguoi dung tra loi, con danh sach
 * ban thi chi de xem.
 */
export default function FriendsList({ token, onSelectUser }) {
  const { t } = useTranslation()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!token) return
    const opts = { headers: authHeaders(token) }
    fetch(`${API_BASE}/friends`, opts)
      .then((r) => (r.ok ? r.json() : []))
      .then(setFriends)
      .catch(() => {})
    fetch(`${API_BASE}/friends/requests`, opts)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRequests)
      .catch(() => {})
  }, [token])

  useEffect(load, [load])

  const act = async (userId, method, path) => {
    setBusy(true)
    try {
      await fetch(`${API_BASE}/friends/${userId}${path}`, { method, headers: authHeaders(token) })
      load()
    } finally {
      setBusy(false)
    }
  }

  if (friends.length === 0 && requests.length === 0) {
    return null
  }

  const nameButton = (f) => (
    <button type="button" className="btn btn-link p-0 text-start text-truncate"
      style={{ minWidth: 0 }} onClick={() => onSelectUser(f.userId)}>
      {f.name}
    </button>
  )

  return (
    <div className="ft-card p-3 mb-3">
      <h4 className="h6 mb-2">{t('friends_title')} ({friends.length})</h4>

      {requests.length > 0 && (
        <div className="mb-3">
          <div className="text-secondary small mb-2">{t('friends_requests')} ({requests.length})</div>
          <div className="d-flex flex-column gap-2">
            {requests.map((f) => (
              <div key={f.userId} className="d-flex align-items-center gap-2">
                <span className="flex-grow-1" style={{ minWidth: 0 }}>{nameButton(f)}</span>
                <button className="btn btn-sm btn-success flex-shrink-0" disabled={busy}
                  onClick={() => act(f.userId, 'POST', '/accept')}>
                  {t('friend_accept')}
                </button>
                <button className="btn btn-sm btn-outline-secondary flex-shrink-0" disabled={busy}
                  onClick={() => act(f.userId, 'DELETE', '')}>
                  {t('friend_decline')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {friends.length === 0 ? (
        <p className="text-secondary small mb-0">{t('friends_empty')}</p>
      ) : (
        <ul className="list-group list-group-flush">
          {friends.map((f) => (
            <li key={f.userId} className="list-group-item px-0 py-2">{nameButton(f)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
