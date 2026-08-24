import { useState } from 'react'
import Modal from './Modal'
import { LEAGUES } from '../constants'
import { useTranslation } from '../i18n'
import { toast } from '../ui/toast'

/**
 * Hop sinh ma nhung (iframe) cho BXH / lich thi dau: chon loai + giai + giao dien,
 * xem truoc song, roi copy doan <iframe> dan vao web khac.
 */
export default function EmbedModal({ onClose, defaultType = 'standings', defaultLeague = 'PL', defaultShow = 'upcoming' }) {
  const { t, lang } = useTranslation()
  const [type, setType] = useState(defaultType) // 'standings' | 'fixtures'
  const [league, setLeague] = useState(defaultLeague)
  const [theme, setTheme] = useState('light')
  const [show, setShow] = useState(defaultShow) // 'upcoming' | 'results' (chi cho fixtures)

  const showQuery = type === 'fixtures' && show === 'results' ? '&show=results' : ''
  const src = `${window.location.origin}/embed/${type}?league=${league}&theme=${theme}&lang=${lang}${showQuery}`
  const height = type === 'standings' ? 520 : 460
  const snippet = `<iframe src="${src}" width="360" height="${height}" style="border:0;border-radius:12px;max-width:100%" loading="lazy" title="Football Stats Tracker"></iframe>`

  const copy = () => {
    navigator.clipboard?.writeText(snippet)
      .then(() => toast.success(t('embed_copied')))
      .catch(() => toast.error(t('embed_copy_failed')))
  }

  const seg = (val, setter, current, label) => (
    <button
      type="button"
      className={`btn btn-sm ${current === val ? 'btn-success' : 'btn-outline-secondary'}`}
      onClick={() => setter(val)}
    >
      {label}
    </button>
  )

  return (
    <Modal onClose={onClose} label={t('embed_title')} size="lg">
      <div className="ft-card p-3 p-md-4">
        <h3 className="h5 mb-1">{t('embed_title')}</h3>
        <p className="text-secondary small mb-3">{t('embed_hint')}</p>

        <div className="d-flex flex-wrap gap-3 mb-3">
          <div>
            <label className="form-label small mb-1 d-block">{t('embed_type')}</label>
            <div className="d-flex gap-1">
              {seg('standings', setType, type, t('embed_type_standings'))}
              {seg('fixtures', setType, type, t('embed_type_fixtures'))}
            </div>
          </div>

          <div>
            <label className="form-label small mb-1 d-block">{t('embed_league')}</label>
            <select className="form-select form-select-sm" value={league}
              onChange={(e) => setLeague(e.target.value)} style={{ minWidth: 160 }}>
              {LEAGUES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {type === 'fixtures' && (
            <div>
              <label className="form-label small mb-1 d-block">{t('embed_show')}</label>
              <div className="d-flex gap-1">
                {seg('upcoming', setShow, show, t('embed_show_upcoming'))}
                {seg('results', setShow, show, t('embed_show_results'))}
              </div>
            </div>
          )}

          <div>
            <label className="form-label small mb-1 d-block">{t('embed_theme')}</label>
            <div className="d-flex gap-1">
              {seg('light', setTheme, theme, t('embed_theme_light'))}
              {seg('dark', setTheme, theme, t('embed_theme_dark'))}
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label small mb-1 d-block">{t('embed_preview')}</label>
            {/* key: doi tham so thi nap lai iframe de xem truoc dung ngay */}
            <iframe
              key={src}
              src={src}
              title="preview"
              style={{ width: '100%', height, border: '1px solid var(--bs-border-color-translucent)', borderRadius: 12 }}
              loading="lazy"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label small mb-1 d-block">{t('embed_code')}</label>
            <textarea className="form-control ft-embed-code" rows={5} readOnly value={snippet}
              onClick={(e) => e.target.select()} />
            <button type="button" className="btn btn-success btn-sm mt-2" onClick={copy}>
              {t('embed_copy')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
