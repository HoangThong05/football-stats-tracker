import { useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { imageUploadEnabled, uploadImage } from '../cloudinary'
import { useTranslation } from '../i18n'

/**
 * Anh bia (banner tren dau trang Ho so) kem nut doi. Giong AvatarUpload nhung cho ca bia.
 *
 * File di THANG len Cloudinary (xem cloudinary.js), backend chi luu duong dan. Nhan ca
 * GIF nen dat duoc anh bia dong. Chua co anh -> ve vach san co mac dinh.
 */
export default function CoverUpload({ token, coverUrl, onSaved }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const errMap = {
    image_type_invalid: t('forum_err_image_type'),
    image_too_large: t('forum_err_image_size'),
    image_upload_failed: t('forum_err_image_upload'),
    image_url_invalid: t('forum_err_image_upload'),
    rate_limited: t('auth_rate_limited'),
  }

  /** Gui duong dan len backend. url rong = go anh bia. */
  const save = async (url) => {
    const res = await fetch(`${API_BASE}/auth/cover`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverUrl: url }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'image_upload_failed')
    }
    const data = await res.json()
    onSaved(data.coverUrl || null)
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await save(await uploadImage(file))
    } catch (err) {
      setError(errMap[err.message] || err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await save('')
    } catch (err) {
      setError(errMap[err.message] || err.message)
    } finally {
      setBusy(false)
    }
  }

  const style = coverUrl
    ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : undefined

  return (
    <div className="ft-profile-cover" style={style}>
      {imageUploadEnabled() && (
        <div className="ft-cover-actions">
          <button type="button" className="ft-cover-btn" disabled={busy}
            onClick={() => fileRef.current?.click()}>
            {busy ? '…' : `📷 ${coverUrl ? t('profile_cover_change') : t('profile_cover_add')}`}
          </button>
          {coverUrl && (
            <button type="button" className="ft-cover-btn" disabled={busy} onClick={remove}>
              {t('profile_cover_remove')}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            className="d-none" onChange={pick} />
        </div>
      )}
      {error && <div className="ft-cover-error small">{error}</div>}
    </div>
  )
}
