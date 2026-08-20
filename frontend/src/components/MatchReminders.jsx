import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'

/*
 * Con so tren chuong chi dem tran trong 48 gio toi.
 *
 * Dem het 7 ngay thi con so luon o muc cao, nhin mai thanh quen va het tac dung
 * nhac nho. Danh sach ben trong van hien du 7 ngay.
 */
const BADGE_WINDOW_HOURS = 48
const REFRESH_MS = 10 * 60 * 1000

/**
 * Chuong nhac tran: cac tran sap dien ra cua doi dang theo doi.
 *
 * Thay cho email nhac tran (da tat qua app.notify.email-enabled). Doc tu database
 * nen khong ton han muc API - goi lai dinh ky thoai mai.
 */
export default function MatchReminders({ token, onSelectTeam }) {
  const { t, lang } = useTranslation()
  const [matches, setMatches] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!token) {
      setMatches([])
      return undefined
    }

    let cancelled = false
    const load = () => {
      fetch(`${API_BASE}/favorites/upcoming`, { headers: authHeaders(token) })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setMatches(data)
        })
        // Nhac nho chi la tro giup: hong thi im lang, khong lam phien nguoi dung
        .catch(() => {})
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [token])

  if (!token) {
    return null
  }

  const soonLimit = Date.now() + BADGE_WINDOW_HOURS * 3600 * 1000
  const soonCount = matches.filter((m) => new Date(m.utcDate).getTime() <= soonLimit).length

  const formatKickoff = (utcDate) => {
    const d = new Date(utcDate)
    const hours = Math.round((d.getTime() - Date.now()) / 3600000)
    const clock = d.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
    // Duoi 1 ngay thi "con X gio" de doc nhanh hon la ngay thang
    return hours <= 24 ? `${clock} · ${t('rem_in_hours').replace('{h}', Math.max(0, hours))}` : clock
  }

  return (
    <div
      className="ft-user-menu"
      tabIndex={-1}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        className="ft-nav-btn ft-nav-btn-icon"
        onClick={() => setOpen((v) => !v)}
        title={t('rem_title')}
        style={{ position: 'relative' }}
      >
        🔔
        {soonCount > 0 && <span className="ft-rem-badge">{soonCount}</span>}
      </button>

      {open && (
        <div className="ft-user-menu-panel ft-fade" style={{ minWidth: 300, maxWidth: 360 }}>
          <div className="ft-user-menu-header">{t('rem_title')}</div>

          {matches.length === 0 ? (
            <p className="text-secondary small mb-0 px-2 py-1">{t('rem_empty')}</p>
          ) : (
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {matches.map((m) => (
                <button
                  key={m.matchId}
                  className="ft-user-menu-item"
                  onClick={() => {
                    setOpen(false)
                    onSelectTeam(m.followedTeamId)
                  }}
                >
                  <span className="d-block small fw-semibold">
                    {shortTeamName(m.homeTeam)} vs {shortTeamName(m.awayTeam)}
                  </span>
                  <span className="d-block text-secondary" style={{ fontSize: '0.75rem' }}>
                    {formatKickoff(m.utcDate)}
                  </span>
                  <span className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
                    ★ {shortTeamName(m.followedTeamName)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
