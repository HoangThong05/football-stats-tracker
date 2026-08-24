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

  const earnedCount = badges.filter((b) => b.earned).length
  // Da dat len truoc (sort on dinh nen giu thu tu goc trong tung nhom): cum sang o tren,
  // cum muc tieu con lai o duoi - de nhin, khong lon xon.
  const ordered = [...badges].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))

  return (
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-3">
        🏅 {t('profile_badges_title')}{' '}
        <span className="text-secondary ft-num">({earnedCount}/{badges.length})</span>
      </div>
      <div className="ft-badge-grid">
        {ordered.map((b) => {
          const meta = BADGE_META[b.code]
          if (!meta) return null
          return <BadgeCard key={b.code} badge={b} meta={meta} t={t} />
        })}
      </div>
    </div>
  )
}

/** Tách riêng để mỗi thẻ có ref nghiêng 3D của chính nó (hook không gọi được trong map). */
function BadgeCard({ badge, meta, t }) {
  const tiltRef = useTilt()
  const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100))

  return (
    <div ref={tiltRef} className={`ft-badge ft-tilt${badge.earned ? ' earned' : ''}`}>
      <span className="ft-badge-icon">{meta.icon}</span>
      <div className="ft-badge-body">
        <div className="ft-badge-title">
          {t(meta.titleKey)}
          {badge.earned && <span className="ft-badge-check" title={t('badge_earned')}>✓</span>}
        </div>
        <div className="ft-badge-desc">{t(meta.descKey)}</div>
        {/* Da dat thi bo thanh tien do + so "x/y" cho gon; chua dat moi hien de biet con bao xa */}
        {!badge.earned && (
          <>
            <div className="ft-badge-progress-track">
              <div className="ft-badge-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="ft-badge-desc ft-num">
              {badge.progress}/{badge.target}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
