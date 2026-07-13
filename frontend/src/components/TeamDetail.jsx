import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Loading from './Loading'

const POSITION_LABELS = {
  Goalkeeper: 'Thủ môn',
  Defender: 'Hậu vệ',
  Midfielder: 'Tiền vệ',
  Attacker: 'Tiền đạo',
}
const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

function groupSquadByPosition(squad) {
  const groups = {}
  squad.forEach((p) => {
    const key = p.position || 'Khác'
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  })
  return POSITION_ORDER.filter((pos) => groups[pos])
    .map((pos) => ({ position: pos, label: POSITION_LABELS[pos] || pos, players: groups[pos] }))
    .concat(
      Object.keys(groups)
        .filter((k) => !POSITION_ORDER.includes(k))
        .map((k) => ({ position: k, label: k, players: groups[k] }))
    )
}

function playerSearchUrl(playerName, teamName) {
  // "&btnI=1" la tinh nang "I'm Feeling Lucky" cua Google -> tu dong nhay
  // thang vao ket qua dau tien thay vi hien trang danh sach ket qua.
  const query = `${playerName} ${teamName} site:transfermarkt.com`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`
}

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

          {team.squad.length > 0 && (
            <>
              <h3 className="h5 mb-3">{t('team_squad')}</h3>
              {groupSquadByPosition(team.squad).map((group) => (
                <div key={group.position} className="mb-4">
                  <h6 className="fw-bold text-uppercase small text-secondary mb-3" style={{ letterSpacing: '1px' }}>
                    {group.label}
                  </h6>
                  <div className="row g-3">
                    {group.players.map((p) => (
                      <div key={p.id} className="col-6 col-md-3">
                        <a href={playerSearchUrl(p.name, team.name)} target="_blank" rel="noreferrer" className="text-decoration-none">
                          <div className="ft-card p-3 text-center h-100">
                            <img
                              src={p.photoUrl || 'https://via.placeholder.com/80?text=?'}
                              alt={p.name}
                              className="rounded-circle mb-2"
                              style={{ width: 72, height: 72, objectFit: 'cover', background: 'var(--ft-card-alt, #eee)' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=?' }}
                            />
                            {p.jerseyNumber != null && (
                              <div className="fw-bold small text-secondary mb-1">#{p.jerseyNumber}</div>
                            )}
                            <div className="fw-semibold small text-body">{p.name}</div>
                            {p.age != null && <div className="text-secondary small">{p.age} tuổi</div>}
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}