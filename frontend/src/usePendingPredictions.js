import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from './api'

/**
 * Dem so tran SAP DA MA CHUA DU DOAN cua giai dang xem, de gan huy hieu len tab Du doan.
 *
 * Ly do can: backend khoa du doan ngay khi bong lan (PredictionService kiem tra
 * Instant.now().isBefore(match.getUtcDate())). Quen vao tab la mat diem vinh vien
 * ma khong co gi bao truoc.
 *
 * Endpoint nay doc tu DATABASE (MatchSyncService da dong bo san), khong goi
 * football-data.org -> khong ton quota, goi thoai mai.
 */

/*
 * Chi dem tran trong 72 gio toi.
 *
 * Dem het ca mua thi con so luon o muc 20-30, nhin mai thanh quen va het tac dung
 * nhac nho. Gioi han lai thi con so chi nhay len khi that su sap den han.
 */
const WINDOW_HOURS = 72

export function usePendingPredictions(league, token) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    // Chua dang nhap thi khong co gi de nhac
    if (!token) {
      setCount(0)
      return undefined
    }

    let cancelled = false

    fetch(`${API_BASE}/predictions/matches/${league}`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((matches) => {
        if (cancelled) return

        const now = Date.now()
        const limit = now + WINDOW_HOURS * 3600 * 1000

        setCount(
          matches.filter((m) => {
            // myHomeScore = null nghia la nguoi dung chua dat du doan cho tran nay
            if (m.myHomeScore != null) return false
            const kickoff = new Date(m.utcDate).getTime()
            return kickoff > now && kickoff <= limit
          }).length,
        )
      })
      // Huy hieu chi la tro giup: hong thi im lang bo qua, khong lam phien nguoi dung
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [league, token])

  useEffect(refresh, [refresh])

  return { count, refresh }
}
