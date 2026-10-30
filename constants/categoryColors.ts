// Brand/categorical colors that stay FIXED across every theme — the same role
// as typeColor in Colors.ts. These encode meaning (banner category, rarity star,
// tool identity, the MomoTalk messenger), not surface/text styling, so they must
// not shift with the theme. Allowlisted in scripts/check-theme-coverage.js.
//
// Small text never sits directly on these as a fill unless it is `onBadge`
// white on a saturated tone; stamps draw the tone as a border + text on the
// themed panel instead (see components/schale/Stamp.tsx).

export const categoryColors = {
  // Banner category chips / stamps
  bannerNew: "#EF4444", // New / LIVE (red)
  bannerFes: "#F59E0B", // Fes (amber)
  bannerCollab: "#8B5CF6", // Collab (purple)
  bannerRerun: "#6B7280", // Rerun (gray)
  bannerDefault: "#475569", // fallback (slate)

  // Alpha twins of the banner tones (45%) for a stamp's inner keyline.
  bannerNewSoft: "rgba(239,68,68,0.45)",
  bannerFesSoft: "rgba(245,158,11,0.45)",
  bannerCollabSoft: "rgba(139,92,246,0.45)",
  bannerRerunSoft: "rgba(107,114,128,0.45)",
  bannerDefaultSoft: "rgba(71,85,105,0.45)",

  // Misc badges / accents
  star: "#FFD700", // rarity star (gold)
  newBadge: "#EAB308", // "new" badge (yellow)

  // Recruitment card-back reading by rarity: blue / gold / pink-rainbow. The
  // spectrum is an evocation for 3-star gradients, not an official value.
  rarity1: "#8FB8DE",
  rarity2: "#F2C14E",
  rarity3: "#F79AC0",
  rarity3Spectrum: ["#FF9EC4", "#FFC89A", "#FFF0A0", "#A8EFC8", "#A8D8FF", "#C9B2FF"],

  // Character class badge
  classDefault: "#374151",
  classSpecial: "#3B82F6",

  // Tool identity accents (icon color on the Tools hub). Fixed per tool so a
  // tool is recognisable at a glance in every theme; icons pass them through
  // readableOn() so they clear 3:1 on the tile.
  toolBanner: "#128AFA", // banners (logo blue)
  toolBond: "#E0588A", // bond (pink)
  toolChara: "#16A085", // level / chara EXP (teal)
  toolEleph: "#7C5CE0", // eleph & UE (violet)
  toolSkill: "#3F63E0", // skills (indigo)
  toolRaid: "#E0453F", // raid score (red)
  toolGacha: "#D99A00", // gacha tracker (amber)
  toolAp: "#EE7A1A", // AP timer (orange)
  toolBirthday: "#D9468C", // birthdays (magenta)
  toolReminder: "#5B6B82", // reminders (slate)

  // MomoTalk, the in-game messenger. Fixed brand look in every theme.
  momoPink: "#FC96AB", // title strip
  momoPinkDeep: "#E56072", // unread pill text / dark strip
  momoBubble: "#4B5A6F", // student bubble
  momoSensei: "#3B78B4", // Sensei reply bubble (deepened from #4A8AC8 so white text clears 4.5:1)
  momoInk: "#2A323E", // messenger ink

  // The logo's two words. For geometry only — never the logo itself.
  logoBlue: "#128AFA",
  logoInk: "#2B2B2B",

  // Text/icon that sits on a saturated brand badge — always light.
  onBadge: "#FFFFFF",
} as const;

export type BannerTone = "new" | "fes" | "collab" | "rerun" | "default";

/** Stamp/badge tone + its keyline twin for a banner category. */
export function bannerTone(tone: BannerTone): { tone: string; soft: string } {
  switch (tone) {
    case "new":
      return { tone: categoryColors.bannerNew, soft: categoryColors.bannerNewSoft };
    case "fes":
      return { tone: categoryColors.bannerFes, soft: categoryColors.bannerFesSoft };
    case "collab":
      return { tone: categoryColors.bannerCollab, soft: categoryColors.bannerCollabSoft };
    case "rerun":
      return { tone: categoryColors.bannerRerun, soft: categoryColors.bannerRerunSoft };
    default:
      return { tone: categoryColors.bannerDefault, soft: categoryColors.bannerDefaultSoft };
  }
}
