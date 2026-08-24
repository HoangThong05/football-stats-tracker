import { useEffect, useRef, useState } from 'react'

/*
 * Hop xac nhan trong app, thay cho confirm()/prompt() goc trinh duyet (trong lac que
 * so voi giao dien con lai).
 *
 * Dung o cap module nhu toast: goi confirmDialog(...) tu bat ky dau, tra ve Promise.
 *   - Che do thuong: resolve true (Dong y) hoac null (Huy/dong).
 *   - Che do nhap (input:true): resolve chuoi da nhap (co the rong) hoac null neu Huy.
 * Mot <ConfirmDialog/> duy nhat o App lang nghe va ve ra.
 */
let openExternal = null
let resolver = null

export function confirmDialog(options = {}) {
  return new Promise((resolve) => {
    resolver = resolve
    if (openExternal) {
      openExternal(options)
    } else {
      // Chua gan host (hiem) -> ve confirm goc de khong ket
      resolve(window.confirm(options.message || '') ? (options.input ? '' : true) : null)
    }
  })
}

export default function ConfirmDialog() {
  const [opts, setOpts] = useState(null)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    openExternal = (options) => {
      setOpts(options)
      setValue('')
    }
    return () => {
      openExternal = null
    }
  }, [])

  useEffect(() => {
    if (!opts) return undefined
    // Focus o nhap / nut khi mo; Esc de dong
    const onKey = (e) => {
      if (e.key === 'Escape') close(null)
    }
    document.addEventListener('keydown', onKey)
    if (opts.input && inputRef.current) inputRef.current.focus()
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts])

  if (!opts) return null

  const close = (result) => {
    const r = resolver
    resolver = null
    setOpts(null)
    if (r) r(result)
  }

  const onConfirm = () => close(opts.input ? value.trim() : true)

  return (
    <div className="ft-confirm-overlay" onClick={() => close(null)}>
      <div className="ft-confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {opts.title && <h3 className="ft-confirm-title">{opts.title}</h3>}
        {opts.message && <p className="ft-confirm-msg">{opts.message}</p>}

        {opts.input && (
          <textarea
            ref={inputRef}
            className="form-control mb-1"
            rows={2}
            maxLength={opts.maxLength || 200}
            placeholder={opts.placeholder || ''}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}

        <div className="ft-confirm-actions">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => close(null)}>
            {opts.cancelText || 'Huỷ'}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${opts.danger ? 'btn-danger' : 'btn-success'}`}
            onClick={onConfirm}
          >
            {opts.confirmText || 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  )
}
