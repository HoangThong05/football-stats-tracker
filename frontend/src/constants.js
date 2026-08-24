// zones: to mau vi tri tren BXH (top = suat du cup chau Au / vong sau, bottom = nguy hiem/xuong hang)
export const LEAGUES = [
  { code: 'PL', name: 'Premier League', zones: { top: 4, bottom: 3 } },
  { code: 'PD', name: 'La Liga', zones: { top: 4, bottom: 3 } },
  { code: 'BL1', name: 'Bundesliga', zones: { top: 4, bottom: 3 } },
  { code: 'SA', name: 'Serie A', zones: { top: 4, bottom: 3 } },
  { code: 'FL1', name: 'Ligue 1', zones: { top: 4, bottom: 3 } },
  // League phase CL: top 8 vao thang vong 1/8, tu 25 tro xuong bi loai
  { code: 'CL', name: 'Champions League', zones: { top: 8, bottom: 12 } },
]

export const VIEWS = [
  { key: 'standings', nameKey: 'view_standings' },
  { key: 'upcoming', nameKey: 'view_upcoming' },
  { key: 'results', nameKey: 'view_results' },
  { key: 'scorers', nameKey: 'view_scorers' },
  { key: 'compare', nameKey: 'view_compare' },
  { key: 'predict', nameKey: 'view_predict' },
]

// Chi so so sanh. better: 'high' = cao hon thi tot hon, 'low' = thap hon tot hon, null = khong so sanh
export const COMPARE_METRICS = [
  { key: 'position', labelKey: 'compare_metric_position', better: 'low' },
  { key: 'playedGames', labelKey: 'compare_metric_played', better: null },
  { key: 'won', labelKey: 'compare_metric_won', better: 'high' },
  { key: 'draw', labelKey: 'compare_metric_draw', better: null },
  { key: 'lost', labelKey: 'compare_metric_lost', better: 'low' },
  { key: 'goalsFor', labelKey: 'compare_metric_gf', better: 'high' },
  { key: 'goalsAgainst', labelKey: 'compare_metric_ga', better: 'low' },
  { key: 'goalDifference', labelKey: 'compare_metric_gd', better: 'high' },
  { key: 'points', labelKey: 'compare_metric_points', better: 'high' },
]

export const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Cam xuc kieu Facebook cho bai viet + binh luan. type khop enum backend.
export const REACTIONS = [
  { type: 'LIKE', emoji: '👍', labelKey: 'react_like' },
  { type: 'LOVE', emoji: '❤️', labelKey: 'react_love' },
  { type: 'HAHA', emoji: '😆', labelKey: 'react_haha' },
  { type: 'WOW', emoji: '😮', labelKey: 'react_wow' },
  { type: 'SAD', emoji: '😢', labelKey: 'react_sad' },
  { type: 'ANGRY', emoji: '😡', labelKey: 'react_angry' },
]

export const REACTION_EMOJI = REACTIONS.reduce((m, r) => { m[r.type] = r.emoji; return m }, {})

// Meta hien thi cho tung huy hieu (khop ma o BadgeType backend). Dung chung cho trang
// ho so cua minh (Badges) va ho so cong khai (PublicProfile) - de mot cho, khong lech nhau.
export const BADGE_META = {
  ROOKIE: { icon: '🐣', titleKey: 'badge_rookie_title', descKey: 'badge_rookie_desc' },
  SHARP: { icon: '🎯', titleKey: 'badge_sharp_title', descKey: 'badge_sharp_desc' },
  PROPHET: { icon: '🔮', titleKey: 'badge_prophet_title', descKey: 'badge_prophet_desc' },
  ORACLE: { icon: '🧿', titleKey: 'badge_oracle_title', descKey: 'badge_oracle_desc' },
  WIN_STREAK: { icon: '🔥', titleKey: 'badge_streak_title', descKey: 'badge_streak_desc' },
  ON_FIRE: { icon: '🌋', titleKey: 'badge_onfire_title', descKey: 'badge_onfire_desc' },
  CENTURION: { icon: '💯', titleKey: 'badge_centurion_title', descKey: 'badge_centurion_desc' },
  WEEKLY_KING: { icon: '👑', titleKey: 'badge_weeklyking_title', descKey: 'badge_weeklyking_desc' },
}
