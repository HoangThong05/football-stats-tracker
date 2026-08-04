import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tieng an mung san van dong, TONG HOP HOAN TOAN bang Web Audio API.
 * Khong tai file mp3 nao -> khong ton bang thong, khong them tai san vao repo.
 *
 * GIOI HAN: cach nay chi tao duoc am thanh phi loi noi. Tieng dam dong, tieng coi,
 * tieng trong thi duoc; cau "SIUUU" la GIONG NGUOI, oscillator khong the tao ra.
 * Muon co giong that thi bat buoc phai co file am thanh.
 *
 * Cong thuc:
 * - Dam dong = nhieu trang qua bo loc bandpass, bien do dang len roi tat dan
 * - Coi trong tai = hai song sin lech nhau mot chut cho ra tieng rung dac trung
 * - Trong = dao dong ha tan so nhanh, danh theo nhip
 */

const CROWD_SECONDS = 2.6

/** Nhieu trang dung lam "loi" cua tieng dam dong. Tao 1 lan roi dung lai. */
function createNoiseBuffer(ctx) {
  const length = Math.floor(ctx.sampleRate * CROWD_SECONDS)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  return buffer
}

export function useStadiumSound() {
  // Mac dinh TAT: web tu dung phat tieng la mot trong nhung thu kho chiu nhat
  const [muted, setMuted] = useState(true)
  const ctxRef = useRef(null)
  const noiseRef = useRef(null)

  useEffect(
    () => () => {
      ctxRef.current?.close?.()
      ctxRef.current = null
    },
    [],
  )

  const play = useCallback(() => {
    if (muted) return

    // Tao AudioContext o lan bam dau tien, khong phai luc mount: trinh duyet chan
    // context tao ngoai cu chi nguoi dung, tao som se sinh ra context bi treo.
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      ctxRef.current = new Ctx()
      noiseRef.current = createNoiseBuffer(ctxRef.current)
    }

    const ctx = ctxRef.current
    ctx.resume?.()

    const t0 = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)

    /* --- Tieng dam dong reo --- */
    const crowd = ctx.createBufferSource()
    crowd.buffer = noiseRef.current

    // Bandpass hep quanh 900Hz cho ra chat "o o" cua dam dong thay vi tieng xi nhieu
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.setValueAtTime(700, t0)
    band.frequency.linearRampToValueAtTime(1300, t0 + 0.8)
    band.Q.value = 0.9

    const crowdGain = ctx.createGain()
    crowdGain.gain.setValueAtTime(0.0001, t0)
    crowdGain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.45) // dang len
    crowdGain.gain.exponentialRampToValueAtTime(0.0001, t0 + CROWD_SECONDS) // tat dan

    crowd.connect(band).connect(crowdGain).connect(master)
    crowd.start(t0)
    crowd.stop(t0 + CROWD_SECONDS)

    /* --- Coi trong tai --- */
    const whistleGain = ctx.createGain()
    whistleGain.gain.setValueAtTime(0.0001, t0)
    whistleGain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.06)
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55)
    whistleGain.connect(master)

    // Lech 18Hz giua hai song la cho ra tieng rung ro cua coi co hat
    for (const freq of [2350, 2368]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(whistleGain)
      osc.start(t0)
      osc.stop(t0 + 0.6)
    }

    /* --- Trong dan --- */
    for (let i = 0; i < 4; i += 1) {
      const at = t0 + 0.15 + i * 0.28
      const drum = ctx.createOscillator()
      const drumGain = ctx.createGain()

      drum.type = 'sine'
      drum.frequency.setValueAtTime(160, at)
      drum.frequency.exponentialRampToValueAtTime(45, at + 0.18) // ha tan so = tieng "thump"

      drumGain.gain.setValueAtTime(0.35, at)
      drumGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)

      drum.connect(drumGain).connect(master)
      drum.start(at)
      drum.stop(at + 0.25)
    }
  }, [muted])

  return { muted, toggleMuted: () => setMuted((v) => !v), play }
}
