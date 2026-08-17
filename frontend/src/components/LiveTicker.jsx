import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

  const viewportRef = useRef(null)
  const setRef = useRef(null)
  const [copies, setCopies] = useState(2)
  const [durationSeconds, setDurationSeconds] = useState(30)

  /*
   * Do be rong THAT cua mot ban sao roi tinh can bao nhieu ban sao moi phu kin khung.
   *
   * Can it nhat 2 lan be rong khung: mot ban sao dang truot ra ngoai thi phan con lai
   * van con du de khong ho khoang trong nao.
   *
   * Toc do co dinh 70px/giay -> it tran hay nhieu tran deu chay muot nhu nhau. De
   * nguyen mot thoi luong cung thi 1 tran se bo lu tu, 20 tran thi lao vun vut.
   */
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const oneSet = setRef.current
    if (!viewport || !oneSet || matches.length === 0) return undefined

    const measure = () => {
      const setWidth = oneSet.scrollWidth
      const viewWidth = viewport.clientWidth
      if (setWidth <= 0 || viewWidth <= 0) return

      const needed = Math.max(2, Math.ceil((viewWidth * 2) / setWidth))
      setCopies(needed)
      setDurationSeconds(Math.max(12, Math.round(setWidth / 70)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
    // Do lai moi khi danh sach tran doi (do dai noi dung thay doi theo)
  }, [matches])

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
      <div className="ft-ticker-viewport" ref={viewportRef}>
        {/*
          Bang chay gom `copies` BAN SAO giong het nhau cua danh sach tran.
          Chay het mot ban sao thi nhay ve 0 - luc do ban sao ke tiep dang o dung
          vi tri cu, mat khong thay diem noi.

          So ban sao PHAI du de lap kin khung nhin. Truoc day cung nhac lap dung 2 lan,
          nhung trai mua chi co 1-2 tran nen ca hai ban sao gop lai van hep hon man hinh:
          nguoi dung thay tran do hien hai lan canh nhau va bang chi chay duoc nua duong.
        */}
        <div
          className="ft-ticker-track"
          style={{
            '--ft-ticker-shift': `-${100 / copies}%`,
            '--ft-ticker-duration': `${durationSeconds}s`,
          }}
        >
          {Array.from({ length: copies }, (_, copy) => (
            <span
              key={copy}
              ref={copy === 0 ? setRef : undefined}
              className="ft-ticker-set"
              // Chi ban sao dau tien duoc trinh doc man hinh doc, tranh doc lap lai
              aria-hidden={copy > 0 ? 'true' : undefined}
            >
              {matches.map((m) => renderItem(m, `${copy}-${m.id}`))}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
