/*
 * Tuy bien mau chu dao (accent) cua giao dien.
 *
 * Tu MOT mau nguoi dung chon, tinh ra 5 bien CSS accent va ghi len :root -> ca app doi mau.
 * Chon "Mac dinh" thi go cac bien di, tra ve mau theo tung theme sang/toi nhu goc.
 */

const KEY = "ft_accent";

/** Danh sach mau chon san. hex = null nghia la dung mau mac dinh cua app. */
export const ACCENT_PRESETS = [
  { id: "default", hex: null },
  { id: "green", hex: "#16a34a" },
  { id: "blue", hex: "#2563eb" },
  { id: "violet", hex: "#7c3aed" },
  { id: "rose", hex: "#e11d48" },
  { id: "teal", hex: "#0d9488" },
  { id: "orange", hex: "#ea580c" },
  { id: "pink", hex: "#db2777" },
];

const VARS = ["--ft-accent", "--ft-accent-strong", "--ft-accent-bright", "--ft-accent-soft", "--ft-on-accent"];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = ({ r, g, b }) => `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
// Tron voi den (dam hon) / trang (sang hon)
const darken = (c, p) => ({ r: c.r * (1 - p), g: c.g * (1 - p), b: c.b * (1 - p) });
const lighten = (c, p) => ({ r: c.r + (255 - c.r) * p, g: c.g + (255 - c.g) * p, b: c.b + (255 - c.b) * p });

/** Ap mau accent (hex) len :root, hoac go bo neu hex rong (ve mac dinh). */
export function applyAccent(hex) {
  const root = document.documentElement;
  if (!hex) {
    VARS.forEach((v) => root.style.removeProperty(v));
    return;
  }
  const c = hexToRgb(hex);
  // Do sang cam nhan -> chon chu tren nen accent la den hay trang
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  root.style.setProperty("--ft-accent", hex);
  root.style.setProperty("--ft-accent-strong", toHex(darken(c, 0.16)));
  root.style.setProperty("--ft-accent-bright", toHex(lighten(c, 0.22)));
  root.style.setProperty("--ft-accent-soft", `rgba(${c.r}, ${c.g}, ${c.b}, 0.14)`);
  root.style.setProperty("--ft-on-accent", luminance > 0.62 ? "#17130a" : "#ffffff");
}

export function savedAccent() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}

export function saveAccent(hex) {
  try {
    if (hex) localStorage.setItem(KEY, hex);
    else localStorage.removeItem(KEY);
  } catch { /* bo qua */ }
}
