import { useTranslation } from '../i18n'

/** "W,D,L,W,W" -> mang ky tu, bo qua gia tri la. Tra ve [] neu chua co du lieu. */
export function parseForm(form) {
  if (!form) return []
  return form
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s === 'W' || s === 'D' || s === 'L')
    .slice(-5)
}

/** Chuoi 5 tran gan nhat, cu -> moi. Mau la phu tro; chu cai ben trong moi la thong tin chinh. */
export default function FormDots({ form }) {
  const { t } = useTranslation()
  const results = parseForm(form)
  if (results.length === 0) return <span className="text-secondary">–</span>

  const label = { W: t('standings_form_win'), D: t('standings_form_draw'), L: t('standings_form_loss') }

  return (
    <span className="ft-form" role="img" aria-label={results.map((r) => label[r]).join(', ')}>
      {results.map((r, i) => (
        <span key={i} className={`ft-form-dot ft-form-${r.toLowerCase()}`} title={label[r]}>
          {label[r].charAt(0)}
        </span>
      ))}
    </span>
  )
}
