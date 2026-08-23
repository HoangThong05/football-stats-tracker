// URL Cloudinary cua video chua '/video/upload/'. Dung de render <video> thay vi <img>.
export function isVideoUrl(url) {
  return typeof url === 'string' && url.includes('/video/upload/')
}

// Bo dau + chuyen thuong, de go "munchen" van tim ra "FC Bayern München"
export function normalizeText(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/*
 * football-data.org tra ve ten phap ly day du ("Arsenal FC", "Real Madrid CF"),
 * dai va khong giong cach goi thuong ngay. Ham nay cat cac tu chi loai hinh cau lac bo
 * khi chung dung o DAU hoac CUOI ten.
 *
 * Chi cat o hai dau, khong bao gio cat o giua: "1. FC Koln" phai giu nguyen chu FC,
 * neu khong se thanh "1. Koln" vo nghia.
 *
 * CHI DUNG DE HIEN THI. Cho luu DB (ten doi yeu thich) hay dung lam tu khoa tim kiem
 * ben ngoai thi van phai giu ten goc.
 */
const CLUB_SUFFIXES = new Set(['FC', 'CF', 'AFC', 'SC', 'BSC', 'SV', 'FK', 'SK', 'BK', 'CD'])
const CLUB_PREFIXES = new Set(['FC', 'AFC'])

export function shortTeamName(name) {
  const parts = (name || '').trim().split(/\s+/)
  if (parts.length < 2) return name || ''

  if (CLUB_SUFFIXES.has(parts[parts.length - 1])) parts.pop()
  if (parts.length > 1 && CLUB_PREFIXES.has(parts[0])) parts.shift()

  // Cat het thi thoi, tra lai ten goc con hon la o trong
  return parts.length ? parts.join(' ') : name
}

export function formatKickoff(utcDate, lang = 'vi', { includeYear = false } = {}) {
  return new Date(utcDate).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    ...(includeYear ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * "5 phut truoc" / "3 gio truoc" / ngay thang neu qua mot ngay.
 *
 * Voi mot viec vua xay ra thi khoang cach doc nhanh hon dong ho: "5 phut truoc" hieu
 * ngay, con "13:20 22-08" thi phai tu tinh xem la bao lau roi.
 *
 * @param {(key: string) => string} t ham dich, can 3 khoa forum_just_now/minutes_ago/hours_ago
 */
export function relativeTime(iso, t, lang = 'vi') {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return t('forum_just_now')
  if (diffMin < 60) return t('forum_minutes_ago').replace('{n}', diffMin)
  if (diffMin < 24 * 60) return t('forum_hours_ago').replace('{n}', Math.floor(diffMin / 60))
  return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
