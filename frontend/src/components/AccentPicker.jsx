import { useState } from 'react'
import { useTranslation } from '../i18n'
import { ACCENT_PRESETS, applyAccent, saveAccent, savedAccent } from '../theme'

/**
 * Chon mau chu dao (accent) cho giao dien. Ap dung ngay + luu localStorage (rieng thiet bi).
 */
export default function AccentPicker() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(savedAccent()) // '' = mac dinh

  const pick = (hex) => {
    const val = hex || ''
    setCurrent(val)
    saveAccent(val)
    applyAccent(val)
  }

  const isPreset = ACCENT_PRESETS.some((p) => (p.hex || '') === current)
  const customActive = current && !isPreset

  return (
    <div className="ft-push-toggle">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span aria-hidden="true">🎨</span>
        <span className="fw-medium">{t('theme_accent_title')}</span>
      </div>
      <div className="ft-accent-swatches">
        {ACCENT_PRESETS.map((p) => {
          const active = (p.hex || '') === current
          if (!p.hex) {
            return (
              <button key={p.id} type="button"
                className={`ft-accent-default${active ? ' active' : ''}`}
                onClick={() => pick(null)}>
                {t('theme_accent_default')}
              </button>
            )
          }
          return (
            <button key={p.id} type="button"
              className={`ft-accent-swatch${active ? ' active' : ''}`}
              style={{ background: p.hex }}
              onClick={() => pick(p.hex)}
              aria-label={p.hex}>
              {active ? '✓' : ''}
            </button>
          )
        })}

        {/* Tu chon mau bat ky - mo bang mau day du cua trinh duyet */}
        <label
          className={`ft-accent-swatch ft-accent-custom${customActive ? ' active' : ''}`}
          style={customActive ? { background: current } : undefined}
          title={t('theme_accent_custom')}>
          {customActive ? '✓' : '🎨'}
          <input type="color" value={customActive ? current : '#22c55e'}
            onChange={(e) => pick(e.target.value)} />
        </label>
      </div>
    </div>
  )
}
