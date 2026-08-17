import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tieng an mung san van dong.
 *
 * HAI DUONG, tu chon theo cai co san:
 *
 * 1. Neu co file /siuuu.mp3 trong frontend/public/ -> phat file that.
 *    Day la cach DUY NHAT co giong nguoi. Repo khong kem san file nao: audio CR7
 *    tren song truyen hinh thuoc ban quyen nha dai, khong the nhung vao du an.
 *    Muon co thi tu thu am hoac dung ban minh co quyen su dung.
 *
 * 2. Khong co file -> tong hop bang Web Audio API.
 *    Khong phai giong that, nhung mo phong nguyen am "i-u" bang FORMANT nen nghe
 *    ra chu "siuuu" chu khong con la tieng u u vo nghia.
 *
 * Ca hai duong deu co nen tieng dam dong ben duoi.
 */

/*
 * MOT ten file duy nhat.
 *
 * Ban truoc thu 5 duoi (.mp3/.m4a/.ogg/.wav/.mp4) cung luc cho "tien", nhung chi co
 * dung 1 file ton tai -> 4 lan 404 do loe trong Console moi lan bam nut, va 4 request
 * thua. Tien cho ai do doi file mot lan khong bu duoc rac do.
 *
 * Muon dung dinh dang khac thi doi ten file thanh siuuu.mp3 la xong: decodeAudioData
 * nhan dang theo NOI DUNG chu khong theo duoi file, nen AAC/OGG/WAV deu giai ma duoc
 * du mang duoi .mp3.
 */
const SAMPLE_URL = '/siuuu.mp3'

/** Tra ve AudioBuffer neu co file, khong co thi null. */
function loadSample(ctx) {
  return fetch(SAMPLE_URL)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error('404'))))
    // File khong ton tai: Vercel co the tra ve index.html kem ma 200, luc do
    // decodeAudioData nem loi -> van roi vao catch, van coi nhu khong co file.
    .then((buf) => ctx.decodeAudioData(buf))
    .catch(() => null)
}

/*
 * Do dai duong TONG HOP (khi khong tim thay file nao). Chi ap dung cho duong nay -
 * co file that thi do dai lay thang tu chinh file, khong con hang so nao phai
 * chinh tay moi lan doi file nua.
 */
const CROWD_SECONDS = 6.0

/** Do dai buffer nhieu trang. Ngan hon CROWD_SECONDS va duoc lap lai khi phat. */
const NOISE_SECONDS = 2.5

/** Am luong khi bat tieng. Nut loa dao qua lai giua muc nay va 0. */
const MASTER_GAIN = 0.9

/** Nhieu trang dung lam "loi" cua tieng dam dong va am /s/. Tao 1 lan roi dung lai. */
function createNoiseBuffer(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  return buffer
}

/** Nen tieng dam dong reo, dung chung cho ca hai duong. */
function playCrowd(ctx, noise, out, gain) {
  const t0 = ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = noise
  // Buffer chi dai NOISE_SECONDS, ngan hon man an mung -> phai lap
  source.loop = true

  // Bandpass hep cho ra chat "o o" cua dam dong thay vi tieng xi nhieu
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(650, t0)
  band.frequency.linearRampToValueAtTime(1250, t0 + 0.9)
  band.Q.value = 0.8

  /*
   * Dang len - GIU - tat dan. Phai co doan giu o giua: ramp mu tu dinh xuong 0
   * suot 6s se roi rat nhanh o dau doan, moi 2 giay la gan nhu im, con lai 4 giay
   * tuong quay trong im lang.
   */
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.5)
  env.gain.setValueAtTime(gain, t0 + CROWD_SECONDS * 0.62)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + CROWD_SECONDS)

  source.connect(band).connect(env).connect(out)
  source.start(t0)
  source.stop(t0 + CROWD_SECONDS)
}

/**
 * Tong hop tieng "SIUUU" bang formant.
 *
 * Nguyen am duoc quyet dinh boi hai dinh cong huong F1/F2 cua khoang mieng:
 *   /i/ (nhu "i")  ->  F1 ~270Hz, F2 ~2300Hz
 *   /u/ (nhu "u")  ->  F1 ~320Hz, F2 ~800Hz
 * Giu F1 gan nhu co dinh va TRUOT F2 tu 2300 xuong 800 chinh la doc "i-u" -
 * do la meo lam nen chu "siu". Truoc do chen mot hoi nhieu tan so cao lam am /s/.
 *
 * Nguon la song rang cua (giau hoa am) chu khong phai sin, vi bo loc formant can
 * co hoa am de ma loc ra; song sin tron tru se khong ra duoc nguyen am nao ca.
 */
