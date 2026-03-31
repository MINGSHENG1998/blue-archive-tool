// constants/i18n.ts

export type Locale = "en" | "zh" | "ko" | "ja";

export interface UIStrings {
  // Banner screen
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

  // Home screen
  appTitle: string;
  homeSubtitle: string;
  toolBannerTitle: string;
  toolBannerSubtitle: string;
  toolBannerDesc: string;
  toolBondTitle: string;
  toolBondSubtitle: string;
  toolBondDesc: string;
  toolCharaTitle: string;
  toolCharaSubtitle: string;
  toolCharaDesc: string;

  // Bond Exp screen
  bondPageTitle: string;
  bondInstruction: string;
  bondCurrentLevel: string;
  bondTargetLevel: string;
  bondAdvancedSettings: string;
  bondEstimatedConfig: string;
  bondCafePat: string;
  bondGift: string;
  bondCalculate: string;
  bondRequiredExp: string;
  bondEstimatedTime: string;
  bondMonths: string;
  bondLessMonth: string;
  bondRequiredResources: string;
  bondValidationError: string;
  bondSource: string;

  // Resource Calc screen
  resourcePageTitle: string;
  resourceCharacter: string;
  resourceEleph: string;

  // Shared calc strings (charaExp + elephCalc)
  calcCurrentInventory: string;
  calcAvailableResources: string;

  // CharaExp screen
  charaExpInstruction: string;
  charaExpValidationError: string;
  charaExpSuperiorReport: string;
  charaExpAdvancedReport: string;
  charaExpNormalReport: string;
  charaExpNoviceReport: string;
  charaExpCredits: string;
  charaExpSuperiorReports: string;
  charaExpAdvancedReports: string;
  charaExpNormalReports: string;
  charaExpNoviceReports: string;

  // ElephCalc screen
  elephInstruction: string;
  elephCurrentRarity: string;
  elephTargetRarity: string;
  elephWeaponRank: string;
  elephCurrentEleph: string;
  elephValidationError: string;
  elephInvalidCombination: string;
  elephStudentEleph: string;
  elephResourceBreakdown: string;
  elephAdditionalEleph: string;
  elephWeaponUpgradeEleph: string;
  elephEligmaCost: string;

  // Misc / Other screen
  miscTitle: string;
  miscSettings: string;
  miscSupport: string;
  miscFeedbackItem: string;
  miscFeedbackItemDesc: string;
  miscAboutSection: string;
  miscVersion: string;
  miscDisclaimer: string;
  miscDisclaimerTap: string;
  miscDisclaimerContent: string;
  miscClose: string;
  miscFeedbackModalTitle: string;
  miscTitleLabel: string;
  miscDescLabel: string;
  miscTitleError: string;
  /** Use {hours} as placeholder for the hour count */
  miscFeedbackWait: string;
  miscSubmit: string;
  miscCancel: string;
  miscFeedbackSent: string;
  miscFeedbackFailed: string;

  // Home screen static text
  greeting: string;
  quickTools: string;

  // Tab bar
  tabHome: string;
  tabBanner: string;
  tabBondExp: string;
  tabCharaBuilder: string;
  tabMisc: string;
}

