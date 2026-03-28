// constants/i18n.ts

export type Locale = "en" | "zh" | "ko" | "ja";

export interface UIStrings {
  pageTitle: string;
  loading: string;
  errorText: string;
  retryButton: string;
  searchPlaceholder: string;
  sortButton: string;
  sortEarliest: string;
  sortLatest: string;
  filterAll: string;
  filterNew: string;
  filterRerun: string;
  filterFes: string;
  filterCollab: string;
  bannerSuffix: string;
  newLabel: string;
  language: string;
}

export const i18n: Record<Locale, UIStrings> = {
  en: {
    pageTitle: "Future Banners",
    loading: "Loading banners...",
    errorText: "Failed to load banners",
    retryButton: "Try Again",
    searchPlaceholder: "Search banners...",
    sortButton: "Sort",
    sortEarliest: "Earliest First",
    sortLatest: "Latest First",
    filterAll: "All",
    filterNew: "New",
    filterRerun: "Rerun",
    filterFes: "Fes",
    filterCollab: "Collab",
    bannerSuffix: "Banner",
    newLabel: "New",
    language: "Language",
  },
  zh: {
    pageTitle: "未来卡池",
    loading: "加载中...",
    errorText: "加载失败",
    retryButton: "重试",
    searchPlaceholder: "搜索卡池...",
    sortButton: "排序",
    sortEarliest: "最早优先",
    sortLatest: "最新优先",
    filterAll: "全部",
    filterNew: "新角色",
    filterRerun: "复刻",
    filterFes: "庆典",
    filterCollab: "联动",
    bannerSuffix: "卡池",
    newLabel: "新",
    language: "语言",
  },
  ko: {
    pageTitle: "미래 배너",
    loading: "로딩 중...",
    errorText: "배너를 불러오지 못했습니다",
    retryButton: "다시 시도",
    searchPlaceholder: "배너 검색...",
    sortButton: "정렬",
    sortEarliest: "가장 이른 순",
    sortLatest: "가장 최근 순",
    filterAll: "전체",
    filterNew: "신규",
    filterRerun: "복각",
    filterFes: "페스",
    filterCollab: "콜라보",
    bannerSuffix: "배너",
    newLabel: "신규",
    language: "언어",
  },
  ja: {
    pageTitle: "今後のガチャ",
    loading: "読み込み中...",
    errorText: "バナーの読み込みに失敗しました",
    retryButton: "もう一度試す",
    searchPlaceholder: "バナーを検索...",
    sortButton: "並び替え",
    sortEarliest: "古い順",
    sortLatest: "新しい順",
    filterAll: "すべて",
    filterNew: "新規",
    filterRerun: "復刻",
    filterFes: "フェス",
    filterCollab: "コラボ",
    bannerSuffix: "ガチャ",
    newLabel: "新規",
    language: "言語",
  },
};

export const atkTypeLabels: Record<string, Record<Locale, string>> = {
  explosive: { en: "Explosive", zh: "爆炸", ko: "폭발", ja: "爆発" },
  piercing:  { en: "Piercing",  zh: "贯通", ko: "관통", ja: "貫通" },
  mystic:    { en: "Mystic",    zh: "神秘", ko: "신비", ja: "神秘" },
  sonic:     { en: "Sonic",     zh: "振动", ko: "진동", ja: "振動" },
  chemical:  { en: "Chemical",  zh: "化学", ko: "화학", ja: "化学" },
};

export const defTypeLabels: Record<string, Record<Locale, string>> = {
  light:     { en: "Light",     zh: "轻装", ko: "경장", ja: "軽装" },
  heavy:     { en: "Heavy",     zh: "重装", ko: "중장", ja: "重装" },
  special:   { en: "Special",   zh: "特殊", ko: "특수", ja: "特殊" },
  elastic:   { en: "Elastic",   zh: "弹性", ko: "탄성", ja: "弾性" },
  composite: { en: "Composite", zh: "复合", ko: "복합", ja: "複合" },
};
