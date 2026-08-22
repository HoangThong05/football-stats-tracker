/**
 * Anh dai dien bang chu cai dau cua ten.
 *
 * Khong dung anh that: se phai them cho luu tru, cho nguoi dung tai len, xu ly anh
 * hong/thieu... trong khi mot vong tron co mau da du de phan biet nguoi trong danh sach.
 *
 * Mau suy ra TU TEN nen mot nguoi luon co dung mot mau o moi cho - nho vay mat nhan ra
 * nguoi quen truoc ca khi doc ten.
 */
export default function Avatar({ name, size = 36 }) {
  const label = (name || '?').trim().charAt(0).toUpperCase()

  // Bam ten thanh mot so, roi lay so do lam goc mau
  let hash = 0
  for (let i = 0; i < (name || '').length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360
  }

  return (
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
