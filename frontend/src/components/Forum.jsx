import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { imageUploadEnabled, uploadImage } from '../cloudinary'
import Avatar from './Avatar'
import Loading from './Loading'

const MAX_POST = 2000
const MAX_COMMENT = 1000

/*
 * Hoi lai bang tin moi 20 giay.
 *
 * Khong co no thi tim/binh luan cua nguoi khac chi hien sau khi tai lai trang - hai
 * nguoi cung mo se thay hai ban khac nhau ma khong biet.
 *
 * Khong dung WebSocket: may chu goi free ngu khi khong ai dung, giu ket noi song lien
 * tuc vua phuc tap vua hay dut. Voi mot dien dan vai nguoi thi 20 giay la du.
 */
const REFRESH_MS = 20_000

/**
 * Dien dan cong khai.
 *
 * Khach chua dang nhap DOC duoc het nhung khong dang/thich/binh luan duoc - de nguoi
 * moi ghe qua thay noi dung that truoc khi quyet dinh co dang ky khong.
 */
export default function Forum({ token, myName, onBack, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [posts, setPosts] = useState(null)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState({})
  // Bai nao dang mo o nhap binh luan - giong Facebook, bam "Binh luan" moi hien
  const [openComment, setOpenComment] = useState({})
  // Dang tra loi binh luan nao: { [postId]: comment }
  const [replyTo, setReplyTo] = useState({})

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

  useEffect(() => {
    load()
    /*
     * Tab bi an thi khong hoi nua. Mot tab bo quen mo ca ngay ma cu 20 giay lai goi
     * mot lan la lang phi hoan toan - khong ai dang nhin no.
     */
    const tick = () => {
      if (!document.hidden) load()
    }
    const timer = setInterval(tick, REFRESH_MS)
    // Quay lai tab thi lam moi ngay, khong bat cho het chu ky
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

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
      await call(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId: replyTo[postId]?.id ?? null }),
      })
      setCommentText((m) => ({ ...m, [postId]: '' }))
      setReplyTo((m) => ({ ...m, [postId]: null }))
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

  /**
   * Doi giao dien NGAY roi moi goi may chu.
   *
   * Cho may chu tra loi xong moi doi thi bam tim co do tre thay ro - nhat la khi may
   * chu goi free vua ngu day. Goi that that bai thi load() ben duoi tra lai dung trang thai.
   */
  const toggleLike = async (post) => {
    setPosts((list) => list.map((p) => (p.id === post.id
      ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
      : p)))
    await act(`/posts/${post.id}/like`)
  }

  const startReply = (postId, comment) => {
    setReplyTo((m) => ({ ...m, [postId]: comment }))
    setOpenComment((m) => ({ ...m, [postId]: true }))
  }

  /** "5 phut truoc" doc nhanh hon "13:20 22-08" voi bai vua dang. */
  const when = (iso) => {
    const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (diffMin < 1) return t('forum_just_now')
    if (diffMin < 60) return t('forum_minutes_ago').replace('{n}', diffMin)
    if (diffMin < 24 * 60) return t('forum_hours_ago').replace('{n}', Math.floor(diffMin / 60))
    return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  /** Mot binh luan - dung chung cho ca binh luan goc lan tra loi. */
  const renderComment = (post, c) => (
    <div className="d-flex gap-2">
      <button type="button" className="ft-avatar-btn" onClick={() => onSelectUser(c.authorId)}>
        <Avatar name={c.authorName} size={28} />
      </button>
      <div style={{ minWidth: 0 }}>
        <div className="ft-comment-bubble">
          <button type="button" className="ft-name-link fw-semibold d-block"
            style={{ fontSize: '0.8rem' }} onClick={() => onSelectUser(c.authorId)}>
            {c.authorName}
          </button>
          <span className="small" style={{ overflowWrap: 'anywhere' }}>{c.content}</span>
        </div>
        {token && (
          <button type="button" className="ft-name-link text-secondary ps-2"
            style={{ fontSize: '0.72rem' }} onClick={() => startReply(post.id, c)}>
            {t('forum_reply')}
          </button>
        )}
      </div>
    </div>
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
          <div className="d-flex gap-2">
            <Avatar name={myName} size={40} />
            <textarea
              className="form-control ft-composer"
              rows={2}
              maxLength={MAX_POST}
              placeholder={t('forum_placeholder').replace('{name}', myName || '')}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {imageUrl && (
            <div className="position-relative d-inline-block mt-2">
              <img src={imageUrl} alt="" style={{ maxHeight: 160, borderRadius: 10 }} />
              <button type="button" className="btn btn-sm btn-dark position-absolute top-0 end-0 m-1 rounded-circle"
                onClick={() => setImageUrl(null)} aria-label="X">
                ✕
              </button>
            </div>
          )}

          <div className="d-flex gap-2 align-items-center flex-wrap mt-2 pt-2 border-top">
            {imageUploadEnabled() && (
              <label className="ft-post-action mb-0">
                🖼 <span>{uploading ? t('forum_uploading') : t('forum_add_image')}</span>
                <input type="file" accept="image/*" hidden onChange={pickImage} disabled={uploading} />
              </label>
            )}
            {text.length >= MAX_POST * 0.8 && (
              <span className="text-secondary small">{text.length}/{MAX_POST}</span>
            )}
            <button className="btn btn-success rounded-pill px-4 ms-auto"
              disabled={posting || uploading || (!text.trim() && !imageUrl)}>
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
          <article key={p.id} className="ft-card ft-post mb-3">
            <header className="d-flex align-items-center gap-2 p-3 pb-2">
              <button type="button" className="ft-avatar-btn" onClick={() => onSelectUser(p.authorId)}>
                <Avatar name={p.authorName} size={40} />
              </button>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <button type="button" className="ft-name-link fw-semibold d-block text-truncate"
                  onClick={() => onSelectUser(p.authorId)}>
                  {p.authorName}
                </button>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{when(p.createdAt)}</span>
              </div>
              {p.canDelete && (
                <button className="ft-post-menu" title={t('forum_delete')}
                  onClick={() => act(`/posts/${p.id}`, 'DELETE')}>
                  ✕
                </button>
              )}
            </header>

            {p.content && (
              <p className="px-3 mb-2" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {p.content}
              </p>
            )}

            {/* Anh trai het be ngang the, khong chua le hai ben - giong bang tin mang xa hoi */}
            {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" className="ft-post-image" />}

            {(p.likeCount > 0 || p.comments.length > 0) && (
              <div className="d-flex gap-3 px-3 pt-2 text-secondary" style={{ fontSize: '0.8rem' }}>
                {p.likeCount > 0 && <span>♥ {p.likeCount}</span>}
                {p.comments.length > 0 && (
                  <span className="ms-auto">
                    {p.comments.length} {t('forum_comments_count')}
                  </span>
                )}
              </div>
            )}

            <div className="ft-post-actions mt-2">
              <button className={p.likedByMe ? 'ft-post-action liked' : 'ft-post-action'}
                disabled={!token} onClick={() => toggleLike(p)}>
                {p.likedByMe ? '♥' : '♡'} <span>{t('forum_like')}</span>
              </button>
              <button className="ft-post-action" disabled={!token}
                onClick={() => setOpenComment((m) => ({ ...m, [p.id]: !m[p.id] }))}>
                💬 <span>{t('forum_comment')}</span>
              </button>
            </div>

            {(p.comments.length > 0 || openComment[p.id]) && (
              <div className="px-3 pb-3 pt-2 d-flex flex-column gap-2">
                {p.comments.filter((c) => c.parentId == null).map((root) => (
                  <div key={root.id} className="d-flex flex-column gap-2">
                    {renderComment(p, root)}
                    {/* Tra loi thut vao mot bac, du de thay quan he ma khong be nho o chu */}
                    {p.comments.filter((r) => r.parentId === root.id).map((reply) => (
                      <div key={reply.id} className="ft-comment-reply">
                        {renderComment(p, reply)}
                      </div>
                    ))}
                  </div>
                ))}

                {token && openComment[p.id] && (
                  <>
                  {replyTo[p.id] && (
                    <div className="small text-secondary d-flex align-items-center gap-2">
                      <span>{t('forum_replying_to')} {replyTo[p.id].authorName}</span>
                      <button type="button" className="ft-name-link"
                        onClick={() => setReplyTo((m) => ({ ...m, [p.id]: null }))}>
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="d-flex gap-2 align-items-center">
                    <Avatar name={myName} size={28} />
                    <input
                      className="form-control form-control-sm rounded-pill"
                      maxLength={MAX_COMMENT}
                      placeholder={t('forum_comment_placeholder')}
                      value={commentText[p.id] || ''}
                      autoFocus
                      onChange={(e) => setCommentText((m) => ({ ...m, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && submitComment(p.id)}
                    />
                    <button className="btn btn-sm btn-success rounded-pill flex-shrink-0"
                      onClick={() => submitComment(p.id)}>
                      {t('chat_send')}
                    </button>
                  </div>
                  </>
                )}
              </div>
            )}
          </article>
        ))
      )}
    </div>
  )
}
