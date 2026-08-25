import { useEffect, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { parseTokens } from '../mentions'
import Avatar from './Avatar'

/*
 * O nhap co goi y nhac ten (@) - dung chung cho bai viet, binh luan, chat phong va tin nhan.
 *
 * Go '@' roi go ten -> hien danh sach BAN BE khop. Chon mot nguoi thi CHEN @Ten (sach) vao
 * o nhap cho de doc, con ben trong dung lai token @[Ten](uid:ID) (xem mentions.jsx) khi gui
 * - nho gan san id nen hien duoc link chuan du ten trung / co dau cach.
 *
 * value cha truyen vao la chuoi THO (co token). Component tu giu ban HIEN THI (@Ten) rieng,
 * va bao onChange bang chuoi THO de cha luu / gui dung.
 */

// Nho danh sach ban be theo token de khong goi lai moi lan mo o nhap
let cache = { key: null, list: null }

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Dung lai chuoi THO tu ban hien thi: doi moi @Ten da chon thanh @[Ten](uid:ID). */
function buildRaw(display, map) {
  let raw = display
  // Ten dai xu ly truoc de ten ngan khong an trong ten dai
  const names = [...map.keys()].sort((a, b) => b.length - a.length)
  for (const name of names) {
    const id = map.get(name)
    // @Ten phai o dau/sau khoang trang va khong phai tien to cua tu dai hon
    const re = new RegExp(`(^|\\s)@${escapeRe(name)}(?=$|\\s|[^\\p{L}\\p{N}_])`, 'gu')
    raw = raw.replace(re, `$1@[${name}](uid:${id})`)
  }
  return raw
}

export default function MentionInput({
  as = 'input', token, value, onChange, onKeyDown,
  className, placeholder, disabled, maxLength, rows, autoFocus, dropUp = false, inputRef,
}) {
  const innerRef = useRef(null)
  const ref = inputRef || innerRef
  const mentionsRef = useRef(new Map()) // ten -> id cua nhung nguoi da chon
  const [display, setDisplay] = useState('')
  const [friends, setFriends] = useState(cache.list || [])
  const [q, setQ] = useState(null) // { at, text } - doan '@...' dang go, null = khong mo goi y
  const [hi, setHi] = useState(0)

  useEffect(() => {
    if (!token) return
    if (cache.key === token && cache.list) { setFriends(cache.list); return }
    fetch(`${API_BASE}/friends`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { const list = Array.isArray(d) ? d : []; cache = { key: token, list }; setFriends(list) })
      .catch(() => { /* bo qua */ })
  }, [token])

  // Dong bo khi value tu ngoai doi (reset '' sau khi gui, hoac nap noi dung de sua)
  useEffect(() => {
    if (value === buildRaw(display, mentionsRef.current)) return
    const { text, picks } = parseTokens(value || '')
    picks.forEach((p) => mentionsRef.current.set(p.name, p.id))
    setDisplay(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const matches = q == null ? [] : friends
    .filter((f) => (f.name || '').toLowerCase().includes(q.text.toLowerCase()))
    .slice(0, 6)
  const open = q != null && matches.length > 0

  // Tim doan '@...' ngay truoc con tro (dau '@' o dau/sau khoang trang, chua qua khoang trang)
  const detect = (val, caret) => {
    const upto = val.slice(0, caret)
    const at = upto.lastIndexOf('@')
    if (at < 0) return null
    if (at > 0 && !/\s/.test(upto[at - 1])) return null
    const text = upto.slice(at + 1)
    if (/[\s@[\]]/.test(text) || text.length > 30) return null
    return { at, text }
  }

  const emit = (nextDisplay) => onChange(buildRaw(nextDisplay, mentionsRef.current))

  const handleChange = (e) => {
    const next = e.target.value
    setDisplay(next)
    emit(next)
    const caret = e.target.selectionStart ?? next.length
    setQ(detect(next, caret))
    setHi(0)
  }

  const pick = (f) => {
    const el = ref.current
    const caret = el && el.selectionStart != null ? el.selectionStart : display.length
    const info = detect(display, caret) || q
    if (!info) return
    mentionsRef.current.set(f.name, f.userId)
    const before = display.slice(0, info.at)
    const after = display.slice(caret)
    const insert = `@${f.name} `
    const next = before + insert + after
    setDisplay(next)
    emit(next)
    setQ(null)
    const pos = (before + insert).length
    requestAnimationFrame(() => {
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos) } catch { /* bo qua */ } }
    })
  }

  const handleKeyDown = (e) => {
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => (h + 1) % matches.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => (h - 1 + matches.length) % matches.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); pick(matches[hi]); return }
      if (e.key === 'Escape') { e.preventDefault(); setQ(null); return }
    }
    if (onKeyDown) onKeyDown(e)
  }

  const Tag = as
  return (
    <div className="ft-mention-wrap">
      <Tag
        ref={ref}
        className={className}
        placeholder={placeholder}
        value={display}
        maxLength={maxLength}
        rows={as === 'textarea' ? rows : undefined}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setQ(null), 120)}
      />
      {open && (
        <div className={`ft-mention-menu${dropUp ? ' up' : ''}`}>
          {matches.map((f, i) => (
            <button key={f.userId} type="button"
              className={`ft-mention-item${i === hi ? ' active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(f) }}
              onMouseEnter={() => setHi(i)}>
              <Avatar name={f.name} src={f.avatarUrl} size={26} />
              <span className="text-truncate">{f.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
