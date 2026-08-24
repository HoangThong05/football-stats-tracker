import { shortTeamName } from '../utils'
import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../api'
import { useTranslation } from '../i18n'
import AvatarUpload from './AvatarUpload'
import Badges from './Badges'
import ChangePassword from './ChangePassword'
import DisplayName from './DisplayName'
import NotificationToggle from './NotificationToggle'
import ProfileStats from './ProfileStats'
import FriendsList from './FriendsList'
import PredictionPointsChart from './PredictionPointsChart'

/**
 * Trang tong hop ca nhan, dung theo loi trang ca nhan mang xa hoi: mot the "danh tinh"
 * o dau (bia + anh dai dien + ten + dai so lieu), roi ben duoi la cac the noi dung.
 *
 * Vi sao gom lai: truoc day 7 khoi xep chong doc, moi khoi keo dai het be ngang cho vai
 * dong chu - phai cuon rat nhieu ma khong khoi nao day. Ba danh sach ngan (ban be, doi
 * yeu thich, phong dau) xep 3 cot vua khit mot man hinh.
 *
 * Hai o cai dat (ten hien thi, mat khau) an sau nut "Cai dat": chung la thu thinh
 * thoang moi dung den mot lan, khong dang chiem cho ngay dau trang.
 */
export default function Profile({ token, userEmail, hasPassword, viaGoogle, displayName,
  avatarUrl, isAdmin, onAvatarSaved, onDisplayNameSaved, onSelectUser, favorites, onBack,
  onSelectTeam, onGoToMiniLeague, onTokenRenewed }) {
  const { t } = useTranslation()
  const [leagues, setLeagues] = useState([])
  const [weeklyWins, setWeeklyWins] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!token) {
      setLeagues([])
      setWeeklyWins(0)
      return
    }
    fetch(`${API_BASE}/leagues/my`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeagues(data))
      .catch(() => setLeagues([]))
    // So lan "Nhat tuan" - hien huy hieu canh ten
    fetch(`${API_BASE}/predictions/champions/mine`, { headers: authHeaders(token) })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWeeklyWins(Array.isArray(data) ? data.length : 0))
      .catch(() => setWeeklyWins(0))
  }, [token])

  /** Mot the danh sach ngan trong hang 3 cot. */
  const listCard = (title, count, items, emptyText) => (
    <div className="ft-card p-3 h-100">
      <div className="fw-semibold mb-2">
        {title} <span className="text-secondary ft-num">({count})</span>
      </div>
      {items.length === 0 ? (
        <p className="text-secondary small mb-0">{emptyText}</p>
      ) : (
        <ul className="list-group list-group-flush">{items}</ul>
      )}
    </div>
  )

  return (
    <div className="ft-fade">
      <button className="btn btn-link ps-0 mb-3" onClick={onBack}>
        {t('back')}
      </button>

      <div className="ft-card ft-profile-hero mb-3">
        {/* Bia: vach san co cua chinh app, khong phai anh tai ve - khong ton request nao */}
        <div className="ft-profile-cover" />

        <div className="ft-profile-id">
          <AvatarUpload token={token} name={displayName || userEmail} avatarUrl={avatarUrl}
            onSaved={onAvatarSaved} />

          <div className="ft-profile-id-text">
            <h3 className="h4 mb-0 text-truncate">
              {displayName || (userEmail || '').split('@')[0]}
              {isAdmin && <span className="ft-admin-tag ms-2">{t('role_admin')}</span>}
            </h3>
            <div className="text-secondary small text-truncate">{userEmail}</div>
            {weeklyWins > 0 && (
              <span className="badge text-bg-warning mt-1">
                🏆 {t('profile_weekly_wins')} ×{weeklyWins}
              </span>
            )}
          </div>

          <button type="button" className="btn btn-sm btn-outline-secondary ft-profile-settings-btn"
            onClick={() => setShowSettings((v) => !v)}>
            {showSettings ? t('pw_cancel') : `⚙ ${t('profile_settings')}`}
          </button>
        </div>

        {!isAdmin && <ProfileStats token={token} />}

        {showSettings && (
          <div className="ft-profile-settings ft-fade">
            <NotificationToggle token={token} />
            <DisplayName token={token} displayName={displayName} onSaved={onDisplayNameSaved} />
            <ChangePassword token={token} hasPassword={hasPassword} viaGoogle={viaGoogle}
              onTokenRenewed={onTokenRenewed} />
          </div>
        )}
      </div>

      {!isAdmin && (
      <>
      {/* Nhom "thanh tich": huy hieu + bieu do diem - ke chuyen minh choi tot the nao */}
      <Badges token={token} />

      <PredictionPointsChart token={token} />

      {/* Nhom "mang luoi": ban be, doi yeu thich, phong - xuong duoi cung */}
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <FriendsList token={token} onSelectUser={onSelectUser} />
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          {listCard(
            t('profile_favorites_title'),
            favorites.length,
            favorites.map((f) => (
              <li
                key={f.teamId}
                className="list-group-item d-flex align-items-center gap-2 px-0"
                role="button"
                onClick={() => onSelectTeam(f.teamId)}
              >
                {f.teamCrest && <img src={f.teamCrest} alt="" width="22" height="22" loading="lazy" />}
                <span className="fw-medium text-truncate" title={f.teamName}>{shortTeamName(f.teamName)}</span>
                <span className="ms-auto text-secondary">›</span>
              </li>
            )),
            t('fav_empty'),
          )}
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          {listCard(
            t('profile_mini_league_title'),
            leagues.length,
            leagues.map((l) => (
              <li
                key={l.id}
                className="list-group-item d-flex align-items-center gap-2 px-0"
                role="button"
                onClick={onGoToMiniLeague}
              >
                <span className="fw-medium text-truncate">{l.name}</span>
                <span className="ms-auto text-secondary small">
                  {l.memberCount} {t('ml_members_count')}
                </span>
              </li>
            )),
            t('ml_empty'),
          )}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
