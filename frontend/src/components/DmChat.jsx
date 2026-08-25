import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { imageUploadEnabled, uploadImage } from '../cloudinary'
import { giphyEnabled } from '../giphy'
import { REACTIONS, REACTION_EMOJI } from '../constants'
import { relativeTime } from '../utils'
import Avatar from './Avatar'
import GifPicker from './GifPicker'
import Loading from './Loading'
import { confirmDialog } from './ConfirmDialog'

const MAX = 2000
const REFRESH_MS = 8000

/**
 * Luong nhan tin 1-1 voi mot nguoi ban. Hoi lai moi 8 giay (khong dung WebSocket).
 * Tin cua minh nam ben phai; co "Da xem" khi doi phuong da doc.
 */
export default function DmChat({ token, other, myName, myAvatar, onBack, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [reactFor, setReactFor] = useState(null) // id tin dang mo bang cam xuc
  const [menuFor, setMenuFor] = useState(null) // id tin dang mo menu ... (thu hoi/ghim)
  const [replyTo, setReplyTo] = useState(null) // tin dang tra loi
  const fileRef = useRef(null)
  const scrollRef = useRef(null)
  const stick = useRef(true)

  const load = useCallback(() => {
    if (!token || !other) return
    fetch(`${API_BASE}/messages/${other.userId}`, { headers: authHeaders(token), cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
  }, [token, other])

  useEffect(() => {
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  // Cuon xuong cuoi khi co tin moi (neu dang o gan day)
  useEffect(() => {
    if (stick.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const post = async (body) => {
    const res = await fetch(`${API_BASE}/messages/${other.userId}`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      stick.current = true
      load()
    }
  }

  const replyId = () => replyTo?.id ?? null

  const send = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    try {
      await post({ content, replyToId: replyId() })
      setText('')
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  const sendImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSending(true)
    try {
      await post({ imageUrl: await uploadImage(file), replyToId: replyId() })
      setReplyTo(null)
    } catch {
      /* bo qua */
    } finally {
      setSending(false)
    }
  }

  const sendGif = async (url) => {
    setShowGif(false)
    await post({ imageUrl: url, replyToId: replyId() })
    setReplyTo(null)
  }

  // Tha / doi / go cam xuc mot tin
  const react = async (messageId, type) => {
    setReactFor(null)
    try {
      await fetch(`${API_BASE}/messages/react/${messageId}`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      load()
    } catch {
      /* bo qua */
    }
  }

  const callMsg = async (path, body) => {
    try {
      await fetch(`${API_BASE}/messages/${path}`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      load()
    } catch {
      /* bo qua */
    }
  }

  const recall = async (id, forEveryone) => {
    setMenuFor(null)
    const ok = await confirmDialog({
      message: forEveryone ? t('dm_recall_all_confirm') : t('dm_recall_me_confirm'),
      confirmText: t('dm_recall'),
      danger: true,
    })
    if (!ok) return
    callMsg(`recall/${id}`, { forEveryone })
  }

  const pin = (id, pinned) => {
    setMenuFor(null)
    callMsg(`pin/${id}`, { pinned })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // "Da xem" hien duoi tin CUOI neu do la tin cua minh va da duoc doc
  const last = messages && messages.length > 0 ? messages[messages.length - 1] : null
  const showSeen = last && last.mine && last.readAt

  const pinned = (messages || []).filter((m) => m.pinned && !m.recalled)
  const pinPreview = (m) => (m.content ? m.content : t('dm_sent_image'))

  return (
    <div className="ft-dm-chat">
      <div className="ft-dm-chat-head">
        <button type="button" className="btn btn-link p-0" onClick={onBack}>‹ {t('back')}</button>
        <button type="button" className="ft-avatar-btn d-flex align-items-center gap-2"
          onClick={() => onSelectUser(other.userId)}>
          <Avatar name={other.name} src={other.avatarUrl} size={30} />
          <span className="fw-semibold">{other.name}</span>
        </button>
      </div>

      {pinned.length > 0 && (
        <div className="ft-dm-pinned">
          {pinned.map((m) => (
            <div key={m.id} className="ft-dm-pinned-row">
              <span className="text-truncate">📌 {pinPreview(m)}</span>
              <button type="button" className="ft-name-link flex-shrink-0"
                onClick={() => pin(m.id, false)} aria-label={t('dm_unpin')}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="ft-dm-scroll" ref={scrollRef} onScroll={onScroll}>
        {messages === null ? (
          <Loading rows={4} />
        ) : messages.length === 0 ? (
          <p className="text-secondary small text-center py-4">{t('dm_empty')}</p>
        ) : (
          messages.map((m) => (
            m.recalled ? (
              <div key={m.id} className={`ft-dm-row ${m.mine ? 'mine' : ''}`}>
                <div className="ft-dm-bubble ft-dm-recalled">🚫 {t('dm_recalled')}</div>
              </div>
            ) : (
            <div key={m.id} className={`ft-dm-row ${m.mine ? 'mine' : ''}`}>
              <div className="ft-dm-msg">
                {m.replyToId && (
                  <div className="ft-dm-quote">
                    ↩ {m.replyToMine ? `${t('dm_you_prefix')} ` : ''}{m.replyToText}
                  </div>
                )}
                <div className="ft-dm-bubble-wrap">
                  <div className="ft-dm-bubble" title={relativeTime(m.createdAt, t, lang)}>
                    {m.content && <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</span>}
                    {m.imageUrl && <img src={m.imageUrl} alt="" loading="lazy" className="ft-dm-image" />}
                  </div>

                  <div className="ft-dm-tools">
                    <button type="button" title={t('dm_more')}
                      onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}>⋯</button>
                    <button type="button" title={t('forum_reply')} onClick={() => setReplyTo(m)}>↩</button>
                    <button type="button" title={t('react_like')}
                      onClick={() => setReactFor(reactFor === m.id ? null : m.id)}>🙂</button>
                  </div>

                  {reactFor === m.id && (
                    <div className="ft-dm-react-picker">
                      {REACTIONS.map((r) => (
                        <button key={r.type} type="button" title={t(r.labelKey)}
                          className={m.myReaction === r.type ? 'active' : ''}
                          onClick={() => react(m.id, r.type)}>{r.emoji}</button>
                      ))}
                    </div>
                  )}

                  {menuFor === m.id && (
                    <div className="ft-dm-menu">
                      <button type="button" onClick={() => pin(m.id, !m.pinned)}>
                        📌 {m.pinned ? t('dm_unpin') : t('dm_pin')}
                      </button>
                      <button type="button" onClick={() => recall(m.id, false)}>
                        🗑️ {t('dm_recall_me')}
                      </button>
                      {m.mine && (
                        <button type="button" className="text-danger" onClick={() => recall(m.id, true)}>
                          ↩️ {t('dm_recall_all')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {m.reactions.length > 0 && (
                  <div className="ft-dm-reacts">
                    {m.reactions.map((rt) => REACTION_EMOJI[rt]).join('')}
                  </div>
                )}
              </div>
            </div>
            )
          ))
        )}
        {showSeen && <div className="ft-dm-seen">{t('dm_seen')}</div>}
      </div>

      {replyTo && (
        <div className="ft-dm-replybar">
          <span className="text-truncate">
            ↩ {t('forum_replying_to')} {replyTo.mine ? t('dm_you_prefix') : other.name}:{' '}
            {replyTo.content || t('dm_sent_image')}
          </span>
          <button type="button" className="ft-name-link flex-shrink-0"
            onClick={() => setReplyTo(null)} aria-label="X">✕</button>
        </div>
      )}

      <form onSubmit={send} className="ft-dm-input">
        {imageUploadEnabled() && (
          <>
            <button type="button" className="ft-gif-open-btn flex-shrink-0"
              onClick={() => fileRef.current?.click()} disabled={sending} title={t('forum_add_image')}>
              🖼️
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              className="d-none" onChange={sendImage} />
          </>
        )}
        {giphyEnabled() && (
          <button type="button" className="ft-gif-open-btn flex-shrink-0"
            onClick={() => setShowGif(true)} disabled={sending}>
            {t('gif_btn')}
          </button>
        )}
        <input
          className="form-control rounded-pill"
          placeholder={t('dm_placeholder')}
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-success rounded-pill px-3 flex-shrink-0" disabled={sending || !text.trim()}>
          {t('chat_send')}
        </button>
      </form>

      {showGif && <GifPicker onPick={sendGif} onClose={() => setShowGif(false)} />}
    </div>
  )
}
