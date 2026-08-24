import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { BADGE_META } from '../constants'
import { useTranslation } from '../i18n'
import { useTilt } from '../useTilt'

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
