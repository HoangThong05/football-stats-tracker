import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { useTilt } from '../useTilt'

// Meta hien thi cho tung ma badge tra ve tu API (BadgeType o backend).
const BADGE_META = {
  ROOKIE: { icon: '🐣', titleKey: 'badge_rookie_title', descKey: 'badge_rookie_desc' },
  SHARP: { icon: '🎯', titleKey: 'badge_sharp_title', descKey: 'badge_sharp_desc' },
  PROPHET: { icon: '🔮', titleKey: 'badge_prophet_title', descKey: 'badge_prophet_desc' },
  ORACLE: { icon: '🧿', titleKey: 'badge_oracle_title', descKey: 'badge_oracle_desc' },
  WIN_STREAK: { icon: '🔥', titleKey: 'badge_streak_title', descKey: 'badge_streak_desc' },
  ON_FIRE: { icon: '🌋', titleKey: 'badge_onfire_title', descKey: 'badge_onfire_desc' },
  CENTURION: { icon: '💯', titleKey: 'badge_centurion_title', descKey: 'badge_centurion_desc' },
  WEEKLY_KING: { icon: '👑', titleKey: 'badge_weeklyking_title', descKey: 'badge_weeklyking_desc' },
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
        return <BadgeCard key={b.code} badge={b} meta={meta} t={t} />
      })}
    </div>
  )
}

/** Tách riêng để mỗi thẻ có ref nghiêng 3D của chính nó (hook không gọi được trong map). */
function BadgeCard({ badge, meta, t }) {
  const tiltRef = useTilt()
  const pct = Math.round((badge.progress / badge.target) * 100)

  return (
    <div ref={tiltRef} className={`ft-badge ft-tilt${badge.earned ? ' earned' : ''}`}>
      <span className="ft-badge-icon">{meta.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div className="ft-badge-title">{t(meta.titleKey)}</div>
        <div className="ft-badge-desc">{t(meta.descKey)}</div>
        <div className="ft-badge-progress-track">
          <div className="ft-badge-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="ft-badge-desc ft-num">
          {badge.progress}/{badge.target}
        </div>
      </div>
    </div>
  )
}
