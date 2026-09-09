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
        {/* Loi vao kin dao cho admin: bam vao bieu tuong bua de mo dang nhap.
            Nguoi dung thuong khong de y -> man hinh sach, khong lo nut "dang nhap quan tri". */}
        <div
          className="ft-maint-icon"
          onClick={onLogin || undefined}
          style={onLogin ? { cursor: 'pointer' } : undefined}
          title={onLogin ? t('maint_admin_login') : undefined}
          aria-hidden="true"
        >
          🛠️
        </div>
        <h1 className="ft-maint-title">{t('maint_title')}</h1>
        <p className="ft-maint-msg">{message || t('maint_default_msg')}</p>
      </div>
    </div>
  )
}
