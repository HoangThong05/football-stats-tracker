import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Bat / tat cho nguoi khac thay trang thai "dang hoat dong" (cham xanh) cua minh.
 * Tuy chon nay luu ben may chu, ap dung o moi thiet bi.
 */
export default function OnlineStatusToggle({ token }) {
  const { t } = useTranslation()
  const [on, setOn] = useState(null) // null = chua tai xong
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/presence/settings`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOn(d ? Boolean(d.showOnlineStatus) : true))
      .catch(() => setOn(true))
  }, [token])

  if (on === null) return null

  const toggle = async () => {
    setBusy(true)
    const next = !on
    try {
      const res = await fetch(`${API_BASE}/presence/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ enabled: next }),
      })
      const data = await res.json().catch(() => ({}))
      const value = res.ok ? Boolean(data.showOnlineStatus) : on
      setOn(value)
      // Bao ngay cho header cap nhat cham xanh cua chinh minh, khong doi vong poll
      if (res.ok) window.dispatchEvent(new CustomEvent('ft-presence-changed', { detail: value }))
    } catch {
      /* giu nguyen trang thai cu */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ft-push-toggle">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span aria-hidden="true">{on ? '🟢' : '⚪'}</span>
        <span className="fw-medium">{t('presence_title')}</span>
        <div className="form-check form-switch ms-auto mb-0">
          <input className="form-check-input" type="checkbox" role="switch"
            style={{ cursor: 'pointer' }}
            checked={on} onChange={toggle} disabled={busy} />
        </div>
      </div>
      <p className="text-secondary small mb-0 mt-1">
        {on ? t('presence_on_hint') : t('presence_off_hint')}
      </p>
    </div>
  )
}
