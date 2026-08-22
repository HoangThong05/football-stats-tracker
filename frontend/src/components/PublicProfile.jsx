import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Avatar from './Avatar'
import Loading from './Loading'

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
        <div className="ft-profile-cover" />

        <div className="ft-profile-id">
          <div className="ft-avatar-upload">
            <div className="ft-avatar-upload-ring">
              <Avatar name={profile.name} src={profile.avatarUrl} size={104} />
            </div>
          </div>

          <div className="ft-profile-id-text">
            <h3 className="h4 mb-0 text-truncate">{profile.name}</h3>
            <div className="text-secondary small">{t('pub_joined')} {joined}</div>
          </div>

          <span className="ft-profile-settings-btn">{friendButton()}</span>
        </div>

        {error && <div className="alert alert-danger py-2 small mx-3">{error}</div>}

        <div className="ft-profile-stats">
          {stat(t('stats_points'), profile.totalPoints)}
          {stat(t('stats_predicted'), profile.totalPredictions)}
          {stat(t('stats_exact'), profile.exactScores)}
        </div>
      </div>

      {profile.badges?.some((b) => b.earned) && (
        <div className="ft-card p-3">
          <h4 className="h6 mb-2">{t('pub_badges')}</h4>
          <div className="d-flex gap-2 flex-wrap">
            {profile.badges.filter((b) => b.earned).map((b) => (
              <span key={b.code} className="badge text-bg-success">
                {t(`badge_${b.code === 'PROPHET' ? 'prophet' : 'streak'}_title`)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
