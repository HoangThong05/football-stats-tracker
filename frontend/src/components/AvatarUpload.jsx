import { useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { imageUploadEnabled, uploadImage } from '../cloudinary'
import { useTranslation } from '../i18n'
import Avatar from './Avatar'

/**
 * Anh dai dien kem nut may anh de doi - dat o dau trang Ho so.
 *
 * File di THANG len Cloudinary tu trinh duyet (xem cloudinary.js), backend chi nhan
 * duong dan de luu lai. Nghia la anh chi thuc su "co" sau khi backend tra ve OK; tai
 * len xong ma luu that bai thi coi nhu chua doi gi.
 */
export default function AvatarUpload({ token, name, avatarUrl, onSaved, size = 104 }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Ma loi tu cloudinary.js -> cau tieng nguoi dung doc duoc
  const errMap = {
    image_type_invalid: t('forum_err_image_type'),
    image_too_large: t('forum_err_image_size'),
    image_upload_failed: t('forum_err_image_upload'),
    image_url_invalid: t('forum_err_image_upload'),
    rate_limited: t('auth_rate_limited'),
  }

  /** Gui duong dan len backend. url rong = go anh. */
  const save = async (url) => {
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'image_upload_failed')
    }
    const data = await res.json()
    onSaved(data.avatarUrl)
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    // Reset ngay: chon lai DUNG file vua chon thi input khong ban su kien change nua
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

  return (
    <div className="ft-avatar-upload">
      <div className="ft-avatar-upload-ring">
        <Avatar name={name} src={avatarUrl} size={size} />

        {/* Chua cau hinh Cloudinary thi an nut di, thay vi hien roi bam vao moi bao loi */}
        {imageUploadEnabled() && (
          <>
            <button
              type="button"
              className="ft-avatar-camera"
              disabled={busy}
              title={t('profile_avatar_change')}
              aria-label={t('profile_avatar_change')}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? '…' : '📷'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="d-none"
              onChange={pick}
            />
          </>
        )}
      </div>

      {avatarUrl && imageUploadEnabled() && (
        <button type="button" className="ft-name-link text-secondary" style={{ fontSize: '0.72rem' }}
          disabled={busy} onClick={remove}>
          {t('profile_avatar_remove')}
        </button>
      )}

      {error && <div className="text-danger small text-center">{error}</div>}
    </div>
  )
}
