import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Loading from './Loading'

export default function TeamDetail({ teamId, onBack, token, favorites, onFavoritesChange }) {
  const { t } = useTranslation()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setTeam(null)

    fetch(`${API_BASE}/teams/${teamId}`)
  .then((res) => {
    if (!res.ok) {
      if (res.status === 404) throw new Error('Đội bóng này chưa có dữ liệu chi tiết')
      throw new Error(`Loi ${res.status}`)
    }
    return res.json()
  })
  .then((data) => setTeam(data))
  .catch((err) => setError(err.message))
  .finally(() => setLoading(false))
  }, [teamId])

  const isFollowing = favorites.some((f) => f.teamId === teamId)

  const toggleFollow = () => {
    if (!team) return
    setFollowBusy(true)

    const request = isFollowing
      ? fetch(`${API_BASE}/favorites/${teamId}`, { method: 'DELETE', headers: authHeaders(token) })
      : fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
          body: JSON.stringify({ teamId, teamName: team.name, teamCrest: team.crest }),
        })

    request
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        onFavoritesChange()
      })
      .finally(() => setFollowBusy(false))
  }

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back_standings')}
      </button>

      {loading && <Loading />}
      {error && (
        <div className="alert alert-danger">
          {t('error_generic')} {error}
        </div>
      )}

      {!loading && !error && team && (
        <>
          <div className="ft-team-hero p-4 mb-4">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              {team.crest && <img src={team.crest} alt="" className="crest-big" />}
              <div className="flex-grow-1">
                <h2 className="h3 mb-2 fw-bold">{team.name}</h2>
                <div className="d-flex flex-wrap column-gap-4 row-gap-1">
                  {team.venue && (
                    <div className="text-muted small">
                      {t('team_venue_prefix')} {team.venue}
                    </div>
                  )}
                  {team.founded != null && (
                    <div className="text-muted small">
                      {t('team_founded_prefix')} {team.founded}
                    </div>
                  )}
                  {team.clubColors && <div className="text-muted small">🎽 {team.clubColors}</div>}
                  {team.coachName && (
                    <div className="text-muted small">
                      {t('team_coach_prefix')} {team.coachName}
                    </div>
                  )}
                </div>
                {team.website && (
                  <div className="small mt-2">
                    <a href={team.website} target="_blank" rel="noreferrer">
                      {t('team_website')}
                    </a>
                  </div>
                )}
              </div>

              {token ? (
                <button
                  className={isFollowing ? 'btn btn-warning fw-semibold' : 'btn btn-outline-light fw-semibold'}
                  onClick={toggleFollow}
                  disabled={followBusy}
                >
                  {isFollowing ? t('team_following') : t('team_follow')}
                </button>
              ) : (
                <span className="text-muted small">{t('team_login_to_follow')}</span>
              )}
            </div>
          </div>

          {/* Doi hinh lay tu API-Football (players/squads), cache 7 ngay/lan
              trong bang team_squad. Chi hien muc nay khi co du lieu. */}
          {team.squad.length > 0 && (
            <>
              <h3 className="h5 mb-3">{t('team_squad')}</h3>
              <div className="ft-card">
                <ul className="list-group list-group-flush ft-stagger">
                  {team.squad.map((p) => (
                    <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span className="fw-medium">{p.name}</span>
                      <span className="text-secondary small">
                        {[p.position, p.nationality].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}