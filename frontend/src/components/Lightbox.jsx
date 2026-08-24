import { useEffect } from 'react'
import { isVideoUrl } from '../utils'

/**
 * Xem anh/video phong to toan man hinh. Bam nen den hoac ✕ hoac Esc de dong.
 * Bam vao chinh anh/video thi khong dong (de con thao tac video).
 */
export default function Lightbox({ url, onClose }) {
  useEffect(() => {
    if (!url) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Khoa cuon trang nen khi dang xem
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [url, onClose])

  if (!url) return null

  return (
    <div className="ft-lightbox" onClick={onClose}>
      <button type="button" className="ft-lightbox-close" aria-label="Đóng" onClick={onClose}>
        ✕
      </button>
      {isVideoUrl(url) ? (
        <video
          src={url}
          controls
          autoPlay
          className="ft-lightbox-media"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img src={url} alt="" className="ft-lightbox-media" onClick={(e) => e.stopPropagation()} />
      )}
    </div>
  )
}
