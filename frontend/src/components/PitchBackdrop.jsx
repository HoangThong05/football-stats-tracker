/**
 * Vach ke san bong chim phia sau toan trang.
 *
 * Noi dung khoa o 960px nen man hinh rong con ~470px trong moi ben - do la cho
 * cac vach nay hien ra. Phan giua bi cac the (.ft-card) co nen duc che di, nen
 * bang so lieu khong he bi vach chay qua lam roi mat.
 *
 * Dung the that thay vi anh SVG nhung: vach phai doi mau theo giao dien sang/toi,
 * ma data URI thi khong doc duoc bien CSS.
 *
 * Hoan toan tinh - khong co chuyen dong nao, nen nguoi bat "giam chuyen dong"
 * van thay day du.
 */
export default function PitchBackdrop() {
  return (
    <div className="ft-pitch-backdrop" aria-hidden="true">
      <div className="ft-pitch-halfway" />
      <div className="ft-pitch-circle" />
      <div className="ft-pitch-spot" />
      <div className="ft-pitch-box ft-pitch-box-left" />
      <div className="ft-pitch-box ft-pitch-box-right" />
      <div className="ft-pitch-goal ft-pitch-goal-left" />
      <div className="ft-pitch-goal ft-pitch-goal-right" />
    </div>
  )
}
