import { useEffect, useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'

/**
 * The "nghi giua hai mua": dem nguoc toi ngay khai mac + tong ket mua vua roi.
 *
 * Ly do ton tai: tu thang 6 den giua thang 8 khong co tran nao, nen bang xep hang
 * la mua cu, ticker trong, radar an. Nguoi vao trang thay mot trang im lim khong
 * biet chuyen gi dang xay ra. The nay lap dung khoang do bang du lieu THAT.
 *
 * Tu an khi giai da khoi tranh - luc do bang xep hang tu no da du hap dan.
 */

/** Con it hon so ngay nay thi coi nhu giai sap da, khong hien the nghi mua nua. */
const HIDE_WHEN_STARTED = true

function daysUntil(dateStr) {
  const start = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(start.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((start - today) / 86400000)
}

export default function SeasonBreak({ league, seasonStart, onSelectTeam }) {
  const { t, lang } = useTranslation()
  const [champion, setChampion] = useState(null)
  const [topScorer, setTopScorer] = useState(null)

  const days = seasonStart ? daysUntil(seasonStart) : null
  // Mua da bat dau -> khong con la ky nghi nua
  const isBreak = days != null && days > 0

  /*
   * Mua vua ket thuc suy TRUC TIEP tu ngay khai mac, khong dua vao nhan mua giai.
   *
   * Ly do: SeasonLabel o backend co buoc lui nhan lai 1 nam de xu ly kieu lech du lieu
   * cua football-data.org (season tro toi mua moi nhung bang van la so lieu mua cu).
   * Nen autoSeasonYear luc nghi giua mua DA LA mua vua xong roi - tru them 1 nua la
   * lui nham ve mua truoc nua. Header X-Season-Start la ngay THO chua qua buoc lui do,
   * nen lay nam cua no tru 1 moi ra dung mua vua ket thuc.
   */
  const lastSeason = seasonStart ? Number(seasonStart.slice(0, 4)) - 1 : null

  useEffect(() => {
    if (!isBreak || lastSeason == null) {
      setChampion(null)
      setTopScorer(null)
      return undefined
    }

    let cancelled = false

    /*
     * Hai lenh goi nay deu di qua cache 30 phut cua backend, va mua giai cu thi
     * khong bao gio doi nua -> thuc te chi ton request o lan dau tien.
     */
    fetch(`${API_BASE}/standings/${league}?season=${lastSeason}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (!cancelled) setChampion(rows.find((r) => r.position === 1) ?? null)
      })
      .catch(() => {})

    fetch(`${API_BASE}/scorers/${league}?season=${lastSeason}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (!cancelled) setTopScorer(list[0] ?? null)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [league, lastSeason, isBreak])

  if (HIDE_WHEN_STARTED && !isBreak) return null

  const openingDate = new Date(`${seasonStart}T00:00:00`).toLocaleDateString(
    lang === 'en' ? 'en-GB' : 'vi-VN',
    { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' },
  )

  return (
    <div className="ft-card ft-season-break p-3 mb-3 ft-fade">
      <div className="ft-season-break-head">
        <div>
          <div className="ft-season-break-label">{t('break_title')}</div>
          <div className="ft-season-break-date">{openingDate}</div>
        </div>
        <div className="ft-season-break-count">
          <span className="ft-season-break-days ft-num">{days}</span>
          <span className="ft-season-break-unit">{t('break_days')}</span>
        </div>
      </div>

      {(champion || topScorer) && (
        <div className="ft-season-break-recap">
          <div className="ft-season-break-recap-title">
            {t('break_recap_title')} {lastSeason}/{String(lastSeason + 1).slice(2)}
          </div>

          <div className="ft-season-break-items">
            {champion && (
              <div
                className="ft-season-break-item"
                role="button"
                onClick={() => onSelectTeam?.(champion.teamId)}
              >
                <span className="ft-season-break-icon">🏆</span>
                <div>
                  <div className="ft-season-break-item-label">{t('break_champion')}</div>
                  <div className="ft-season-break-item-value">
                    {champion.crest && <img src={champion.crest} alt="" width="18" height="18" />}
                    <span title={champion.teamName}>{shortTeamName(champion.teamName)}</span>
                    <span className="text-secondary ft-num">{champion.points}đ</span>
                  </div>
                </div>
              </div>
            )}

            {topScorer && (
              <div className="ft-season-break-item">
                <span className="ft-season-break-icon">⚽</span>
                <div>
                  <div className="ft-season-break-item-label">{t('break_top_scorer')}</div>
                  <div className="ft-season-break-item-value">
                    <span>{topScorer.playerName}</span>
                    <span className="text-secondary ft-num">
                      {topScorer.goals} {t('break_goals')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
