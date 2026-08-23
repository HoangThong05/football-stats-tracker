import { useState } from 'react'
import { REACTIONS, REACTION_EMOJI } from '../constants'
import { useTranslation } from '../i18n'

/**
 * Thanh cam xuc kieu Facebook cho bai viet / binh luan.
 *
 * @param current  loai cam xuc cua nguoi xem (LIKE/LOVE...), null = chua tha
 * @param counts   { LIKE: 3, LOVE: 1 } - so luot theo loai
 * @param total    tong so luot
 * @param onReact  (type) => void: tha loai do; bam lai dung loai dang co = go
 * @param compact  ban gon cho binh luan
 *
 * Bam nut mo bang chon 6 cam xuc; may co chuot thi ro chuot vao cung mo.
 */
export default function ReactionBar({ current, counts, total, onReact, disabled, compact }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const cur = REACTIONS.find((r) => r.type === current)

  const pick = (type) => {
    setOpen(false)
    onReact(type)
  }

  // Tối đa 3 biểu tượng nhiều lượt nhất, cho phần tóm tắt
  const topEmojis = Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTION_EMOJI[type] || '👍')

  return (
    <span className={`ft-react ${compact ? 'ft-react-compact' : ''}`} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className={`ft-react-btn ${cur ? `reacted reacted-${cur.type.toLowerCase()}` : ''}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => !disabled && setOpen(true)}
      >
        <span className="ft-react-btn-emoji">{cur ? cur.emoji : '👍'}</span>
        <span className="ft-react-btn-label">{cur ? t(cur.labelKey) : t('react_like')}</span>
      </button>

      {open && !disabled && (
        <span className="ft-react-picker">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={t(r.labelKey)}
              className={`ft-react-opt ${current === r.type ? 'active' : ''}`}
              onClick={() => pick(r.type)}
            >
              {r.emoji}
            </button>
          ))}
        </span>
      )}

      {total > 0 && (
        <span className="ft-react-summary" title={`${total}`}>
          {topEmojis.join('')} <span className="ft-num">{total}</span>
        </span>
      )}
    </span>
  )
}
