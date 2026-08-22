import { useEffect, useState } from 'react'
import { API_BASE } from './api'

/** Tran dang da: football-data.org dung 3 trang thai nay. */
export const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED'])

const REFRESH_MS = 60_000

/** Tu dau ngay hom nay den dau ngay mai, theo gio may nguoi dung. */
function dayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

/**
 * Cac tran cua ngay hom nay, lam moi moi 60 giay.
 *
 * Khong co endpoint "live" rieng - dung /api/matches/range giong trang Hom nay. Du lieu
 * doc tu DB (MatchSyncService dong bo ve) nen goi lai o day KHONG ton request cua
 * football-data.org: backend tra tu DB chu khong goi thang len API.
 */
export function useTodayMatches() {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    let cancelled = false

    const load = () => {
      const { from, to } = dayRange()
      fetch(`${API_BASE}/matches/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setMatches(Array.isArray(data) ? data : [])
        })
        // Chi la thong tin phu: hong thi im lang, khong bao loi lam phien nguoi dung
        .catch(() => {})
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return matches
}

/**
 * Id cac doi DANG DA ngay luc nay.
 *
 * Dung de danh dau bang xep hang: football-data.org cong diem cho tran ngay khi bong
 * con lan, nen mot doi co the da nhay len 3 diem trong luc tran chua ket thuc. Khong
 * noi ro thi nguoi xem tuong bang bi sai.
 */
export function useLiveTeamIds() {
  const matches = useTodayMatches()

  const ids = new Set()
  for (const m of matches) {
    if (LIVE_STATUSES.has(m.status)) {
      ids.add(m.homeTeamId)
      ids.add(m.awayTeamId)
    }
  }
  return ids
}
