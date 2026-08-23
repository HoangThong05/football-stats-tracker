import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { REACTION_EMOJI } from '../constants'
import { useTranslation } from '../i18n'
import Avatar from './Avatar'
import Loading from './Loading'

/**
 * Hop "ai da tha cam xuc" kieu Facebook: mo khi bam vao phan tom tat cam xuc.
 *
 * @param kind   'posts' hoac 'comments' - dung dung endpoint
 * @param id     id cua bai / binh luan
 * @param onClose dong hop
 * @param onSelectUser bam vao mot nguoi -> mo trang ca nhan cua ho
 *
 * Tab "Tat ca" + tung loai cam xuc co mat (nhieu luot truoc). Danh sach loc theo tab.
 */
export default function ReactionsModal({ kind, id, token, onClose, onSelectUser }) {
  const { t } = useTranslation()
  const [reactors, setReactors] = useState(null)
  const [tab, setTab] = useState('ALL')

  useEffect(() => {
    fetch(`${API_BASE}/forum/${kind}/${id}/reactions`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReactors(Array.isArray(data) ? data : []))
      .catch(() => setReactors([]))
  }, [kind, id, token])

  // So luot theo loai, de dung tab; xep nhieu truoc
  const counts = {}
  for (const r of reactors || []) counts[r.type] = (counts[r.type] || 0) + 1
  const types = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([type]) => type)

  const shown = tab === 'ALL' ? (reactors || []) : (reactors || []).filter((r) => r.type === tab)

  const pick = (userId) => {
    onClose()
    onSelectUser(userId)
  }

  return (
    <div className="ft-reactors-overlay" onClick={onClose}>
      <div className="ft-reactors" onClick={(e) => e.stopPropagation()}>
        <div className="ft-reactors-head">
          <div className="ft-reactors-tabs">
            <button type="button" className={`ft-reactors-tab ${tab === 'ALL' ? 'active' : ''}`}
              onClick={() => setTab('ALL')}>
              {t('reactors_all')} {reactors && <span className="ft-num">{reactors.length}</span>}
            </button>
            {types.map((type) => (
              <button key={type} type="button" className={`ft-reactors-tab ${tab === type ? 'active' : ''}`}
                onClick={() => setTab(type)}>
                <span>{REACTION_EMOJI[type] || '👍'}</span> <span className="ft-num">{counts[type]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="ft-reactors-close" onClick={onClose} aria-label="X">✕</button>
        </div>

        <div className="ft-reactors-list">
          {reactors === null ? (
            <Loading rows={3} />
          ) : shown.length === 0 ? (
            <p className="text-secondary small mb-0 p-3">{t('reactors_empty')}</p>
          ) : (
            shown.map((r) => (
              <button key={`${r.userId}-${r.type}`} type="button" className="ft-reactors-row"
                onClick={() => pick(r.userId)}>
                <span className="ft-reactors-avatar">
                  <Avatar name={r.name} src={r.avatar} size={40} />
                  <span className="ft-reactors-badge">{REACTION_EMOJI[r.type] || '👍'}</span>
                </span>
                <span className="fw-medium text-truncate">{r.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
