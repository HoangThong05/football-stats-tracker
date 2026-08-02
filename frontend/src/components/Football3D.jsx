import { useEffect, useRef, useState } from 'react'

/**
 * Nên tải Three.js (~130KB gzip) hay dùng emoji cho nhẹ?
 * Bỏ qua khi người dùng đang tiết kiệm dữ liệu, mạng quá chậm, hoặc máy ít RAM —
 * những trường hợp mà 130KB cho một hình trang trí là không đáng.
 */
function shouldLoad3D() {
  const net = navigator.connection
  if (net?.saveData) return false
  if (net?.effectiveType && /(^|-)2g$/.test(net.effectiveType)) return false
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) return false
  return true
}

/**
 * Quả bóng đá 3D (WebGL), tự lùi về emoji ⚽ khi không tải/không vẽ được.
 *
 * Three.js được nạp bằng dynamic import nên nằm ở chunk RIÊNG — trang hiện ra trước,
 * quả bóng xuất hiện sau, không chặn lần vẽ đầu tiên.
 *
 * Để đỡ hao pin, vòng vẽ tự dừng khi: tab bị ẩn, quả bóng cuộn khỏi màn hình, hoặc
 * người dùng bật "giảm chuyển động" (khi đó chỉ vẽ đúng 1 khung hình tĩnh).
 */
export default function Football3D({ size = 42, className = '' }) {
  const mountRef = useRef(null)
  const [failed, setFailed] = useState(!shouldLoad3D())

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || failed) return undefined

    let disposed = false
    let cleanup = () => {}

    // Lay dung nhung lop can dung (thay vi `import * as THREE`) de Rollup
    // co co hoi loai bo phan three khong dung khi dong goi.
    import('three')
      .then(({
        Scene,
        PerspectiveCamera,
        WebGLRenderer,
        IcosahedronGeometry,
        MeshStandardMaterial,
        Mesh,
        AmbientLight,
        DirectionalLight,
        BufferAttribute,
        Vector3,
        Color,
      }) => {
        if (disposed) return
        const THREE = {
          Scene,
          PerspectiveCamera,
          WebGLRenderer,
          IcosahedronGeometry,
          MeshStandardMaterial,
          Mesh,
          AmbientLight,
          DirectionalLight,
          BufferAttribute,
          Vector3,
          Color,
        }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
        camera.position.z = 3.4

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        // setPixelRatio PHAI goi truoc setSize (setSize dung ty le nay de tinh buffer).
        // Man Retina co devicePixelRatio 3-4: chan o 2 de khong ve thua pixel.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(size, size) // de mac dinh updateStyle=true -> canvas dung kich thuoc CSS
        mount.appendChild(renderer.domElement)

        // --- Hình học: icosahedron detail=2 cho đúng 12 cụm ngũ giác quanh 12 đỉnh gốc,
        // --- tô đen các cụm đó => ra hoa văn quả bóng đá kinh điển.
        const geometry = new THREE.IcosahedronGeometry(1, 2)
        const position = geometry.attributes.position

        const base = new THREE.IcosahedronGeometry(1, 0)
        const basePos = base.attributes.position
        const hubs = []
        for (let i = 0; i < basePos.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(basePos, i).normalize()
          if (!hubs.some((h) => h.distanceTo(v) < 1e-6)) hubs.push(v)
        }
        base.dispose()

        const dark = new THREE.Color('#15201a')
        const light = new THREE.Color('#f7f9f6')
        const colors = new Float32Array(position.count * 3)
        const centroid = new THREE.Vector3()
        const vertex = new THREE.Vector3()

        for (let f = 0; f < position.count / 3; f++) {
          centroid.set(0, 0, 0)
          for (let k = 0; k < 3; k++) {
            centroid.add(vertex.fromBufferAttribute(position, f * 3 + k))
          }
          centroid.divideScalar(3).normalize()

          let nearest = Infinity
          for (const h of hubs) nearest = Math.min(nearest, h.distanceTo(centroid))

          const c = nearest < 0.35 ? dark : light
          for (let k = 0; k < 3; k++) {
            colors.set([c.r, c.g, c.b], (f * 3 + k) * 3)
          }
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          flatShading: true,
          roughness: 0.55,
          metalness: 0.05,
        })
        const ball = new THREE.Mesh(geometry, material)
        ball.rotation.x = 0.4
        scene.add(ball)

        // Ánh sáng ngả vàng = đèn pha sân vận động, khớp với accent của app
        scene.add(new THREE.AmbientLight(0xffffff, 1.7))
        const key = new THREE.DirectionalLight(0xffd08a, 2.6)
        key.position.set(2, 2.5, 3)
        scene.add(key)
        const rim = new THREE.DirectionalLight(0x8fd6a8, 1.2)
        rim.position.set(-2.5, -1, -2)
        scene.add(rim)

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        let frame = 0
        let visible = true
        let onScreen = true

        const stop = () => {
          if (frame) cancelAnimationFrame(frame)
          frame = 0
        }

        const loop = () => {
          ball.rotation.y += 0.006
          ball.rotation.x += 0.0015
          renderer.render(scene, camera)
          frame = requestAnimationFrame(loop)
        }

        const start = () => {
          if (!frame && visible && onScreen && !reduceMotion) loop()
        }

        if (reduceMotion) {
          renderer.render(scene, camera) // 1 khung hình tĩnh, không chạy vòng lặp
        } else {
          start()
        }

        const onVisibility = () => {
          visible = !document.hidden
          if (visible) start()
          else stop()
        }
        document.addEventListener('visibilitychange', onVisibility)

        // Cuộn khỏi màn hình -> ngừng vẽ (không nhìn thấy thì đừng tốn pin)
        const observer = new IntersectionObserver(
          ([entry]) => {
            onScreen = entry.isIntersecting
            if (onScreen) start()
            else stop()
          },
          { threshold: 0 },
        )
        observer.observe(mount)

        cleanup = () => {
          stop()
          document.removeEventListener('visibilitychange', onVisibility)
          observer.disconnect()
          geometry.dispose()
          material.dispose()
          renderer.dispose() // tra lai WebGL context, tranh ro ri
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement)
          }
        }
      })
      .catch(() => {
        // Máy không hỗ trợ WebGL / tải chunk lỗi -> quay về emoji, không để trống
        if (!disposed) setFailed(true)
      })

    return () => {
      disposed = true
      cleanup()
    }
  }, [size, failed])

  if (failed) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.8, lineHeight: 1 }}
        aria-hidden="true"
      >
        ⚽
      </span>
    )
  }

  return (
    <span
      ref={mountRef}
      className={className}
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
      aria-hidden="true"
    />
  )
}
