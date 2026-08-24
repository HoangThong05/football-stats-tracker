/*
 * Thong bao day (Web Push) tu phia trinh duyet.
 *
 * Luong: lay khoa cong khai VAPID tu backend -> xin quyen -> dang ky voi trinh duyet
 * (PushManager) -> gui dang ky len backend luu. Tat thi huy dang ky + bao backend quen.
 *
 * Service worker (sw.js) la noi NHAN day va hien thong bao len; file nay chi lo phan
 * bat/tat va trao doi voi may chu.
 */
import { API_BASE, authHeaders } from './api'

/** Trinh duyet co du kha nang nhan thong bao day khong. */
export function pushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Khoa VAPID la base64url; PushManager can dang Uint8Array. */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i)
  return arr
}

/** { enabled, publicKey } - enabled=false nghia la may chu chua cau hinh khoa VAPID. */
export async function getPushConfig(token) {
  try {
    const res = await fetch(`${API_BASE}/push/public-key`, { headers: authHeaders(token) })
    if (!res.ok) return { enabled: false, publicKey: '' }
    return await res.json()
  } catch {
    return { enabled: false, publicKey: '' }
  }
}

/** Dang ky push hien tai cua trinh duyet nay (null neu chua bat). */
export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

/**
 * Bat thong bao tren thiet bi nay: xin quyen, dang ky, gui len backend.
 * @throws Error('denied') neu nguoi dung tu choi quyen
 */
export async function enablePush(token, publicKey) {
  const reg = await navigator.serviceWorker.ready
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    throw new Error('denied')
  }
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }
  const json = sub.toJSON() // { endpoint, keys: { p256dh, auth } }
  const res = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  })
  if (!res.ok) {
    throw new Error('subscribe_failed')
  }
  return sub
}

/** Tat thong bao tren thiet bi nay: bao backend quen + huy dang ky voi trinh duyet. */
export async function disablePush(token) {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await fetch(`${API_BASE}/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {})
  await sub.unsubscribe().catch(() => {})
}
