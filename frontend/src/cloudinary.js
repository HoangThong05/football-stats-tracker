/*
 * Tai anh THANG len Cloudinary tu trinh duyet, khong di qua backend.
 *
 * Vi sao khong qua backend: may chu Render goi free co o dia tam va bang thong hep -
 * de file di qua no vua cham vua vo ich, vi anh cuoi cung van nam o Cloudinary.
 *
 * Cloud name va upload preset KHONG phai bi mat: chung nhung thang trong ma nguon trang
 * web, ai xem cung thay. Cai phai giu kin la API Secret, va luong nay khong dung den no.
 */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'football-forum'

/** Chua cau hinh thi frontend an nut chon anh di, thay vi hien roi bam vao mo ra loi. */
export function imageUploadEnabled() {
  return Boolean(CLOUD_NAME)
}

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Video cho dien dan: nang hon anh nen tran rong hon, nhung van chan de khong "chay"
// quota free cua Cloudinary va khong bat nguoi dung ngoi cho upload file khong lo.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime']

/**
 * @returns {Promise<string>} duong dan https cua anh da tai len
 * @throws {Error} ma loi de noi goi tu dich sang tieng nguoi dung
 */
export async function uploadImage(file) {
  if (!imageUploadEnabled()) {
    throw new Error('image_upload_disabled')
  }
  /*
   * Kiem tra ngay o day thay vi de Cloudinary tu choi: nguoi dung biet loi TRUOC khi
   * ngoi cho tai xong mot file 50MB, va minh khong ton bang thong vo ich.
   */
  if (!ALLOWED.includes(file.type)) {
    throw new Error('image_type_invalid')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('image_too_large')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    throw new Error('image_upload_failed')
  }
  const data = await res.json()
  return data.secure_url
}

/**
 * Tai ANH HOAC VIDEO len cho bai viet dien dan.
 *
 * Dung endpoint /auto/ de Cloudinary tu nhan dien la anh hay video; URL tra ve chua
 * '/video/upload/' neu la video, frontend dua vao do de render <video> thay vi <img>.
 * (Preset tren Cloudinary phai dat Resource type = Auto thi video moi duoc nhan.)
 *
 * @returns {Promise<string>} duong dan https cua tep da tai len
 * @throws {Error} ma loi de noi goi tu dich sang tieng nguoi dung
 */
export async function uploadMedia(file) {
  if (!imageUploadEnabled()) {
    throw new Error('image_upload_disabled')
  }
  const isImage = ALLOWED.includes(file.type)
  const isVideo = ALLOWED_VIDEO.includes(file.type)
  if (!isImage && !isVideo) {
    throw new Error('media_type_invalid')
  }
  // Kiem tra kich thuoc TRUOC khi tai, moi loai mot tran rieng
  if (isImage && file.size > MAX_BYTES) {
    throw new Error('image_too_large')
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error('video_too_large')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    throw new Error('image_upload_failed')
  }
  const data = await res.json()
  return data.secure_url
}

/**
 * Tai mot anh/GIF tu URL ben ngoai (vd GIF cua Giphy) LEN Cloudinary, tra ve URL Cloudinary.
 *
 * Cloudinary tu di lay tep tu URL do (khong can trinh duyet tai ve truoc). Nho vay du
 * chon GIF tu Giphy, thu cuoi cung luu van la URL Cloudinary - giu nguyen tac backend
 * chi nhan res.cloudinary.com.
 */
export async function uploadFromUrl(remoteUrl) {
  if (!imageUploadEnabled()) {
    throw new Error('image_upload_disabled')
  }
  const form = new FormData()
  form.append('file', remoteUrl)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    throw new Error('image_upload_failed')
  }
  const data = await res.json()
  return data.secure_url
}
