import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { pushSupported, getPushConfig, currentSubscription, enablePush, disablePush } from '../push'

/**
 * Nut bat/tat thong bao day tren THIET BI HIEN TAI (moi may/trinh duyet bat rieng).
 *
 * An di neu may chu chua cau hinh khoa VAPID (config.enabled=false) - de khong hien nut
 * bam vao chi bao loi. Trinh duyet khong ho tro thi noi ro.
 */
export default function NotificationToggle({ token }) {
  const { t } = useTranslation()
  const [config, setConfig] = useState(null) // { enabled, publicKey }
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const supported = pushSupported()

  useEffect(() => {
    if (!token || !supported) return undefined
    let alive = true
    getPushConfig(token).then((c) => {
      if (!alive) return
      setConfig(c)
      if (c.enabled) {
        currentSubscription().then((s) => {
          if (alive) setOn(Boolean(s))
        })
      }
    })
    return () => {
      alive = false
    }
  }, [token, supported])

  if (!token) return null
  if (!supported) return <p className="text-secondary small mb-0">{t('push_unsupported')}</p>
  if (!config || !config.enabled) return null // may chu chua cau hinh -> an han

  const denied = typeof Notification !== 'undefined' && Notification.permission === 'denied'

  const toggle = async () => {
    setError(null)
    setBusy(true)
    try {
      if (on) {
        await disablePush(token)
        setOn(false)
      } else {
        await enablePush(token, config.publicKey)
        setOn(true)
      }
    } catch (e) {
      setError(e.message === 'denied' ? t('push_denied') : t('push_error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ft-push-toggle">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span aria-hidden="true">🔔</span>
        <span className="fw-medium">{t('push_title')}</span>
        <button
          type="button"
          className={`btn btn-sm ms-auto ${on ? 'btn-outline-secondary' : 'btn-success'}`}
          onClick={toggle}
          disabled={busy || denied}
        >
          {busy ? '...' : on ? t('push_off_btn') : t('push_on_btn')}
        </button>
      </div>
      <p className="text-secondary small mb-0 mt-1">
        {denied ? t('push_denied') : on ? t('push_on_hint') : t('push_hint')}
      </p>
      {error && <p className="text-danger small mb-0 mt-1">{error}</p>}
    </div>
  )
}
