import { useThreeScene } from '../useThreeScene'

/**
 * Quả bóng đá 3D, tự lùi về emoji ⚽ khi không tải/không vẽ được.
 *
 * Hoa văn quả bóng không phải texture ảnh: icosahedron chia nhỏ (detail=2) tạo ra đúng
 * 12 cụm 5 mặt quanh 12 đỉnh gốc — tô đen các cụm đó là ra 12 "ngũ giác" kinh điển.
 */
export default function Football3D({ size = 42, className = '' }) {
  const { mountRef, failed } = useThreeScene({
    width: size,
    height: size,
    build: (THREE, { scene }) => {
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
      camera.position.z = 3.4

      const geometry = new THREE.IcosahedronGeometry(1, 2)
      const position = geometry.attributes.position

      // 12 đỉnh icosahedron gốc = tâm của 12 ngũ giác đen
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
        for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f * 3 + k) * 3)
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const ball = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          flatShading: true,
          roughness: 0.55,
          metalness: 0.05,
        }),
      )
      ball.rotation.x = 0.4
      scene.add(ball)

      // Ánh sáng ngả vàng = đèn pha sân vận động, khớp accent của app
      scene.add(new THREE.AmbientLight(0xffffff, 1.7))
      const key = new THREE.DirectionalLight(0xffd08a, 2.6)
      key.position.set(2, 2.5, 3)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x8fd6a8, 1.2)
      rim.position.set(-2.5, -1, -2)
      scene.add(rim)

      return {
        camera,
        onFrame: () => {
          ball.rotation.y += 0.006
          ball.rotation.x += 0.0015
        },
      }
    },
  })

  if (failed) {
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }} aria-hidden="true">
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