export const i18n: Record<Locale, UIStrings> = {
  en: {
    // Banner
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

    // Home
    appTitle: "Blue Archive",
    homeSubtitle: "Helper",
    toolBannerTitle: "Future Banner",
    toolBannerSubtitle: "Gacha Tracker",
    toolBannerDesc: "Track upcoming banners and plan your summons strategically",
    toolBondTitle: "Bond Experience",
    toolBondSubtitle: "Relationship Calculator",
    toolBondDesc: "Calculate bond levels and optimize your character relationships",
    toolCharaTitle: "Character Builder",
    toolCharaSubtitle: "Resource Optimizer",
    toolCharaDesc: "Build perfect character loadouts with smart resource management",

    // Bond Exp
    bondPageTitle: "Bond Exp Calculator",
    bondInstruction: "Insert your current bond level and target bond level",
    bondCurrentLevel: "Current Level",
    bondTargetLevel: "Target Level",
    bondAdvancedSettings: "Advanced Settings",
    bondEstimatedConfig: "Config for Estimated Days",
    bondCafePat: "Cafe Pat /day",
    bondGift: "Gift (60Exp) /month",
    bondCalculate: "Calculate",
    bondRequiredExp: "Required Experience",
    bondEstimatedTime: "Estimated Time",
    bondMonths: "month(s)",
    bondLessMonth: "less than a month",
    bondRequiredResources: "Required Resources",
    bondValidationError: 'Please ensure "from" is 1-99, "to" is 2-100, and "from" < "to".',
    bondSource: "Source",

    // Resource Calc
    resourcePageTitle: "Resource Calculator",
    resourceCharacter: "Character",
    resourceEleph: "Eleph",

    // Misc
    miscTitle: "About",
    miscSettings: "Settings",
    miscSupport: "Support",
    miscFeedbackItem: "Send Feedback",
    miscFeedbackItemDesc: "Help us improve the app",
    miscAboutSection: "About",
    miscVersion: "Version",
    miscDisclaimer: "Disclaimer",
    miscDisclaimerTap: "Tap to view",
    miscDisclaimerContent:
      "This app is just a fan project. I do not own any assets or intellectual property associated with this content.",
    miscClose: "Close",
    miscFeedbackModalTitle: "Send Feedback",
    miscTitleLabel: "Title *",
    miscDescLabel: "Description *",
    miscTitleError: "Title cannot be blank.",
    miscFeedbackWait: "Please wait {hours}h before sending another feedback.",
    miscSubmit: "Submit",
    miscCancel: "Cancel",
    miscFeedbackSent: "Feedback sent! Thank you.",
    miscFeedbackFailed: "Failed to send feedback. Please try again.",

    // Home screen static text
    greeting: "Hello Sensei!",
    quickTools: "Quick Tools",

    // Tabs
    tabHome: "Home",
    tabBanner: "Banner",
    tabBondExp: "Bond Exp",
    tabCharaBuilder: "Chara Builder",
    tabMisc: "Misc",

    // Shared calc
    calcCurrentInventory: "Current Inventory",
    calcAvailableResources: "Available Resources",

    // CharaExp
    charaExpInstruction: "Enter current level and target level",
    charaExpValidationError: 'Please ensure "Current Level" is 1-89 and "Target Level" is 2-90.',
    charaExpSuperiorReport: "Superior EXP Report",
    charaExpAdvancedReport: "Advanced EXP Report",
    charaExpNormalReport: "Normal EXP Report",
    charaExpNoviceReport: "Novice EXP Report",
    charaExpCredits: "Credits",
    charaExpSuperiorReports: "Superior EXP Reports",
    charaExpAdvancedReports: "Advanced EXP Reports",
    charaExpNormalReports: "Normal EXP Reports",
    charaExpNoviceReports: "Novice EXP Reports",

    // ElephCalc
    elephInstruction: "Enter current rarity and target rarity",
    elephCurrentRarity: "Current Rarity",
    elephTargetRarity: "Target Rarity",
    elephWeaponRank: "Weapon Rank",
    elephCurrentEleph: "Current Student Eleph",
    elephValidationError: 'Please ensure "Current Rarity" is 1-4 and "Target Rarity" is 2-5.',
    elephInvalidCombination: "Invalid rarity combination",
    elephStudentEleph: "Student Eleph",
    elephResourceBreakdown: "Resource Breakdown",
    elephAdditionalEleph: "Additional Eleph Needed",
    elephWeaponUpgradeEleph: "Weapon Upgrade Eleph",
    elephEligmaCost: "Estimated Eligma Cost",
  },

  zh: {
    // Banner
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

    // Home
    appTitle: "蔚蓝档案",
    homeSubtitle: "助手",
    toolBannerTitle: "未来卡池",
    toolBannerSubtitle: "抽卡追踪",
    toolBannerDesc: "追踪即将到来的卡池，策略性地规划你的抽卡",
    toolBondTitle: "好感度经验",
    toolBondSubtitle: "关系计算器",
    toolBondDesc: "计算好感度等级，优化你的角色关系",
    toolCharaTitle: "角色养成",
    toolCharaSubtitle: "资源优化",
    toolCharaDesc: "用智能资源管理打造完美角色配置",

    // Bond Exp
    bondPageTitle: "好感度经验计算器",
    bondInstruction: "请输入当前好感度等级和目标好感度等级",
    bondCurrentLevel: "当前等级",
    bondTargetLevel: "目标等级",
    bondAdvancedSettings: "高级设置",
    bondEstimatedConfig: "预计天数配置",
    bondCafePat: "咖啡厅摸头 /天",
    bondGift: "礼物 (60经验) /月",
    bondCalculate: "计算",
    bondRequiredExp: "所需经验",
    bondEstimatedTime: "预计时间",
    bondMonths: "个月",
    bondLessMonth: "不足一个月",
    bondRequiredResources: "所需资源",
    bondValidationError: '"起始"需为1-99，"目标"需为2-100，且"起始" < "目标"',
    bondSource: "来源",

    // Resource Calc
    resourcePageTitle: "资源计算器",
    resourceCharacter: "角色",
    resourceEleph: "秘石",

    // Misc
    miscTitle: "关于",
    miscSettings: "设置",
    miscSupport: "支持",
    miscFeedbackItem: "发送反馈",
    miscFeedbackItemDesc: "帮助我们改进应用",
    miscAboutSection: "关于",
    miscVersion: "版本",
    miscDisclaimer: "免责声明",
    miscDisclaimerTap: "点击查看",
    miscDisclaimerContent:
      "本应用仅为粉丝项目。本人不拥有与此内容相关的任何资产或知识产权。",
    miscClose: "关闭",
    miscFeedbackModalTitle: "发送反馈",
    miscTitleLabel: "标题 *",
    miscDescLabel: "描述 *",
    miscTitleError: "标题不能为空。",
    miscFeedbackWait: "请等待 {hours} 小时后再发送反馈。",
    miscSubmit: "提交",
    miscCancel: "取消",
    miscFeedbackSent: "反馈已发送！感谢您。",
    miscFeedbackFailed: "发送反馈失败，请重试。",

    // Home screen static text
    greeting: "你好，老师！",
    quickTools: "快捷工具",

    // Tabs
    tabHome: "首页",
    tabBanner: "卡池",
    tabBondExp: "好感度",
    tabCharaBuilder: "角色养成",
    tabMisc: "其他",

    // Shared calc
    calcCurrentInventory: "当前库存",
    calcAvailableResources: "可用资源",

    // CharaExp
    charaExpInstruction: "请输入当前等级和目标等级",
    charaExpValidationError: '"当前等级"需为1-89，"目标等级"需为2-90',
    charaExpSuperiorReport: "高级战术教材",
    charaExpAdvancedReport: "中级战术教材",
    charaExpNormalReport: "初级战术教材",
    charaExpNoviceReport: "新人战术教材",
    charaExpCredits: "金额",
    charaExpSuperiorReports: "高级战术教材",
    charaExpAdvancedReports: "中级战术教材",
    charaExpNormalReports: "初级战术教材",
    charaExpNoviceReports: "新人战术教材",

    // ElephCalc
    elephInstruction: "请输入当前星级和目标星级",
    elephCurrentRarity: "当前星级",
    elephTargetRarity: "目标星级",
    elephWeaponRank: "武器等级",
    elephCurrentEleph: "当前学生秘石",
    elephValidationError: '"当前星级"需为1-4，"目标星级"需为2-5',
    elephInvalidCombination: "无效的星级组合",
    elephStudentEleph: "学生秘石",
    elephResourceBreakdown: "资源明细",
    elephAdditionalEleph: "还需秘石",
    elephWeaponUpgradeEleph: "武器升级秘石",
    elephEligmaCost: "预计艾利格玛消耗",
  },

  ko: {
    // Banner
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

    // Home
    appTitle: "블루 아카이브",
    homeSubtitle: "헬퍼",
    toolBannerTitle: "미래 배너",
    toolBannerSubtitle: "가챠 트래커",
    toolBannerDesc: "다가오는 배너를 추적하고 전략적으로 소환을 계획하세요",
    toolBondTitle: "호감도 경험치",
    toolBondSubtitle: "관계 계산기",
    toolBondDesc: "호감도 레벨을 계산하고 캐릭터 관계를 최적화하세요",
    toolCharaTitle: "캐릭터 빌더",
    toolCharaSubtitle: "자원 최적화",
    toolCharaDesc: "스마트한 자원 관리로 완벽한 캐릭터 세팅을 구성하세요",

    // Bond Exp
    bondPageTitle: "호감도 경험치 계산기",
    bondInstruction: "현재 호감도 레벨과 목표 호감도 레벨을 입력하세요",
    bondCurrentLevel: "현재 레벨",
    bondTargetLevel: "목표 레벨",
    bondAdvancedSettings: "고급 설정",
    bondEstimatedConfig: "예상 일수 설정",
    bondCafePat: "카페 쓰다듬기 /일",
    bondGift: "선물 (60경험치) /월",
    bondCalculate: "계산",
    bondRequiredExp: "필요 경험치",
    bondEstimatedTime: "예상 기간",
    bondMonths: "개월",
    bondLessMonth: "한 달 미만",
    bondRequiredResources: "필요 자원",
    bondValidationError: '"시작"은 1-99, "목표"는 2-100이어야 하며, "시작" < "목표"이어야 합니다.',
    bondSource: "출처",

    // Resource Calc
    resourcePageTitle: "자원 계산기",
    resourceCharacter: "캐릭터",
    resourceEleph: "엘레프",

    // Misc
    miscTitle: "정보",
    miscSettings: "설정",
    miscSupport: "지원",
    miscFeedbackItem: "피드백 보내기",
    miscFeedbackItemDesc: "앱 개선에 도움을 주세요",
    miscAboutSection: "정보",
    miscVersion: "버전",
    miscDisclaimer: "면책조항",
    miscDisclaimerTap: "탭하여 보기",
    miscDisclaimerContent:
      "이 앱은 팬 프로젝트입니다. 이 콘텐츠와 관련된 어떠한 자산이나 지식재산권도 소유하지 않습니다.",
    miscClose: "닫기",
    miscFeedbackModalTitle: "피드백 보내기",
    miscTitleLabel: "제목 *",
    miscDescLabel: "설명 *",
    miscTitleError: "제목은 비워 둘 수 없습니다.",
    miscFeedbackWait: "다음 피드백을 보내기 전에 {hours}시간 기다려 주세요.",
    miscSubmit: "제출",
    miscCancel: "취소",
    miscFeedbackSent: "피드백이 전송되었습니다! 감사합니다.",
    miscFeedbackFailed: "피드백 전송에 실패했습니다. 다시 시도해 주세요.",

    // Home screen static text
    greeting: "안녕하세요, 선생님!",
    quickTools: "빠른 도구",

    // Tabs
    tabHome: "홈",
    tabBanner: "배너",
    tabBondExp: "호감도",
    tabCharaBuilder: "캐릭터",
    tabMisc: "기타",

    // Shared calc
    calcCurrentInventory: "현재 보유량",
    calcAvailableResources: "보유 자원",

    // CharaExp
    charaExpInstruction: "현재 레벨과 목표 레벨을 입력하세요",
    charaExpValidationError: '"현재 레벨"은 1-89, "목표 레벨"은 2-90이어야 합니다.',
    charaExpSuperiorReport: "상급 전술교재",
    charaExpAdvancedReport: "중급 전술교재",
    charaExpNormalReport: "초급 전술교재",
    charaExpNoviceReport: "신인 전술교재",
    charaExpCredits: "크레딧",
    charaExpSuperiorReports: "상급 전술교재",
    charaExpAdvancedReports: "중급 전술교재",
    charaExpNormalReports: "초급 전술교재",
    charaExpNoviceReports: "신인 전술교재",

    // ElephCalc
    elephInstruction: "현재 성급과 목표 성급을 입력하세요",
    elephCurrentRarity: "현재 성급",
    elephTargetRarity: "목표 성급",
    elephWeaponRank: "무기 등급",
    elephCurrentEleph: "현재 학생 엘레프",
    elephValidationError: '"현재 성급"은 1-4, "목표 성급"은 2-5이어야 합니다.',
    elephInvalidCombination: "유효하지 않은 성급 조합",
    elephStudentEleph: "학생 엘레프",
    elephResourceBreakdown: "자원 상세",
    elephAdditionalEleph: "추가 필요 엘레프",
    elephWeaponUpgradeEleph: "무기 강화 엘레프",
    elephEligmaCost: "예상 엘리그마 소모",
  },

  ja: {
    // Banner
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

    // Home
    appTitle: "ブルーアーカイブ",
    homeSubtitle: "ヘルパー",
    toolBannerTitle: "今後のガチャ",
    toolBannerSubtitle: "ガチャトラッカー",
    toolBannerDesc: "今後のガチャを追跡し、戦略的に引くタイミングを計画しましょう",
    toolBondTitle: "絆経験値",
    toolBondSubtitle: "関係計算機",
    toolBondDesc: "絆レベルを計算し、キャラクターの関係を最適化しましょう",
    toolCharaTitle: "キャラクタービルダー",
    toolCharaSubtitle: "リソース最適化",
    toolCharaDesc: "スマートなリソース管理で完璧なキャラクター構成を作りましょう",

    // Bond Exp
    bondPageTitle: "絆経験値計算機",
    bondInstruction: "現在の絆レベルと目標の絆レベルを入力してください",
    bondCurrentLevel: "現在レベル",
    bondTargetLevel: "目標レベル",
    bondAdvancedSettings: "詳細設定",
    bondEstimatedConfig: "推定日数の設定",
    bondCafePat: "カフェ撫で /日",
    bondGift: "プレゼント (60経験値) /月",
    bondCalculate: "計算",
    bondRequiredExp: "必要経験値",
    bondEstimatedTime: "推定期間",
    bondMonths: "ヶ月",
    bondLessMonth: "1ヶ月未満",
    bondRequiredResources: "必要リソース",
    bondValidationError: '"開始"は1〜99、"目標"は2〜100で、"開始" < "目標"にしてください。',
    bondSource: "ソース",

    // Resource Calc
    resourcePageTitle: "リソース計算機",
    resourceCharacter: "キャラクター",
    resourceEleph: "エレフ",

    // Misc
    miscTitle: "情報",
    miscSettings: "設定",
    miscSupport: "サポート",
    miscFeedbackItem: "フィードバックを送る",
    miscFeedbackItemDesc: "アプリの改善にご協力ください",
    miscAboutSection: "情報",
    miscVersion: "バージョン",
    miscDisclaimer: "免責事項",
    miscDisclaimerTap: "タップして表示",
    miscDisclaimerContent:
      "このアプリはファンプロジェクトです。このコンテンツに関連する資産や知的財産権は所有していません。",
    miscClose: "閉じる",
    miscFeedbackModalTitle: "フィードバックを送る",
    miscTitleLabel: "タイトル *",
    miscDescLabel: "説明 *",
    miscTitleError: "タイトルは空白にできません。",
    miscFeedbackWait: "次のフィードバックを送信するまで {hours} 時間お待ちください。",
    miscSubmit: "送信",
    miscCancel: "キャンセル",
    miscFeedbackSent: "フィードバックを送信しました！ありがとうございます。",
    miscFeedbackFailed: "フィードバックの送信に失敗しました。もう一度お試しください。",

    // Home screen static text
    greeting: "こんにちは、先生！",
    quickTools: "クイックツール",

    // Tabs
    tabHome: "ホーム",
    tabBanner: "ガチャ",
    tabBondExp: "絆経験値",
    tabCharaBuilder: "キャラクター",
    tabMisc: "その他",

    // Shared calc
    calcCurrentInventory: "現在の所持数",
    calcAvailableResources: "所持リソース",

    // CharaExp
    charaExpInstruction: "現在レベルと目標レベルを入力してください",
    charaExpValidationError: '"現在レベル"は1〜89、"目標レベル"は2〜90にしてください。',
    charaExpSuperiorReport: "上級戦術教材",
    charaExpAdvancedReport: "中級戦術教材",
    charaExpNormalReport: "初級戦術教材",
    charaExpNoviceReport: "新人戦術教材",
    charaExpCredits: "クレジット",
    charaExpSuperiorReports: "上級戦術教材",
    charaExpAdvancedReports: "中級戦術教材",
    charaExpNormalReports: "初級戦術教材",
    charaExpNoviceReports: "新人戦術教材",

    // ElephCalc
    elephInstruction: "現在のレアリティと目標のレアリティを入力してください",
    elephCurrentRarity: "現在レアリティ",
    elephTargetRarity: "目標レアリティ",
    elephWeaponRank: "武器ランク",
    elephCurrentEleph: "現在の生徒エレフ",
    elephValidationError: '"現在レアリティ"は1〜4、"目標レアリティ"は2〜5にしてください。',
    elephInvalidCombination: "無効なレアリティの組み合わせ",
    elephStudentEleph: "生徒エレフ",
    elephResourceBreakdown: "リソース内訳",
    elephAdditionalEleph: "追加必要エレフ",
    elephWeaponUpgradeEleph: "武器強化エレフ",
    elephEligmaCost: "推定エリグマ消費",
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
