import { useTranslation } from '../i18n'

/**
 * Hop chon anh bia kieu Discord: 2 o - "Tai len anh" va "Chon GIF".
 * Chi mo khi Giphy da bat (co key); chua co GIF thi CoverUpload mo thang hop chon file.
 */
export default function CoverAddDialog({ onUpload, onGif, onClose }) {
  const { t } = useTranslation()
  return (
    <div className="ft-gif-overlay" onClick={onClose}>
      <div className="ft-cover-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-cover-dialog-head">
          <span className="fw-bold">{t('cover_pick_title')}</span>
          <button type="button" className="ft-gif-close" aria-label="X" onClick={onClose}>✕</button>
        </div>

        <div className="ft-cover-dialog-cards">
          <button type="button" className="ft-cover-card" onClick={onUpload}>
            <span className="ft-cover-card-icon" aria-hidden="true">🖼️</span>
            <span>{t('cover_pick_upload')}</span>
          </button>
          <button type="button" className="ft-cover-card" onClick={onGif}>
            <span className="ft-cover-card-badge" aria-hidden="true">GIF</span>
            <span>{t('cover_pick_gif')}</span>
          </button>
        </div>

        <p className="ft-cover-dialog-note">{t('cover_pick_note')}</p>
      </div>
    </div>
  )
}
