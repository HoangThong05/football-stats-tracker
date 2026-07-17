import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

// Meta hien thi cho tung ma badge tra ve tu API (BadgeType o backend).
const BADGE_META = {
  PROPHET: { icon: '🔮', titleKey: 'badge_prophet_title', descKey: 'badge_prophet_desc' },
  WIN_STREAK: { icon: '🔥', titleKey: 'badge_streak_title', descKey: 'badge_streak_desc' },
}

/** Hang huy hieu thanh tich cua user. Tu fetch, khong render gi neu chua co du lieu/loi. */
export default function Badges({ token }) {
  const { t } = useTranslation()
  const [badges, setBadges] = useState([])

  useEffect(() => {
    if (!token) {
      setBadges([])
      return
    }
    fetch(`${API_BASE}/predictions/badges`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBadges(data))
      .catch(() => setBadges([]))
  }, [token])

  if (badges.length === 0) return null

  return (
    <div className="ft-badge-row">
      {badges.map((b) => {
        const meta = BADGE_META[b.code]
        if (!meta) return null
        const pct = Math.round((b.progress / b.target) * 100)
        return (
          <div key={b.code} className={`ft-badge${b.earned ? ' earned' : ''}`}>
            <span className="ft-badge-icon">{meta.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div className="ft-badge-title">{t(meta.titleKey)}</div>
              <div className="ft-badge-desc">{t(meta.descKey)}</div>
              <div className="ft-badge-progress-track">
                <div className="ft-badge-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="ft-badge-desc">
                {b.progress}/{b.target}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
