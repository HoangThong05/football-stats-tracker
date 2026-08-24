import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'
import { BADGE_META } from '../constants'
import Avatar from './Avatar'
import CoverMedia from './CoverMedia'
import Loading from './Loading'
import PointsAreaChart from './PointsAreaChart'

/**
 * Ho so cong khai cua mot nguoi choi.
 *
 * Khach chua dang nhap van xem duoc (bang xep hang von la trang cong khai) - chi khac
 * la khong co nut ket ban, vi khong biet ho la ai.
 */
export default function PublicProfile({ userId, token, onBack }) {
  const { t, lang } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    fetch(`${API_BASE}/users/${userId}/profile`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [userId, token])

  useEffect(load, [load])

  const act = async (method, path) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/friends/${userId}${path}`, {
        method,
        headers: authHeaders(token),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || `Error ${res.status}`)
      }
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!profile) {
    return (
      <div className="ft-fade">
        <button className="btn btn-link ps-0 mb-3" onClick={onBack}>{t('back')}</button>
        <Loading rows={3} />
      </div>
    )
  }

  const stat = (label, value) => (
    <div className="ft-profile-stat">
      <span className="ft-num fw-bold">{value}</span>
      <span className="ft-profile-stat-label">{label}</span>
    </div>
  )

  /* Nut doi theo quan he hien tai - moi trang thai mot hanh dong khac nhau */
  const friendButton = () => {
    if (!token || profile.relation === 'SELF') return null
    if (profile.relation === 'FRIENDS') {
      return (
        <button className="btn btn-sm btn-outline-secondary" disabled={busy}
          onClick={() => act('DELETE', '')}>
          {t('friend_remove')}
        </button>
      )
    }
    if (profile.relation === 'PENDING_SENT') {
      return (
        <button className="btn btn-sm btn-outline-secondary" disabled={busy}
          onClick={() => act('DELETE', '')}>
          {t('friend_cancel')}
        </button>
      )
    }
    if (profile.relation === 'PENDING_RECEIVED') {
      return (
        <span className="d-flex gap-2">
          <button className="btn btn-sm btn-success" disabled={busy}
            onClick={() => act('POST', '/accept')}>
            {t('friend_accept')}
          </button>
          <button className="btn btn-sm btn-outline-secondary" disabled={busy}
            onClick={() => act('DELETE', '')}>
            {t('friend_decline')}
          </button>
        </span>
      )
    }
    return (
      <button className="btn btn-sm btn-success" disabled={busy} onClick={() => act('POST', '')}>
        {t('friend_add')}
      </button>
    )
  }

  const joined = new Date(profile.joinedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB')

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>{t('back')}</button>

      <div className="ft-card ft-profile-hero mb-3">
        <div className="ft-profile-cover">
          <CoverMedia url={profile.coverUrl} pos={profile.coverPos ?? 50} />
        </div>

        <div className="ft-profile-id">
          <div className="ft-avatar-upload">
            <div className="ft-avatar-upload-ring">
              <Avatar name={profile.name} src={profile.avatarUrl} size={104} />
            </div>
          </div>

          <div className="ft-profile-id-text">
            <h3 className="h4 mb-0 text-truncate">
              {profile.name}
              {profile.isAdmin && <span className="ft-admin-tag ms-2">{t('role_admin')}</span>}
              {(() => {
                const f = profile.badges?.find((b) => b.featured)
                const meta = f ? BADGE_META[f.code] : null
                return meta ? (
                  <span className="ft-name-badge ms-2" title={t(meta.descKey)}>
                    <span className="ft-name-badge-icon">{meta.icon}</span>
                    {t(meta.titleKey)}
                  </span>
                ) : null
              })()}
            </h3>
            <div className="text-secondary small">{t('pub_joined')} {joined}</div>
            {profile.weeklyWins > 0 && (
              <span className="badge text-bg-warning mt-1">
                🏆 {t('profile_weekly_wins')} ×{profile.weeklyWins}
              </span>
            )}
          </div>

          {/* Admin khong phai nguoi choi xa hoi -> khong co nut ket ban */}
          {!profile.isAdmin && <span className="ft-profile-settings-btn">{friendButton()}</span>}
        </div>

        {error && <div className="alert alert-danger py-2 small mx-3">{error}</div>}

        {!profile.isAdmin && (
          <div className="ft-profile-stats">
            {stat(t('stats_points'), profile.totalPoints)}
            {stat(t('stats_predicted'), profile.totalPredictions)}
            {stat(t('stats_exact'), profile.exactScores)}
            {stat(t('stats_hit_rate'), `${profile.hitRate ?? 0}%`)}
          </div>
        )}
      </div>

      {!profile.isAdmin && profile.badges?.some((b) => b.earned) && (
        <div className="ft-card p-3">
          <h4 className="h6 mb-2">{t('pub_badges')}</h4>
          <div className="d-flex gap-2 flex-wrap">
            {profile.badges.filter((b) => b.earned).map((b) => {
              const meta = BADGE_META[b.code]
              if (!meta) return null
              return (
                <span key={b.code} className="ft-badge-chip" title={t(meta.descKey)}>
                  <span className="ft-badge-chip-icon">{meta.icon}</span>
                  {t(meta.titleKey)}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {!profile.isAdmin && (profile.pointsTimeline?.length ?? 0) >= 3 && (
        <div className="ft-card p-3 mt-3">
          <div className="fw-semibold mb-1">{t('myp_chart_points_title')}</div>
          <PointsAreaChart points={profile.pointsTimeline} ariaLabel={t('myp_chart_points_title')} />
          <div className="text-secondary small mt-2">
            {t('myp_points_cumulative_total')}{' '}
            <strong className="text-body ft-num">
              {profile.pointsTimeline.reduce((s, p) => s + p, 0)} {t('myp_points_suffix')}
            </strong>
          </div>
        </div>
      )}

      {!profile.isAdmin && (
      <div className="row g-3 mt-0">
        {profile.favorites?.length > 0 && (
          <div className="col-12 col-md-6">
            <div className="ft-card p-3 h-100">
              <div className="fw-semibold mb-2">
                {t('profile_favorites_title')}{' '}
                <span className="text-secondary ft-num">({profile.favorites.length})</span>
              </div>
              <ul className="list-group list-group-flush">
                {profile.favorites.map((f) => (
                  <li key={f.teamId} className="list-group-item d-flex align-items-center gap-2 px-0">
                    {f.teamCrest && <img src={f.teamCrest} alt="" width="22" height="22" loading="lazy" />}
                    <span className="fw-medium text-truncate" title={f.teamName}>{shortTeamName(f.teamName)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {(profile.friendsCount ?? 0) > 0 && (
          /* align-self-start: the ban be chi cao theo noi dung, khong gian bang cot doi yeu thich */
          <div className="col-12 col-md-6 align-self-start">
            <div className="ft-card p-3 d-flex align-items-center gap-3">
              <span style={{ fontSize: '1.6rem' }}>🤝</span>
              <div>
                <div className="ft-num fw-bold fs-4">{profile.friendsCount}</div>
                <div className="text-secondary small">{t('pub_friends_count')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
