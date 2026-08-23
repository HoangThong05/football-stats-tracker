import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { formatKickoff, shortTeamName } from '../utils'
import { useTranslation } from '../i18n'

export default function PredictionsView({ matches, token, onRefresh, onSelectMatch }) {
  const { t, lang } = useTranslation()
  // Luu ti so dang nhap cho tung tran: { [matchId]: { home: '2', away: '1' } }
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  // Loi cua tung tran: { id, msg } - msg tuy ly do (ti so sai / tran da bat dau)
  const [error, setError] = useState(null)
  // Tran dang dat x2 tuan nay (null = chua dung luot). Cho banner.
  const [currentDouble, setCurrentDouble] = useState(null)
  const [doublingId, setDoublingId] = useState(null)
  const [x2Error, setX2Error] = useState(null)

  useEffect(() => {
    const initial = {}
    for (const m of matches) {
      initial[m.matchId] = {
        home: m.myHomeScore ?? '',
        away: m.myAwayScore ?? '',
      }
    }
    setDrafts(initial)
  }, [matches])

  // Trang thai luot x2 tuan nay - dung MOT lan chung cho ca 6 giai
  const fetchCurrentDouble = () => {
    if (!token) {
      setCurrentDouble(null)
      return
    }
    fetch(`${API_BASE}/predictions/double/current-week`, { headers: authHeaders(token) })
      .then((res) => (res.status === 204 ? null : res.ok ? res.json() : null))
      .then(setCurrentDouble)
      .catch(() => {})
  }

  useEffect(fetchCurrentDouble, [token])

  const setDraft = (matchId, field, value) => {
    setDrafts((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }))
  }

  const submit = (matchId) => {
    const draft = drafts[matchId]
    const home = Number(draft?.home)
    const away = Number(draft?.away)
    if (draft?.home === '' || draft?.away === '' || Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
      setError({ id: matchId, msg: t('predict_invalid_score') })
      return
    }

    setError(null)
    setSavingId(matchId)

    fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
    })
      .then((res) => {
        if (res.ok) {
          onRefresh()
          return
        }
        // 409 = tran da bat dau (may chu chan). Phan biet voi ti so sai (400) de
        // khong bao nham "ti so khong hop le" khi nguoi dung nhap ti so binh thuong.
        setError({
          id: matchId,
          msg: res.status === 409 ? t('predict_started') : t('predict_invalid_score'),
        })
      })
      .catch(() => setError({ id: matchId, msg: t('predict_invalid_score') }))
      .finally(() => setSavingId(null))
  }

  // Ma loi tu backend -> cau tieng nguoi dung doc duoc
  const x2ErrMap = {
    must_predict_first: t('predict_x2_need_predict'),
    match_started: t('predict_x2_started'),
    not_current_week: t('predict_x2_not_week'),
    double_used_this_week: t('predict_x2_locked'),
    rate_limited: t('auth_rate_limited'),
  }

  const toggleDouble = (m) => {
    setDoublingId(m.matchId)
    setX2Error(null)
    fetch(`${API_BASE}/predictions/double`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ matchId: m.matchId, doubled: !m.myDoubled }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `Error ${res.status}`)
        }
      })
      .then(() => {
        onRefresh()
        fetchCurrentDouble()
      })
      .catch((err) => setX2Error(x2ErrMap[err.message] || err.message))
      .finally(() => setDoublingId(null))
  }

  if (matches.length === 0) {
    return (
      <div className="alert alert-secondary d-flex align-items-center gap-2">
        <span style={{ fontSize: '1.3rem' }}>🎯</span>
        <span>{t('predict_empty')}</span>
      </div>
    )
  }

  const hasEligible = matches.some((m) => m.weekEligible)

  return (
    <div>
      {!token && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <span>{t('predict_login_hint')}</span>
        </div>
      )}

      {/* Banner luot x2 tuan nay - hien moi lan mo tab cho toi khi da dung */}
      {token && currentDouble && (
        <div className="alert alert-warning py-2 small d-flex align-items-center gap-2">
          <span>⭐</span>
          <span>
            {t('predict_x2_used').replace(
              '{match}',
              `${shortTeamName(currentDouble.homeTeam)} - ${shortTeamName(currentDouble.awayTeam)}`,
            )}
          </span>
        </div>
      )}
      {token && !currentDouble && hasEligible && (
        <div className="alert alert-warning py-2 small d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
          <span>{t('predict_x2_available')}</span>
        </div>
      )}

      {x2Error && (
        <div className="alert alert-danger py-2 small" role="button" onClick={() => setX2Error(null)}>
          {x2Error}
        </div>
      )}

      <div className="ft-card">
        <ul className="list-group list-group-flush ft-stagger">
          {matches.map((m) => {
            const draft = drafts[m.matchId] || { home: '', away: '' }
            const already = m.myHomeScore != null
            // Tran da lan bong -> khoa o nhap, an nut. Phong khi danh sach con sot tran
            // vua bat dau: de nguoi dung go so roi bam moi bao loi thi rat kho hieu.
            const started = m.utcDate && new Date(m.utcDate).getTime() <= Date.now()

            return (
              <li key={m.matchId} className="list-group-item py-3">
                <div className="ft-predict-row">
                  <small
                    className="text-secondary ft-predict-time"
                    role="button"
                    onClick={() => onSelectMatch(m.matchId)}
                  >
                    <span className="d-block ft-predict-when">{formatKickoff(m.utcDate, lang)}</span>
                    {m.matchday != null && (
                      <span className="d-block text-body-tertiary">
                        {t('matchday_label')} {m.matchday}
                      </span>
                    )}
                  </small>

                  <div className="ft-predict-home d-flex align-items-center justify-content-end gap-2">
                    {m.myDoubled && <span className="badge text-bg-warning">x2</span>}
                    <span className="text-truncate fw-medium" title={m.homeTeam}>{shortTeamName(m.homeTeam)}</span>
                    {m.homeCrest && <img src={m.homeCrest} alt="" width="22" height="22" loading="lazy" />}
                  </div>

                  {token ? (
                    <div className="ft-predict-score d-flex align-items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="form-control form-control-sm text-center"
                        style={{ width: 52 }}
                        value={draft.home}
                        disabled={started}
                        onChange={(e) => setDraft(m.matchId, 'home', e.target.value)}
                      />
                      <span className="text-secondary">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="form-control form-control-sm text-center"
                        style={{ width: 52 }}
                        value={draft.away}
                        disabled={started}
                        onChange={(e) => setDraft(m.matchId, 'away', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="ft-predict-score ft-score-badge upcoming text-center">{t('matches_vs')}</span>
                  )}

                  <div className="ft-predict-away d-flex align-items-center gap-2">
                    {m.awayCrest && <img src={m.awayCrest} alt="" width="22" height="22" loading="lazy" />}
                    <span className="text-truncate fw-medium" title={m.awayTeam}>{shortTeamName(m.awayTeam)}</span>
                  </div>

                  {token && !started && (
                    <div className="ft-predict-btn d-flex flex-column gap-1">
                      <button
                        className={already ? 'btn btn-outline-success btn-sm' : 'btn btn-success btn-sm'}
                        onClick={() => submit(m.matchId)}
                        disabled={savingId === m.matchId}
                      >
                        {savingId === m.matchId ? t('predict_saving') : already ? t('predict_update_btn') : t('predict_submit_btn')}
                      </button>
                      {/* Nut x2: chi khi DA du doan va tran trong tuan nay */}
                      {already && m.weekEligible && (
                        <button
                          className={m.myDoubled ? 'btn btn-warning btn-sm' : 'btn btn-outline-warning btn-sm'}
                          onClick={() => toggleDouble(m)}
                          disabled={doublingId === m.matchId}
                          title={m.myDoubled ? t('predict_x2_off_hint') : t('predict_x2_on_hint')}
                        >
                          {m.myDoubled ? `✓ ${t('predict_x2_btn')}` : t('predict_x2_btn')}
                        </button>
                      )}
                    </div>
                  )}
                  {token && started && (
                    <span className="ft-predict-btn text-secondary small text-center">{t('predict_started')}</span>
                  )}
                </div>

                {error && error.id === m.matchId && (
                  <div className="text-danger small mt-1">{error.msg}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <p className="ft-legend text-secondary mt-2 ps-1">{t('predict_scoring_rule')}</p>
    </div>
  )
}
