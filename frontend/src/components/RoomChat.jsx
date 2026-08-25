import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Avatar from './Avatar'
import BadgeFlair from './BadgeFlair'
import GifPicker from './GifPicker'
import MentionInput from './MentionInput'
import { giphyEnabled } from '../giphy'
import { renderMentions } from '../mentions'

const MAX_LENGTH = 500
const REFRESH_MS = 15_000

/**
 * Khung chat trong phong Mini League.
 *
 * Hoi lai moi 15 giay thay vi mo WebSocket: phong chi vai nguoi, va may chu goi free
 * ngu khi khong ai dung - giu mot ket noi song lien tuc vua phuc tap vua khong on dinh.
 */
export default function RoomChat({ token, leagueId, myUserId, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const boxRef = useRef(null)
  // Chi tu cuon xuong khi nguoi dung DANG o duoi cung - dang doc tin cu thi de yen
  const stickToBottom = useRef(true)

  const load = useCallback(() => {
    fetch(`${API_BASE}/leagues/${leagueId}/messages`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then(setMessages)
      .catch(() => {})
  }, [leagueId, token])

  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    const box = boxRef.current
    if (box && stickToBottom.current) {
      box.scrollTop = box.scrollHeight
    }
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/leagues/${leagueId}/messages`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        setText('')
        stickToBottom.current = true
        load()
      }
    } finally {
      setSending(false)
    }
  }

  // GIF gui ngay thanh mot tin rieng (url da la Cloudinary tu GifPicker)
  const sendGif = async (url) => {
    setShowGif(false)
    try {
      const res = await fetch(`${API_BASE}/leagues/${leagueId}/messages`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', imageUrl: url }),
      })
      if (res.ok) {
        stickToBottom.current = true
        load()
      }
    } catch {
      /* bo qua */
    }
  }

  const when = (iso) =>
    new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="mt-4">
      <h4 className="h6 mb-2">💬 {t('chat_title')}</h4>

      <div className="ft-card p-3">
        <div
          ref={boxRef}
          onScroll={(e) => {
            const el = e.currentTarget
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
          }}
          style={{ maxHeight: 320, overflowY: 'auto' }}
          className="d-flex flex-column gap-1 mb-3"
        >
          {messages.length === 0 ? (
            <p className="text-secondary small mb-0">{t('chat_empty')}</p>
          ) : (
            messages.map((m, i) => {
              const mine = m.authorId === myUserId
              /*
               * Nhieu tin lien tiep cua cung mot nguoi thi chi hien avatar va ten o tin
               * DAU TIEN. Lap lai o moi dong khien doan hoi thoai ngan cung nhin nhu dai
               * va roi mat.
               */
              const sameAsPrev = i > 0 && messages[i - 1].authorId === m.authorId

              return (
                <div key={m.id} className={mine ? 'ft-chat-row mine' : 'ft-chat-row'}>
                  {!mine && (
                    <span className="ft-chat-avatar">
                      {!sameAsPrev && (
                        <button type="button" className="ft-avatar-btn"
                          onClick={() => onSelectUser(m.authorId)}>
                          <Avatar name={m.authorName} src={m.authorAvatar} size={28} />
                        </button>
                      )}
                    </span>
                  )}

                  <div className="ft-chat-bubble" title={when(m.createdAt)}>
                    {!mine && !sameAsPrev && (
                      <button type="button" className="ft-name-link fw-semibold d-block"
                        style={{ fontSize: '0.75rem' }} onClick={() => onSelectUser(m.authorId)}>
                        {m.authorName}
                        <BadgeFlair code={m.authorBadge} />
                      </button>
                    )}
                    {m.content && (
                      <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {renderMentions(m.content, onSelectUser)}
                      </span>
                    )}
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="" loading="lazy" className="ft-comment-image" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form onSubmit={send} className="d-flex gap-2">
          <MentionInput
            as="input"
            token={token}
            className="form-control rounded-pill"
            placeholder={t('chat_placeholder')}
            value={text}
            maxLength={MAX_LENGTH}
            dropUp
            onChange={setText}
          />
          {giphyEnabled() && (
            <button type="button" className="ft-gif-open-btn flex-shrink-0" onClick={() => setShowGif(true)}>
              {t('gif_btn')}
            </button>
          )}
          <button className="btn btn-success rounded-pill px-3 flex-shrink-0"
            disabled={sending || !text.trim()}>
            {t('chat_send')}
          </button>
        </form>
      </div>

      {showGif && <GifPicker onPick={sendGif} onClose={() => setShowGif(false)} />}
    </div>
  )
}
