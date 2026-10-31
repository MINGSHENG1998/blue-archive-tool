// Localized theme names. THEMES[id].name in constants/theme.ts stays as the
// English fallback for non-UI uses; anything a Sensei reads goes through here.
// Each theme is Kivotos at a different time of day; the `<id>Mood` line says so.

import type { ThemeId } from "@/constants/theme";
import type { Locale } from "@/constants/i18n";
import { defineStrings, stringsFor } from "./define";

export const themeStrings = defineStrings({
  en: {
    baBlue: "BA Blue",
    daylight: "Schale Daylight",
    paper: "Paper",
    cozy: "Cozy",
    calico: "Calico",
    sea: "Sea Breeze",
    tropical: "Tropical",
    cafe: "Café",
    baBlueMood: "Night sky",
    daylightMood: "Clear morning",
    paperMood: "Parchment dawn",
    cozyMood: "Dusk",
    calicoMood: "Sunset",
    seaMood: "Noon",
    tropicalMood: "Lagoon",
    cafeMood: "Evening",
  },
  zh: {
    baBlue: "BA 蓝",
    daylight: "夏莱白昼",
    paper: "纸张",
    cozy: "温馨",
    calico: "三花猫",
    sea: "海风",
    tropical: "热带",
    cafe: "咖啡馆",
    baBlueMood: "夜空",
    daylightMood: "晴朗的早晨",
    paperMood: "羊皮纸般的黎明",
    cozyMood: "黄昏",
    calicoMood: "日落",
    seaMood: "正午",
    tropicalMood: "泻湖",
    cafeMood: "傍晚",
  },
  ko: {
    baBlue: "BA 블루",
    daylight: "샬레 데이라이트",
    paper: "페이퍼",
    cozy: "코지",
    calico: "캘리코",
    sea: "바닷바람",
    tropical: "트로피컬",
    cafe: "카페",
    baBlueMood: "밤하늘",
    daylightMood: "맑은 아침",
    paperMood: "양피지빛 새벽",
    cozyMood: "땅거미",
    calicoMood: "해 질 녘",
    seaMood: "한낮",
    tropicalMood: "석호",
    cafeMood: "저녁",
  },
  ja: {
    baBlue: "BA ブルー",
    daylight: "シャーレ・デイライト",
    paper: "ペーパー",
    cozy: "コージー",
    calico: "三毛猫",
    sea: "潮風",
    tropical: "トロピカル",
    cafe: "カフェ",
    baBlueMood: "夜空",
    daylightMood: "晴れた朝",
    paperMood: "羊皮紙の夜明け",
    cozyMood: "黄昏",
    calicoMood: "夕焼け",
    seaMood: "真昼",
    tropicalMood: "ラグーン",
    cafeMood: "宵の口",
  },
  vi: {
    baBlue: "Xanh BA",
    daylight: "Schale ban ngày",
    paper: "Giấy",
    cozy: "Ấm áp",
    calico: "Mèo tam thể",
    sea: "Gió biển",
    tropical: "Nhiệt đới",
    cafe: "Quán cà phê",
    baBlueMood: "Bầu trời đêm",
    daylightMood: "Buổi sáng trong lành",
    paperMood: "Bình minh màu giấy da",
    cozyMood: "Chạng vạng",
    calicoMood: "Hoàng hôn",
    seaMood: "Giữa trưa",
    tropicalMood: "Đầm phá",
    cafeMood: "Buổi tối",
  },
  th: {
    baBlue: "ฟ้า BA",
    daylight: "Schale ยามกลางวัน",
    paper: "กระดาษ",
    cozy: "อบอุ่น",
    calico: "แมวสามสี",
    sea: "ลมทะเล",
    tropical: "ทรอปิคอล",
    cafe: "คาเฟ่",
    baBlueMood: "ท้องฟ้ายามค่ำคืน",
    daylightMood: "เช้าที่สดใส",
    paperMood: "รุ่งอรุณสีกระดาษเก่า",
    cozyMood: "โพล้เพล้",
    calicoMood: "พระอาทิตย์ตก",
    seaMood: "เที่ยงวัน",
    tropicalMood: "ลากูน",
    cafeMood: "หัวค่ำ",
  },
});

/** Localized display name for a theme. */
export function themeName(id: ThemeId, locale: Locale): string {
  return stringsFor(themeStrings, locale)[id];
}

/** Localized "time of day" line for a theme gallery card. */
export function themeMood(id: ThemeId, locale: Locale): string {
  return stringsFor(themeStrings, locale)[`${id}Mood`];
}
