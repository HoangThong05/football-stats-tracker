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

const CELEBRATE_MS = 1600

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
  const { t } = useTranslation()
  const boxRef = useRef(null)
  const [width, setWidth] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | fallback
  const [playing, setPlaying] = useState(true)
  const [hasAnimation, setHasAnimation] = useState(false)

  // Cầu nối sang vòng vẽ: đổi state React không nên chạm vào vòng lặp mỗi khung hình
  const controlRef = useRef({ playing: true, celebrateUntil: 0 })

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

  const celebrate = () => {
    controlRef.current.celebrateUntil = performance.now() + CELEBRATE_MS
    play()
  }

  const { mountRef, failed } = useThreeScene({
    width,
    height,
    build: (THREE, { scene, renderer }) => {
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
      camera.position.set(0, STATUE_CENTER_Y + 0.9, 6.2)
      camera.lookAt(0, STATUE_CENTER_Y, 0) // OrbitControls chua tai xong van ngam dung cho

      scene.add(new THREE.AmbientLight(0xffffff, 1.2))
      const key = new THREE.DirectionalLight(0xffd9a0, 2.2) // đèn pha ngả vàng
      key.position.set(3, 5, 4)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x9fe0bb, 0.9)
      rim.position.set(-4, 2, -3)
      scene.add(rim)
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
      const beams = [-1, 0, 1].map((slot) => {
        const beam = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 7, 32, 1, true),
          new THREE.MeshBasicMaterial({
            color: '#ffe6b0',
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        )
        // Non mac dinh dinh o tren, day o duoi - dung luon huong cua den roi xuong
        beam.position.set(slot * 2.2, BASE_TOP_Y + 3.5, slot * -1.2)
        scene.add(beam)
        return beam
      })

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

      /** Ban toan bo hat len tu vien buc, moi hat mot huong va mot toc do khac nhau. */
      const burstParticles = () => {
        for (let i = 0; i < PARTICLE_COUNT; i += 1) {
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

      return {
        camera,
        onFrame: () => {
          const delta = clock.getDelta()
          const now = performance.now()
          const ctrl = controlRef.current
          const celebrating = now < ctrl.celebrateUntil

          if (mixer && ctrl.playing) mixer.update(delta)

          // Ăn mừng: quay tít + nảy lên + đèn rọi bừng sáng
          holder.rotation.y += celebrating ? 0.22 : 0.004
          holder.position.y = celebrating ? Math.abs(Math.sin(now / 90)) * 0.45 : 0
          spot.intensity = celebrating ? 90 : 0

          // Vong neon quay deu, an mung thi sang bung
          neonRing.rotation.z += delta * 0.6
          neonMaterial.opacity = celebrating ? 0.9 : 0.45 + Math.sin(now / 700) * 0.12

          // Luong den pha day len luc an mung, ngay thuong chi hu hu
          for (const beam of beams) {
            beam.material.opacity = celebrating ? 0.16 : 0.05
          }

          // Bat dau an mung -> ban hat (chi ban dung mot lan o suon len)
          if (celebrating && !wasCelebrating) burstParticles()
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
        {status !== 'loading' && <FutCard />}

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
