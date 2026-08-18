import { useState } from 'react'
import { useTranslation } from '../i18n'
import Modal from './Modal'
import Statue3D from './Statue3D'

/**
 * Ngan keo chua tuong CR7 3D: mot nut nho o goc, bam moi mo ra.
 *
 * VI SAO KHONG DE SAN TREN TRANG:
 * 1. Tuong xoay lien tuc ngay canh bang so lieu -> mat bi keo di khi dang doc.
 * 2. Statue3D chi cần mount la keo ve file .glb 8,25MB. Tren mot trang thong ke ma
 *    noi dung chinh chi nang vai KB, bat nguoi dung tai ngan ay cho mot hinh trang
 *    tri la khong dang.
 *
 * De trong ngan keo thi ca hai chi tai khi nguoi dung THUC SU muon xem.
 */
export default function StatueDrawer() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

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
        <Modal onClose={() => setOpen(false)} label={t('statue_open')} size="lg">
          {/* Chi den day Statue3D moi ton tai -> den day three.js va .glb moi duoc tai */}
          <Statue3D height={340} />
        </Modal>
      )}
    </>
  )
}
