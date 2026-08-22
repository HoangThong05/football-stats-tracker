import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from './api'

const SEEN_KEY = 'ft_forum_seen'
const REFRESH_MS = 60_000

/**
 * Dem bai va binh luan moi ke tu lan cuoi nguoi dung mo dien dan.
 *
 * Moc "da xem den dau" nam o localStorage chu khong tren may chu: them mot bang chi de
 * ghi moc doc cua tung nguoi la khong dang, va moc sai lech mot chut cung khong hai gi.
 * Doi lai moi may nho rieng - dung tren hai may thi moi may dem tu lan mo cuoi cua no.
 */
export function useForumUnread(token) {
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    // Chua mo bao gio -> lay moc la BAY GIO, khong dem nguoc ca lich su thanh "chua doc"
    const since = localStorage.getItem(SEEN_KEY) || new Date().toISOString()
    if (!localStorage.getItem(SEEN_KEY)) {
      localStorage.setItem(SEEN_KEY, since)
    }

    fetch(`${API_BASE}/forum/unread?since=${encodeURIComponent(since)}`, {
      headers: authHeaders(token),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCount(data?.count ?? 0))
      // Huy hieu chi la tro giup: hong thi im lang, khong lam phien nguoi dung
      .catch(() => {})
  }, [token])

  useEffect(() => {
    load()
    const tick = () => {
      if (!document.hidden) load()
    }
    const timer = setInterval(tick, REFRESH_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  /** Goi khi nguoi dung mo dien dan: danh dau da xem den bay gio. */
  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString())
    } catch {
      // Trinh duyet chan localStorage (che do rieng tu) -> bo qua, huy hieu van chay
    }
    setCount(0)
  }, [])

  return { count, markSeen }
}
