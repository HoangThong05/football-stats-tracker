import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const [menu, setMenu] = useState(null) // { id, mine, pinned, top, left, up } - menu ... dang mo
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

  // Doi cuoc tro chuyen: xoa tin cu, bam lai xuong day
  useEffect(() => {
    stick.current = true
    setMessages(null)
  }, [other?.userId])

  useEffect(() => {
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Bam vao trich dan -> nhay toi tin goc va nhay sang
  const jumpTo = (mid) => {
    const el = scrollRef.current?.querySelector(`[data-mid="${mid}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ft-dm-flash')
    setTimeout(() => el.classList.remove('ft-dm-flash'), 1300)
  }

  // Cuon xuong cuoi khi co tin moi (neu dang o gan day). Layout effect de tranh nhay.
  useLayoutEffect(() => {
    if (stick.current) scrollToBottom()
  }, [messages, scrollToBottom])

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

  // Mo menu ... - dinh vi noi (fixed) ngay canh nut, khong bi khung cuon cat
  const openMenu = (e, m) => {
    if (menu && menu.id === m.id) {
      setMenu(null)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    const up = r.bottom + 170 > window.innerHeight
    setReactFor(null)
    setMenu({
      id: m.id,
      mine: m.mine,
      pinned: m.pinned,
      top: up ? r.top - 6 : r.bottom + 6,
      left: Math.max(8, Math.min(r.left, window.innerWidth - 208)),
      up,
    })
  }

  const recall = async (id, forEveryone) => {
    setMenu(null)
    const ok = await confirmDialog({
      message: forEveryone ? t('dm_recall_all_confirm') : t('dm_recall_me_confirm'),
      confirmText: t('dm_recall'),
      danger: true,
    })
    if (!ok) return
    callMsg(`recall/${id}`, { forEveryone })
  }

  const pin = (id, pinned) => {
    setMenu(null)
    callMsg(`pin/${id}`, { pinned })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // Trang thai hien duoi tin CUOI neu do la tin cua minh: ✓ Da gui -> ✓✓ Da xem
  const last = messages && messages.length > 0 ? messages[messages.length - 1] : null
  const showStatus = last && last.mine && !last.recalled

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
              <div key={m.id} data-mid={m.id} className={`ft-dm-row ${m.mine ? 'mine' : ''}`}>
                <div className="ft-dm-bubble ft-dm-recalled">🚫 {t('dm_recalled')}</div>
              </div>
            ) : (
            <div key={m.id} data-mid={m.id} className={`ft-dm-row ${m.mine ? 'mine' : ''}`}>
              <div className="ft-dm-msg">
                {m.replyToId && (
                  <button type="button" className="ft-dm-quote" onClick={() => jumpTo(m.replyToId)}>
                    ↩ {m.replyToMine ? `${t('dm_you_prefix')} ` : ''}{m.replyToText}
                  </button>
                )}
                <div className="ft-dm-bubble-wrap">
                  <div className="ft-dm-bubble" title={relativeTime(m.createdAt, t, lang)}>
                    {m.content && <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</span>}
                    {m.imageUrl && <img src={m.imageUrl} alt="" loading="lazy" className="ft-dm-image"
                      onLoad={() => { if (stick.current) scrollToBottom() }} />}
                  </div>

                  <div className="ft-dm-tools">
                    <button type="button" title={t('dm_more')} onClick={(e) => openMenu(e, m)}>⋯</button>
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
        {showStatus && (
          <div className="ft-dm-seen">{last.readAt ? t('dm_seen') : t('dm_sent_status')}</div>
        )}
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

      {menu && (
        <>
          <div className="ft-dm-menu-backdrop" onClick={() => setMenu(null)} />
          <div className={`ft-dm-menu${menu.up ? ' up' : ''}`}
            style={{ top: menu.top, left: menu.left }}>
            <button type="button" onClick={() => pin(menu.id, !menu.pinned)}>
              📌 {menu.pinned ? t('dm_unpin') : t('dm_pin')}
            </button>
            <button type="button" onClick={() => recall(menu.id, false)}>
              🗑️ {t('dm_recall_me')}
            </button>
            {menu.mine && (
              <button type="button" className="text-danger" onClick={() => recall(menu.id, true)}>
                ↩️ {t('dm_recall_all')}
              </button>
            )}
          </div>
        </>
      )}

      {showGif && <GifPicker onPick={sendGif} onClose={() => setShowGif(false)} />}
    </div>
  )
}
