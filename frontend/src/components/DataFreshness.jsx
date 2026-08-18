import { useTranslation } from '../i18n'

/**
 * Dong nho "Cap nhat luc HH:mm" duoi noi dung.
 *
 * Backend cache 30 phut nen so lieu co the tre toi nua tieng. Khong noi ra thi nguoi
 * dung so ti so voi TV thay lech va tuong web hong; noi ra thi ho biet ngay ly do.
 *
 * Moc thoi gian la luc THUC SU goi nguon du lieu (backend gan vao header
 * X-Data-Fetched-At), khong phai luc trang duoc tai - hai thu nay lech nhau dung
 * bang tuoi cua cache.
 */
export default function DataFreshness({ fetchedAt }) {
  const { t, lang } = useTranslation()

  if (!fetchedAt) return null

  const at = new Date(fetchedAt)
  if (Number.isNaN(at.getTime())) return null

  const minutesAgo = Math.max(0, Math.floor((Date.now() - at.getTime()) / 60000))

  const clock = at.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <p className="ft-freshness">
      {t('freshness_updated_at')} {clock}
      {/* Duoi 1 phut thi "0 phut truoc" nghe ngo ngan, noi thang la vua xong */}
      <span className="ft-freshness-ago">
        {minutesAgo < 1
          ? ` · ${t('freshness_just_now')}`
          : ` · ${minutesAgo} ${t('freshness_minutes_ago')}`}
      </span>
    </p>
  )
}
