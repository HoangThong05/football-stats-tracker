import { useEffect, useRef, useState } from 'react'
import { useThreeScene } from '../useThreeScene'
import { useTranslation } from '../i18n'
import FutCard from './FutCard'
import { useStadiumSound } from '../useStadiumSound'

/**
 * File .glb đặt trong frontend/public/ — KHÔNG phải resources/static của backend.
 * Backend (Render) và frontend (Vercel) là hai domain khác nhau; để bên backend thì
 * trang web sẽ tải 404.
 */
const MODEL_URL = '/ronaldo.glb'

/** Cỡ cao mong muốn của tượng trong khung, theo đơn vị của scene. */
const TARGET_HEIGHT = 2.4

// Kích thước bục — khai báo một chỗ để chỗ dựng bục và chỗ đặt tượng không lệch nhau
const BASE_CENTER_Y = -1.6
const BASE_HEIGHT = 0.35
/** Cao độ MẶT TRÊN của bục — chân tượng phải đứng đúng ở đây. */
const BASE_TOP_Y = BASE_CENTER_Y + BASE_HEIGHT / 2
/** Tâm tượng sau khi dựng — camera ngắm vào đây để tượng nằm giữa khung. */
const STATUE_CENTER_Y = BASE_TOP_Y + TARGET_HEIGHT / 2

/*
 * Do dai man an mung khi CHUA BIET tieng dai bao nhieu - dang tat tieng, hoac
 * lan bam dau tien file chua tai xong. Biet roi thi lay dung do dai file, nen
 * doi file am thanh khong con phai sua con so nao o day.
 */
const DEFAULT_CELEBRATE_MS = 6000

/* Toc do xoay tinh bang RAD/GIAY (khong phai rad/khung hinh - xem onFrame). */
const SPIN_IDLE = 0.25 // luc binh thuong, chi de tuong khong dung chet
const SPIN_PEAK = 1.8 // ngay khi bam nut
const SPIN_REST = 0.4 // sau khi lang xuong, toc do "trung bay"
const SPIN_DECAY_S = 1.8 // hang so thoi gian giam tu PEAK ve REST

/* Man mo the pack: tong do dai, va thoi diem CHOP sang giua man. */
const REVEAL_TOTAL_S = 2.6
const REVEAL_FLASH_S = 0.6
export const REVEAL_TOTAL_MS = REVEAL_TOTAL_S * 1000

/**
 * Tượng cầu thủ 3D nạp từ file .glb.
 *
 * Model tải về mỗi cái một cỡ và một gốc toạ độ khác nhau, nên component tự đo hộp bao
 * rồi thu/phóng, dời về giữa và hạ chân xuống chạm bục — bỏ model nào vào cũng hiện
 * đúng khung, không phải chỉnh tay.
 *
 * Thiếu file hoặc file hỏng thì tự chuyển sang tượng vàng dựng bằng khối hình học, để
 * chỗ này không bao giờ trống trơn.
 */
