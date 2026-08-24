import { useEffect, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { imageUploadEnabled, uploadImage } from '../cloudinary'
import { useTranslation } from '../i18n'
import { giphyEnabled } from '../giphy'
import CoverMedia from './CoverMedia'
import GifPicker from './GifPicker'
import CoverAddDialog from './CoverAddDialog'

const clamp = (v) => Math.max(0, Math.min(100, v))

/**
 * Anh bia (banner tren dau trang Ho so) kem doi anh + KEO chinh vi tri (giong Facebook).
 *
 * File di THANG len Cloudinary (xem cloudinary.js), backend luu duong dan + vi tri doc
 * (coverPos 0-100%). Nhan ca GIF nen dat duoc anh bia dong. Chua co anh -> vach san co.
 */
export default function CoverUpload({ token, coverUrl, coverPos, onSaved }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [moving, setMoving] = useState(false) // dang keo chinh vi tri
  const [showGif, setShowGif] = useState(false)
  const [showAdd, setShowAdd] = useState(false) // hop 2 o kieu Discord
  const [pos, setPos] = useState(coverPos ?? 50)
  const drag = useRef(null)

  // Dong bo vi tri khi du lieu tu ngoai doi (tai lai / doi anh)
  useEffect(() => setPos(coverPos ?? 50), [coverPos])

  const errMap = {
    image_type_invalid: t('forum_err_image_type'),
    media_type_invalid: t('forum_err_media_type'),
    image_too_large: t('forum_err_image_size'),
    video_too_large: t('forum_err_video_size'),
    image_upload_failed: t('forum_err_image_upload'),
    image_url_invalid: t('forum_err_image_upload'),
    rate_limited: t('auth_rate_limited'),
  }

  /** Gui len backend. url rong = go anh. position = vi tri doc. */
  const save = async (url, position) => {
    const res = await fetch(`${API_BASE}/auth/cover`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverUrl: url, coverPos: position }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'image_upload_failed')
    }
    const data = await res.json()
    onSaved({
      coverUrl: data.coverUrl || null,
      coverPos: typeof data.coverPos === 'number' ? data.coverPos : 50,
    })
  }

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(errMap[err.message] || err.message)
    } finally {
      setBusy(false)
    }
  }

  const pick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // Anh/GIF moi -> dat ve giua (50). Bia chi nhan anh + GIF, khong nhan video.
    run(async () => save(await uploadImage(file), 50))
  }

  const remove = () => run(async () => {
    await save('', null)
    setMoving(false)
  })

  const savePosition = () => run(async () => {
    await save(coverUrl, Math.round(pos))
    setMoving(false)
  })

  const cancelPosition = () => {
    setPos(coverPos ?? 50)
    setMoving(false)
  }

  // Keo doc de chinh vi tri (chi khi dang o che do chinh)
  const onDown = (e) => {
    if (!moving) return
    drag.current = { y: e.clientY, pos }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    if (!moving || !drag.current) return
    const h = e.currentTarget.offsetHeight || 200
    const dy = e.clientY - drag.current.y
    // Keo xuong (dy > 0) -> lo phan TREN cua anh -> pos giam
    setPos(clamp(drag.current.pos - (dy / h) * 100))
  }
  const onUp = () => { drag.current = null }

  return (
    <div
      className={`ft-profile-cover${moving ? ' repositioning' : ''}`}
      style={moving ? { cursor: 'grab', touchAction: 'none' } : undefined}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <CoverMedia url={coverUrl} pos={pos} />

      {imageUploadEnabled() && (
        <div className="ft-cover-actions">
          {moving ? (
            <>
              <button type="button" className="ft-cover-btn" disabled={busy} onClick={savePosition}>
                {busy ? '…' : `✓ ${t('profile_cover_save_pos')}`}
              </button>
              <button type="button" className="ft-cover-btn" disabled={busy} onClick={cancelPosition}>
                {t('pw_cancel')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ft-cover-btn" disabled={busy}
                onClick={() => (giphyEnabled() ? setShowAdd(true) : fileRef.current?.click())}>
                {busy ? '…' : `📷 ${coverUrl ? t('profile_cover_change') : t('profile_cover_add')}`}
              </button>
              {coverUrl && (
                <button type="button" className="ft-cover-btn" disabled={busy}
                  onClick={() => setMoving(true)}>
                  ↕ {t('profile_cover_reposition')}
                </button>
              )}
              {coverUrl && (
                <button type="button" className="ft-cover-btn" disabled={busy} onClick={remove}>
                  {t('profile_cover_remove')}
                </button>
              )}
            </>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            className="d-none" onChange={pick} />
        </div>
      )}

      {moving && <div className="ft-cover-hint">{t('profile_cover_drag_hint')}</div>}
      {error && <div className="ft-cover-error small">{error}</div>}

      {showAdd && (
        <CoverAddDialog
          onClose={() => setShowAdd(false)}
          onUpload={() => { setShowAdd(false); fileRef.current?.click() }}
          onGif={() => { setShowAdd(false); setShowGif(true) }}
        />
      )}

      {showGif && (
        <GifPicker
          onClose={() => setShowGif(false)}
          onPick={(url) => { setShowGif(false); run(async () => save(url, 50)) }}
        />
      )}
    </div>
  )
}
