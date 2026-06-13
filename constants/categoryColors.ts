// Brand/categorical colors that stay FIXED across every theme — the same role
// as typeColor in Colors.ts. These encode meaning (banner category, rarity star,
// tool identity), not surface/text styling, so they must not shift with the theme.
// Allowlisted in scripts/check-theme-coverage.js.

export const categoryColors = {
  // Banner category chips
  bannerNew: "#EF4444", // New / LIVE (red)
  bannerFes: "#F59E0B", // Fes (amber)
  bannerCollab: "#8B5CF6", // Collab (purple)
  bannerRerun: "#6B7280", // Rerun (gray)
  bannerDefault: "#475569", // fallback (slate)

  // Misc badges / accents
  star: "#FFD700", // rarity star (gold)
  newBadge: "#EAB308", // "new" badge (yellow)

  // Character class badge
  classDefault: "#374151",
  classSpecial: "#3B82F6",

  // Home tool-card identity accents
  toolBanner: "#128AFA", // banner tool (blue)
  toolBond: "#E879A0", // bond tool (pink)
  toolChara: "#3DD68C", // chara builder tool (green)

  // Text/icon that sits on a saturated brand badge — always light.
  onBadge: "#FFFFFF",
} as const;
