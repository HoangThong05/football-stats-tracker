import { isVideoUrl } from '../utils'

/**
 * Lop anh/video bia lap day khung .ft-profile-cover. Dung chung o Ho so (co the chinh)
 * va Ho so cong khai (chi doc).
 *
 * Vi tri + zoom: object-fit cover phu khung; object-position (x%, y%) chon phan hien;
 * transform scale(zoom) phong to, transform-origin trung tiêu diem de zoom quanh do.
 * Video: tu phat, tat tieng, lap. Khong co url -> khong ve gi (khung tu ve vach san co).
 */
export default function CoverMedia({ url, x = 50, y = 50, zoom = 100 }) {
  if (!url) return null

  const style = {
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${zoom / 100})`,
    transformOrigin: `${x}% ${y}%`,
  }

  if (isVideoUrl(url)) {
    return <video className="ft-cover-media-el" src={url} autoPlay muted loop playsInline style={style} />
  }
  return <img className="ft-cover-media-el" src={url} alt="" style={style} />
}
