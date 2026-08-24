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
 * Anh bia kem doi anh + chinh vi tri kieu Facebook: KEO 2 chieu (trai/phai + len/xuong)
 * va THANH TRUOT phong to. File di thang len Cloudinary, backend luu URL + vi tri (x,y) +
 * zoom. Nhan ca GIF. Chua co anh -> vach san co mac dinh.
 */
export default function CoverUpload({ token, coverUrl, coverPos, coverX, coverZoom, onSaved }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [moving, setMoving] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [posX, setPosX] = useState(coverX ?? 50)
  const [posY, setPosY] = useState(coverPos ?? 50)
  const [zoom, setZoom] = useState(coverZoom ?? 100)
  const drag = useRef(null)

  // Dong bo khi du lieu tu ngoai doi (tai lai / doi anh)
  useEffect(() => setPosX(coverX ?? 50), [coverX])
  useEffect(() => setPosY(coverPos ?? 50), [coverPos])
  useEffect(() => setZoom(coverZoom ?? 100), [coverZoom])

  const errMap = {
    image_type_invalid: t('forum_err_image_type'),
    media_type_invalid: t('forum_err_media_type'),
    image_too_large: t('forum_err_image_size'),
    video_too_large: t('forum_err_video_size'),
    image_upload_failed: t('forum_err_image_upload'),
    image_url_invalid: t('forum_err_image_upload'),
    rate_limited: t('auth_rate_limited'),
  }

  /** Gui len backend. url rong = go anh. */
  const save = async (url, x, y, z) => {
    const res = await fetch(`${API_BASE}/auth/cover`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverUrl: url, coverX: x, coverPos: y, coverZoom: z }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'image_upload_failed')
    }
    const data = await res.json()
    onSaved({
      coverUrl: data.coverUrl || null,
      coverPos: typeof data.coverPos === 'number' ? data.coverPos : 50,
      coverX: typeof data.coverX === 'number' ? data.coverX : 50,
      coverZoom: typeof data.coverZoom === 'number' ? data.coverZoom : 100,
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
    // Anh/GIF moi -> ve giua, khong zoom. Bia chi nhan anh + GIF.
    run(async () => save(await uploadImage(file), 50, 50, 100))
  }

  const remove = () => run(async () => {
    await save('', null, null, null)
    setMoving(false)
  })

  const savePosition = () => run(async () => {
    await save(coverUrl, Math.round(posX), Math.round(posY), Math.round(zoom))
    setMoving(false)
  })

  const cancelPosition = () => {
    setPosX(coverX ?? 50)
    setPosY(coverPos ?? 50)
    setZoom(coverZoom ?? 100)
    setMoving(false)
  }

  // Keo 2 chieu de chinh vi tri (chi khi dang chinh, va khong bam trung nut/thanh truot)
  const onDown = (e) => {
    if (!moving) return
    if (e.target.closest('.ft-cover-actions, .ft-cover-hint, .ft-cover-zoombar')) return
    drag.current = { x: e.clientX, y: e.clientY, px: posX, py: posY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    if (!moving || !drag.current) return
    const el = e.currentTarget
    const w = el.offsetWidth || 400
    const h = el.offsetHeight || 200
    // Keo phai (dx>0) -> lo phan trai -> x giam; keo xuong -> lo phan tren -> y giam
    setPosX(clamp(drag.current.px - ((e.clientX - drag.current.x) / w) * 100))
    setPosY(clamp(drag.current.py - ((e.clientY - drag.current.y) / h) * 100))
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
      <CoverMedia url={coverUrl} x={posX} y={posY} zoom={zoom} />

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
                  ⤢ {t('profile_cover_reposition')}
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

      {moving && (
        <>
          <div className="ft-cover-hint">{t('profile_cover_drag_hint')}</div>
          <div className="ft-cover-zoombar">
            <span aria-hidden="true">🔍</span>
            <input type="range" min="100" max="300" value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))} />
          </div>
        </>
      )}
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
          onPick={(url) => { setShowGif(false); run(async () => save(url, 50, 50, 100)) }}
        />
      )}
    </div>
  )
}
