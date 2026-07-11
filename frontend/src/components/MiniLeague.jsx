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
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontSize: '1.1rem' }}>🏆 Vui lòng <strong>đăng nhập</strong> để dùng tính năng Mini League</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px 40px' }}>

      {/* Thông báo */}
      {msg && (
        <div onClick={() => setMsg(null)} style={{
          margin: '12px 0', padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#15803d' : '#dc2626', fontSize: '0.9rem'
        }}>
          {msg.text} <span style={{ float: 'right', opacity: 0.6 }}>✕</span>
        </div>
      )}

      {/* Tạo & tham gia */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '20px 0' }}>
        {/* Tạo phòng */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>➕ Tạo phòng mới</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createLeague()}
            placeholder="Tên phòng..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 10, boxSizing: 'border-box' }}
          />
          <button onClick={createLeague} disabled={loading || !newName.trim()} style={{
            width: '100%', padding: '9px', borderRadius: 8, border: 'none',
            background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600
          }}>
            Tạo phòng
          </button>
        </div>

        {/* Tham gia */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>🔑 Tham gia bằng mã</h3>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinLeague()}
            placeholder="Nhập mã 6 ký tự..."
            maxLength={6}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 10, boxSizing: 'border-box', letterSpacing: 4, fontWeight: 700 }}
          />
          <button onClick={joinLeague} disabled={loading || joinCode.length !== 6} style={{
            width: '100%', padding: '9px', borderRadius: 8, border: 'none',
            background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600
          }}>
            Tham gia
          </button>
        </div>
      </div>

      {/* Danh sách phòng */}
      {leagues.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 10px' }}>🏠 Phòng của tôi</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {leagues.map(l => (
              <button key={l.id} onClick={() => setSelected(l)} style={{
                padding: '8px 16px', borderRadius: 999,
                border: selected?.id === l.id ? '2px solid #6366f1' : '1px solid #d1d5db',
                background: selected?.id === l.id ? '#eef2ff' : '#fff',
                color: selected?.id === l.id ? '#6366f1' : '#374151',
                cursor: 'pointer', fontWeight: selected?.id === l.id ? 700 : 400
              }}>
                {l.name} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({l.memberCount} người)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BXH phòng được chọn */}
      {selected && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🏆 {selected.name}</h3>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Mã mời:</span>
                <span style={{
                  background: '#f3f4f6', padding: '3px 12px', borderRadius: 6,
                  fontWeight: 700, letterSpacing: 3, fontSize: '1rem', color: '#1f2937'
                }}>
                  {selected.inviteCode}
                </span>
                <button onClick={() => { navigator.clipboard.writeText(selected.inviteCode); setMsg({ type: 'ok', text: 'Đã copy mã mời!' }) }}
                  style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Copy
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selected.isOwner ? (
                <button onClick={() => deleteLeague(selected.id)} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #fca5a5',
                  background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem'
                }}>Xóa phòng</button>
              ) : (
                <button onClick={() => leaveLeague(selected.id)} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem'
                }}>Rời phòng</button>
              )}
            </div>
          </div>

          {/* Bảng xếp hạng */}
          {!leaderboard ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Đang tải...</p>
          ) : leaderboard.entries.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Chưa có thành viên nào dự đoán</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: '#fff' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: 50 }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Thành viên</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Điểm</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.entries.map((e, i) => (
                  <tr key={e.email} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>
                      {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{e.email}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#6366f1' }}>
                      {e.totalPoints} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {leagues.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 32 }}>
          Bạn chưa tham gia phòng nào. Tạo phòng mới hoặc nhập mã mời từ bạn bè!
        </p>
      )}
    </div>
  )
}
