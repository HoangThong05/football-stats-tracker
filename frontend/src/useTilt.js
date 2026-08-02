import { useEffect, useRef } from 'react'

const MAX_DEG = 6 // nghiêng tối đa; quá tay sẽ làm bảng số liệu khó đọc

/**
 * Cho thẻ nghiêng 3D nhẹ theo vị trí chuột.
 *
 * Chỉ ghi 2 biến CSS (--rx/--ry cho góc, --mx/--my cho vệt sáng) rồi để CSS lo phần
 * còn lại — không đụng tới layout nên không gây reflow.
 *
 * Tự tắt khi: máy không có chuột thật (điện thoại/tablet) hoặc người dùng bật
 * "giảm chuyển động" trong hệ điều hành.
 */
export function useTilt() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reduceMotion) return undefined

    let frame = 0

    const onMove = (e) => {
      // Gộp nhiều sự kiện chuột vào 1 khung hình -> không tính toán thừa
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width // 0..1
        const py = (e.clientY - r.top) / r.height
        el.style.setProperty('--ry', `${(px - 0.5) * 2 * MAX_DEG}deg`)
        el.style.setProperty('--rx', `${(0.5 - py) * 2 * MAX_DEG}deg`)
        el.style.setProperty('--mx', `${px * 100}%`)
        el.style.setProperty('--my', `${py * 100}%`)
      })
    }

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return ref
}
