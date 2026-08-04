import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'

/**
 * Thanh ty so chay ngang kieu kenh the thao, dat ngay duoi navbar.
 *
 * Khong co endpoint "live" rieng - dung /api/matches/range cho ngay hom nay, giong
 * trang Hom nay. Du lieu doc tu DB (MatchSyncService dong bo moi 30 phut) nen ty so
 * co the tre toi 30 phut; goi lai moi 60 giay o day KHONG ton them request cua
 * football-data.org vi backend tra tu DB chu khong goi thang len API.
 *
 * Trai mua giai thi khong co tran nao -> component tu tra null, khong de lai thanh
 * rong chiem cho.
 */
const REFRESH_MS = 60_000

/** Tran dang da: football-data.org dung 3 trang thai nay. */
const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED'])

function dayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

export default function LiveTicker({ onSelectMatch }) {
  const { t, lang } = useTranslation()
  const [matches, setMatches] = useState([])

  useEffect(() => {
    let cancelled = false

    const load = () => {
      const { from, to } = dayRange()
      fetch(`${API_BASE}/matches/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setMatches(Array.isArray(data) ? data : [])
        })
        // Ticker chi la trang tri: hong thi im lang bien mat, khong bao loi lam phien
        .catch(() => {})
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  if (matches.length === 0) return null

  const timeOf = (utcDate) =>
    new Date(utcDate).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const renderItem = (m, key) => {
    const live = LIVE_STATUSES.has(m.status)
    const finished = m.status === 'FINISHED'
    const hasScore = m.homeScore != null && m.awayScore != null

    return (
      <span
        key={key}
        className="ft-ticker-item"
        role="button"
        tabIndex={-1}
        onClick={() => onSelectMatch?.(m.id)}
      >
        <span className="ft-ticker-league">{m.competition}</span>
        <span>{shortTeamName(m.homeTeam)}</span>
        <span className={`ft-ticker-score${live ? ' ft-ticker-score-live' : ''}`}>
          {hasScore ? `${m.homeScore} - ${m.awayScore}` : timeOf(m.utcDate)}
        </span>
        <span>{shortTeamName(m.awayTeam)}</span>
        {live && <span className="ft-ticker-live">● {t('ticker_live')}</span>}
        {finished && <span className="ft-ticker-ft">{t('ticker_finished')}</span>}
      </span>
    )
  }

  return (
    <div className="ft-ticker">
      <div className="ft-ticker-label">{t('ticker_label')}</div>
      <div className="ft-ticker-viewport">
        {/*
          Danh sach lap DOI de vong chay lien mach: khi ban sao thu nhat truot het
          khoi khung thi ban sao thu hai da vao dung vi tri xuat phat, mat khong thay
          diem noi. Ban sao thu hai an voi trinh doc man hinh de khong doc lai hai lan.
        */}
        <div className="ft-ticker-track">
          {matches.map((m) => renderItem(m, m.id))}
          <span aria-hidden="true" className="ft-ticker-dup">
            {matches.map((m) => renderItem(m, `dup-${m.id}`))}
          </span>
        </div>
      </div>
    </div>
  )
}
