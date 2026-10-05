// Cac moc chuoi doan dung de an mung (tang dan). Dat o day de ca the hien va
// logic an mung dung chung mot nguon.
export const STREAK_MILESTONES = [3, 5, 10, 15, 20, 25, 30, 40, 50]

/**
 * Tinh chuoi doan dung tu danh sach diem (xep CU -> MOI).
 *
 * "Dung" = diem >= 1 (doan trung ket qua thang/hoa/thua, du sai ti so). Mot tran
 * sai (0 diem) lam dut chuoi. Chi tinh cac du doan DA CHAM (diem khac null) - ben
 * goi da loc san.
 *
 * Tra ve { current, longest }:
 *  - current: so tran dung lien tiep tinh tu tran MOI NHAT nguoc ve.
 *  - longest: chuoi dai nhat tung dat.
 */
export function computeStreaks(pointsOldestToNewest) {
  const pts = pointsOldestToNewest || []

  let longest = 0
  let run = 0
  for (const p of pts) {
    if (p != null && p >= 1) {
      run += 1
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  let current = 0
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    if (pts[i] != null && pts[i] >= 1) current += 1
    else break
  }

  return { current, longest }
}

/** Moc ke tiep LON HON chuoi hien tai, hoac null neu da vuot moc cao nhat. */
export function nextMilestone(current) {
  return STREAK_MILESTONES.find((m) => m > current) ?? null
}

/** Moc cao nhat <= chuoi hien tai (lam diem goc cho thanh tien do), 0 neu chua dat moc nao. */
export function reachedMilestone(current) {
  let reached = 0
  for (const m of STREAK_MILESTONES) {
    if (current >= m) reached = m
  }
  return reached
}
