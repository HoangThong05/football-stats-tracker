/*
 * Toast: thong bao noi ngan (luu thanh cong / loi) o goc man hinh, tu bien mat.
 *
 * Dung mo hinh pub/sub o cap module de BAT KY file nao cung goi duoc `toast.success(...)`
 * ma khong phai luong context qua ca cay component. Mot <Toaster/> duy nhat o App lang
 * nghe va ve ra.
 */
let idSeq = 0
const listeners = new Set()
let items = []

function emit() {
  listeners.forEach((l) => l(items))
}

/** Component Toaster goi de nhan cap nhat danh sach toast. Tra ham huy dang ky. */
export function subscribe(listener) {
  listeners.add(listener)
  listener(items)
  return () => listeners.delete(listener)
}

function push(type, message, ttl) {
  const id = ++idSeq
  items = [...items, { id, type, message }]
  emit()
  if (ttl > 0) {
    setTimeout(() => dismiss(id), ttl)
  }
  return id
}

export function dismiss(id) {
  items = items.filter((t) => t.id !== id)
  emit()
}

export const toast = {
  success: (message) => push('success', message, 3200),
  error: (message) => push('error', message, 4600),
  info: (message) => push('info', message, 3200),
}
