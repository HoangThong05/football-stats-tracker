import { useState, useEffect } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'

function translateError(code, t) {
  const key = `ml_err_${code}`
  const translated = t(key)
  return translated !== key ? translated : code
}

export default function MiniLeague({ token, onBack, onSelectUser }) {
  const { t, lang } = useTranslation()
  const [leagues, setLeagues] = useState([])
  const [selected, setSelected] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  // Du doan cua ca phong - backend chi tra ve tran DA lan banh
  const [picks, setPicks] = useState([])
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { if (token) fetchMyLeagues() }, [token])
  useEffect(() => { if (token) fetchMyLeagues() }, [])

  useEffect(() => { if (selected) fetchLeaderboard(selected.id) }, [selected])

  async function fetchMyLeagues() {
    const res = await fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
    if (res.ok) {
      const data = await res.json()
      setLeagues(data)
      if (data.length > 0 && !selected) {
        setSelected(data[0])
      }
    }
  }

  async function fetchLeaderboard(id) {
    setLeaderboard(null)
    setPicks([])
    const res = await fetch(`${API_BASE}/leagues/${id}/leaderboard`, { headers: authHeaders(token) })
    if (res.ok) setLeaderboard(await res.json())

    // Phan phu: hong thi bang diem van hien binh thuong
    fetch(`${API_BASE}/leagues/${id}/picks`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPicks)
      .catch(() => {})
  }

  async function refreshAndSelect(targetId) {
    const res = await fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
    if (res.ok) {
      const data = await res.json()
      setLeagues(data)
      const target = data.find(l => l.id === targetId)
      if (target) setSelected(target)
    }
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
      setMsg({ type: 'ok', text: `${t('ml_create_success')} ${league.inviteCode}` })
      setNewName('')
      await refreshAndSelect(league.id)
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg({ type: 'err', text: translateError(err.message, t) || t('ml_create_error') })
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
      setMsg({ type: 'ok', text: `${t('ml_join_success')} "${league.name}"` })
      setJoinCode('')
      await refreshAndSelect(league.id)
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg({ type: 'err', text: translateError(err.message, t) || t('ml_join_error') })
    }
    setLoading(false)
  }

  async function leaveLeague(id) {
    if (!confirm(t('ml_confirm_leave'))) return
    const res = await fetch(`${API_BASE}/leagues/${id}/leave`, {
      method: 'DELETE', headers: authHeaders(token)
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: t('ml_leave_success') })
      setSelected(null)
      setLeaderboard(null)
      const res2 = await fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
      if (res2.ok) {
        const data = await res2.json()
        setLeagues(data)
        if (data.length > 0) setSelected(data[0])
      }
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg({ type: 'err', text: translateError(err.message, t) })
    }
  }

  async function deleteLeague(id) {
    if (!confirm(t('ml_confirm_delete'))) return
    const res = await fetch(`${API_BASE}/leagues/${id}`, {
      method: 'DELETE', headers: authHeaders(token)
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: t('ml_delete_success') })
      setSelected(null)
      setLeaderboard(null)
      const res2 = await fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
      if (res2.ok) {
        const data = await res2.json()
        setLeagues(data)
        if (data.length > 0) setSelected(data[0])
      }
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg({ type: 'err', text: translateError(err.message, t) })
    }
  }

