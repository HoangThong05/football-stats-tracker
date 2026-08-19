import { useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'

/**
 * Doi mat khau khi dang dang nhap.
 *
 * Doi xong backend vo hieu MOI token da phat - ke ca token cua chinh tab nay - roi
 * tra ve token moi. Phai giao token do cho App qua onTokenRenewed, khong thi nguoi
 * vua doi mat khau se bi dang xuat ngay tai cho.
 *
 * Chi hoi "mat khau hien tai" khi CA HAI dieu sau dung:
 *   - tai khoan da tung tu dat mat khau (hasPassword)
 *   - phien nay dang nhap bang mat khau, khong phai bang nut Google (!viaGoogle)
 *
 * Thieu ve viaGoogle la sai o cho: mot tai khoan dang ky bang email tu lau, nay dang
 * nhap bang nut Google, van bi doi mat khau ma nguoi dung khong he go lan nao trong
 * phien do - va rat co the khong con nho.
 */
export default function ChangePassword({ token, hasPassword, viaGoogle, onTokenRenewed }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hoiMatKhauCu = hasPassword && !viaGoogle

  const errMap = {
    wrong_current_password: t('pw_wrong_current'),
    password_too_short: t('pw_too_short'),
    rate_limited: t('auth_rate_limited'),
  }

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setShow(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError(t('auth_password_mismatch'))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(errMap[body.message] || body.message || `Error ${res.status}`)
      }
      const data = await res.json()
      onTokenRenewed(data.token, data.email, data.role, data.hasPassword, data.viaGoogle)
      reset()
      setOpen(false)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ft-card p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="h6 mb-1">🔒 {hoiMatKhauCu ? t('pw_title') : t('pw_title_set')}</h4>
          <p className="text-secondary small mb-0">
            {hoiMatKhauCu ? t('pw_subtitle') : t('pw_subtitle_set')}
          </p>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={() => { setOpen((v) => !v); setDone(false); reset() }}>
          {open ? t('pw_cancel') : t('pw_open')}
        </button>
      </div>

      {done && !open && (
        <div className="alert alert-success py-2 small mb-0 mt-3">{t('pw_done')}</div>
      )}

      {open && (
        <form onSubmit={submit} className="d-flex flex-column gap-3 mt-3">
          {hoiMatKhauCu && (
            <div>
              <label className="form-label small fw-medium">{t('pw_current')}</label>
              <input type={show ? 'text' : 'password'} className="form-control"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                required autoFocus />
            </div>
          )}

          <div>
            <label className="form-label small fw-medium">{t('pw_new')}</label>
            <div className="input-group">
              <input type={show ? 'text' : 'password'} className="form-control"
                placeholder={t('auth_password_placeholder_register')}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                required minLength={6} autoFocus={!hoiMatKhauCu} />
              <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                onClick={() => setShow((v) => !v)}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label small fw-medium">{t('auth_confirm_password_label')}</label>
            <input type={show ? 'text' : 'password'} className="form-control"
              placeholder={t('auth_confirm_placeholder')}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required minLength={6} />
          </div>

          {error && <div className="alert alert-danger py-2 mb-0 small">{error}</div>}

          <p className="text-secondary small mb-0">{t('pw_logout_note')}</p>

          <button type="submit" className="btn btn-success fw-semibold" disabled={submitting}>
            {submitting ? t('auth_submitting') : t('pw_submit')}
          </button>
        </form>
      )}
    </div>
  )
}
