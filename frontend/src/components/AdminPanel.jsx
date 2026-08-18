import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Bang dieu khien van hanh cho ADMIN: so lieu tong quan, han muc API con lai,
 * nut xoa cache va nut dong bo tran ngay.
 *
 * Han muc la thu dang chu y nhat: goi mien phi cua football-data.org chi cho 10 request
 * moi phut. Vuot qua thi API tra 429 - da tung lam vo tab Lich thi dau. Truoc day con so
 * nay chi nam trong log, gio nhin thay truoc khi cham tran.
 */

/** Con it hon nguong nay thi to do canh bao. */
const LOW_QUOTA = 3

export default function AdminPanel({ token }) {
  const { t, lang } = useTranslation()
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(null) // 'cache' | 'sync' | null
  const [message, setMessage] = useState(null)

  const loadStats = useCallback(() => {
    fetch(`${API_BASE}/admin/stats`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
  }, [token])

  useEffect(loadStats, [loadStats])

  const runAction = (key, path, successKey) => {
    setBusy(key)
    setMessage(null)

    fetch(`${API_BASE}${path}`, { method: 'POST', headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        setMessage({ type: 'ok', text: t(successKey) })
        // Han muc thay doi sau khi dong bo -> lay lai so lieu
        loadStats()
      })
      .catch((err) => setMessage({ type: 'err', text: err.message }))
      .finally(() => setBusy(null))
  }

  if (!stats) return null

  const quotaLow = stats.quotaRemaining != null && stats.quotaRemaining <= LOW_QUOTA
  const quotaSeen = stats.quotaSeenAt
    ? new Date(stats.quotaSeenAt).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-2">{t('admin_ops_title')}</div>

      <div className="ft-admin-stats">
        <Stat label={t('admin_stat_users')} value={stats.users} />
        <Stat label={t('admin_stat_admins')} value={stats.admins} />
        <Stat label={t('admin_stat_predictions')} value={stats.predictions} />
        <Stat label={t('admin_stat_leagues')} value={stats.miniLeagues} />
        <Stat label={t('admin_stat_matches')} value={stats.syncedMatches} />
        <Stat
          label={t('admin_stat_quota')}
          value={stats.quotaRemaining ?? '—'}
          hint={quotaSeen ? `${t('admin_quota_at')} ${quotaSeen}` : t('admin_quota_never')}
          danger={quotaLow}
        />
      </div>

      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => runAction('cache', '/admin/cache/clear', 'admin_cache_cleared')}
          disabled={busy != null}
        >
          {busy === 'cache' ? t('auth_submitting') : t('admin_clear_cache')}
        </button>

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => runAction('sync', '/admin/sync-matches', 'admin_synced')}
          disabled={busy != null}
        >
          {busy === 'sync' ? t('auth_submitting') : t('admin_sync_now')}
        </button>
      </div>

      {message && (
        <div className={`alert py-2 mt-2 mb-0 ${message.type === 'ok' ? 'alert-success' : 'alert-danger'}`}>
          {message.text}
        </div>
      )}

      <p className="ft-legend text-secondary mb-0 mt-2">{t('admin_ops_note')}</p>
    </div>
  )
}

function Stat({ label, value, hint, danger }) {
  return (
    <div className={`ft-admin-stat${danger ? ' ft-admin-stat-danger' : ''}`}>
      <div className="ft-admin-stat-value ft-num">{value}</div>
      <div className="ft-admin-stat-label">{label}</div>
      {hint && <div className="ft-admin-stat-hint">{hint}</div>}
    </div>
  )
}
