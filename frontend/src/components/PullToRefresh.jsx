import { useEffect, useRef, useState } from 'react'

/*
 * Keo xuong de lam moi (chi tren thiet bi cam ung, chi khi dang o DINH trang).
 *
 * Chi chan cuon (preventDefault) khi that su dang keo xuong o dinh, de khong pha cuon
 * binh thuong. Qua nguong thi goi onRefresh (lam moi du lieu view hien tai).
 */
const THRESHOLD = 70
const MAX = 90

export default function PullToRefresh({ onRefresh }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)
  // onRefresh doi moi lan render (dong view/league) -> giu ban moi nhat, tranh goi nham view cu
  const cb = useRef(onRefresh)
  cb.current = onRefresh

  const apply = (v) => {
    pullRef.current = v
    setPull(v)
  }
  const flag = (v) => {
    refreshingRef.current = v
    setRefreshing(v)
  }

  useEffect(() => {
    if (!('ontouchstart' in window)) return undefined

    const onStart = (e) => {
      startY.current = window.scrollY <= 0 && !refreshingRef.current ? e.touches[0].clientY : null
    }
    const onMove = (e) => {
      if (startY.current == null || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && window.scrollY <= 0) {
        const damped = Math.min(dy * 0.5, MAX)
        apply(damped)
        if (damped > 4) e.preventDefault()
      }
    }
    const onEnd = () => {
      if (pullRef.current > THRESHOLD) {
        flag(true)
        apply(THRESHOLD)
        try {
          if (cb.current) cb.current()
        } catch {
          /* bo qua */
        }
        setTimeout(() => {
          flag(false)
          apply(0)
        }, 900)
      } else {
        apply(0)
      }
      startY.current = null
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  if (pull <= 0 && !refreshing) return null

  const rotation = Math.min(pull / THRESHOLD, 1) * 270
  return (
    <div className="ft-ptr" style={{ transform: `translateX(-50%) translateY(${pull}px)` }}>
      <span
        className={`ft-ptr-spin ${refreshing ? 'spinning' : ''}`}
        style={refreshing ? undefined : { transform: `rotate(${rotation}deg)` }}
      >
        ↻
      </span>
    </div>
  )
}
