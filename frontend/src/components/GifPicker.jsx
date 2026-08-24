import { useEffect, useState } from 'react'
import { trendingGifs, searchGifs } from '../giphy'
import { uploadFromUrl } from '../cloudinary'
import { useTranslation } from '../i18n'

/**
 * O chon GIF kieu Messenger: go tu khoa -> luoi GIF; mac dinh hien trending.
 *
 * Chon mot GIF -> tu tai no len Cloudinary roi tra URL Cloudinary qua onPick (giu nguyen
 * tac backend chi nhan URL Cloudinary). Bat buoc hien "Powered by GIPHY" theo dieu khoan.
 *
 * @param onPick (cloudinaryUrl) => void
 * @param onClose () => void
 */
export default function GifPicker({ onPick, onClose }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(null) // null = dang tai
  const [error, setError] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)

  // Cho go xong (350ms) moi goi - tiet kiem luot API. Trong rong -> trending.
  useEffect(() => {
    let alive = true
    setError(false)
    setItems(null)
    const run = () => {
      const p = query.trim() ? searchGifs(query.trim()) : trendingGifs()
      p.then((list) => { if (alive) setItems(list) })
        .catch(() => { if (alive) { setItems([]); setError(true) } })
    }
    const timer = setTimeout(run, query.trim() ? 350 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [query])

  const choose = async (item) => {
    if (uploadingId) return
    setUploadingId(item.id)
    setError(false)
    try {
      const url = await uploadFromUrl(item.full)
      onPick(url)
    } catch {
      setError(true)
      setUploadingId(null)
    }
  }

  return (
    <div className="ft-gif-overlay" onClick={onClose}>
      <div className="ft-gif-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-gif-head">
          <input
            className="form-control form-control-sm"
            placeholder={t('gif_search_placeholder')}
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="ft-gif-close" aria-label="X" onClick={onClose}>✕</button>
        </div>

        <div className="ft-gif-grid">
          {items === null ? (
            // Khung xuong nhap nhay trong luc tai - gon gang hon la mot dau "..."
            Array.from({ length: 9 }).map((_, i) => <div key={i} className="ft-gif-skel" />)
          ) : items.length === 0 ? (
            <p className="ft-gif-msg">{error ? t('gif_error') : t('gif_empty')}</p>
          ) : (
            items.map((it) => (
              <button key={it.id} type="button" className="ft-gif-item"
                disabled={Boolean(uploadingId)} onClick={() => choose(it)}>
                <img src={it.preview} alt="" loading="lazy" />
                {uploadingId === it.id && <span className="ft-gif-uploading">…</span>}
              </button>
            ))
          )}
        </div>

        <div className="ft-gif-foot">Powered by GIPHY</div>
      </div>
    </div>
  )
}
