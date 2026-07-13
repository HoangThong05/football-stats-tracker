// Bo dau + chuyen thuong, de go "munchen" van tim ra "FC Bayern München"
export function normalizeText(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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
