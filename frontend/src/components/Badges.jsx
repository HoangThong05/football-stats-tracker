import { BADGE_META } from '../constants'
import { useTranslation } from '../i18n'
import { useTilt } from '../useTilt'

/**
 * Luoi huy hieu thanh tich (trang ho so cua minh). Nhan du lieu tu Profile (controlled)
 * de hero + luoi dung chung mot nguon, va bam "Ghim" cap nhat duoc ca hai.
 *
 * @param badges       danh sach huy hieu (co co earned + featured)
 * @param onSetFeatured (code|null) => void: ghim huy hieu do canh ten, null = bo ghim
 */
export default function Badges({ badges, onSetFeatured }) {
  const { t } = useTranslation()
  if (!badges || badges.length === 0) return null

  const earnedCount = badges.filter((b) => b.earned).length
  // Da dat len truoc (sort on dinh): cum sang o tren, cum muc tieu o duoi
  const ordered = [...badges].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))

  return (
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-1">
        🏅 {t('profile_badges_title')}{' '}
        <span className="text-secondary ft-num">({earnedCount}/{badges.length})</span>
      </div>
      <p className="text-secondary small mb-3">{t('badge_pick_hint')}</p>
      <div className="ft-badge-grid">
        {ordered.map((b) => {
          const meta = BADGE_META[b.code]
          if (!meta) return null
          return <BadgeCard key={b.code} badge={b} meta={meta} t={t} onSetFeatured={onSetFeatured} />
        })}
      </div>
    </div>
  )
}

/** Tách riêng để mỗi thẻ có ref nghiêng 3D của chính nó (hook không gọi được trong map). */
function BadgeCard({ badge, meta, t, onSetFeatured }) {
  const tiltRef = useTilt()
  const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100))

  return (
    <div ref={tiltRef}
      className={`ft-badge ft-tilt${badge.earned ? ' earned' : ''}${badge.featured ? ' featured' : ''}`}>
      <span className="ft-badge-icon">{meta.icon}</span>
      <div className="ft-badge-body">
        <div className="ft-badge-title">
          {t(meta.titleKey)}
          {badge.earned && <span className="ft-badge-check" title={t('badge_earned')}>✓</span>}
        </div>
        <div className="ft-badge-desc">{t(meta.descKey)}</div>

        {/* Da dat thi bo thanh tien do "x/y" cho gon; chua dat moi hien de biet con bao xa */}
        {!badge.earned ? (
          <>
            <div className="ft-badge-progress-track">
              <div className="ft-badge-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="ft-badge-desc ft-num">
              {badge.progress}/{badge.target}
            </div>
          </>
        ) : (
          onSetFeatured && (
            <button
              type="button"
              className={`ft-badge-pin${badge.featured ? ' active' : ''}`}
              onClick={() => onSetFeatured(badge.featured ? null : badge.code)}
            >
              📌 {badge.featured ? t('badge_pinned') : t('badge_pin')}
            </button>
          )
        )}
      </div>
    </div>
  )
}
