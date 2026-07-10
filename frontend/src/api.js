export const API_BASE = 'http://localhost:8080/api'

// view -> đường dẫn API tương ứng.
// "compare" dùng lại chính dữ liệu bảng xếp hạng, không tốn thêm request.
export function endpointFor(view, league) {
  if (view === 'standings' || view === 'compare') return `${API_BASE}/standings/${league}`
  if (view === 'scorers') return `${API_BASE}/scorers/${league}`
  if (view === 'predict') return `${API_BASE}/predictions/matches/${league}`
  return `${API_BASE}/matches/${league}/${view}`
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
