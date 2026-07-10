import { useTranslation } from '../i18n'

export default function Loading({ rows = 6 }) {
  const { t } = useTranslation()

  return (
    <div className="ft-card p-3" aria-busy="true">
      <span className="visually-hidden">{t('loading')}</span>
      <div className="d-flex flex-column gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="ft-skeleton-row" style={{ animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
    </div>
  )
}
