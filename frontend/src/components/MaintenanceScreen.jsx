import { useTranslation } from '../i18n'

/**
 * Man hinh phu kin khi he thong dang BAO TRI - chan nguoi dung thuong dung app.
 * Admin khong thay man nay (App tu bo qua khi vai tro ADMIN).
 */
export default function MaintenanceScreen({ message, onLogin }) {
  const { t } = useTranslation()
  return (
    <div className="ft-maint">
      <div className="ft-maint-card">
        <div className="ft-maint-icon" aria-hidden="true">🛠️</div>
        <h1 className="ft-maint-title">{t('maint_title')}</h1>
        <p className="ft-maint-msg">{message || t('maint_default_msg')}</p>
        {onLogin && (
          <button type="button" className="btn btn-sm btn-outline-light mt-2" onClick={onLogin}>
            {t('maint_admin_login')}
          </button>
        )}
      </div>
    </div>
  )
}
