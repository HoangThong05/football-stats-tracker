import { useEffect, useRef, useState } from 'react'

/**
 * Nên tải Three.js (~130KB gzip) hay bỏ qua cho nhẹ?
 * Bỏ khi người dùng đang tiết kiệm dữ liệu, mạng 2G, hoặc máy ít RAM — những lúc mà
 * 130KB cho một hình trang trí là không đáng.
 */
export function shouldLoad3D() {
  const net = navigator.connection
  if (net?.saveData) return false
  if (net?.effectiveType && /(^|-)2g$/.test(net.effectiveType)) return false
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) return false
  return true
}

/**
 * Phần khung xương dùng chung cho mọi cảnh 3D trong app: nạp Three.js theo kiểu tách
 * chunk, dựng renderer, chạy vòng vẽ, và quan trọng nhất là DỪNG vẽ khi không cần —
 * tab bị ẩn, cảnh cuộn khỏi màn hình, hoặc người dùng bật "giảm chuyển động".
 *
 * `build(THREE, ctx)` dựng nội dung cảnh và trả về `{ camera, onFrame }`.
 * Geometry/material được dọn tự động khi unmount nên nơi gọi không phải nhớ.
 *
 * @returns {{ mountRef: object, failed: boolean }} failed = không dựng được -> nơi gọi tự lo phương án thay thế.
 */
export function useThreeScene({ width, height, build, alpha = true }) {
  const mountRef = useRef(null)
  const buildRef = useRef(build)
  buildRef.current = build

  const [failed, setFailed] = useState(!shouldLoad3D())

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || failed || !width || !height) return undefined

    let disposed = false
    let cleanup = () => {}

    // Lấy đúng những lớp đang dùng thay vì `import * as THREE`: nhập cả namespace sẽ
    // chặn tree-shaking và làm chunk three phình từ ~130KB lên ~190KB gzip.
    // Thêm lớp mới ở đây khi cảnh 3D cần tới.
    import('three')
      .then(({
        Scene,
        WebGLRenderer,
        PerspectiveCamera,
        OrthographicCamera,
        Mesh,
        MeshStandardMaterial,
        MeshBasicMaterial,
        IcosahedronGeometry,
        PlaneGeometry,
        CylinderGeometry,
        SphereGeometry,
        CapsuleGeometry,
        RingGeometry,
        CircleGeometry,
        ConeGeometry,
        AmbientLight,
        DirectionalLight,
        SpotLight,
        BufferAttribute,
        BufferGeometry,
        Points,
        PointsMaterial,
        AdditiveBlending,
        DoubleSide,
        CanvasTexture,
        AnimationMixer,
        Group,
        Box3,
        Clock,
        Vector3,
        Color,
        SRGBColorSpace,
      }) => {
        if (disposed) return

        /*
         * PHAI GIU KHOP VOI DANH SACH DESTRUCTURE O TREN.
         *
         * Them ten o tren ma quen them o day thi KHONG co loi bien dich: thuoc tinh
         * chi la undefined, den luc `new THREE.CaiGiDo()` moi nem loi - ma cho nem lai
         * nam trong .then(), bi .catch() ben duoi nuot mat va chuyen sang failed=true.
         * Ket qua: ca canh 3D lang le bien mat, khong mot dong log. Da dinh dung bay nay.
         */
        const THREE = {
          Scene,
          WebGLRenderer,
          PerspectiveCamera,
          OrthographicCamera,
          Mesh,
          MeshStandardMaterial,
          MeshBasicMaterial,
          IcosahedronGeometry,
          PlaneGeometry,
          CylinderGeometry,
          SphereGeometry,
          CapsuleGeometry,
          RingGeometry,
          CircleGeometry,
          ConeGeometry,
          AmbientLight,
          DirectionalLight,
          SpotLight,
          BufferAttribute,
          BufferGeometry,
          Points,
          PointsMaterial,
          AdditiveBlending,
          DoubleSide,
          CanvasTexture,
          AnimationMixer,
          Group,
          Box3,
          Clock,
          Vector3,
          Color,
          SRGBColorSpace,
        }

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha })
        // setPixelRatio phải gọi TRƯỚC setSize (setSize dùng tỉ lệ này để tính buffer).
        // Màn Retina có devicePixelRatio 3-4: chặn ở 2 để không vẽ thừa pixel.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(width, height)
        mount.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const built = buildRef.current(THREE, { scene, renderer, width, height })
        const camera = built.camera
        const onFrame = built.onFrame
        // Canh tu don dep rieng cua tung canh (huy tai nguyen dang nap do, go control...)
        const disposeScene = built.dispose

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        let frame = 0
        let tabVisible = true
        let onScreen = true

        const stop = () => {
          if (frame) cancelAnimationFrame(frame)
          frame = 0
        }

        const loop = (time) => {
          if (onFrame) onFrame(time)
          renderer.render(scene, camera)
          frame = requestAnimationFrame(loop)
        }

        const start = () => {
          if (!frame && tabVisible && onScreen && !reduceMotion) frame = requestAnimationFrame(loop)
        }

        if (reduceMotion) {
          renderer.render(scene, camera) // 1 khung hình tĩnh, không chạy vòng lặp
        } else {
          start()
        }

        const onVisibility = () => {
          tabVisible = !document.hidden
          if (tabVisible) start()
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
          disposeScene?.()
          document.removeEventListener('visibilitychange', onVisibility)
          observer.disconnect()
          scene.traverse((obj) => {
            obj.geometry?.dispose()
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
            mats.forEach((m) => {
              m?.map?.dispose()
              m?.dispose?.()
            })
          })
          renderer.dispose() // trả lại WebGL context, tránh rò rỉ
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement)
          }
        }
      })
      .catch(() => {
        // Máy không hỗ trợ WebGL / tải chunk lỗi -> báo để nơi gọi hiện phương án thay thế
        if (!disposed) setFailed(true)
      })

    return () => {
      disposed = true
      cleanup()
    }
  }, [width, height, failed, alpha])

  return { mountRef, failed }
}
