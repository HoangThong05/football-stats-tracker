import { useLayoutEffect, useRef } from 'react'

/**
 * Vien "thuoc" truot muot tu tab cu sang tab dang chon, thay vi nen nhay coc tung o.
 *
 * JS chi do vi tri/kich thuoc cua nut .active roi ghi vao 4 bien CSS; phan ve va
 * chuyen dong deu do CSS lo (xem .ft-view-tabs::before) - chay tren GPU, khong reflow.
 *
 * Do ca offsetTop chu khong chi offsetLeft: thanh tab co flex-wrap, man hinh hep se
 * xuong dong va vien phai nhay dung hang.
 *
 * @param {unknown} activeKey doi gia tri nay -> do lai vi tri (vd tab dang chon, ngon ngu)
 */
export function useSlidingIndicator(activeKey) {
  const ref = useRef(null)

  // useLayoutEffect chu khong useEffect: do va ve TRUOC khi trinh duyet son khung dau,
  // neu khong tab dang chon se nhap nhay mot khung vi chua co nen.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const measure = () => {
      const active = el.querySelector('.active')
      if (!active) {
        el.style.setProperty('--ft-ind-o', '0')
        return
      }
      el.style.setProperty('--ft-ind-x', `${active.offsetLeft}px`)
      el.style.setProperty('--ft-ind-y', `${active.offsetTop}px`)
      el.style.setProperty('--ft-ind-w', `${active.offsetWidth}px`)
      el.style.setProperty('--ft-ind-h', `${active.offsetHeight}px`)
      el.style.setProperty('--ft-ind-o', '1')
    }

    measure()

    // Doi ngon ngu / doi be rong man hinh lam nut rong hep khac di -> do lai
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)

    return () => observer.disconnect()
  }, [activeKey])

  return ref
}
