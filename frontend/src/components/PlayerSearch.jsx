import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../api'
import { useTranslation } from '../i18n'
import { shortTeamName } from '../utils'

const MIN_CHARS = 2
const DEBOUNCE_MS = 300
// 6 giai x ~20 doi. Chi de uoc luong tien do, khong can chinh xac tuyet doi.
const EXPECTED_TEAMS = 120

/**
 * Tim cau thu theo ten.
 *
 * Doc tu chi muc trong database chu khong goi API bong da, nen go den dau ra den do
 * ma khong ton han muc request. Doi lai: cau thu chi tim thay sau khi doi cua ho da
 * duoc lap chi muc - viec do chay ngam, moi lan mot doi.
 */
export default function PlayerSearch({ league, onSelectTeam }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [allLeagues, setAllLeagues] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  // Da phai noi rong ra cac giai khac moi tim thay
  const [widened, setWidened] = useState(false)
  const requestId = useRef(0)
  const [status, setStatus] = useState(null)

  // Chi de giai thich khi khong tim thay: dang thieu du lieu hay that su khong co
  useEffect(() => {
    fetch(`${API_BASE}/players/index-status`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [searched])

  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_CHARS) {
      setResults([])
      setSearched(false)
      return undefined
    }

    const timer = setTimeout(() => {
      /*
       * Danh so tung request: go nhanh thi nhieu request chay cung luc, ma chung
       * khong dam bao ve dung thu tu. Khong co so nay thi ket qua cua chu "ma" co the
       * ve sau chu "martinez" va de len ket qua dung.
       */
      const id = ++requestId.current
      setLoading(true)
      const base = `${API_BASE}/players/search?q=${encodeURIComponent(q)}`
      const url = allLeagues ? base : `${base}&league=${league}`

      fetch(url)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          /*
           * Khong co trong giai dang xem thi thu lai tren tat ca cac giai.
           * Rat hay gap: nguoi dung dang o Premier League nhung go "Mbappe" - anh ay
           * da cho Real Madrid. Bao "khong tim thay" luc do la dung ky thuat nhung
           * vo dung voi nguoi dung, vi cau thu do CO trong du lieu.
           */
          if (data.length === 0 && !allLeagues) {
            return fetch(base)
              .then((r) => (r.ok ? r.json() : []))
              .then((all) => ({ rows: all, widened: all.length > 0 }))
          }
          return { rows: data, widened: false }
        })
        .then(({ rows, widened }) => {
          if (id !== requestId.current) return
          setResults(rows)
          setWidened(widened)
          setSearched(true)
        })
        .catch(() => {
          if (id !== requestId.current) return
          setResults([])
          setSearched(true)
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, league, allLeagues])

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <input
          type="search"
          className="form-control"
          style={{ maxWidth: 380 }}
          placeholder={t('players_search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="form-check mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            id="ft-all-leagues"
            checked={allLeagues}
            onChange={(e) => setAllLeagues(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="ft-all-leagues">
            {t('players_all_leagues')}
          </label>
        </div>
      </div>

      {query.trim().length > 0 && query.trim().length < MIN_CHARS && (
        <p className="text-secondary small">{t('players_min_chars')}</p>
      )}

      {loading && <p className="text-secondary small">{t('loading')}</p>}

      {!loading && searched && results.length === 0 && (
        <div className="ft-card p-3">
          <p className="mb-1">{t('players_none')}</p>
          <p className="text-secondary small mb-0">
            {status && status.teams < EXPECTED_TEAMS
              ? t('players_indexing')
                  .replace('{teams}', status.teams)
                  .replace('{total}', EXPECTED_TEAMS)
                  .replace('{players}', status.players)
              : t('players_index_note')}
          </p>
        </div>
      )}

      {!loading && widened && results.length > 0 && (
        <p className="text-secondary small">{t('players_widened')}</p>
      )}

      {results.length > 0 && (
        <div className="row g-2">
          {results.map((p) => (
            <div className="col-12 col-md-6 col-lg-4" key={p.id}>
              <button
                type="button"
                className="ft-card p-3 w-100 text-start border-0 d-flex align-items-center gap-3"
                onClick={() => p.teamId && onSelectTeam(p.teamId)}
                title={t('players_go_to_team')}
              >
                {p.teamCrest && (
                  <img src={p.teamCrest} alt="" width={36} height={36}
                    style={{ objectFit: 'contain', flexShrink: 0 }} />
                )}
                <span className="flex-grow-1" style={{ minWidth: 0 }}>
                  <span className="d-block fw-semibold text-truncate">{p.name}</span>
                  <span className="d-block text-secondary small text-truncate">
                    {shortTeamName(p.teamName)}
                    {p.position ? ` · ${p.position}` : ''}
                    {p.age ? ` · ${p.age} ${t('players_years_old')}` : ''}
                  </span>
                  {p.nationality && (
                    <span className="d-block text-secondary small text-truncate">{p.nationality}</span>
                  )}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
