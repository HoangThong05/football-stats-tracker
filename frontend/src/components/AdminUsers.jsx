import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Loading from './Loading'

export default function AdminUsers({ token, onBack }) {
  const { t, lang } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/admin/users`, { headers: authHeaders(token) })
      .then((res) => {
        if (!res.ok) throw new Error(`Loi ${res.status}`)
        return res.json()
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <h3 className="h5 mb-3">{t('admin_title')}</h3>

      {loading && <Loading />}
      {error && (
        <div className="alert alert-danger">
          {t('error_generic')} {error}
        </div>
      )}

      {!loading && !error && (
        <div className="ft-card table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>{t('admin_col_id')}</th>
                <th>{t('admin_col_email')}</th>
                <th>{t('admin_col_role')}</th>
                <th>{t('admin_col_created')}</th>
              </tr>
            </thead>
            <tbody className="ft-stagger">
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="fw-medium">{u.email}</td>
                  <td>
                    <span className={u.role === 'ADMIN' ? 'badge text-bg-danger' : 'badge text-bg-secondary'}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-secondary small">
                    {new Date(u.createdAt).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
