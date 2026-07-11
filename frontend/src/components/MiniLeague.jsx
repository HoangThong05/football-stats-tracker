import { useState, useEffect } from 'react'
import { API_BASE, authHeaders } from '../api'

export default function MiniLeague({ token }) {
  const [leagues, setLeagues] = useState([])
  const [selected, setSelected] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text }

  useEffect(() => { if (token) fetchMyLeagues() }, [token])
  useEffect(() => { if (selected) fetchLeaderboard(selected.id) }, [selected])

  async function fetchMyLeagues() {
    const res = await fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
    if (res.ok) setLeagues(await res.json())
  }

  async function fetchLeaderboard(id) {
    setLeaderboard(null)
    const res = await fetch(`${API_BASE}/leagues/${id}/leaderboard`, { headers: authHeaders(token) })
    if (res.ok) setLeaderboard(await res.json())
  }

  async function createLeague() {
    if (!newName.trim()) return
    setLoading(true)
    const res = await fetch(`${API_BASE}/leagues`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    })
    if (res.ok) {
      const league = await res.json()
      setMsg({ type: 'ok', text: `Tạo phòng thành công! Mã mời: ${league.inviteCode}` })
      setNewName('')
      await fetchMyLeagues()
      setSelected(league)
    } else {
      setMsg({ type: 'err', text: 'Tạo phòng thất bại' })
    }
    setLoading(false)
  }

  async function joinLeague() {
    if (!joinCode.trim()) return
    setLoading(true)
    const res = await fetch(`${API_BASE}/leagues/join`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() })
    })
    if (res.ok) {
      const league = await res.json()
      setMsg({ type: 'ok', text: `Tham gia phòng "${league.name}" thành công!` })
      setJoinCode('')
      await fetchMyLeagues()
      setSelected(league)
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg({ type: 'err', text: err.message || 'Mã mời không hợp lệ' })
    }
    setLoading(false)
  }

  async function leaveLeague(id) {
    if (!confirm('Bạn có chắc muốn rời phòng?')) return
    const res = await fetch(`${API_BASE}/leagues/${id}/leave`, {
      method: 'DELETE', headers: authHeaders(token)
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Đã rời phòng' })
      setSelected(null)
      setLeaderboard(null)
      await fetchMyLeagues()
    }
  }

  async function deleteLeague(id) {
    if (!confirm('Xóa phòng sẽ xóa tất cả thành viên. Bạn có chắc?')) return
    const res = await fetch(`${API_BASE}/leagues/${id}`, {
      method: 'DELETE', headers: authHeaders(token)
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Đã xóa phòng' })
      setSelected(null)
      setLeaderboard(null)
      await fetchMyLeagues()
    }
  }

  if (!token) {
    return (
      <div className="text-center text-secondary py-5">
        <p className="fs-5">🏆 Vui lòng <strong>đăng nhập</strong> để dùng tính năng Mini League</p>
      </div>
    )
  }

  return (
    <div>
      {msg && (
        <div
          className={`alert py-2 ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="button"
          onClick={() => setMsg(null)}
        >
          {msg.text} <span className="float-end opacity-50">✕</span>
        </div>
      )}

      {/* Tạo & tham gia */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="ft-card p-4 h-100">
            <h6 className="fw-bold mb-3">➕ Tạo phòng mới</h6>
            <input
              className="form-control mb-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createLeague()}
              placeholder="Tên phòng..."
            />
            <button className="btn btn-primary w-100 fw-semibold"
              onClick={createLeague} disabled={loading || !newName.trim()}>
              Tạo phòng
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="ft-card p-4 h-100">
            <h6 className="fw-bold mb-3">🔑 Tham gia bằng mã</h6>
            <input
              className="form-control mb-2 text-center fw-bold"
              style={{ letterSpacing: '4px' }}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinLeague()}
              placeholder="Nhập mã 6 ký tự..."
              maxLength={6}
            />
            <button className="btn btn-success w-100 fw-semibold"
              onClick={joinLeague} disabled={loading || joinCode.length !== 6}>
              Tham gia
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách phòng */}
      {leagues.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-bold mb-2">🏠 Phòng của tôi</h6>
          <div className="ft-league-tabs">
            {leagues.map((l) => (
              <button key={l.id}
                className={l.id === selected?.id ? 'btn btn-sm active' : 'btn btn-sm'}
                onClick={() => setSelected(l)}>
                {l.name} <span className="opacity-50">({l.memberCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BXH phòng được chọn */}
      {selected && (
        <div className="ft-card p-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h5 className="fw-bold mb-2">🏆 {selected.name}</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="small text-secondary">Mã mời:</span>
                <span className="badge text-bg-secondary fs-6" style={{ letterSpacing: '3px' }}>
                  {selected.inviteCode}
                </span>
                <button className="btn btn-sm btn-outline-secondary"
                  onClick={() => { navigator.clipboard.writeText(selected.inviteCode); setMsg({ type: 'ok', text: 'Đã copy mã mời!' }) }}>
                  Copy
                </button>
              </div>
            </div>
            <div>
              {selected.isOwner ? (
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLeague(selected.id)}>
                  Xóa phòng
                </button>
              ) : (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => leaveLeague(selected.id)}>
                  Rời phòng
                </button>
              )}
            </div>
          </div>

          {!leaderboard ? (
            <p className="text-secondary text-center mb-0">Đang tải...</p>
          ) : leaderboard.entries.length === 0 ? (
            <p className="text-secondary text-center mb-0">Chưa có thành viên nào dự đoán</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: 60 }}>#</th>
                    <th>Thành viên</th>
                    <th className="text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((e) => (
                    <tr key={e.email}>
                      <td className="text-center fw-bold">
                        {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}
                      </td>
                      <td>{e.email}</td>
                      <td className="text-center fw-bold" style={{ color: 'var(--ft-accent-strong)' }}>
                        {e.totalPoints} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {leagues.length === 0 && (
        <p className="text-center text-secondary mt-4">
          Bạn chưa tham gia phòng nào. Tạo phòng mới hoặc nhập mã mời từ bạn bè!
        </p>
      )}
    </div>
  )
}