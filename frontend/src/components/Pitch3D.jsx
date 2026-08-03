import { useEffect, useRef, useState } from 'react'
import { useThreeScene } from '../useThreeScene'

// Tỉ lệ sân thật 105 x 68 m, quy về đơn vị 10m cho gọn
const PITCH_L = 10.5
const PITCH_W = 6.8

/**
 * Vẽ toàn bộ mặt cỏ (sọc cắt cỏ + mọi vạch kẻ) vào MỘT texture canvas 2D.
 *
 * Làm cách này thay vì dựng hàng chục mesh cho từng vạch: chỉ tốn 1 mặt phẳng duy nhất,
 * vạch luôn sắc nét, và đổi bố cục sân chỉ là sửa vài dòng vẽ 2D.
 */
function createPitchTexture(THREE) {
  const scale = 100 // px trên mỗi đơn vị
  const canvas = document.createElement('canvas')
  canvas.width = PITCH_L * scale
  canvas.height = PITCH_W * scale
  const ctx = canvas.getContext('2d')

  const W = canvas.width
  const H = canvas.height

  // Sọc cắt cỏ chạy dọc sân
  const stripes = 12
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1f6b40' : '#1a5c37'
    ctx.fillRect((i * W) / stripes, 0, W / stripes + 1, H)
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.82)'
  ctx.lineWidth = 4
  const m = 0.35 * scale // lề trong sân

  const line = (x, y, w, h) => ctx.strokeRect(x, y, w, h)

  line(m, m, W - m * 2, H - m * 2) // đường biên

  // Vạch giữa + vòng tròn giữa (bán kính thật 9.15m)
  ctx.beginPath()
  ctx.moveTo(W / 2, m)
  ctx.lineTo(W / 2, H - m)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, 0.915 * scale, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, 6, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.fill()

  // Vòng cấm (16.5 x 40.3m) và vòng 5m50 (5.5 x 18.3m) ở hai đầu
  const boxD = 1.65 * scale
  const boxW = 4.03 * scale
  const sixD = 0.55 * scale
  const sixW = 1.83 * scale

  for (const side of [0, 1]) {
    const x = side === 0 ? m : W - m - boxD
    const xs = side === 0 ? m : W - m - sixD
    line(x, (H - boxW) / 2, boxD, boxW)
    line(xs, (H - sixW) / 2, sixD, sixW)

    // Chấm phạt đền (11m tính từ vạch vôi)
    const px = side === 0 ? m + 1.1 * scale : W - m - 1.1 * scale
    ctx.beginPath()
    ctx.arc(px, H / 2, 5, 0, Math.PI * 2)
    ctx.fill()

    // Cung tròn ngoài vòng cấm
    ctx.beginPath()
    ctx.arc(px, H / 2, 0.915 * scale, side === 0 ? -0.9 : Math.PI - 0.9, side === 0 ? 0.9 : Math.PI + 0.9)
    ctx.stroke()
  }

  // Cung phạt góc
  const r = 0.1 * scale
  const corners = [
    [m, m, 0, Math.PI / 2],
    [W - m, m, Math.PI / 2, Math.PI],
    [W - m, H - m, Math.PI, Math.PI * 1.5],
    [m, H - m, Math.PI * 1.5, Math.PI * 2],
  ]
  for (const [cx, cy, a0, a1] of corners) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, a0, a1)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 8
  if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Khung thành đơn giản: 2 cột + xà ngang, đúng tỉ lệ 7.32 x 2.44 m. */
function addGoal(THREE, scene, side) {
  const postR = 0.035
  const goalW = 0.732
  const goalH = 0.244
  const x = side * (PITCH_L / 2)
  const material = new THREE.MeshStandardMaterial({ color: '#f2f5f1', roughness: 0.5 })

  const post = new THREE.CylinderGeometry(postR, postR, goalH, 8)
  for (const z of [-goalW / 2, goalW / 2]) {
    const mesh = new THREE.Mesh(post, material)
    mesh.position.set(x, goalH / 2, z)
    scene.add(mesh)
  }

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, goalW, 8), material)
  bar.rotation.x = Math.PI / 2
  bar.position.set(x, goalH, 0)
  scene.add(bar)
}

/**
 * Sân bóng 3D nhìn kiểu isometric (chiếu đẳng cự).
 *
 * Dùng camera TRỰC GIAO (orthographic) chứ không phải phối cảnh — đó mới đúng chất
 * isometric của Football Manager/FIFA: vật ở xa không bị thu nhỏ, các đường song song
 * vẫn song song.
 *
 * Không vẽ chữ/logo trong 3D: phần đó để HTML phủ lên trên cho sắc nét và tránh
 * rắc rối CORS khi nạp ảnh logo từ máy chủ khác.
 */
export default function Pitch3D({ height = 200, className = '', children }) {
  const boxRef = useRef(null)
  const [width, setWidth] = useState(0)

  // Sân co giãn theo bề ngang khung chứa -> cần biết bề ngang thật để dựng canvas
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const apply = () => setWidth(Math.round(el.getBoundingClientRect().width))
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { mountRef, failed } = useThreeScene({
    width,
    height,
    build: (THREE, { scene, width: w, height: h }) => {
      const aspect = w / h

      // Khung nhìn phải bao trọn sân ở CẢ hai chiều, dù khung chứa rất rộng (hero)
      // hay hẹp (điện thoại dọc) -> lấy giá trị lớn hơn giữa 2 ràng buộc.
      const halfH = Math.max(4.3, 7.4 / aspect)
      const halfW = halfH * aspect
      const camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 100)
      // Nghiêng ~38° từ trên xuống, lệch ngang cho ra góc đẳng cự
      camera.position.set(5.5, 7.5, 8)
      camera.lookAt(0, 0, 0)

      const pitch = new THREE.Mesh(
        new THREE.PlaneGeometry(PITCH_L, PITCH_W),
        new THREE.MeshStandardMaterial({ map: createPitchTexture(THREE), roughness: 0.95 }),
      )
      pitch.rotation.x = -Math.PI / 2
      scene.add(pitch)

      addGoal(THREE, scene, -1)
      addGoal(THREE, scene, 1)

      scene.add(new THREE.AmbientLight(0xffffff, 1.5))
      const key = new THREE.DirectionalLight(0xffd9a0, 2.2) // đèn pha ngả vàng
      key.position.set(4, 8, 5)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0x9fe0bb, 0.8)
      fill.position.set(-5, 3, -4)
      scene.add(fill)

      // Đung đưa cực chậm quanh trục đứng: đủ để thấy là 3D, không gây rối mắt
      return {
        camera,
        onFrame: (time) => {
          scene.rotation.y = Math.sin(time / 9000) * 0.08
        },
      }
    },
  })

  return (
    <div ref={boxRef} className={`ft-pitch3d ${className}`} style={{ height }}>
      {!failed && <div ref={mountRef} className="ft-pitch3d-canvas" aria-hidden="true" />}
      {children && <div className="ft-pitch3d-overlay">{children}</div>}
    </div>
  )
}