if (!token) {
    return (
      <div>
        <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
          {t('back_standings')}
        </button>
        <div className="text-center text-secondary py-5">
          <p className="fs-5">🏆 {t('ml_login_hint')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back_standings')}
      </button>
      {msg && (
        <div className={`alert py-2 ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`}
          role="button" onClick={() => setMsg(null)}>
          {msg.text} <span className="float-end opacity-50">✕</span>
        </div>
      )}

      <div className="ft-card p-3 mb-4">
        <h5 className="h6 fw-bold mb-2">🏆 {t('ml_intro_title')}</h5>
        <p className="mb-2 small">{t('ml_intro_what')}</p>
        <ol className="mb-0 small text-secondary ps-3">
          <li>{t('ml_intro_step1')}</li>
          <li>{t('ml_intro_step2')}</li>
          <li>{t('ml_intro_step3')}</li>
        </ol>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="ft-card p-4 h-100">
            <h6 className="fw-bold mb-3">➕ {t('ml_create_title')}</h6>
            <input className="form-control mb-2" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createLeague()}
              placeholder={t('ml_create_placeholder')} />
            <button className="btn btn-primary w-100 fw-semibold"
              onClick={createLeague} disabled={loading || !newName.trim()}>
              {t('ml_create_btn')}
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="ft-card p-4 h-100">
            <h6 className="fw-bold mb-3">🔑 {t('ml_join_title')}</h6>
            <input className="form-control mb-2 text-center fw-bold"
              style={{ letterSpacing: '4px' }} value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinLeague()}
              placeholder={t('ml_join_placeholder')} maxLength={6} />
            <button className="btn btn-success w-100 fw-semibold"
              onClick={joinLeague} disabled={loading || joinCode.length !== 6}>
              {t('ml_join_btn')}
            </button>
          </div>
        </div>
      </div>

      {leagues.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-bold mb-2">🏠 {t('ml_my_rooms')}</h6>
          <div className="ft-league-tabs">
            {leagues.map((l) => (
              <button key={l.id}
                className={l.id === selected?.id ? 'btn btn-sm active' : 'btn btn-sm'}
                onClick={() => setSelected(l)}>
                {l.name} <span className="opacity-50">({l.memberCount} {t('ml_members_count')})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="ft-card p-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h5 className="fw-bold mb-2">🏆 {selected.name}</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="small text-secondary">{t('ml_invite_code')}</span>
                <span className="badge text-bg-secondary fs-6" style={{ letterSpacing: '3px' }}>
                  {selected.inviteCode}
                </span>
                <button className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(selected.inviteCode)
                    setMsg({ type: 'ok', text: t('ml_copy_success') })
                  }}>
                  {t('ml_copy_btn')}
                </button>
              </div>
            </div>
            <div>
              {selected.isOwner ? (
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLeague(selected.id)}>
                  {t('ml_delete_btn')}
                </button>
              ) : (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => leaveLeague(selected.id)}>
                  {t('ml_leave_btn')}
                </button>
              )}
            </div>
          </div>

          {!leaderboard ? (
            <p className="text-secondary text-center mb-0">{t('ml_loading')}</p>
          ) : leaderboard.entries.length === 0 ? (
            <p className="text-secondary text-center mb-0">{t('ml_no_predictions')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: 60 }}>{t('ml_col_rank')}</th>
                    <th>{t('ml_col_member')}</th>
                    <th className="text-center d-none d-sm-table-cell">{t('ml_col_played')}</th>
                    <th className="text-center d-none d-sm-table-cell">{t('ml_col_exact')}</th>
                    <th className="text-center">{t('ml_col_points')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((e) => (
                    <tr key={e.name}>
                      <td className="text-center fw-bold">
                        {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}
                      </td>
                      <td>
                        <button type="button" className="btn btn-link p-0 text-start"
                          onClick={() => onSelectUser(e.userId)}>
                          {e.name}
                        </button>
                      </td>
                      <td className="text-center ft-num text-secondary d-none d-sm-table-cell">
                        {e.scoredPredictions}
                      </td>
                      <td className="text-center ft-num text-secondary d-none d-sm-table-cell">
                        {e.exactScores}
                      </td>
                      <td className="text-center fw-bold" style={{ color: 'var(--ft-accent-strong)' }}>
                        {e.totalPoints} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {picks.length > 0 && (
            <div className="mt-4">
              <h6 className="fw-bold mb-1">👀 {t('ml_picks_title')}</h6>
              <p className="text-secondary small mb-3">{t('ml_picks_note')}</p>

              {picks.map((m) => (
                <div key={m.matchId} className="ft-card p-3 mb-2">
                  <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                    <span className="fw-semibold small">
                      {shortTeamName(m.homeTeam)} {m.actualHomeScore ?? '-'} - {m.actualAwayScore ?? '-'}{' '}
                      {shortTeamName(m.awayTeam)}
                    </span>
                    <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {m.competition} · {new Date(m.utcDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB')}
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-1">
                    {m.picks.map((p) => (
                      <div key={p.name} className="d-flex align-items-center gap-2 small">
                        <span className="text-truncate flex-grow-1" style={{ minWidth: 0 }} title={p.name}>
                          {p.name}
                        </span>
                        <span className="ft-num fw-semibold flex-shrink-0">
                          {p.homeScore} - {p.awayScore}
                        </span>
                        <span
                          className={`badge flex-shrink-0 ${
                            p.points === 3 ? 'text-bg-success'
                              : p.points === 1 ? 'text-bg-warning'
                                : p.points === 0 ? 'text-bg-secondary'
                                  : 'text-bg-light'
                          }`}
                          style={{ minWidth: 34 }}
                        >
                          {p.points == null ? '…' : `+${p.points}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {leagues.length === 0 && (
        <p className="text-center text-secondary mt-4">{t('ml_empty')}</p>
      )}
    </div>
  )
}