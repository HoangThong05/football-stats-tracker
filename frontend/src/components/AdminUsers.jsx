import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import Loading from './Loading'
import AdminPanel from './AdminPanel'

export default function AdminUsers({ token, onBack, currentEmail }) {
  const { t, lang } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [changingId, setChangingId] = useState(null)

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

  /*
   * Backend con chan mot lan nua (khong tu ha quyen minh, khong ha admin cuoi cung).
   * Kiem tra o day chi de an nut cho do nham - khong duoc coi day la lop bao ve.
   */
  const roleErrors = {
    cannot_demote_self: t('admin_err_self'),
    last_admin: t('admin_err_last_admin'),
  }

  const changeRole = (user) => {
    const next = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    setChangingId(user.id)
    setError(null)

    fetch(`${API_BASE}/admin/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ role: next }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(roleErrors[data.message] || data.message || `Loi ${res.status}`)
        return data
      })
      .then((updated) => setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u))))
      .catch((err) => setError(err.message))
      .finally(() => setChangingId(null))
  }

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <h3 className="h5 mb-3">{t('admin_title')}</h3>

      <AdminPanel token={token} />

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
                <th className="text-end">{t('admin_col_action')}</th>
              </tr>
            </thead>
            <tbody className="ft-stagger">
              {users.map((u) => {
                const isSelf = u.email === currentEmail
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className="fw-medium">
                      {u.email}
                      {isSelf && <span className="text-secondary small ms-2">({t('lb_you')})</span>}
                    </td>
                    <td>
                      <span className={u.role === 'ADMIN' ? 'badge text-bg-danger' : 'badge text-bg-secondary'}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-secondary small">
                      {new Date(u.createdAt).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN')}
                    </td>
                    <td className="text-end">
                      {/* Chinh minh thi khong hien nut - ha quyen minh la tu khoa minh ra ngoai */}
                      {!isSelf && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => changeRole(u)}
                          disabled={changingId != null}
                        >
                          {changingId === u.id
                            ? t('auth_submitting')
                            : u.role === 'ADMIN'
                              ? t('admin_demote')
                              : t('admin_promote')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
