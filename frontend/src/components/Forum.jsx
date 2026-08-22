import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { imageUploadEnabled, uploadImage } from '../cloudinary'
import Loading from './Loading'

const MAX_POST = 2000
const MAX_COMMENT = 1000

/**
 * Dien dan cong khai.
 *
 * Khach chua dang nhap DOC duoc het nhung khong dang/thich/binh luan duoc - de nguoi
 * moi ghe qua thay noi dung that truoc khi quyet dinh co dang ky khong.
 */
export default function Forum({ token, onBack, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [posts, setPosts] = useState(null)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState({})

  const errMap = {
    post_empty: t('forum_err_empty'),
    post_too_long: t('forum_err_too_long'),
    image_url_invalid: t('forum_err_image'),
    image_type_invalid: t('forum_err_image_type'),
    image_too_large: t('forum_err_image_size'),
    image_upload_failed: t('forum_err_image_upload'),
    rate_limited: t('auth_rate_limited'),
  }

  const load = useCallback(() => {
    fetch(`${API_BASE}/forum/posts`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [token])

  useEffect(load, [load])

  const call = async (path, options) => {
    const res = await fetch(`${API_BASE}/forum${path}`, {
      ...options,
      headers: { ...authHeaders(token), 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(errMap[body.message] || body.message || `Error ${res.status}`)
    }
  }

  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // chon lai cung file van kich hoat duoc
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      setImageUrl(await uploadImage(file))
    } catch (err) {
      setError(errMap[err.message] || err.message)
    } finally {
      setUploading(false)
    }
  }

  const submitPost = async (e) => {
    e.preventDefault()
    setError(null)
    setPosting(true)
    try {
      await call('/posts', { method: 'POST', body: JSON.stringify({ content: text, imageUrl }) })
      setText('')
      setImageUrl(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  const submitComment = async (postId) => {
    const content = (commentText[postId] || '').trim()
    if (!content) return
    try {
      await call(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) })
      setCommentText((m) => ({ ...m, [postId]: '' }))
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const act = async (path, method = 'POST') => {
    try {
      await call(path, { method })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const when = (iso) =>
    new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })

  const authorLink = (id, name) => (
    <button type="button" className="ft-name-link fw-semibold" onClick={() => onSelectUser(id)}>
      {name}
    </button>
  )

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>{t('back')}</button>

      <h3 className="h5 mb-1">{t('forum_title')}</h3>
      <p className="text-secondary small mb-3">{t('forum_subtitle')}</p>

      {error && (
        <div className="alert alert-danger py-2 small" role="button" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {token ? (
        <form onSubmit={submitPost} className="ft-card p-3 mb-4">
          <textarea
            className="form-control mb-2"
            rows={3}
            maxLength={MAX_POST}
            placeholder={t('forum_placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {imageUrl && (
            <div className="position-relative d-inline-block mb-2">
              <img src={imageUrl} alt="" style={{ maxHeight: 160, borderRadius: 8 }} />
              <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                onClick={() => setImageUrl(null)}>
                ✕
              </button>
            </div>
          )}

          <div className="d-flex gap-2 align-items-center flex-wrap">
            {imageUploadEnabled() && (
              <label className="btn btn-sm btn-outline-secondary mb-0">
                {uploading ? t('forum_uploading') : t('forum_add_image')}
                <input type="file" accept="image/*" hidden onChange={pickImage} disabled={uploading} />
              </label>
            )}
            <span className="text-secondary small ms-auto">{text.length}/{MAX_POST}</span>
            <button className="btn btn-success" disabled={posting || uploading || (!text.trim() && !imageUrl)}>
              {posting ? t('auth_submitting') : t('forum_post')}
            </button>
          </div>
        </form>
      ) : (
        <div className="alert alert-secondary py-2 small">{t('forum_login_hint')}</div>
      )}

      {posts === null ? (
        <Loading rows={4} />
      ) : posts.length === 0 ? (
        <p className="text-secondary">{t('forum_empty')}</p>
      ) : (
        posts.map((p) => (
          <div key={p.id} className="ft-card p-3 mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="flex-grow-1 small" style={{ minWidth: 0 }}>
                {authorLink(p.authorId, p.authorName)}
                <span className="text-secondary ms-2" style={{ fontSize: '0.72rem' }}>{when(p.createdAt)}</span>
              </span>
              {p.canDelete && (
                <button className="btn btn-sm btn-link text-danger p-0"
                  onClick={() => act(`/posts/${p.id}`, 'DELETE')}>
                  {t('forum_delete')}
                </button>
              )}
            </div>

            {p.content && (
              <p className="mb-2" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {p.content}
              </p>
            )}

            {p.imageUrl && (
              <img src={p.imageUrl} alt="" loading="lazy"
                style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 8 }} className="mb-2" />
            )}

            <div className="d-flex gap-3 align-items-center small">
              <button className={p.likedByMe ? 'ft-name-link text-danger' : 'ft-name-link'}
                disabled={!token} onClick={() => act(`/posts/${p.id}/like`)}>
                {p.likedByMe ? '♥' : '♡'} {p.likeCount}
              </button>
              {token && (
                <button className="ft-name-link text-secondary"
                  onClick={() => act(`/posts/${p.id}/report`)}>
                  {t('forum_report')}
                </button>
              )}
            </div>

            {p.comments.length > 0 && (
              <div className="mt-2 pt-2 border-top d-flex flex-column gap-1">
                {p.comments.map((c) => (
                  <div key={c.id} className="small">
                    {authorLink(c.authorId, c.authorName)}
                    <span className="ms-2" style={{ overflowWrap: 'anywhere' }}>{c.content}</span>
                  </div>
                ))}
              </div>
            )}

            {token && (
              <div className="d-flex gap-2 mt-2">
                <input
                  className="form-control form-control-sm"
                  maxLength={MAX_COMMENT}
                  placeholder={t('forum_comment_placeholder')}
                  value={commentText[p.id] || ''}
                  onChange={(e) => setCommentText((m) => ({ ...m, [p.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment(p.id)}
                />
                <button className="btn btn-sm btn-outline-success flex-shrink-0"
                  onClick={() => submitComment(p.id)}>
                  {t('chat_send')}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
