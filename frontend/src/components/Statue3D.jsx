import { useEffect, useRef, useState } from 'react'
import { useThreeScene } from '../useThreeScene'
import { useTranslation } from '../i18n'

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

  const celebrate = () => {
    controlRef.current.celebrateUntil = performance.now() + CELEBRATE_MS
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

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.5, BASE_HEIGHT, 48),
        new THREE.MeshStandardMaterial({ color: '#2b3a31', roughness: 0.85 }),
      )
      base.position.y = BASE_CENTER_Y
      scene.add(base)

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

      return {
        camera,
        onFrame: () => {
          const delta = clock.getDelta()
          const ctrl = controlRef.current
          const celebrating = performance.now() < ctrl.celebrateUntil

          if (mixer && ctrl.playing) mixer.update(delta)

          // Ăn mừng: quay tít + nảy lên + đèn rọi bừng sáng
          holder.rotation.y += celebrating ? 0.22 : 0.004
          holder.position.y = celebrating ? Math.abs(Math.sin(performance.now() / 90)) * 0.45 : 0
          spot.intensity = celebrating ? 90 : 0

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

        <span className="ft-statue-hint">
          {status === 'fallback' ? t('statue_missing_file') : t('statue_drag_hint')}
        </span>
      </div>
    </div>
  )
}
