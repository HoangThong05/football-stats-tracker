import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from './api'

/**
 * Trang thai "dang hoat dong" cho mot nhom nguoi dung.
 *
 * Truyen danh sach id dang hien, hook hoi may chu moi ~40s (bo qua khi tab an), tra ve mot
 * Map id -> { online, lastSeen }. Chi co mat nhung nguoi CHO PHEP hien va da tung online;
 * ai tat o cai dat se khong bao gio nam trong Map (may chu tu loc).
 */
export function usePresence(token, ids) {
  const [status, setStatus] = useState(() => new Map())
  // Chuoi id da sap xep -> chi goi lai khi tap id thuc su doi
  const key = Array.from(new Set(ids || [])).sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (!token || !key) { setStatus(new Map()); return undefined }
    let alive = true
    const load = () => {
      fetch(`${API_BASE}/presence?ids=${key}`, { headers: authHeaders(token), cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (!alive) return
          const m = new Map()
          if (Array.isArray(d)) d.forEach((p) => m.set(p.id, { online: p.online, lastSeen: p.lastSeen }))
          setStatus(m)
        })
        .catch(() => {})
    }
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, 15000)
    return () => { alive = false; clearInterval(timer) }
  }, [token, key])

  return status
}

/** Doi map trang thai + id thanh 'online' | 'offline' | undefined (khong hien cham). */
export function presenceTag(status, id) {
  const p = status.get(id)
  return p ? (p.online ? 'online' : 'offline') : undefined
}
