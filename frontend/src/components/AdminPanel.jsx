import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { confirmDialog } from './ConfirmDialog'
import Avatar from './Avatar'

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
  const [reports, setReports] = useState([])
  const [bc, setBc] = useState({ title: '', body: '' })
  const [bcBusy, setBcBusy] = useState(false)

  const loadStats = useCallback(() => {
    fetch(`${API_BASE}/admin/stats`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
  }, [token])

  const loadReports = useCallback(() => {
    fetch(`${API_BASE}/admin/reports`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .catch(() => setReports([]))
  }, [token])

  useEffect(loadStats, [loadStats])
  useEffect(loadReports, [loadReports])

  const sendBroadcast = async () => {
    const title = bc.title.trim()
    const body = bc.body.trim()
    if (!title || !body) return
    setBcBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ title, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Loi ${res.status}`)
      setMessage({ type: 'ok', text: t('admin_bc_sent').replace('{n}', data.sent ?? 0) })
      setBc({ title: '', body: '' })
    } catch (e) {
      setMessage({ type: 'err', text: e.message })
    } finally {
      setBcBusy(false)
    }
  }

  const removeReported = async (postId) => {
    const reason = await confirmDialog({
      title: t('admin_report_remove'),
      message: t('forum_delete_reason_prompt'),
      input: true,
      placeholder: t('forum_delete_reason_prompt'),
      confirmText: t('forum_delete'),
      danger: true,
    })
    if (reason === null) return
    await fetch(`${API_BASE}/forum/posts/${postId}?reason=${encodeURIComponent(reason)}`, {
      method: 'DELETE', headers: authHeaders(token),
    }).catch(() => {})
    loadReports()
  }

  const dismissReported = async (postId) => {
    await fetch(`${API_BASE}/admin/reports/${postId}`, {
      method: 'DELETE', headers: authHeaders(token),
    }).catch(() => {})
    loadReports()
  }

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
    <>
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

    {/* Hang doi bao cao bai viet */}
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-2">
        🚩 {t('admin_reports_title')}
        {reports.length > 0 && <span className="badge text-bg-danger ms-2">{reports.length}</span>}
      </div>
      {reports.length === 0 ? (
        <p className="text-secondary small mb-0">{t('admin_reports_empty')}</p>
      ) : (
        <ul className="list-group list-group-flush">
          {reports.map((r) => (
            <li key={r.postId} className="list-group-item px-0">
              <div className="d-flex align-items-center gap-2 mb-1">
                <Avatar name={r.authorName} src={r.authorAvatar} size={28} />
                <span className="fw-medium">{r.authorName}</span>
                <span className="badge text-bg-danger ms-1">
                  {r.reportCount} {t('admin_report_count')}
                </span>
              </div>
              {r.excerpt && <div className="small mb-1" style={{ overflowWrap: 'anywhere' }}>{r.excerpt}</div>}
              {r.reasons.length > 0 && (
                <div className="small text-secondary mb-2">
                  {t('admin_report_reasons')}: {r.reasons.join(' · ')}
                </div>
              )}
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeReported(r.postId)}>
                  {t('admin_report_remove')}
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => dismissReported(r.postId)}>
                  {t('admin_report_dismiss')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Gui thong bao toan he thong */}
    <div className="ft-card p-3 mb-3">
      <div className="fw-semibold mb-2">📢 {t('admin_bc_title')}</div>
      <input
        className="form-control mb-2"
        maxLength={120}
        placeholder={t('admin_bc_title_ph')}
        value={bc.title}
        onChange={(e) => setBc((v) => ({ ...v, title: e.target.value }))}
      />
      <textarea
        className="form-control mb-2"
        rows={3}
        maxLength={1000}
        placeholder={t('admin_bc_body_ph')}
        value={bc.body}
        onChange={(e) => setBc((v) => ({ ...v, body: e.target.value }))}
      />
      <button className="btn btn-sm btn-success"
        disabled={bcBusy || !bc.title.trim() || !bc.body.trim()} onClick={sendBroadcast}>
        {bcBusy ? t('auth_submitting') : t('admin_bc_send')}
      </button>
      <p className="ft-legend text-secondary mb-0 mt-2">{t('admin_bc_note')}</p>
    </div>
    </>
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
