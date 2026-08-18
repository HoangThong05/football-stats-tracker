import { useEffect } from 'react'
import { useTranslation } from '../i18n'

/**
 * Hop thoai phu len trang: nen mo, bam ra ngoai hoac nhan Esc de dong.
 *
 * Gom mot cho vi app co nhieu hop thoai (dang nhap, tuong 3D). Viet rieng tung cai
 * thi phan khoa cuon nen va bat phim Esc bi lap lai, va som muon cung lech nhau -
 * cai nay dong duoc bang Esc, cai kia thi khong.
 *
 * @param {string} label ten hop thoai cho trinh doc man hinh
 * @param {'md'|'lg'} size do rong toi da
 */
export default function Modal({ onClose, label, size = 'md', children }) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    /*
     * Khoa cuon nen trong luc mo. Nho giu lai gia tri CU roi tra ve dung no khi dong,
     * khong gan cung 'auto' - nho trang dang dat gia tri khac thi se lam hong.
     */
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="ft-modal" role="dialog" aria-modal="true" aria-label={label}>
      <div className="ft-modal-backdrop" onClick={onClose} />

      <div className={`ft-modal-panel ft-modal-${size} ft-fade`}>
        <button
          className="ft-modal-close"
          onClick={onClose}
          aria-label={t('modal_close')}
          title={t('modal_close')}
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  )
}
