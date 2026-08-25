import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from './api'

const REFRESH_MS = 30_000

/**
 * So tin nhan rieng chua doc - cho chấm do tren nav.
 *
 * May chu tu theo doi "da doc" (readAt) nen o day chi can hoi con so, khong can moc
 * localStorage nhu dien dan.
 */
export function useDmUnread(token) {
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    if (!token) {
      setCount(0)
      return
    }
    fetch(`${API_BASE}/messages/unread`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCount(data?.count ?? 0))
      .catch(() => {})
  }, [token])

  useEffect(() => {
    load()
    const tick = () => { if (!document.hidden) load() }
    const timer = setInterval(tick, REFRESH_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  return { count, refresh: load }
}
