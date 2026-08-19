import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'

/**
 * Nut "Dang nhap bang Google", dung Google Identity Services.
 *
 * LUONG: Google cho nguoi dung chon tai khoan -> tra ve mot ID token -> ta gui token do
 * len backend -> backend XAC MINH chu ky roi phat JWT cua app. Frontend khong tu tin
 * bat ky thong tin nao trong token, chi lam nguoi chuyen thu.
 *
 * Tu an di khi backend chua cau hinh GOOGLE_CLIENT_ID - hien nut roi bam vao moi bao
 * loi thi te hon la khong hien.
 */

const GSI_SRC = 'https://accounts.google.com/gsi/client'

/** Nap script cua Google dung MOT lan cho ca trang, du co bao nhieu nut. */
let gsiPromise = null
function loadGoogleScript() {
  if (gsiPromise) return gsiPromise

  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

  return gsiPromise
}

export default function GoogleLoginButton({ onSuccess, onError }) {
  const { t } = useTranslation()
  const boxRef = useRef(null)
  const [clientId, setClientId] = useState(null)
  const [failed, setFailed] = useState(false)

  /*
   * Hoi backend xem tinh nang co duoc bat khong, thay vi doc bien moi truong cua
   * frontend. Nhu vay chi phai cau hinh Client ID o MOT noi - lech nhau giua hai ben
   * se ra loi "invalid audience" rat kho doan.
   */
  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE}/auth/google/enabled`)
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data) => {
        if (!cancelled) setClientId(data.enabled ? data.clientId : null)
      })
      .catch(() => {
        if (!cancelled) setClientId(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!clientId || !boxRef.current) return undefined

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !boxRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            fetch(`${API_BASE}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            })
              .then(async (res) => {
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(data.message || 'google_login_failed')
                return data
              })
              .then((data) => onSuccess(data.token, data.email, data.role, data.hasPassword, data.viaGoogle))
              // Tra ve MA loi tho; AuthPanel doi sang cau tieng Viet qua errMap cua no
              .catch((err) => onError?.(err.message))
          },
        })

        window.google.accounts.id.renderButton(boxRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          width: 320,
        })
      })
      .catch(() => {
        // Chan quang cao hoac mat mang -> khong nap duoc script, an nut di
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [clientId, onSuccess, onError])

  if (!clientId || failed) return null

  return (
    <div className="ft-google-login">
      <div className="ft-google-divider">
        <span>{t('auth_or')}</span>
      </div>
      <div ref={boxRef} className="ft-google-button" />
    </div>
  )
}
