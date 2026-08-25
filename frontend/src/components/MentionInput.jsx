import { useEffect, useRef, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import Avatar from './Avatar'

/*
 * O nhap co goi y nhac ten (@) - dung chung cho bai viet, binh luan, chat phong va tin nhan.
 *
 * Go '@' roi go ten -> hien danh sach BAN BE khop. Chon mot nguoi thi chen token
 * @[Ten](uid:ID) vao noi dung (xem mentions.jsx). Vi ten co the trung / co dau cach nen
 * phai chon tu goi y chu khong doan tu chu.
 */

// Nho danh sach ban be theo token de khong goi lai moi lan mo o nhap
let cache = { key: null, list: null }

export default function MentionInput({
  as = 'input', token, value, onChange, onKeyDown,
  className, placeholder, disabled, maxLength, rows, autoFocus, dropUp = false, inputRef,
}) {
  const innerRef = useRef(null)
  const ref = inputRef || innerRef
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

  const matches = q == null ? [] : friends
    .filter((f) => (f.name || '').toLowerCase().includes(q.text.toLowerCase()))
    .slice(0, 6)
  const open = q != null && matches.length > 0

  // Tim doan '@...' ngay truoc con tro (dau '@' phai o dau hoac sau khoang trang)
  const detect = (val, caret) => {
    const upto = val.slice(0, caret)
    const at = upto.lastIndexOf('@')
    if (at < 0) return null
    if (at > 0 && !/\s/.test(upto[at - 1])) return null
    const text = upto.slice(at + 1)
    if (/[\n@[\]]/.test(text) || text.length > 30) return null
    return { at, text }
  }

  const handleChange = (e) => {
    const val = e.target.value
    onChange(val)
    const caret = e.target.selectionStart ?? val.length
    setQ(detect(val, caret))
    setHi(0)
  }

  const pick = (f) => {
    const el = ref.current
    const caret = el && el.selectionStart != null ? el.selectionStart : value.length
    const info = detect(value, caret) || q
    if (!info) return
    const before = value.slice(0, info.at)
    const after = value.slice(caret)
    const tokenStr = `@[${f.name}](uid:${f.userId}) `
    onChange(before + tokenStr + after)
    setQ(null)
    const pos = (before + tokenStr).length
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
        value={value}
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
