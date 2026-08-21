import { useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Doi ten hien thi.
 *
 * Ten nay la thu NGUOI KHAC nhin thay o bang xep hang du doan (trang cong khai) va trong
 * phong Mini League. Truoc day cac cho do hien email day du cua tung nguoi choi.
 */
export default function DisplayName({ token, displayName, onSaved }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(displayName || '')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const errMap = {
    display_name_length: t('name_err_length'),
    display_name_invalid: t('name_err_invalid'),
    rate_limited: t('auth_rate_limited'),
  }

  const save = async (e) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/auth/display-name`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: value }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(errMap[body.message] || body.message || `Error ${res.status}`)
      }
      const data = await res.json()
      onSaved(data.displayName)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ft-card p-3 mb-3">
      <h4 className="h6 mb-1">🏷 {t('name_title')}</h4>
      <p className="text-secondary small mb-3">{t('name_subtitle')}</p>

      <form onSubmit={save} className="d-flex gap-2 flex-wrap align-items-start">
        <input
          className="form-control"
          style={{ maxWidth: 260 }}
          value={value}
          onChange={(e) => { setValue(e.target.value); setDone(false) }}
          minLength={2}
          maxLength={30}
          required
        />
        <button className="btn btn-success" disabled={saving || value.trim() === (displayName || '')}>
          {saving ? t('auth_submitting') : t('name_save')}
        </button>
      </form>

      {error && <div className="alert alert-danger py-2 small mb-0 mt-2">{error}</div>}
      {done && <div className="alert alert-success py-2 small mb-0 mt-2">{t('name_done')}</div>}
    </div>
  )
}
