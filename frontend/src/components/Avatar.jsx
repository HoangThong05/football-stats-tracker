import { useState } from 'react'

/**
 * Anh dai dien: anh that neu nguoi dung da tai len, khong thi ve vong tron chu cai dau.
 *
 * Mau cua vong tron suy ra TU TEN nen mot nguoi luon co dung mot mau o moi cho - nho vay
 * mat nhan ra nguoi quen truoc ca khi doc ten.
 */
export default function Avatar({ name, src, size = 36, presence }) {
  /*
   * Anh hong (link chet, Cloudinary xoa file...) thi lang le quay ve vong tron chu cai.
   * Khong co dong nay thi trinh duyet hien o anh vo - xau hon han ma khong noi len gi.
   */
  const [broken, setBroken] = useState(false)

  let inner
  if (src && !broken) {
    inner = (
      <img
        className="ft-avatar ft-avatar-img"
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    )
  } else {
    const label = (name || '?').trim().charAt(0).toUpperCase()

    // Bam ten thanh mot so, roi lay so do lam goc mau
    let hash = 0
    for (let i = 0; i < (name || '').length; i += 1) {
      hash = (hash * 31 + name.charCodeAt(i)) % 360
    }

    inner = (
      <span
        className="ft-avatar"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          // Do bao hoa vua phai de chu trang luon doc duoc tren moi goc mau
          background: `hsl(${hash}, 45%, 42%)`,
        }}
        aria-hidden="true"
      >
        {label}
      </span>
    )
  }

  // Chi boc them khung khi co trang thai (presence: 'online' | 'offline') - noi khac giu nguyen
  if (presence !== 'online' && presence !== 'offline') return inner
  return (
    <span className="ft-avatar-wrap" style={{ width: size, height: size }}>
      {inner}
      <span className={`ft-online-dot${presence === 'offline' ? ' ft-online-dot-away' : ''}`} />
    </span>
  )
}
