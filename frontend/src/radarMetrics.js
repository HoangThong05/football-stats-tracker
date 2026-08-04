/**
 * Quy 5 chi so cua mot doi ve thang 0..1 de ve radar.
 *
 * MOC SO SANH LA TOAN GIAI, khong phai giua hai doi duoc chon. Neu chi lay hai doi
 * lam moc thi doi kem hon luon bi ve thanh 0 o moi truc - nhin nhu doi do te hai,
 * trong khi thuc te co the ca hai cung manh. Lay ca giai lam moc thi hinh da giac
 * moi noi len duoc "doi nay dung o dau trong giai".
 *
 * KHONG CO TRUC "KIEM SOAT BONG": football-data.org khong tra ti le kiem soat bong
 * o bat ky endpoint nao. Thay bang hieu suat thang - so lieu that, va doc lap voi
 * ban thang nen khong trung thong tin voi truc Tan cong.
 */

/** "W,D,L,W,W" -> diem tich luy 5 tran gan nhat (W=3, D=1, L=0). */
function formPoints(form) {
  if (!form) return 0
  return form
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s === 'W' || s === 'D' || s === 'L')
    .slice(-5)
    .reduce((sum, s) => sum + (s === 'W' ? 3 : s === 'D' ? 1 : 0), 0)
}

/** Chia an toan: dau mua giai playedGames = 0, chia thang se ra NaN/Infinity. */
const per = (value, games) => (games > 0 ? value / games : 0)

/**
 * @param {object[]} rows toan bo bang xep hang, dung lam moc chuan hoa
 * @param {(key: string) => string} t ham dich
 * @returns {{axes: object[], build: (row: object) => {values: number[], raw: string[]}}}
 */
export function buildRadarModel(rows, t) {
  // Chi hien truc phong do khi giai that su co du lieu do (dau mua thi chua co)
  const hasForm = rows.some((r) => formPoints(r.form) > 0)

  const defs = [
    {
      key: 'attack',
      label: t('radar_attack'),
      value: (r) => per(r.goalsFor, r.playedGames),
      format: (v) => `${v.toFixed(2)} ${t('radar_per_match')}`,
    },
    {
      key: 'defence',
      label: t('radar_defence'),
      // Thung it ban = phong ngu tot -> phai DAO chieu truoc khi chuan hoa
      value: (r) => per(r.goalsAgainst, r.playedGames),
      invert: true,
      format: (v) => `${v.toFixed(2)} ${t('radar_per_match')}`,
    },
    {
      key: 'winRate',
      label: t('radar_win_rate'),
      value: (r) => per(r.won, r.playedGames),
      format: (v) => `${Math.round(v * 100)}%`,
    },
    ...(hasForm
      ? [
          {
            key: 'form',
            label: t('radar_form'),
            value: (r) => formPoints(r.form),
            format: (v) => `${v}/15`,
          },
        ]
      : []),
    {
      key: 'goals',
      label: t('radar_goals'),
      value: (r) => r.goalsFor,
      format: (v) => `${v}`,
    },
  ]

  // Moc lon nhat toan giai cho tung truc
  const maxes = defs.map((d) => Math.max(...rows.map((r) => d.value(r)), 0))

  const build = (row) => {
    const values = []
    const raw = []

    defs.forEach((d, i) => {
      const v = d.value(row)
      const max = maxes[i]

      /*
       * max = 0 nghia la CA GIAI chua co so lieu o truc nay -> ve 0.
       *
       * Truc dao chieu phai chan rieng: de cong thuc chung "1 - ratio" chay tiep thi
       * ratio = 0 se thanh 1, tuc dau mua chua da tran nao ma moi doi deu hien
       * phong ngu hoan hao.
       */
      const ratio = max > 0 ? v / max : 0
      values.push(d.invert ? (max > 0 ? 1 - ratio : 0) : ratio)
      raw.push(d.format(v))
    })

    return { values, raw }
  }

  return {
    axes: defs.map((d) => ({ key: d.key, label: d.label })),
    build,
    // Trai mua chua da tran nao -> moi truc deu 0, da giac sup thanh mot cham.
    // Ben goi dung co nay de an han bieu do thay vi ve mot hinh vo nghia.
    hasData: rows.some((r) => r.playedGames > 0),
  }
}
