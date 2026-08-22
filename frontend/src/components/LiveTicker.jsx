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

/** Toc do chay, pixel moi giay. Doc thoai mai o muc nay, khong phai duoi mat theo. */
const SPEED_PX_PER_S = 70

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
  const [motion, setMotion] = useState({ copies: 1, from: 0, to: 0, duration: 20 })

  /*
   * HAI KIEU CHAY khac han nhau, chon theo noi dung co dai hon khung hay khong.
   *
   * a) Noi dung DAI HON khung (nhieu tran): lap du ban sao cho kin, chay vong lien
   *    tuc, het mot ban sao thi nhay ve 0 - mat khong thay diem noi.
   *
   * b) Noi dung NGAN HON khung (1-2 tran): chi MOT ban duy nhat, di tu mep phai sang
   *    het mep trai roi quay lai. Truoc day van lap cho kin o ca truong hop nay, ra
   *    canh mot tran bi nhan ban chuc lan nam canh nhau - nhin nhu bi ket dia.
   *
   * Toc do co dinh 70px/giay cho ca hai -> it tran hay nhieu tran deu mot nhip.
   */
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const oneSet = setRef.current
    if (!viewport || !oneSet || matches.length === 0) return undefined

    const measure = () => {
      const setWidth = oneSet.scrollWidth
      const viewWidth = viewport.clientWidth
      if (setWidth <= 0 || viewWidth <= 0) return

      if (setWidth > viewWidth) {
        setMotion({
          copies: Math.max(2, Math.ceil((viewWidth * 2) / setWidth)),
          from: 0,
          to: -setWidth,
          duration: Math.max(12, setWidth / SPEED_PX_PER_S),
        })
      } else {
        setMotion({
          copies: 1,
          from: viewWidth,
          to: -setWidth,
          duration: Math.max(10, (viewWidth + setWidth) / SPEED_PX_PER_S),
        })
      }
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

  const hasLive = matches.some((m) => LIVE_STATUSES.has(m.status))

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
      {/*
        Nhan doi theo tinh hinh that: co tran dang da thi bao "TRUC TIEP" mau do, khong
        thi la "TRAN DAU". Goi tat ca la "TY SO" thi sai voi cac tran chua da - chung
        moi chi co gio, chua co ti so nao.
      */}
      <div className={hasLive ? 'ft-ticker-label live' : 'ft-ticker-label'}>
        {hasLive ? t('ticker_label_live') : t('ticker_label')}
      </div>
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
            '--ft-ticker-from': `${motion.from}px`,
            '--ft-ticker-to': `${motion.to}px`,
            '--ft-ticker-duration': `${motion.duration}s`,
          }}
        >
          {Array.from({ length: motion.copies }, (_, copy) => (
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
