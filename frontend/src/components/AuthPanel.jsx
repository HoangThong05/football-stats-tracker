import { useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'

export default function AuthPanel({ onSuccess }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [forgotHint, setForgotHint] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    setConfirmPassword('')
    setForgotHint(false)
  }

  const submit = (e) => {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && password !== confirmPassword) {
      setError(t('auth_password_mismatch'))
      return
    }

    setSubmitting(true)

    fetch(`${API_BASE}/auth/${mode === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `Loi ${res.status}`)
        }
        return res.json()
      })
      .then((data) => onSuccess(data.token, data.email, data.role))
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="ft-card p-4" style={{ maxWidth: 400 }}>
      <div className="text-center mb-4">
        <div
          className="ft-auth-icon d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ width: 56, height: 56, background: 'var(--ft-accent-soft)', fontSize: '1.6rem' }}
          key={mode}
        >
          {mode === 'login' ? '👋' : '🎉'}
        </div>
        <h4 className="fw-bold mb-1">{mode === 'login' ? t('auth_login_title') : t('auth_register_title')}</h4>
        <p className="text-secondary small mb-0">
          {mode === 'login' ? t('auth_login_subtitle') : t('auth_register_subtitle')}
        </p>
      </div>

      <form onSubmit={submit} className="d-flex flex-column gap-3">
        <div>
          <label className="form-label small fw-medium">{t('auth_email_label')}</label>
          <input
            type="email"
            className="form-control"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <div className="d-flex justify-content-between align-items-center">
            <label className="form-label small fw-medium mb-1">{t('auth_password_label')}</label>
            {mode === 'login' && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 small mb-1"
                onClick={() => setForgotHint(true)}
              >
                {t('auth_forgot')}
              </button>
            )}
          </div>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder={mode === 'register' ? t('auth_password_placeholder_register') : t('auth_password_placeholder_login')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? t('auth_hide_password') : t('auth_show_password')}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {forgotHint && <div className="form-text text-warning-emphasis">{t('auth_forgot_hint')}</div>}
        </div>

        {mode === 'register' && (
          <div>
            <label className="form-label small fw-medium">{t('auth_confirm_password_label')}</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder={t('auth_confirm_placeholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}
                title={showConfirmPassword ? t('auth_hide_password') : t('auth_show_password')}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger py-2 mb-0 small">{error}</div>}

        <button type="submit" className="btn btn-success w-100 fw-semibold py-2" disabled={submitting}>
          {submitting ? t('auth_submitting') : mode === 'login' ? t('auth_login_btn') : t('auth_register_btn')}
        </button>
      </form>

      <div className="text-center small mt-3">
        {mode === 'login' ? (
          <>
            <span className="text-secondary">{t('auth_no_account')} </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => switchMode('register')}>
              {t('auth_signup_now')}
            </button>
          </>
        ) : (
          <>
            <span className="text-secondary">{t('auth_has_account')} </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => switchMode('login')}>
              {t('auth_login_now')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
