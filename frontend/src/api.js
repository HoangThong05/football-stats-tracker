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

/**
 * JWT còn hạn không? Chỉ dùng để quyết định hiển thị giao diện đã/chưa đăng nhập —
 * KHÔNG thay thế việc xác thực ở backend (backend vẫn tự kiểm tra chữ ký + hạn).
 * Token hỏng/không đọc được thì coi như hết hạn cho an toàn.
 */
export function isTokenExpired(token) {
  if (!token) return true
  try {
    // JWT dùng base64url (- _) thay vì base64 chuẩn (+ /)
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    if (!exp) return false
    return exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

/**
 * Đọc phiên đăng nhập đã lưu. Nếu token hết hạn thì xoá luôn, tránh tình trạng
 * giao diện hiện "đang đăng nhập" nhưng mọi request đều bị backend trả 403.
 */
export function loadSavedSession() {
  const token = localStorage.getItem('ft_token')
  if (isTokenExpired(token)) {
    clearSavedSession()
    return { token: null, email: null, role: null, hasPassword: true, viaGoogle: false, displayName: null }
  }
  return {
    token,
    email: localStorage.getItem('ft_email'),
    role: localStorage.getItem('ft_role'),
    // Thieu khoa nay = phien luu tu ban cu -> coi nhu co mat khau (dung voi hau het).
    // Doan sai thi man doi mat khau chi hoi thua 1 o, khong khoa ai ra ngoai.
    hasPassword: localStorage.getItem('ft_has_password') !== 'false',
    viaGoogle: localStorage.getItem('ft_via_google') === 'true',
    displayName: localStorage.getItem('ft_display_name'),
  }
}

export function clearSavedSession() {
  localStorage.removeItem('ft_token')
  localStorage.removeItem('ft_email')
  localStorage.removeItem('ft_role')
  localStorage.removeItem('ft_has_password')
  localStorage.removeItem('ft_via_google')
  localStorage.removeItem('ft_display_name')
}
