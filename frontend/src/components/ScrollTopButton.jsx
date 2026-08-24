import { useEffect, useState } from 'react'

/**
 * Nut noi "len dau trang", chi hien khi da cuon xuong kha xa. Bam thi cuon muot len dau.
 * Dat cao hon nut cup (StatueDrawer) o goc phai duoi de khong de len nhau.
 */
export default function ScrollTopButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      type="button"
      className="ft-scrolltop"
      aria-label="Lên đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}
