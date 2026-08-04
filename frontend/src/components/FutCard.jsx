/**
 * The chi so kieu EA Sports FUT, de goc canvas 3D.
 *
 * CANH BAO: TOAN BO chi so o day la SO GO CUNG, khong lay tu API nao.
 * Du an khong co nguon du lieu chi so cau thu - football-data.org chi tra ten/vi tri/
 * quoc tich, khong he co OVR/PAC/SHO. Day thuan tuy la trang tri di kem mo hinh 3D,
 * dung nham tuong la so lieu that va cung dung nhan ban cho cau thu khac.
 */
const RATING = 99
const NAME = 'RONALDO'
const POSITION = 'ST'

const STATS = [
  { key: 'PAC', value: 89 },
  { key: 'SHO', value: 93 },
  { key: 'PAS', value: 81 },
  { key: 'DRI', value: 85 },
  { key: 'DEF', value: 35 },
  { key: 'PHY', value: 77 },
]

export default function FutCard() {
  return (
    <div className="ft-fut-card" aria-hidden="true">
      <div className="ft-fut-shine" />

      <div className="ft-fut-head">
        <div className="ft-fut-rating">{RATING}</div>
        <div className="ft-fut-position">{POSITION}</div>
      </div>

      <div className="ft-fut-name">{NAME}</div>

      <div className="ft-fut-stats">
        {STATS.map((s) => (
          <div key={s.key} className="ft-fut-stat">
            <span className="ft-fut-stat-value">{s.value}</span>
            <span className="ft-fut-stat-key">{s.key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
