import { useEffect, useState } from 'react'
import { subscribe, dismiss } from '../ui/toast'

/**
 * Noi hien cac toast. Dat MOT lan o goc App. Bam vao mot toast de dong som.
 */
export default function Toaster() {
  const [items, setItems] = useState([])
  useEffect(() => subscribe(setItems), [])

  if (items.length === 0) return null

  const icon = (type) => (type === 'success' ? '✓' : type === 'error' ? '!' : 'i')

  return (
    <div className="ft-toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`ft-toast ft-toast-${t.type}`}
          onClick={() => dismiss(t.id)}
        >
          <span className="ft-toast-icon" aria-hidden="true">{icon(t.type)}</span>
          <span className="ft-toast-msg">{t.message}</span>
        </button>
      ))}
    </div>
  )
}
