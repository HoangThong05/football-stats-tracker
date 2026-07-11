import { useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'

export default function AuthPanel({ onSuccess }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('token') ? 'reset' : 'login'
  })
  const [resetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('token') || ''
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    setSuccess(null)
    setPassword('')
    setConfirmPassword('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'register' && password !== confirmPassword) {
      setError(t('auth_password_mismatch'))
      return
    }
    if (mode === 'reset' && password !== confirmPassword) {
      setError(t('auth_password_mismatch'))
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'login' || mode === 'register') {
        const res = await fetch(`${API_BASE}/auth/${mode === 'login' ? 'login' : 'register'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `Loi ${res.status}`)
        }
        const data = await res.json()
        onSuccess(data.token, data.email, data.role)

      } else if (mode === 'forgot') {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || 'Email khong ton tai')
        }
        setSuccess('Đã gửi email đặt lại mật khẩu! Kiểm tra hộp thư của bạn.')

      } else if (mode === 'reset') {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || 'Token khong hop le hoac da het han')
        }
        setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.')
        setTimeout(() => switchMode('login'), 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const icon = { login: '👋', register: '🎉', forgot: '🔑', reset: '🔒' }[mode]
  const title = {
    login: t('auth_login_title'),
    register: t('auth_register_title'),
    forgot: 'Quên mật khẩu',
    reset: 'Đặt lại mật khẩu'
  }[mode]
  const subtitle = {
    login: t('auth_login_subtitle'),
    register: t('auth_register_subtitle'),
    forgot: 'Nhập email để nhận link đặt lại mật khẩu',
    reset: 'Nhập mật khẩu mới của bạn'
  }[mode]

  return (
    <div className="ft-card p-4" style={{ maxWidth: 400 }}>
      <div className="text-center mb-4">
        <div className="ft-auth-icon d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ width: 56, height: 56, background: 'var(--ft-accent-soft)', fontSize: '1.6rem' }} key={mode}>
          {icon}
        </div>
        <h4 className="fw-bold mb-1">{title}</h4>
        <p className="text-secondary small mb-0">{subtitle}</p>
      </div>

      <form onSubmit={submit} className="d-flex flex-column gap-3">
        {mode !== 'reset' && (
          <div>
            <label className="form-label small fw-medium">{t('auth_email_label')}</label>
            <input type="email" className="form-control" placeholder="ban@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
        )}

        {mode !== 'forgot' && (
          <div>
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label small fw-medium mb-1">
                {mode === 'reset' ? 'Mật khẩu mới' : t('auth_password_label')}
              </label>
              {mode === 'login' && (
                <button type="button" className="btn btn-link btn-sm p-0 small mb-1"
                  onClick={() => switchMode('forgot')}>
                  {t('auth_forgot')}
                </button>
              )}
            </div>
            <div className="input-group">
              <input type={showPassword ? 'text' : 'password'} className="form-control"
                placeholder={mode === 'register' ? t('auth_password_placeholder_register') : t('auth_password_placeholder_login')}
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {(mode === 'register' || mode === 'reset') && (
          <div>
            <label className="form-label small fw-medium">{t('auth_confirm_password_label')}</label>
            <div className="input-group">
              <input type={showConfirmPassword ? 'text' : 'password'} className="form-control"
                placeholder={t('auth_confirm_placeholder')}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength={6} />
              <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}>
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger py-2 mb-0 small">{error}</div>}
        {success && <div className="alert alert-success py-2 mb-0 small">{success}</div>}

        <button type="submit" className="btn btn-success w-100 fw-semibold py-2" disabled={submitting}>
          {submitting ? t('auth_submitting') : {
            login: t('auth_login_btn'),
            register: t('auth_register_btn'),
            forgot: 'Gửi email đặt lại mật khẩu',
            reset: 'Đặt lại mật khẩu'
          }[mode]}
        </button>
      </form>

      <div className="text-center small mt-3">
        {mode === 'login' && (
          <>
            <span className="text-secondary">{t('auth_no_account')} </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => switchMode('register')}>
              {t('auth_signup_now')}
            </button>
          </>
        )}
        {(mode === 'register' || mode === 'forgot') && (
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