export default function Statue3D({ height = 320, className = '' }) {
  const { t, lang } = useTranslation()
  const boxRef = useRef(null)
  const [width, setWidth] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | fallback
  const [playing, setPlaying] = useState(true)
  const [hasAnimation, setHasAnimation] = useState(false)

  // Cầu nối sang vòng vẽ: đổi state React không nên chạm vào vòng lặp mỗi khung hình
  // celebrateMs: do dai man an mung DANG chay - can no de tinh nguoc ra da troi bao lau
  // revealStart: moc bat dau man mo pack (performance.now), 0 = khong chay
  const controlRef = useRef({
    playing: true,
    celebrateUntil: 0,
    celebrateMs: DEFAULT_CELEBRATE_MS,
    revealStart: 0,
  })

  const [revealing, setRevealing] = useState(false)

  /*
   * Nguoi dung bat "giam chuyen dong" -> useThreeScene chi ve DUNG MOT khung hinh
   * roi dung han vong lap. Man reveal se ket o khung do: tuong thu nho ve 0 va
   * KHONG BAO GIO lon lai, tuc CR7 bien mat vinh vien. Bat buoc phai an nut di.
   */
  const [canReveal] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const openPack = () => {
    if (!canReveal) return
    controlRef.current.revealStart = performance.now()
    setRevealing(true)
    setTimeout(() => setRevealing(false), REVEAL_TOTAL_MS)
  }

  useEffect(() => {
    controlRef.current.playing = playing
  }, [playing])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const apply = () => setWidth(Math.round(el.getBoundingClientRect().width))
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { muted, toggleMuted, play } = useStadiumSound()

  /*
   * Chay hoat anh NGAY voi do dai mac dinh, roi keo dai lai khi biet tieng dai bao
   * nhieu. Cho play() xong moi bat dau thi lan bam dau tien se tre - luc do file
   * con dang tai. Va vi chi keo DAI ra, mat nhin khong thay cho noi.
   */
  const celebrate = async () => {
    const ctrl = controlRef.current
    ctrl.celebrateMs = DEFAULT_CELEBRATE_MS
    ctrl.celebrateUntil = performance.now() + DEFAULT_CELEBRATE_MS

    const seconds = await play()
    if (seconds > 0) {
      ctrl.celebrateMs = seconds * 1000
      ctrl.celebrateUntil = performance.now() + ctrl.celebrateMs
    }
  }

  const { mountRef, failed } = useThreeScene({
    width,
    height,
    build: (THREE, { scene, renderer }) => {
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
      camera.position.set(0, STATUE_CENTER_Y + 0.9, 6.2)
      camera.lookAt(0, STATUE_CENTER_Y, 0) // OrbitControls chua tai xong van ngam dung cho

      // Giu tham chieu ca ba den: man mo pack can vặn toi roi bat sang tro lai
      const ambient = new THREE.AmbientLight(0xffffff, 1.2)
      scene.add(ambient)
      const key = new THREE.DirectionalLight(0xffd9a0, 2.2) // đèn pha ngả vàng
      key.position.set(3, 5, 4)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x9fe0bb, 0.9)
      rim.position.set(-4, 2, -3)
      scene.add(rim)

      // Do sang goc, de con nhan he so lam mo trong man reveal
      const BASE_LIGHTS = [
        [ambient, ambient.intensity],
        [key, key.intensity],
        [rim, rim.intensity],
      ]
      // Đèn rọi này bừng sáng lúc ăn mừng
      const spot = new THREE.SpotLight(0xffc24b, 0, 20, Math.PI / 5, 0.4)
      spot.position.set(0, 6, 3)
      scene.add(spot)

      /* ===== Buc co: dia co + vach voi + vong neon ===== */

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.62, BASE_HEIGHT, 64),
        new THREE.MeshStandardMaterial({ color: '#1e5e37', roughness: 0.95 }),
      )
      base.position.y = BASE_CENTER_Y
      scene.add(base)

      /*
       * Vach voi nam NGAY TREN mat buc, khong phai o dung cao do mat buc:
       * trung cao do se sinh z-fighting, vach nhap nhay khi xoay camera.
       */
      const LINE_Y = BASE_TOP_Y + 0.002
      const chalk = new THREE.MeshBasicMaterial({
        color: '#eaf5ee',
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      })

      const addFlatRing = (inner, outer, material, y = LINE_Y) => {
        const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 72), material)
        ring.rotation.x = -Math.PI / 2 // RingGeometry nam trong mat phang XY -> lat cho nam ngang
        ring.position.y = y
        scene.add(ring)
        return ring
      }

      addFlatRing(1.4, 1.45, chalk) // duong bien
      addFlatRing(0.62, 0.66, chalk) // vong tron giua san

      const centerSpot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), chalk)
      centerSpot.rotation.x = -Math.PI / 2
      centerSpot.position.y = LINE_Y
      scene.add(centerSpot)

      // Vong neon vang quay quanh chan - sang han len luc an mung
      const neonMaterial = new THREE.MeshBasicMaterial({
        color: '#ffc24b',
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const neonRing = addFlatRing(1.52, 1.68, neonMaterial, BASE_TOP_Y + 0.004)

      /* ===== Luong den pha tu tren xuong ===== */

      /*
       * "Luong sang" chi la hinh non trong suot cong mau (AdditiveBlending), khong phai
       * anh sang that - do bong the tich that su qua nang cho mot hinh trang tri.
       * depthWrite:false de cac non khong cat nhau thanh mang toi.
       */
      // MOT luong duy nhat, roi thang tu tren dinh xuong giua buc
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(1.7, 7, 40, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#ffe6b0',
          transparent: true,
          opacity: 0.06,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      )
      // Non mac dinh dinh o tren, day o duoi - dung luon huong cua den roi xuong
      beam.position.set(0, BASE_TOP_Y + 3.5, 0)
      scene.add(beam)

      /* ===== Hat kim tuyen vang ===== */

      const PARTICLE_COUNT = 500
      const PARTICLE_LIFE_S = 1.8
      const DEAD_Y = -999 // day hat da tat ra khoi khung thay vi xoa khoi buffer

      const positions = new Float32Array(PARTICLE_COUNT * 3)
      const velocities = new Float32Array(PARTICLE_COUNT * 3)
      const lives = new Float32Array(PARTICLE_COUNT)

      for (let i = 0; i < PARTICLE_COUNT; i += 1) positions[i * 3 + 1] = DEAD_Y

      const particleGeometry = new THREE.BufferGeometry()
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: '#ffc24b',
          size: 0.07,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      scene.add(particles)

      /**
       * Cho song toi da `limit` hat DANG TAT, ban len tu vien buc.
       *
       * Chi dung lai hat da tat chu khong reset ca mang: an mung keo dai 6,5s ma hat
       * chi song 1,8s, nen moi khung hinh phai bu them vai hat cho voi phun lien tuc.
       * Reset ca mang se lam nhung hat dang bay giua chung bi keo tut ve chan tuong.
       */
      const emitParticles = (limit) => {
        let emitted = 0
        for (let i = 0; i < PARTICLE_COUNT && emitted < limit; i += 1) {
          if (lives[i] > 0) continue
          emitted += 1

          const angle = Math.random() * Math.PI * 2
          const radius = 0.3 + Math.random() * 1.2
          positions[i * 3] = Math.cos(angle) * radius
          positions[i * 3 + 1] = BASE_TOP_Y
          positions[i * 3 + 2] = Math.sin(angle) * radius

          velocities[i * 3] = Math.cos(angle) * (0.4 + Math.random() * 0.9)
          velocities[i * 3 + 1] = 2.6 + Math.random() * 2.6
          velocities[i * 3 + 2] = Math.sin(angle) * (0.4 + Math.random() * 0.9)

          lives[i] = PARTICLE_LIFE_S
        }
        particleGeometry.attributes.position.needsUpdate = true
      }

      /* ===== Khoi san khau (chi dung trong man mo pack) ===== */

      /*
       * Hat khoi can vien MEM, khong phai o vuong. PointsMaterial khong co san
       * hinh tron nao nen tu ve mot vet mo bang canvas roi dung lam texture -
       * re hon nhieu so voi keo them mot file anh ve.
       */
      const smokeCanvas = document.createElement('canvas')
      smokeCanvas.width = 64
      smokeCanvas.height = 64
      const sctx = smokeCanvas.getContext('2d')
      const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, 'rgba(255,255,255,0.85)')
      grad.addColorStop(0.45, 'rgba(255,255,255,0.28)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      sctx.fillStyle = grad
      sctx.fillRect(0, 0, 64, 64)

      const SMOKE_COUNT = 90
      const smokePositions = new Float32Array(SMOKE_COUNT * 3)
      const smokeVelocities = new Float32Array(SMOKE_COUNT * 3)
      for (let i = 0; i < SMOKE_COUNT; i += 1) smokePositions[i * 3 + 1] = DEAD_Y

      const smokeGeometry = new THREE.BufferGeometry()
      smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3))

      const smokeMaterial = new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(smokeCanvas),
        color: '#dfe8e2',
        size: 1.5,
        transparent: true,
        opacity: 0,
        depthWrite: false, // khong thi cac hat khoi cat nhau thanh vien cung
      })
      const smoke = new THREE.Points(smokeGeometry, smokeMaterial)
      scene.add(smoke)

      /** Phun khoi la la quanh chan buc, toa ra ngoai va boc len rat cham. */
      const burstSmoke = () => {
        for (let i = 0; i < SMOKE_COUNT; i += 1) {
          const angle = Math.random() * Math.PI * 2
          const radius = 0.2 + Math.random() * 1.5
          smokePositions[i * 3] = Math.cos(angle) * radius
          smokePositions[i * 3 + 1] = BASE_TOP_Y - 0.1 + Math.random() * 0.4
          smokePositions[i * 3 + 2] = Math.sin(angle) * radius

          smokeVelocities[i * 3] = Math.cos(angle) * (0.25 + Math.random() * 0.5)
          smokeVelocities[i * 3 + 1] = 0.15 + Math.random() * 0.35
          smokeVelocities[i * 3 + 2] = Math.sin(angle) * (0.25 + Math.random() * 0.5)
        }
        smokeGeometry.attributes.position.needsUpdate = true
      }

      // Xoay cả nhóm thay vì xoay model, để tâm xoay luôn nằm giữa bục
      const holder = new THREE.Group()
      scene.add(holder)

      let cancelled = false
      let mixer = null
      let controls = null
      const clock = new THREE.Clock()

      /**
       * Căn model vào giữa khung và đặt CHÂN lên mặt bục.
       *
       * Trục Y phải bám theo ĐÁY hộp bao (box.min.y), không phải tâm — lấy tâm thì tượng
       * bị hạ xuống thêm nửa chiều cao và chìm nghỉm vào bục.
       * Riêng X/Z vẫn dùng tâm, để tượng đứng chính giữa bục.
       */
      const fitToStage = (model) => {
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const scale = TARGET_HEIGHT / Math.max(size.y, 0.0001)
        model.scale.setScalar(scale)
        model.position.set(
          -center.x * scale,
          BASE_TOP_Y - box.min.y * scale,
          -center.z * scale,
        )
      }

      /** Không có file .glb -> dựng tượng vàng bằng khối hình học cho đỡ trống. */
      const buildFallbackStatue = () => {
        const gold = new THREE.MeshStandardMaterial({
          color: '#d9a441',
          roughness: 0.35,
          metalness: 0.75,
        })
        const figure = new THREE.Group()

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), gold)
        head.position.y = 1.55
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.8, 6, 16), gold)
        torso.position.y = 0.72
        figure.add(head, torso)

        for (const side of [-1, 1]) {
          const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.68, 4, 12), gold)
          arm.position.set(side * 0.5, 0.78, 0)
          arm.rotation.z = side * 0.42
          const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.78, 4, 12), gold)
          leg.position.set(side * 0.2, -0.35, 0)
          figure.add(arm, leg)
        }

        // Dung chung cach can voi model that -> chan cung dung dung tren mat buc
        fitToStage(figure)
        holder.add(figure)
      }

      // Điều khiển xoay/zoom bằng chuột và cảm ứng
      import('three/examples/jsm/controls/OrbitControls.js')
        .then(({ OrbitControls }) => {
          if (cancelled) return
          controls = new OrbitControls(camera, renderer.domElement)
          controls.enablePan = false
          controls.enableDamping = true
          controls.dampingFactor = 0.08
          controls.minDistance = 3.5
          controls.maxDistance = 9
          // Chặn xoay xuống dưới mặt bục cho đỡ kỳ
          controls.maxPolarAngle = Math.PI / 1.9
          controls.target.set(0, STATUE_CENTER_Y, 0) // xoay quanh tam tuong, khong phai goc toa do
        })
        .catch(() => {})

      /*
       * File .glb da duoc nen bang gltfpack (EXT_meshopt_compression) de giam 14MB -> 8MB.
       * GLTFLoader KHONG tu giai nen duoc chuan nay, phai nap them MeshoptDecoder -
       * thieu no thi file tai ve binh thuong nhung parse loi, ra dung canh "khong xem duoc".
       * Decoder nho (~30KB) va cung nam o chunk rieng.
       */
      Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      ])
        .then(([{ GLTFLoader }, { MeshoptDecoder }]) => {
          if (cancelled) return
          const loader = new GLTFLoader()
          loader.setMeshoptDecoder(MeshoptDecoder)
          loader.load(
            MODEL_URL,
            (gltf) => {
              if (cancelled) return
              fitToStage(gltf.scene)
              holder.add(gltf.scene)

              if (gltf.animations?.length) {
                mixer = new THREE.AnimationMixer(gltf.scene)
                gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
                setHasAnimation(true)
              }
              setStatus('ready')
            },
            undefined,
            () => {
              if (cancelled) return
              buildFallbackStatue()
              setStatus('fallback')
            },
          )
        })
        .catch(() => {
          if (cancelled) return
          buildFallbackStatue()
          setStatus('fallback')
        })

      let wasCelebrating = false

      // Trang thai man mo pack, song giua cac khung hinh
      let lightFactor = 1 // he so lam mo den, 1 = binh thuong
      let revealScale = 1 // co tuong, 0 = an han
      let smokeFired = false
      let burstFired = false

      return {
        camera,
        onFrame: () => {
          const delta = clock.getDelta()
          const now = performance.now()
          const ctrl = controlRef.current
          const celebrating = now < ctrl.celebrateUntil

          if (mixer && ctrl.playing) mixer.update(delta)

          /*
           * An mung dai 6,5s nen phai CHIA MAN chu khong quay tit deu tu dau chi cuoi -
           * xoay 14 vong lien tuc thi chong mat va het hap dan tu giay thu hai.
           *
           *   0,0 - 1,6s : nay len + quay nhanh   (cu an mung)
           *   1,6 - 6,5s : ha dan ve quay cham    (trung bay tuong)
           */
          const elapsed = celebrating ? (ctrl.celebrateMs - (ctrl.celebrateUntil - now)) / 1000 : 0

          /*
           * ===== MAN MO THE PACK =====
           *
           * Moc thoi gian tinh tu luc bam (giay):
           *   0,00 - 0,45  den tat dan, tuong thu nho ve 0
           *   0,45 - 0,60  toi hoan toan, khoi bat dau phun
           *   0,60         CHOP: den bung, phao hoa no, tuong bat dau lon ra
           *   0,60 - 1,40  tuong bung len theo ham nhun (vot qua 1 roi tra ve)
           *   1,40 - 2,60  khoi tan, den ve binh thuong
           */
          const revealT = ctrl.revealStart > 0 ? (now - ctrl.revealStart) / 1000 : -1
          const inReveal = revealT >= 0 && revealT < REVEAL_TOTAL_S

          if (inReveal) {
            if (revealT < REVEAL_FLASH_S) {
              // Giai doan toi: den tut xuong, tuong co lai
              const k = revealT / REVEAL_FLASH_S
              lightFactor = Math.max(0.06, 1 - k * 1.6)
              revealScale = Math.max(0, 1 - k * 2.2)
              if (!smokeFired && revealT > 0.3) {
                burstSmoke()
                smokeFired = true
              }
            } else {
              // Sau chop: tuong bung ra, den sang tro lai
              const k = Math.min(1, (revealT - REVEAL_FLASH_S) / 0.8)
              lightFactor = 0.06 + (1 - 0.06) * k
              // Nhun qua 1 roi tra ve -> cam giac "bat" ra khoi goi
              revealScale = 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k)
              if (k >= 1) revealScale = 1
              if (!burstFired) {
                emitParticles(PARTICLE_COUNT)
                burstFired = true
              }
            }
          } else if (ctrl.revealStart > 0) {
            // Man vua ket thuc -> tra moi thu ve mac dinh dung MOT lan
            ctrl.revealStart = 0
            lightFactor = 1
            revealScale = 1
            smokeFired = false
            burstFired = false
          }

          for (const [light, baseIntensity] of BASE_LIGHTS) {
            light.intensity = baseIntensity * lightFactor
          }
          holder.scale.setScalar(revealScale)

          // Khoi: boc len, toa ra, mo dan roi tan han
          if (smokeFired) {
            const fade = Math.max(0, 1 - Math.max(0, revealT - 0.45) / 2.0)
            smokeMaterial.opacity = 0.5 * fade
            for (let i = 0; i < SMOKE_COUNT; i += 1) {
              smokePositions[i * 3] += smokeVelocities[i * 3] * delta
              smokePositions[i * 3 + 1] += smokeVelocities[i * 3 + 1] * delta
              smokePositions[i * 3 + 2] += smokeVelocities[i * 3 + 2] * delta
            }
            smokeGeometry.attributes.position.needsUpdate = true
          } else if (smokeMaterial.opacity !== 0) {
            smokeMaterial.opacity = 0
          }

          /*
           * Nhan voi delta -> toc do tinh theo GIAY THAT, khong theo khung hinh.
           * Cong thang mot so co dinh moi khung se lam man 144Hz quay nhanh gap 2,4
           * lan man 60Hz, va chay giat moi khi trinh duyet rot khung.
           */
          const spin = celebrating
            ? SPIN_REST + (SPIN_PEAK - SPIN_REST) * Math.exp(-elapsed / SPIN_DECAY_S)
            : SPIN_IDLE
          holder.rotation.y += spin * delta

          const bounceLeft = Math.max(0, 1 - elapsed / 1.6)
          holder.position.y = celebrating
            ? Math.abs(Math.sin(now / 120)) * 0.32 * bounceLeft
            : 0

          /*
           * Den roi. Ngay sau CHOP thi doi len gap boi cho ra "hao quang", roi tat dan.
           * Man reveal duoc uu tien hon an mung vi no ngan va la tam diem.
           */
          const flashAge = inReveal ? revealT - REVEAL_FLASH_S : -1
          if (flashAge >= 0) {
            spot.intensity = 260 * Math.max(0, 1 - flashAge / 1.1)
          } else {
            spot.intensity = celebrating ? 90 : 0
          }

          // Vong neon quay deu, an mung thi sang bung, luc toi thi tat theo den
          neonRing.rotation.z += delta * 0.6
          const neonBase = celebrating ? 0.9 : 0.45 + Math.sin(now / 700) * 0.12
          neonMaterial.opacity = neonBase * lightFactor

          // Luong den pha day len luc an mung, ngay thuong chi hu hu
          const beamBase = celebrating ? 0.17 : 0.06
          beam.material.opacity = flashAge >= 0
            ? Math.max(beamBase, 0.4 * Math.max(0, 1 - flashAge / 1.1))
            : beamBase * lightFactor

          /*
           * Suon len: ban mot loat that day. Sau do moi khung hinh bu them vai hat
           * de voi phun chay suot man an mung thay vi tat ngum sau 1,8s.
           */
          if (celebrating) emitParticles(wasCelebrating ? 8 : PARTICLE_COUNT)
          wasCelebrating = celebrating

          // Hat bay: van toc + trong luc, het tuoi thi day ra ngoai khung
          let anyAlive = false
          for (let i = 0; i < PARTICLE_COUNT; i += 1) {
            if (lives[i] <= 0) continue
            anyAlive = true
            lives[i] -= delta

            if (lives[i] <= 0) {
              positions[i * 3 + 1] = DEAD_Y
              continue
            }

            velocities[i * 3 + 1] -= 5.2 * delta // trong luc, nhe hon that cho hat bay lau
            positions[i * 3] += velocities[i * 3] * delta
            positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
            positions[i * 3 + 2] += velocities[i * 3 + 2] * delta
          }
          if (anyAlive) particleGeometry.attributes.position.needsUpdate = true

          controls?.update()
        },
        dispose: () => {
          cancelled = true
          mixer?.stopAllAction()
          controls?.dispose()
        },
      }
    },
  })

  if (failed) return null

  return (
    <div className={`ft-statue-card ${className}`}>
      <div ref={boxRef} className="ft-statue3d" style={{ height }}>
        <div ref={mountRef} className="ft-statue3d-canvas" aria-hidden="true" />

        {/* Chi hien khi mo hinh da len - the vang tren nen trong lam luc dang tai trong ky */}
        {status !== 'loading' && <FutCard lang={lang} />}

        {/*
          Man toi + chop sang de o lop HTML chu khong ve trong 3D: mot lop phu CSS
          re hon nhieu so voi dung post-processing cua three, ma hieu qua nhin nhu nhau.
        */}
        {revealing && <div className="ft-reveal-veil" aria-hidden="true" />}

        {status === 'loading' && (
          <div className="ft-statue-loading">
            <span className="ft-statue-spinner" aria-hidden="true" />
            <span>{t('statue_loading')}</span>
          </div>
        )}
      </div>

      <div className="ft-statue-bar">
        <button className="btn btn-sm btn-primary fw-semibold" onClick={celebrate}>
          {t('statue_celebrate')}
        </button>

        {canReveal && (
          <button
            className="btn btn-sm btn-outline-warning fw-semibold"
            onClick={openPack}
            disabled={revealing}
          >
            {t('statue_open_pack')}
          </button>
        )}

        {hasAnimation && (
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setPlaying((v) => !v)}>
            {playing ? t('statue_pause') : t('statue_play')}
          </button>
        )}

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={toggleMuted}
          title={muted ? t('statue_sound_on') : t('statue_sound_off')}
          aria-pressed={!muted}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        <span className="ft-statue-hint">
          {status === 'fallback' ? t('statue_missing_file') : t('statue_drag_hint')}
        </span>
      </div>
    </div>
  )
}
