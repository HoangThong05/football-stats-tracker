import { isVideoUrl } from '../utils'

/**
 * Lop anh/video bia lap day khung .ft-profile-cover. Dung chung o Ho so (co the chinh)
 * va Ho so cong khai (chi doc). pos = vi tri doc 0-100%.
 *
 * Video: tu phat, tat tieng, lap (kieu anh bia dong). Anh/GIF: dat lam nen.
 * Khong co url -> khong ve gi (khung tu hien vach san co mac dinh).
 */
export default function CoverMedia({ url, pos = 50 }) {
  if (!url) return null

  if (isVideoUrl(url)) {
    return (
      <video
        className="ft-cover-video"
        src={url}
        autoPlay
        muted
        loop
        playsInline
        style={{ objectPosition: `center ${pos}%` }}
      />
    )
  }

  return (
    <div
      className="ft-cover-img"
      style={{ backgroundImage: `url(${url})`, backgroundPosition: `center ${pos}%` }}
    />
  )
}
