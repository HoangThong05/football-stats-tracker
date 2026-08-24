import { BADGE_META } from '../constants'
import { useTranslation } from '../i18n'

/**
 * Icon huy hieu nguoi dung ghim, hien gon canh ten (ten day o tooltip).
 * Dung chung o dien dan, BXH du doan, chat phong. null/khong hop le -> khong ve gi.
 */
export default function BadgeFlair({ code }) {
  const { t } = useTranslation()
  const meta = code && BADGE_META[code]
  if (!meta) return null
  return <span className="ft-name-flair" title={t(meta.titleKey)}>{meta.icon}</span>
}
