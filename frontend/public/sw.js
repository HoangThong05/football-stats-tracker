const CACHE_NAME = 'football-tracker-v1'
const API_CACHE = 'football-tracker-api-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
]

/*
 * Các endpoint được phép lưu lại để xem khi mất mạng.
 *
 * DANH SÁCH NÀY PHẢI CHỈ GỒM DỮ LIỆU CÔNG KHAI — thứ mọi người đọc đều giống nhau.
 * Không bao giờ thêm vào đây các đường dẫn trả về dữ liệu riêng của một người
 * (/api/favorites, /api/predictions/mine, /api/leagues, /api/admin...): máy dùng chung
 * thì người sau mở app lúc mất mạng sẽ đọc được dữ liệu của người trước.
 */
const CACHEABLE_API = [
  '/api/standings/',
  '/api/scorers/',
  '/api/matches/',
  '/api/teams/',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Giữ CẢ HAI kho; thiếu API_CACHE ở đây là mỗi lần kích hoạt lại xóa sạch dữ liệu offline
  const keep = [CACHE_NAME, API_CACHE]
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

/** Lấy mạng trước, hỏng thì dùng bản đã lưu. Luôn ưu tiên dữ liệu mới. */
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone()
        caches.open(cacheName).then((cache) => cache.put(request, clone))
      }
      return response
    })
    .catch(() => caches.match(request))
}

/*
 * Nhan thong bao day va hien len.
 *
 * Noi dung do backend gui la JSON { title, body, url }. Bam vao thong bao se mo app o
 * dung 'url' (vd /?post=12 de mo dung bai).
 */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = {}
  }
  const title = data.title || 'Football Stats Tracker'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Da mo mot cua so app -> dua no ve dung url roi focus; chua thi mo cua so moi
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url).catch(() => {})
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = event.request.url

  if (url.includes('/api/')) {
    /*
     * Các đường dẫn trong danh sách trả về cùng một nội dung cho mọi người, nên lưu lại
     * kể cả khi request có kèm token đăng nhập — app vẫn gắn token vào mọi lời gọi.
     * Đường dẫn ngoài danh sách thì đi thẳng ra mạng, không lưu gì.
     */
    if (CACHEABLE_API.some((path) => url.includes(path))) {
      event.respondWith(networkFirst(event.request, API_CACHE))
    }
    return
  }

  event.respondWith(networkFirst(event.request, CACHE_NAME))
})
