/*
 * Nhac ten (@) trong bai viet / binh luan / chat / tin nhan.
 *
 * App khong co username duy nhat, nen mot luot nhac duoc luu THANG trong noi dung duoi dang
 * token @[Ten hien thi](uid:123) do o goi y sinh ra. Nho gan san id, ta hien duoc link chuan
 * (du ten trung) va biet chinh xac ai duoc nhac. Ham duoi tach token do de hien @Ten bam duoc.
 */

// eslint-disable-next-line no-useless-escape
const MENTION_RE = /@\[([^\]\n]{1,80})\]\(uid:(\d{1,18})\)/g

/** Doi token @[Ten](uid:ID) thanh @Ten cho van ban thuan (o tra loi, xem truoc...). */
export function stripMentions(text) {
  if (!text) return text
  return text.replace(new RegExp(MENTION_RE), '@$1')
}

/**
 * Tach noi dung thanh cac doan van + cac the @Ten (bam vao mo ho so).
 * @param {string} text noi dung tho (con token)
 * @param {(userId:number)=>void} [onUser] bam vao mot luot nhac
 * @returns mang node React (hoac chinh text neu khong co gi de tach)
 */
export function renderMentions(text, onUser) {
  if (!text) return text
  const nodes = []
  const re = new RegExp(MENTION_RE)
  let last = 0
  let key = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const name = m[1]
    const uid = Number(m[2])
    nodes.push(
      onUser ? (
        <button key={`m${key++}`} type="button" className="ft-mention"
          onClick={(e) => { e.stopPropagation(); onUser(uid) }}>@{name}</button>
      ) : (
        <span key={`m${key++}`} className="ft-mention">@{name}</span>
      ),
    )
    last = m.index + m[0].length
  }
  if (last === 0) return text
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
