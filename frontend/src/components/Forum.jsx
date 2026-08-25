import { useCallback, useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { imageUploadEnabled, uploadMedia } from '../cloudinary'
import { giphyEnabled } from '../giphy'
import { relativeTime, isVideoUrl } from '../utils'
import Avatar from './Avatar'
import BadgeFlair from './BadgeFlair'
import ReactionBar from './ReactionBar'
import ReactionsModal from './ReactionsModal'
import GifPicker from './GifPicker'
import Lightbox from './Lightbox'
import Loading from './Loading'
import MentionInput from './MentionInput'
import { toast } from '../ui/toast'
import { confirmDialog } from './ConfirmDialog'
import { renderMentions } from '../mentions'

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
export default function Forum({ token, myName, myAvatar, myUserId, isAdmin, focusPostId, onClearFocus,
  onBack, onSelectUser }) {
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
  /*
   * Dang sua cai gi: { kind: 'post' | 'comment', id, text }, null = khong sua gi.
   *
   * Mot o duy nhat chu khong phai mot o cho moi bai: mo hai o sua cung luc roi bam Luu
   * nham cai nay sang cai kia la chuyen rat de xay ra, ma khong ai can lam viec do.
   */
  const [editing, setEditing] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  // Hop "ai da tha cam xuc" dang mo: { kind: 'posts'|'comments', id }, null = dong
  const [reactorsFor, setReactorsFor] = useState(null)
  // Anh/video dang xem phong to (lightbox); null = dong
  const [lightbox, setLightbox] = useState(null)
  // Bai nao dang gui binh luan - khoa nut Gui de bam nhieu lan khong ra nhieu cmt
  const [sendingPost, setSendingPost] = useState(null)
  // O chon GIF dang mo cho muc tieu nao: 'post' | postId (so, cho o binh luan) | null
  const [gifTarget, setGifTarget] = useState(null)
  // GIF/anh dinh kem cho o binh luan tung bai: { [postId]: url }
  const [commentImage, setCommentImage] = useState({})

  const errMap = {
    post_empty: t('forum_err_empty'),
    post_too_long: t('forum_err_too_long'),
    image_url_invalid: t('forum_err_image'),
    image_type_invalid: t('forum_err_image_type'),
    media_type_invalid: t('forum_err_media_type'),
    image_too_large: t('forum_err_image_size'),
    video_too_large: t('forum_err_video_size'),
    image_upload_failed: t('forum_err_image_upload'),
    rate_limited: t('auth_rate_limited'),
    comment_empty: t('forum_err_comment_empty'),
    comment_too_long: t('forum_err_comment_too_long'),
    edit_window_over: t('forum_err_edit_window'),
    delete_window_over: t('forum_err_delete_window'),
    not_your_post: t('forum_err_not_yours'),
    not_your_comment: t('forum_err_not_yours'),
  }

  /*
   * focusPostId co gia tri -> chi lay DUNG bai do, kem het binh luan.
   *
   * Khong loc tu bang tin: bai duoc nhac toi trong chuong co the nam ngoai 20 bai dau,
   * va binh luan lam nguoi dung duoc bao co the la binh luan thu 50 - ban rut gon
   * 3 binh luan cua bang tin khong chua no.
   */
  const load = useCallback(() => {
    const url = focusPostId
      ? `${API_BASE}/forum/posts/${focusPostId}`
      : `${API_BASE}/forum/posts`
    // no-store: sau khi xoa/sua, tai lai PHAI lay ban moi - khong thi trinh duyet tra
    // ban cache cu (bao "da xoa" ma cmt van con, F5 mot luc moi mat)
    fetch(url, { headers: authHeaders(token), cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      // Bai da bi xoa -> mang rong, o duoi hien cau "bai nay khong con nua"
      .then((data) => setPosts(data == null ? [] : (focusPostId ? [data] : data)))
      .catch(() => setPosts([]))
  }, [token, focusPostId])

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

  const pickMedia = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // chon lai cung file van kich hoat duoc
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      setImageUrl(await uploadMedia(file))
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
    const image = commentImage[postId] || null
    if (!content && !image) return
    // Dang gui bai nay roi -> bo qua, tranh bam nhieu lan ra nhieu cmt trung
    if (sendingPost === postId) return
    setSendingPost(postId)
    try {
      await call(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, imageUrl: image, parentId: replyTo[postId]?.id ?? null }),
      })
      setCommentText((m) => ({ ...m, [postId]: '' }))
      setCommentImage((m) => ({ ...m, [postId]: null }))
      setReplyTo((m) => ({ ...m, [postId]: null }))
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingPost(null)
    }
  }

  const startEdit = (kind, id, content) => setEditing({ kind, id, text: content })

  const saveEdit = async () => {
    const content = editing.text.trim()
    if (!content) return
    setError(null)
    setSavingEdit(true)
    try {
      await call(`/${editing.kind === 'post' ? 'posts' : 'comments'}/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })
      setEditing(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  /**
   * Hoi lai truoc khi xoa. Xoa la khong lay lai duoc, va nut xoa nam ngay canh nut sua -
   * bam nham mot ly la mat ca bai.
   */
  const confirmDelete = async (kind, id, authorId) => {
    const path = kind === 'post' ? 'posts' : 'comments'
    // Admin go bai/cmt cua NGUOI KHAC -> hoi ly do (se bao cho nguoi dang qua chuong)
    if (isAdmin && authorId !== myUserId) {
      const reason = await confirmDialog({
        title: t('forum_delete'),
        message: t('forum_delete_reason_prompt'),
        input: true,
        placeholder: t('forum_delete_reason_prompt'),
        confirmText: t('forum_delete'),
        danger: true,
      })
      if (reason === null) return // bam Huy o hop nhap ly do
      if (editing?.kind === kind && editing.id === id) setEditing(null)
      act(`/${path}/${id}?reason=${encodeURIComponent(reason)}`, 'DELETE',
        kind === 'post' ? t('forum_toast_post_deleted') : t('forum_toast_comment_deleted'))
      return
    }
    // Tu xoa cua chinh minh -> chi hoi xac nhan
    const ok = await confirmDialog({
      message: kind === 'post' ? t('forum_confirm_delete_post') : t('forum_confirm_delete_comment'),
      confirmText: t('forum_delete'),
      danger: true,
    })
    if (!ok) return
    if (editing?.kind === kind && editing.id === id) setEditing(null)
    act(`/${path}/${id}`, 'DELETE',
      kind === 'post' ? t('forum_toast_post_deleted') : t('forum_toast_comment_deleted'))
  }

  /** O sua dung chung cho bai va binh luan - khac nhau moi so dong va gioi han ky tu. */
  const editBox = (rows, maxLength) => (
    <div className="ft-edit-box">
      <textarea
        className="form-control"
        rows={rows}
        maxLength={maxLength}
        value={editing.text}
        autoFocus
        onChange={(e) => setEditing((v) => ({ ...v, text: e.target.value }))}
      />
      <div className="d-flex gap-2 mt-2">
        <button type="button" className="btn btn-sm btn-success"
          disabled={savingEdit || !editing.text.trim()} onClick={saveEdit}>
          {t('forum_edit_save')}
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary"
          disabled={savingEdit} onClick={() => setEditing(null)}>
          {t('forum_edit_cancel')}
        </button>
      </div>
    </div>
  )

  const act = async (path, method = 'POST', successMsg) => {
    try {
      await call(path, { method })
      if (successMsg) toast.success(successMsg)
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
  /** Tha / doi / go cam xuc. kind = 'posts' hoac 'comments'. */
  const react = async (kind, id, type) => {
    try {
      await call(`/${kind}/${id}/react`, { method: 'POST', body: JSON.stringify({ type }) })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  // Chon GIF xong (da la URL Cloudinary): gan vao dung muc tieu
  const onGifPick = (url) => {
    if (gifTarget === 'post') {
      setImageUrl(url)
    } else if (typeof gifTarget === 'number') {
      setCommentImage((m) => ({ ...m, [gifTarget]: url }))
      setOpenComment((m) => ({ ...m, [gifTarget]: true }))
    }
    setGifTarget(null)
  }

  const startReply = (postId, comment) => {
    setReplyTo((m) => ({ ...m, [postId]: comment }))
    setOpenComment((m) => ({ ...m, [postId]: true }))
  }

  const when = (iso) => relativeTime(iso, t, lang)

  /** Mot binh luan - dung chung cho ca binh luan goc lan tra loi. */
  const renderComment = (post, c) => (
    <div className="d-flex gap-2">
      <button type="button" className="ft-avatar-btn" onClick={() => onSelectUser(c.authorId)}>
        <Avatar name={c.authorName} src={c.authorAvatar} size={28} />
      </button>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        {editing?.kind === 'comment' && editing.id === c.id ? (
          editBox(2, MAX_COMMENT)
        ) : (
          <>
            <div className="ft-comment-bubble">
              <button type="button" className="ft-name-link fw-semibold d-block"
                style={{ fontSize: '0.8rem' }} onClick={() => onSelectUser(c.authorId)}>
                {c.authorName}
                {c.authorIsAdmin && <span className="ft-admin-tag ms-1">{t('role_admin')}</span>}
                <BadgeFlair code={c.authorBadge} />
              </button>
              {c.content && <span className="small" style={{ overflowWrap: 'anywhere' }}>{renderMentions(c.content, onSelectUser)}</span>}
              {c.imageUrl && (
                <img src={c.imageUrl} alt="" loading="lazy" className="ft-comment-image"
                  role="button" onClick={() => setLightbox(c.imageUrl)} />
              )}
            </div>

            <div className="ft-comment-tools">
              {token && (
                <button type="button" className="ft-name-link text-secondary"
                  onClick={() => startReply(post.id, c)}>
                  {t('forum_reply')}
                </button>
              )}
              <ReactionBar
                compact
                current={c.myReaction}
                counts={c.reactions}
                total={c.totalReactions}
                disabled={!token}
                onReact={(type) => react('comments', c.id, type)}
                onShowReactors={() => setReactorsFor({ kind: 'comments', id: c.id })}
              />
              {c.canEdit && (
                <button type="button" className="ft-name-link text-secondary"
                  onClick={() => startEdit('comment', c.id, c.content)}>
                  {t('forum_edit')}
                </button>
              )}
              {c.canDelete && (
                <button type="button" className="ft-name-link text-secondary"
                  onClick={() => confirmDelete('comment', c.id, c.authorId)}>
                  {t('forum_delete')}
                </button>
              )}
              {c.editedAt && <span className="text-secondary">{t('forum_edited')}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>{t('back')}</button>

      <h3 className="h5 mb-1">{t('forum_title')}</h3>
      {focusPostId ? (
        <p className="text-secondary small mb-3">
          {t('forum_one_post')}
          <button type="button" className="ft-name-link ms-2" onClick={onClearFocus}>
            {t('forum_back_to_feed')}
          </button>
        </p>
      ) : (
        <p className="text-secondary small mb-3">{t('forum_subtitle')}</p>
      )}

      {error && (
        <div className="alert alert-danger py-2 small" role="button" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {token && !focusPostId ? (
        <form onSubmit={submitPost} className="ft-card p-3 mb-4">
          <div className="d-flex gap-2">
            <Avatar name={myName} src={myAvatar} size={40} />
            <MentionInput
              as="textarea"
              token={token}
              className="form-control ft-composer"
              rows={2}
              maxLength={MAX_POST}
              placeholder={t('forum_placeholder').replace('{name}', myName || '')}
              value={text}
              onChange={setText}
            />
          </div>

          {imageUrl && (
            <div className="position-relative d-inline-block mt-2">
              {isVideoUrl(imageUrl) ? (
                <video src={imageUrl} controls style={{ maxHeight: 160, borderRadius: 10 }} />
              ) : (
                <img src={imageUrl} alt="" style={{ maxHeight: 160, borderRadius: 10 }} />
              )}
              <button type="button" className="btn btn-sm btn-dark position-absolute top-0 end-0 m-1 rounded-circle"
                onClick={() => setImageUrl(null)} aria-label="X">
                ✕
              </button>
            </div>
          )}

          <div className="d-flex gap-2 align-items-center flex-wrap mt-2 pt-2 border-top">
            {imageUploadEnabled() && (
              <label className="ft-attach-btn mb-0">
                {uploading ? t('forum_uploading') : t('forum_add_image')}
                <input type="file" accept="image/*,video/*" hidden onChange={pickMedia} disabled={uploading} />
              </label>
            )}
            {giphyEnabled() && (
              <button type="button" className="ft-gif-open-btn" onClick={() => setGifTarget('post')}>
                {t('gif_btn')}
              </button>
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
      ) : focusPostId ? null : (
        <div className="alert alert-secondary py-2 small">{t('forum_login_hint')}</div>
      )}

      {posts === null ? (
        <Loading rows={4} />
      ) : posts.length === 0 ? (
        <p className="text-secondary">{focusPostId ? t('forum_post_gone') : t('forum_empty')}</p>
      ) : (
        posts.map((p) => (
          <article key={p.id} className="ft-card ft-post mb-3">
            <header className="d-flex align-items-center gap-2 p-3 pb-2">
              <button type="button" className="ft-avatar-btn" onClick={() => onSelectUser(p.authorId)}>
                <Avatar name={p.authorName} src={p.authorAvatar} size={40} />
              </button>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <button type="button" className="ft-name-link fw-semibold d-block text-truncate"
                  onClick={() => onSelectUser(p.authorId)}>
                  {p.authorName}
                  {p.authorIsAdmin && <span className="ft-admin-tag ms-1">{t('role_admin')}</span>}
                  <BadgeFlair code={p.authorBadge} />
                </button>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  {when(p.createdAt)}
                  {p.editedAt && ` · ${t('forum_edited')}`}
                </span>
              </div>
              {p.canEdit && (
                <button className="ft-post-menu" title={t('forum_edit')}
                  onClick={() => startEdit('post', p.id, p.content)}>
                  ✎
                </button>
              )}
              {p.canDelete && (
                <button className="ft-post-menu" title={t('forum_delete')}
                  onClick={() => confirmDelete('post', p.id, p.authorId)}>
                  ✕
                </button>
              )}
            </header>

            {editing?.kind === 'post' && editing.id === p.id ? (
              <div className="px-3 pb-2">{editBox(3, MAX_POST)}</div>
            ) : (
              p.content && (
                <p className="px-3 mb-2 ft-post-text" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {renderMentions(p.content, onSelectUser)}
                </p>
              )
            )}

            {/* Anh/video trai het be ngang the, khong chua le hai ben - giong bang tin mang xa hoi */}
            {p.imageUrl && (
              <div className="ft-post-media">
                {isVideoUrl(p.imageUrl) ? (
                  <video src={p.imageUrl} controls preload="metadata" className="ft-post-image" />
                ) : (
                  <img src={p.imageUrl} alt="" loading="lazy" className="ft-post-image"
                    role="button" onClick={() => setLightbox(p.imageUrl)} />
                )}
                <button type="button" className="ft-media-expand" aria-label={t('lightbox_zoom')}
                  onClick={() => setLightbox(p.imageUrl)}>
                  ⤢
                </button>
              </div>
            )}

            {/*
              Bieu tuong va so nam CHUNG mot hang, can trai.
              Tach thanh hang dem rieng roi hang nut rieng thi mot bai chi vai chu se co
              phan chan cao hon ca phan noi dung.
            */}
            <div className="ft-post-actions">
              <ReactionBar
                current={p.myReaction}
                counts={p.reactions}
                total={p.totalReactions}
                disabled={!token}
                onReact={(type) => react('posts', p.id, type)}
                onShowReactors={() => setReactorsFor({ kind: 'posts', id: p.id })}
              />
              <button className="ft-post-action" disabled={!token} title={t('forum_comment')}
                onClick={() => setOpenComment((m) => ({ ...m, [p.id]: !m[p.id] }))}>
                <span className="ft-action-icon">💬</span>
                {p.comments.length > 0 && <span className="ft-num">{p.comments.length}</span>}
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
                  {/* GIF/anh dinh kem dang cho gui */}
                  {commentImage[p.id] && (
                    <div className="ft-comment-attach">
                      <img src={commentImage[p.id]} alt="" />
                      <button type="button" className="ft-comment-attach-x"
                        onClick={() => setCommentImage((m) => ({ ...m, [p.id]: null }))} aria-label="X">✕</button>
                    </div>
                  )}
                  <div className="d-flex gap-2 align-items-center">
                    <Avatar name={myName} src={myAvatar} size={28} />
                    <MentionInput
                      as="input"
                      token={token}
                      className="form-control form-control-sm rounded-pill"
                      maxLength={MAX_COMMENT}
                      placeholder={t('forum_comment_placeholder')}
                      value={commentText[p.id] || ''}
                      autoFocus
                      dropUp
                      onChange={(val) => setCommentText((m) => ({ ...m, [p.id]: val }))}
                      onKeyDown={(e) => e.key === 'Enter' && !e.repeat && submitComment(p.id)}
                    />
                    {giphyEnabled() && (
                      <button type="button" className="ft-gif-open-btn flex-shrink-0"
                        onClick={() => setGifTarget(p.id)}>
                        {t('gif_btn')}
                      </button>
                    )}
                    <button className="btn btn-sm btn-success rounded-pill flex-shrink-0"
                      disabled={sendingPost === p.id || (!(commentText[p.id] || '').trim() && !commentImage[p.id])}
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

      {reactorsFor && (
        <ReactionsModal
          kind={reactorsFor.kind}
          id={reactorsFor.id}
          token={token}
          onClose={() => setReactorsFor(null)}
          onSelectUser={onSelectUser}
        />
      )}

      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />

      {gifTarget !== null && (
        <GifPicker onPick={onGifPick} onClose={() => setGifTarget(null)} />
      )}
    </div>
  )
}
