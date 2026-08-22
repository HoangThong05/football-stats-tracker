import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'
import GoogleLoginButton from './GoogleLoginButton'

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
  /*
   * Gui xong thi thay han form bang man xac nhan, khong con nut de bam nham.
   * Moi lan bam la backend sinh token moi de len token cu -> bam hai lan thi link
   * trong thu DAU TIEN chet. Nguoi dung hay mo thu den truoc, bam vao, gap bao loi
   * "link khong hop le" trong khi thu dung dang nam ngay duoi.
   */
  const [sentTo, setSentTo] = useState(null)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  const errMap = {
    invalid_credentials: t('auth_invalid_credentials'),
    email_exists: t('auth_email_exists'),
    invalid_email: t('auth_invalid_email'),
    password_too_short: t('pw_too_short'),
    token_invalid: t('auth_token_invalid'),
    token_expired: t('auth_token_expired'),
    // Dung ca hai duong dang nhap: mat khau va Google deu tra ma nay khi bi khoa
    account_disabled: t('auth_account_disabled'),
    rate_limited: t('auth_rate_limited'),
  }

  const switchMode = (next) => {
    setMode(next)
    setError(null)
    setSuccess(null)
    setSentTo(null)
    setResendIn(0)
    setPassword('')
    setConfirmPassword('')
  }

  const sendForgot = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(errMap[body.message] || body.message || `Error ${res.status}`)
      }
      /*
       * Bao da gui ma KHONG noi email do co ton tai hay khong. Noi ra thi ai cung
       * do duoc email nao da dang ky, chi bang cach go thu tung dia chi vao o nay.
       */
      setSentTo(email)
      setResendIn(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'forgot') {
      await sendForgot()
      return
    }
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
          throw new Error(errMap[body.message] || body.message || `Error ${res.status}`)
        }
        const data = await res.json()
        onSuccess(data.token, data.email, data.role, data.hasPassword, data.viaGoogle, data.displayName, data.userId)

      } else if (mode === 'reset') {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(errMap[body.message] || body.message || `Error ${res.status}`)
        }
        setSuccess(t('auth_reset_success'))
        setTimeout(() => switchMode('login'), 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const forgotSent = mode === 'forgot' && sentTo

  if (forgotSent) {
    return (
      <div className="ft-card p-4 text-center" style={{ maxWidth: 400 }}>
        <div className="ft-auth-icon d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{ width: 56, height: 56, background: 'var(--ft-accent-soft)', fontSize: '1.6rem' }}>
          ✉️
        </div>
        <h4 className="fw-bold mb-2">{t('auth_forgot_sent_title')}</h4>
        <p className="mb-1">{t('auth_forgot_sent_short').replace('{email}', sentTo)}</p>
        <p className="text-secondary small mb-4">{t('auth_forgot_sent_spam')}</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <button type="button" className="btn btn-success w-100 fw-semibold py-2 mb-2"
          onClick={() => switchMode('login')}>
          {t('auth_login_now')}
        </button>
        <button type="button" className="btn btn-link btn-sm p-0"
          disabled={resendIn > 0 || submitting} onClick={sendForgot}>
          {resendIn > 0
            ? t('auth_forgot_resend_wait').replace('{s}', resendIn)
            : t('auth_forgot_resend')}
        </button>
      </div>
    )
  }

  const icon = { login: '👋', register: '🎉', forgot: '🔑', reset: '🔒' }[mode]
  const title = {
    login: t('auth_login_title'),
    register: t('auth_register_title'),
    forgot: t('auth_forgot_title'),
    reset: t('auth_reset_title'),
  }[mode]
  const subtitle = {
    login: t('auth_login_subtitle'),
    register: t('auth_register_subtitle'),
    forgot: t('auth_forgot_subtitle'),
    reset: t('auth_reset_subtitle'),
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
                {mode === 'reset' ? t('auth_new_password_label') : t('auth_password_label')}
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
        {success && (
          <div className="alert alert-success py-2 mb-0 small" style={{ whiteSpace: 'pre-line' }}>
            {success}
          </div>
        )}

        <button type="submit" className="btn btn-success w-100 fw-semibold py-2" disabled={submitting}>
          {submitting ? t('auth_submitting') : {
            login: t('auth_login_btn'),
            register: t('auth_register_btn'),
            forgot: t('auth_forgot_guide_btn'),
            reset: t('auth_reset_btn'),
          }[mode]}
        </button>
      </form>

      {/* Chi hien o man dang nhap/dang ky - man dat lai mat khau thi khong lien quan.
          Nut Google tra ve MA loi tho nen phai qua errMap, khong hien thang cho nguoi dung. */}
      {(mode === 'login' || mode === 'register') && (
        <GoogleLoginButton
          onSuccess={onSuccess}
          onError={(code) => setError(errMap[code] || code)}
        />
      )}

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