function playSynthVoice(ctx, noise, out) {
  const t0 = ctx.currentTime
  const S_LEN = 0.13
  const V_START = t0 + S_LEN * 0.7 // nguyen am chom len truoc khi /s/ tat han
  const V_LEN = 1.15

  /* --- Am /s/: nhieu tan so cao --- */
  const sSource = ctx.createBufferSource()
  sSource.buffer = noise
  const sFilter = ctx.createBiquadFilter()
  sFilter.type = 'highpass'
  sFilter.frequency.value = 4200
  const sGain = ctx.createGain()
  sGain.gain.setValueAtTime(0.0001, t0)
  sGain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.04)
  sGain.gain.exponentialRampToValueAtTime(0.0001, t0 + S_LEN)
  sSource.connect(sFilter).connect(sGain).connect(out)
  sSource.start(t0)
  sSource.stop(t0 + S_LEN)

  /* --- Nguyen am "iuuu" --- */
  const glottis = ctx.createOscillator()
  glottis.type = 'sawtooth'
  glottis.frequency.setValueAtTime(180, V_START)
  glottis.frequency.linearRampToValueAtTime(215, V_START + 0.18) // hung len
  glottis.frequency.linearRampToValueAtTime(155, V_START + V_LEN) // roi ha dan

  // Rung giong: khong co cai nay nghe rat may moc
  const vibrato = ctx.createOscillator()
  vibrato.frequency.value = 5.5
  const vibratoDepth = ctx.createGain()
  vibratoDepth.gain.value = 4.5
  vibrato.connect(vibratoDepth).connect(glottis.frequency)

  const voiceEnv = ctx.createGain()
  voiceEnv.gain.setValueAtTime(0.0001, V_START)
  voiceEnv.gain.exponentialRampToValueAtTime(0.55, V_START + 0.09)
  voiceEnv.gain.setValueAtTime(0.55, V_START + V_LEN * 0.55)
  voiceEnv.gain.exponentialRampToValueAtTime(0.0001, V_START + V_LEN)
  voiceEnv.connect(out)

  // F1: gan nhu dung yen - nguyen am nao cung quanh 270-320Hz
  const f1 = ctx.createBiquadFilter()
  f1.type = 'bandpass'
  f1.Q.value = 7
  f1.frequency.setValueAtTime(280, V_START)
  f1.frequency.linearRampToValueAtTime(320, V_START + V_LEN * 0.5)

  // F2: TRUOT tu /i/ xuong /u/ - day moi la chu "iu"
  const f2 = ctx.createBiquadFilter()
  f2.type = 'bandpass'
  f2.Q.value = 9
  f2.frequency.setValueAtTime(2300, V_START)
  f2.frequency.exponentialRampToValueAtTime(800, V_START + V_LEN * 0.45)

  const f1Gain = ctx.createGain()
  f1Gain.gain.value = 1
  const f2Gain = ctx.createGain()
  f2Gain.gain.value = 0.75

  // Hai formant chay SONG SONG roi cong lai, khong noi tiep
  glottis.connect(f1).connect(f1Gain).connect(voiceEnv)
  glottis.connect(f2).connect(f2Gain).connect(voiceEnv)

  glottis.start(V_START)
  glottis.stop(V_START + V_LEN)
  vibrato.start(V_START)
  vibrato.stop(V_START + V_LEN)
}

