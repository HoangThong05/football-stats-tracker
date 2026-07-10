import { useTranslation } from '../i18n'

export default function FavoritesList({ favorites, onSelectTeam, onBack }) {
  const { t } = useTranslation()

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <h3 className="h5 mb-3">{t('fav_title')}</h3>

      {favorites.length === 0 ? (
        <div className="alert alert-secondary">{t('fav_empty')}</div>
      ) : (
        <div className="ft-card">
          <ul className="list-group list-group-flush ft-stagger">
            {favorites.map((f) => (
              <li
                key={f.teamId}
                className="list-group-item d-flex align-items-center gap-3 py-3"
                role="button"
                onClick={() => onSelectTeam(f.teamId)}
              >
                {f.teamCrest && <img src={f.teamCrest} alt="" width="28" height="28" loading="lazy" />}
                <span className="fw-medium">{f.teamName}</span>
                <span className="ms-auto text-secondary">›</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
