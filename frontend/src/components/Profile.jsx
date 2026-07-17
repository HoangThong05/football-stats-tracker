import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Badges from './Badges'
import PredictionPointsChart from './PredictionPointsChart'

/**
 * Trang tong hop ca nhan: huy hieu, bieu do diem, doi yeu thich, phong Mini League.
 * Gop lai nhung gi truoc day nam rai rac o cac tab rieng (Lich su / Yeu thich / Mini League).
 */
export default function Profile({ token, userEmail, favorites, onBack, onSelectTeam, onGoToMiniLeague }) {
  const { t } = useTranslation()
  const [leagues, setLeagues] = useState([])

  useEffect(() => {
    if (!token) {
      setLeagues([])
      return
    }
    fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeagues(data))
      .catch(() => setLeagues([]))
  }, [token])

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <h3 className="h5 mb-1">{t('profile_title')}</h3>
      <p className="text-secondary small mb-3">{userEmail}</p>

      <Badges token={token} />

      <PredictionPointsChart token={token} />

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="ft-card p-3 h-100">
            <div className="fw-semibold mb-2">
              {t('profile_favorites_title')} ({favorites.length})
            </div>
            {favorites.length === 0 ? (
              <p className="text-secondary small mb-0">{t('fav_empty')}</p>
            ) : (
              <ul className="list-group list-group-flush">
                {favorites.map((f) => (
                  <li
                    key={f.teamId}
                    className="list-group-item d-flex align-items-center gap-2 px-0"
                    role="button"
                    onClick={() => onSelectTeam(f.teamId)}
                  >
                    {f.teamCrest && <img src={f.teamCrest} alt="" width="22" height="22" loading="lazy" />}
                    <span className="fw-medium text-truncate">{f.teamName}</span>
                    <span className="ms-auto text-secondary">›</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="ft-card p-3 h-100">
            <div className="fw-semibold mb-2">
              {t('profile_mini_league_title')} ({leagues.length})
            </div>
            {leagues.length === 0 ? (
              <p className="text-secondary small mb-0">{t('ml_empty')}</p>
            ) : (
              <ul className="list-group list-group-flush">
                {leagues.map((l) => (
                  <li
                    key={l.id}
                    className="list-group-item d-flex align-items-center gap-2 px-0"
                    role="button"
                    onClick={onGoToMiniLeague}
                  >
                    <span className="fw-medium text-truncate">{l.name}</span>
                    <span className="ms-auto text-secondary small">
                      {l.memberCount} {t('ml_members_count')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