export function useStadiumSound() {
  // Mac dinh TAT: web tu dung phat tieng la mot trong nhung thu kho chiu nhat
  const [muted, setMuted] = useState(true)
  const ctxRef = useRef(null)
  const noiseRef = useRef(null)

  /*
   * Buffer nhieu chi dung cho duong TONG HOP. Tao khi thuc su can chu khong tao san:
   * co file that thi khong bao gio dung toi, khoi giu khong 440KB trong bo nho.
   *
   * Chi tao 2,5s roi cho lap khi phat: nhieu trang thi doan nao cung nhu doan nao,
   * tai khong nghe ra cho noi, ma tiet kiem 2/3 bo nho so voi tao du 8 giay.
   */
  const getNoise = (ctx) => {
    if (!noiseRef.current) noiseRef.current = createNoiseBuffer(ctx, NOISE_SECONDS)
    return noiseRef.current
  }
  const sampleRef = useRef(undefined) // undefined = chua thu tai, null = khong co file
  const currentRef = useRef(null) // nguon dang phat, giu de con cat khi bam lai
  const masterRef = useRef(null) // nut am luong CHUNG, song suot doi component

  useEffect(
    () => () => {
      ctxRef.current?.close?.()
      ctxRef.current = null
      masterRef.current = null
    },
    [],
  )

  /*
   * Bam nut loa GIUA CHUNG tieng dang phat thi phai im NGAY.
   *
   * Chi chan o dau vao cua play() la khong du: AudioBufferSourceNode da start() roi
   * thi cu the chay het 31 giay, co doi muted thanh true no cung khong biet.
   * Vi vay moi am thanh deu di qua mot nut am luong chung, tat = ha nut do ve 0.
   *
   * Ha bang setTargetAtTime chu khong gan thang 0: cat bien do dot ngot sinh ra
   * tieng "tach" o loa.
   *
   * CO Y KHONG goi stop(): tat roi mo lai thi nghe TIEP chu khong mat doan.
   * AudioBufferSourceNode theo chuan la dung MOT LAN - da stop() thi khong start()
   * lai duoc, phai dung nguon moi. Ma tao nguon moi se khien tieng lech pha voi
   * hoat anh: tuong van an mung theo dong thoi gian cu cua no.
   * De nguon chay ngam thi khi mo lai, tieng va hinh van dung khop nhau.
   */
  useEffect(() => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return

    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime, 0.015)
  }, [muted])

  /**
   * Phat tieng an mung.
   * @returns {Promise<number>} do dai tieng vua phat, tinh bang giay. 0 = khong phat gi
   *   (dang tat tieng hoac trinh duyet khong ho tro). Ben goi dung so nay de khop
   *   do dai hoat anh - xem Statue3D.
   */
  const play = useCallback(async () => {
    if (muted) return 0

    // Tao AudioContext o lan bam dau tien, khong phai luc mount: trinh duyet chan
    // context tao ngoai cu chi nguoi dung, tao som se sinh ra context bi treo.
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return 0
      ctxRef.current = new Ctx()
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.gain.value = MASTER_GAIN
      masterRef.current.connect(ctxRef.current.destination)
    }

    const ctx = ctxRef.current
    const master = masterRef.current
    ctx.resume?.()

    /*
     * Mo lai sau khi tat: keo am luong ve muc thuong.
     * Effect theo doi `muted` khong lam duoc viec nay o lan bam DAU TIEN, vi luc no
     * chay thi masterRef con chua ton tai - context chi duoc tao o day.
     */
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(MASTER_GAIN, ctx.currentTime, 0.015)

    // Thu tai file that dung MOT lan, ket qua nho lai cho cac lan bam sau
    if (sampleRef.current === undefined) {
      sampleRef.current = await loadSample(ctx)
    }

    /*
     * Bam lai khi tieng cu con dang chay -> CAT tieng cu di.
     * File dai 31 giay ma khong cat thi bam ba phat la ba ban ghi chong len nhau,
     * nghe thanh mo bong bong.
     */
    currentRef.current?.stop?.()
    currentRef.current = null

    if (sampleRef.current) {
      /*
       * CO FILE THAT -> phat mot minh no, KHONG chong them nen dam dong tong hop.
       * Ban thu am that von da co san khong khi san bong; cong them nhieu trang
       * qua bo loc vao chi ra tieng re, khong ra tieng nguoi reo.
       */
      const voice = ctx.createBufferSource()
      voice.buffer = sampleRef.current
      voice.connect(master)
      voice.start()
      // Phat het thi tu buong ra, khong giu tham chieu den nguon da xong viec
      voice.onended = () => {
        if (currentRef.current === voice) currentRef.current = null
      }
      currentRef.current = voice
      return sampleRef.current.duration
    }

    // Khong co file: giong tong hop tro troi nghe rat mong, can nen dam dong do
    playSynthVoice(ctx, getNoise(ctx), master)
    playCrowd(ctx, getNoise(ctx), master, 0.34)
    return CROWD_SECONDS
  }, [muted])

  return { muted, toggleMuted: () => setMuted((v) => !v), play }
}
