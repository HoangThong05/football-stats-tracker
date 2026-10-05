import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { toast } from '../ui/toast'
import { computeStreaks, nextMilestone, reachedMilestone } from '../streaks'

// Moc cao nhat da an mung tren may nay -> khong mung lai cung mot moc moi lan mo ho so.
const CELEBRATED_KEY = 'ft_streak_celebrated'

/**
 * The "Chuoi du doan dung" tren trang Ho so.
 *
 * Nguon diem (xep CU -> MOI):
 *  - points: truyen thang (ho so cong khai da co san pointsTimeline) -> KHONG goi mang.
 *  - token: tu tai /predictions/mine roi tu sap xep (ho so cua chinh minh).
 *
 * Tinh toan hoan toan o client tu du lieu da co -> khong them truy van/polling nao,
 * khong dung them compute cua DB. celebrate=true (ho so cua minh) thi ban phao giay +
 * toast khi chuoi cham mot moc MOI.
 */
export default function StreakCard({ token, points, celebrate = false }) {
  const { t } = useTranslation()
  const [fetched, setFetched] = useState(null)

  useEffect(() => {
    if (points || !token) return undefined
    let cancelled = false
    fetch(`${API_BASE}/predictions/mine`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (cancelled) return
        const ordered = (Array.isArray(rows) ? rows : [])
          .filter((r) => r.points != null)
          .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
          .map((r) => r.points)
        setFetched(ordered)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token, points])

  const series = points || fetched
  const { current, longest } = useMemo(() => computeStreaks(series || []), [series])

  const [burst, setBurst] = useState(false)
  const timerRef = useRef(null)
  useEffect(() => {
    if (!celebrate || !series) return undefined
    const reached = reachedMilestone(current)
    if (!reached) return undefined
    let prev = 0
    try { prev = parseInt(localStorage.getItem(CELEBRATED_KEY) || '0', 10) || 0 } catch { /* che do rieng tu */ }
    if (reached > prev) {
      try { localStorage.setItem(CELEBRATED_KEY, String(reached)) } catch { /* che do rieng tu */ }
      setBurst(true)
      toast.success(t('streak_toast').replace('{m}', reached))
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setBurst(false), 2200)
    }
    return () => clearTimeout(timerRef.current)
  }, [celebrate, series, current, t])

  // Chua tai xong, hoac chua co du doan da cham nao -> khong hien (tranh the trong tron)
  if (!series || series.length === 0) return null

  const next = nextMilestone(current)
  const base = reachedMilestone(current)
  const pct = next ? Math.round(((current - base) / (next - base)) * 100) : 100

  return (
    <div className={`ft-card p-3 ft-streak-card${burst ? ' ft-streak-pop' : ''}`}>
      {burst && (
        <div className="ft-confetti" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="ft-confetti-bit"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.4}s`,
                fontSize: `${12 + Math.random() * 14}px`,
              }}
            >
              {['⚽', '🔥', '🎉', '✨'][i % 4]}
            </span>
          ))}
        </div>
      )}

      <div className="fw-semibold mb-2">{t('streak_title')}</div>

      <div className="d-flex align-items-stretch gap-3">
        <div className="ft-streak-big">
          <span className="ft-streak-flame">🔥</span>
          <span className="ft-num fw-bold ft-streak-num">{current}</span>
          <span className="text-secondary small">{t('streak_current')}</span>
        </div>
        <div className="ft-streak-best">
          <span className="ft-num fw-bold fs-5">🏆 {longest}</span>
          <span className="text-secondary small">{t('streak_best')}</span>
        </div>
      </div>

      {current === 0 ? (
        <div className="text-secondary small mt-2">{t('streak_none')}</div>
      ) : next ? (
        <div className="mt-2">
          <div className="ft-streak-bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="text-secondary small mt-1">
            {t('streak_next')
              .replace('{n}', next - current)
              .replace('{unit}', t('streak_matches'))
              .replace('{m}', next)}
          </div>
        </div>
      ) : (
        <div className="text-secondary small mt-2">{t('streak_maxed')}</div>
      )}

      <div className="ft-streak-hint">{t('streak_hint')}</div>
    </div>
  )
}
