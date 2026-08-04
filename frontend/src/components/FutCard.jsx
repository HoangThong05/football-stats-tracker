/**
 * Bang ten kieu the FUT, de goc canvas 3D.
 *
 * TRUOC DAY cho la the chi so (OVR 99, PAC, SHO...) nhung TOAN BO so do la go tay:
 * du an khong co nguon du lieu chi so cau thu nao. Dat so bia len mot trang web ma
 * gia tri nam o thong ke that thi chinh no la thu duy nhat noi doi.
 *
 * Gio chi giu nhung thong tin DUNG va khong bao gio cu: ten, so ao, quoc tich.
 */
const NAME_FIRST = 'CRISTIANO'
const NAME_LAST = 'RONALDO'
const SHIRT_NUMBER = 7
const COUNTRY = 'Bồ Đào Nha'
const COUNTRY_EN = 'Portugal'

export default function FutCard({ lang = 'vi' }) {
  return (
    <div className="ft-fut-card" aria-hidden="true">
      <div className="ft-fut-shine" />

      <div className="ft-fut-number">{SHIRT_NUMBER}</div>

      <div className="ft-fut-name">
        <span className="ft-fut-name-first">{NAME_FIRST}</span>
        <span className="ft-fut-name-last">{NAME_LAST}</span>
      </div>

      <div className="ft-fut-country">{lang === 'en' ? COUNTRY_EN : COUNTRY}</div>
    </div>
  )
}
