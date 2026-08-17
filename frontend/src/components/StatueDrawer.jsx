import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import Statue3D from './Statue3D'

/**
 * Ngan keo chua tuong CR7 3D: mot nut nho o goc, bam moi mo ra.
 *
 * VI SAO KHONG DE SAN TREN TRANG:
 * 1. Tuong xoay lien tuc ngay canh bang so lieu -> mat bi keo di khi dang doc.
 * 2. Statue3D chi cần mount la keo ve 578KB three.js + 8,25MB file .glb. Tren mot
 *    trang thong ke ma noi dung chinh chi nang vai KB, bat nguoi dung tai gan 9MB
 *    cho mot hinh trang tri la khong dang.
 *
 * De trong ngan keo thi ca hai chi tai khi nguoi dung THUC SU muon xem.
 */
export default function StatueDrawer() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  // Mo hop thoai thi chan cuon nen, va cho phim Esc dong lai
  useEffect(() => {
    if (!open) return undefined

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      {!open && (
        <button
          className="ft-statue-fab"
          onClick={() => setOpen(true)}
          title={t('statue_open')}
          aria-label={t('statue_open')}
        >
          <span aria-hidden="true">🏆</span>
        </button>
      )}

      {open && (
        <div className="ft-statue-modal" role="dialog" aria-modal="true" aria-label={t('statue_open')}>
          <div className="ft-statue-modal-backdrop" onClick={() => setOpen(false)} />

          <div className="ft-statue-modal-panel ft-fade">
            <button
              className="ft-statue-modal-close"
              onClick={() => setOpen(false)}
              aria-label={t('statue_close')}
              title={t('statue_close')}
            >
              ✕
            </button>

            {/* Chi den day Statue3D moi ton tai -> den day three.js va .glb moi duoc tai */}
            <Statue3D height={340} />
          </div>
        </div>
      )}
    </>
  )
}
