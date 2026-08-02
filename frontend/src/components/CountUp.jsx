import { useEffect, useRef, useState } from 'react'

const DURATION = 650

/** Vào nhanh rồi chậm dần về đích — giống chuyển động thật hơn là tăng đều. */
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

/**
 * Số đếm tăng dần từ 0 tới `value` khi lần đầu hiện ra.
 *
 * Giữ nguyên số cũ (không nhảy về 0) khi `value` đổi giữa chừng, và bỏ qua hoàn toàn
 * hiệu ứng nếu người dùng bật "giảm chuyển động" hoặc giá trị không phải số.
 */
export default function CountUp({ value, className }) {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const target = Number(value)
    if (!Number.isFinite(target)) {
      setShown(value)
      return undefined
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target)
      return undefined
    }

    const from = Number(fromRef.current) || 0
    if (from === target) {
      setShown(target)
      return undefined
    }

    let frame = 0
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / DURATION, 1)
      setShown(Math.round(from + (target - from) * easeOut(progress)))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = target
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <span className={className}>{shown}</span>
}
