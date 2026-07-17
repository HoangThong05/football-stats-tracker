export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// view -> đường dẫn API tương ứng.
// "compare" dùng lại chính dữ liệu bảng xếp hạng, không tốn thêm request.
// season (tuỳ chọn): năm bắt đầu mùa giải (vd 2024 = mùa 2024/25) - chỉ áp dụng cho
// standings/compare/scorers, bỏ qua ở các view khác.
export function endpointFor(view, league, season) {
  const seasonQuery = season ? `?season=${season}` : ''
  if (view === 'standings' || view === 'compare') return `${API_BASE}/standings/${league}${seasonQuery}`
  if (view === 'scorers') return `${API_BASE}/scorers/${league}${seasonQuery}`
  if (view === 'predict') return `${API_BASE}/predictions/matches/${league}`
  return `${API_BASE}/matches/${league}/${view}`
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
