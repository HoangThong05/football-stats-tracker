/*
 * Goi API Giphy de tim / lay GIF trending cho o chon GIF.
 *
 * Key beta mien phi gioi han 100 luot goi/gio (dung chung ca app), nen o chon GIF phia
 * tren se cho go xong moi tim (debounce) va mac dinh hien trending - tiet kiem luot goi.
 *
 * Key nam o bien moi truong VITE_GIPHY_KEY (cau hinh tren Vercel). Chua co -> tinh nang
 * tat, nut GIF an di.
 */
const KEY = import.meta.env.VITE_GIPHY_KEY || ''
const BASE = 'https://api.giphy.com/v1/gifs'

export function giphyEnabled() {
  return Boolean(KEY)
}

/** Chuan hoa mot ket qua Giphy -> { id, preview (nho, cho luoi), full (dung khi chon) }. */
function toItem(g) {
  const images = g.images || {}
  return {
    id: g.id,
    // Anh nho cho luoi (nhe, tai nhanh); dung ban co dinh chieu cao
    preview: images.fixed_height_small?.url || images.fixed_height?.url || images.original?.url,
    // Ban day du de luu (downsized medium cho nhe, van ro)
    full: images.downsized_medium?.url || images.downsized?.url || images.original?.url,
  }
}

async function call(path, params) {
  const q = new URLSearchParams({ api_key: KEY, limit: '24', rating: 'pg-13', ...params })
  const res = await fetch(`${BASE}/${path}?${q}`)
  if (!res.ok) throw new Error('giphy_failed')
  const data = await res.json()
  return (data.data || []).map(toItem).filter((it) => it.preview && it.full)
}

/** GIF dang trending - hien mac dinh khi mo o chon, chua go gi. */
export function trendingGifs() {
  return call('trending', {})
}

/** Tim GIF theo tu khoa. */
export function searchGifs(query) {
  return call('search', { q: query })
}
