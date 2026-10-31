// constants/i18n.ts

/**
 * Every language the app renders. Vietnamese and Thai are not CJK: they are
 * never caps-suppressed like zh/ja/ko, but their body text uses the system
 * face (see constants/typography.ts), because the bundled Outfit cannot draw
 * Vietnamese's stacked diacritics or any Thai at all.
 */
export type Locale = "en" | "zh" | "ko" | "ja" | "vi" | "th";

export interface UIStrings {
  // Banner screen
  pageTitle: string;
  loading: string;
  errorText: string;
  retryButton: string;
  searchPlaceholder: string;
  bannerEmptyTitle: string;
  bannerEmptyBody: string;
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

  // Student Birthdays screen
  toolBirthdayTitle: string;
  toolBirthdaySubtitle: string;
  toolBirthdayDesc: string;
  birthdayPageTitle: string;
  birthdaySubtitle: string;
  birthdayTodayHeading: string;
  birthdayTodayEmpty: string;
  birthdayUpcomingHeading: string;
  birthdayCalendarHeading: string;
  birthdaySearchPlaceholder: string;
  birthdayNoResults: string;
  birthdayToday: string;
  birthdayTomorrow: string;
  /** "in {days} days" — {days} is substituted at render time. */
  birthdayInDays: string;
  navBack: string;
  monthNames: string[];

  // Home: reset timers + student of the day
  resetHeading: string;
  resetDaily: string;
  resetCafe: string;
  resetHeadpat: string;
  sotdHeading: string;

  // Banner: live-now strip, straight from SchaleDB
  liveNowHeading: string;
  /** "{time} left" — {time} is a formatted duration like "3d 4h". */
  liveNowEndsIn: string;

  // Raid score calculator
  toolRaidTitle: string;
  toolRaidSubtitle: string;
  raidPageTitle: string;
  raidSubtitle: string;
  raidDurationLabel: string;
  raidBossHint: string;
  raidDifficultyLabel: string;
  raidModeTimeToScore: string;
  raidModeScoreToTime: string;
  raidClearTimeLabel: string;
  raidClearTimeHint: string;
  raidScoreLabel: string;
  raidTotalScore: string;
  /** "Team {n}" */
  raidTeam: string;
  raidAddTeam: string;
  raidInvalidTime: string;
  raidInvalidScore: string;

  // Gacha rate tracker
  toolGachaTitle: string;
  toolGachaSubtitle: string;
  gachaPageTitle: string;
  gachaSubtitle: string;
  gachaPulls: string;
  gachaThreeStars: string;
  gachaPickups: string;
  gachaRate: string;
  /** "expected {rate}" */
  gachaExpected: string;
  gachaSinceLast: string;
  gachaAddMiss: string;
  gachaAddTen: string;
  gachaAddThreeStar: string;
  gachaAddPickup: string;
  gachaUndo: string;
  gachaReset: string;
  gachaResetConfirm: string;
  gachaCancel: string;
  gachaLucky: string;
  gachaUnlucky: string;
  gachaEven: string;

  // Student browser
  toolStudentsTitle: string;
  toolStudentsSubtitle: string;
  studentsPageTitle: string;
  studentsSubtitle: string;
  studentsSearchPlaceholder: string;
  studentsNoResults: string;
  /** "{n} students" */
  studentsCount: string;
  studentsFilters: string;
  studentsClearFilters: string;
  studentsRarity: string;
  studentsAtkType: string;
  studentsDefType: string;
  studentsSchool: string;
  studentsGlobalOnly: string;
  studentDetailClub: string;
  studentDetailRole: string;
  studentDetailPosition: string;
  studentDetailWeapon: string;
  studentDetailBirthday: string;
  studentDetailAvailability: string;
  regionJapan: string;
  regionGlobal: string;
  regionChina: string;
  positionFront: string;
  positionMiddle: string;
  positionBack: string;

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
  bondLevelRange: string;
  bondDays: string;
  bondDaysUnit: string;
  bondExp: string;
  bondQty: string;

  // Resource Calc screen
  resourcePageTitle: string;
  resourceCharacter: string;
  resourceEleph: string;
  resourceChooseCalc: string;
  resourceCalculating: string;
  resourceSubtitle: string;
  resourceCharDesc: string;
  resourceElephDesc: string;
  resourceCalculate: string;
  resourceSkill: string;
  resourceSkillDesc: string;

  // Shared calc strings (charaExp + elephCalc)
  calcCurrentInventory: string;
  calcAvailableResources: string;

  // CharaExp screen
  charaExpLevelConfig: string;
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
  elephWeaponUpgradeLabel: string;

  // SkillCalc screen
  skillLevelConfig: string;
  skillExLabel: string;
  skillSkill1: string;
  skillSkill2: string;
  skillSkill3: string;
  skillBd1: string;
  skillBd2: string;
  skillBd3: string;
  skillBd4: string;
  skillTn1: string;
  skillTn2: string;
  skillTn3: string;
  skillTn4: string;
  skillSecretNotes: string;
  skillTotalCredits: string;
  skillValidationError: string;
  skillArtifactNote: string;
  skillOoLow: string;
  skillOoHigh: string;

  // Misc / Other screen
  miscTitle: string;
  miscSettings: string;
  theme: string;
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

  // Buy Me a Coffee
  miscCoffeeItem: string;
  miscCoffeeItemDesc: string;
  miscCoffeeDrawerTitle: string;
  miscCoffeeDrawerDesc: string;
  miscCoffeeSmallLabel: string;
  miscCoffeeLargeLabel: string;
  miscCoffeeBadge: string;
  miscCoffeeAdFreeNote: string;
  miscCoffeeButton: string;
  miscCoffeeRestore: string;
  miscCoffeeThankYouTitle: string;
  miscCoffeeThankYouDesc: string;
  miscCoffeeDone: string;
  miscCoffeeRestoreSuccess: string;
  miscCoffeeRestoreFail: string;
  miscCoffeeAlreadyOwned: string;

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
    bannerEmptyTitle: "No banners match",
    bannerEmptyBody: "Try a different name or clear the filters.",
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
    toolBirthdayTitle: "Student Birthdays",
    toolBirthdaySubtitle: "Every student's big day",
    toolBirthdayDesc: "Never miss a birthday — see who is celebrating and when",
    birthdayPageTitle: "Student Birthdays",
    birthdaySubtitle: "Who is celebrating, and when",
    birthdayTodayHeading: "Today's birthdays",
    birthdayTodayEmpty: "No birthdays today. Check back tomorrow!",
    birthdayUpcomingHeading: "Coming up",
    birthdayCalendarHeading: "Full calendar",
    birthdaySearchPlaceholder: "Search students…",
    birthdayNoResults: "No students match that search.",
    birthdayToday: "Today",
    birthdayTomorrow: "Tomorrow",
    birthdayInDays: "in {days} days",
    navBack: "Back",
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    resetHeading: "Reset timers",
    resetDaily: "Daily reset",
    resetCafe: "Cafe reset",
    resetHeadpat: "Headpat charge",
    sotdHeading: "Student of the day",
    liveNowHeading: "Live now",
    liveNowEndsIn: "{time} left",
    toolRaidTitle: "Raid Score",
    toolRaidSubtitle: "Convert clear time to score",
    raidPageTitle: "Raid Score Calculator",
    raidSubtitle: "Convert between clear time and raid score",
    raidDurationLabel: "Boss timer",
    raidBossHint: "Bosses: {list}",
    raidDifficultyLabel: "Difficulty",
    raidModeTimeToScore: "Time → Score",
    raidModeScoreToTime: "Score → Time",
    raidClearTimeLabel: "Clear time",
    raidClearTimeHint: "M:SS.mmm — e.g. 1:23.456",
    raidScoreLabel: "Raid score",
    raidTotalScore: "Total score",
    raidTeam: "Team {n}",
    raidAddTeam: "Add team",
    raidInvalidTime: "Enter a time like 1:23.456",
    raidInvalidScore: "Enter a score",
    toolGachaTitle: "Gacha Tracker",
    toolGachaSubtitle: "Track your pull luck live",
    gachaPageTitle: "Gacha Rate Tracker",
    gachaSubtitle: "Log pulls as you go and see your real rate",
    gachaPulls: "Pulls",
    gachaThreeStars: "3★",
    gachaPickups: "Rate-up",
    gachaRate: "3★ rate",
    gachaExpected: "expected {rate}",
    gachaSinceLast: "Since last 3★",
    gachaAddMiss: "+1 miss",
    gachaAddTen: "+10 misses",
    gachaAddThreeStar: "+1 3★",
    gachaAddPickup: "+1 rate-up",
    gachaUndo: "Undo",
    gachaReset: "Reset",
    gachaResetConfirm: "Reset this session? The counts will be cleared.",
    gachaCancel: "Cancel",
    gachaLucky: "Running lucky",
    gachaUnlucky: "Running unlucky",
    gachaEven: "On rate",
    toolStudentsTitle: "Students",
    toolStudentsSubtitle: "Browse every student",
    studentsPageTitle: "Students",
    studentsSubtitle: "Search and filter the full roster",
    studentsSearchPlaceholder: "Search students…",
    studentsNoResults: "No students match those filters.",
    studentsCount: "{n} students",
    studentsFilters: "Filters",
    studentsClearFilters: "Clear",
    studentsRarity: "Rarity",
    studentsAtkType: "Attack",
    studentsDefType: "Defense",
    studentsSchool: "School",
    studentsGlobalOnly: "Global only",
    studentDetailClub: "Club",
    studentDetailRole: "Role",
    studentDetailPosition: "Position",
    studentDetailWeapon: "Weapon",
    studentDetailBirthday: "Birthday",
    studentDetailAvailability: "Availability",
    regionJapan: "Japan",
    regionGlobal: "Global",
    regionChina: "China",
    positionFront: "Front",
    positionMiddle: "Middle",
    positionBack: "Back",

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
    bondLevelRange: "Bond Level Range",
    bondDays: "Days (~)",
    bondDaysUnit: "days",
    bondExp: "Exp",
    bondQty: "Qty",

    // Resource Calc
    resourcePageTitle: "Resource Calculator",
    resourceCharacter: "Character",
    resourceEleph: "Eleph",
    resourceChooseCalc: "Choose Calculator Type",
    resourceCalculating: "Calculating...",
    resourceSubtitle: "Calculate resources for character progression",
    resourceCharDesc: "Calculate EXP needed for leveling",
    resourceElephDesc: "Calculate eleph resources",
    resourceCalculate: "Calculate Resources",
    resourceSkill: "Skill",
    resourceSkillDesc: "Calculate skillbooks needed",

    // Misc
    miscTitle: "About",
    miscSettings: "Settings",
    theme: "Theme",
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

    // Buy Me a Coffee
    miscCoffeeItem: 'Buy Me a Coffee',
    miscCoffeeItemDesc: 'Support the developer · Remove ads',
    miscCoffeeDrawerTitle: 'Buy Me a Coffee',
    miscCoffeeDrawerDesc: 'Enjoying the app? A small tip removes ads forever.',
    miscCoffeeSmallLabel: 'Kopi Ice',
    miscCoffeeLargeLabel: 'Chicken Rice',
    miscCoffeeBadge: 'BEST VALUE!',
    miscCoffeeAdFreeNote: 'Both tiers remove all ads permanently',
    miscCoffeeButton: 'Support',
    miscCoffeeRestore: 'Restore Purchase',
    miscCoffeeThankYouTitle: 'Thank You!',
    miscCoffeeThankYouDesc: 'Ads removed. You\'re the best!',
    miscCoffeeDone: 'Done',
    miscCoffeeRestoreSuccess: 'Purchase restored! Ads removed.',
    miscCoffeeRestoreFail: 'No previous purchase found.',
    miscCoffeeAlreadyOwned: 'Thanks for your support! Feel free to treat me again anytime. ☕',

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
    charaExpLevelConfig: "Level Configuration",
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
    elephWeaponUpgradeLabel: "Weapon Upgrade",
    skillLevelConfig: "Skill Levels",
    skillExLabel: "EX Skill",
    skillSkill1: "Skill 1",
    skillSkill2: "Skill 2",
    skillSkill3: "Skill 3",
    skillBd1: "Blu-ray T1",
    skillBd2: "Blu-ray T2",
    skillBd3: "Blu-ray T3",
    skillBd4: "Blu-ray T4",
    skillTn1: "Tech Notes T1",
    skillTn2: "Tech Notes T2",
    skillTn3: "Tech Notes T3",
    skillTn4: "Tech Notes T4",
    skillSecretNotes: "Secret Tech Notes",
    skillTotalCredits: "Total Credits",
    skillValidationError: "Target level must be greater than or equal to current level",
    skillArtifactNote: "OOParts are an approximate estimate; exact items vary by student.",
    skillOoLow: "OOParts (lower)",
    skillOoHigh: "OOParts (higher)",
  },

  zh: {
    // Banner
    pageTitle: "未来卡池",
    loading: "加载中...",
    errorText: "加载失败",
    retryButton: "重试",
    searchPlaceholder: "搜索卡池...",
    bannerEmptyTitle: "没有匹配的卡池",
    bannerEmptyBody: "换个名字或清除筛选条件试试。",
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
    toolBirthdayTitle: "学生生日",
    toolBirthdaySubtitle: "每位学生的重要日子",
    toolBirthdayDesc: "不再错过任何生日 —— 查看谁在庆祝以及何时庆祝",
    birthdayPageTitle: "学生生日",
    birthdaySubtitle: "谁在庆祝，何时庆祝",
    birthdayTodayHeading: "今天的生日",
    birthdayTodayEmpty: "今天没有生日，明天再来看看吧！",
    birthdayUpcomingHeading: "即将到来",
    birthdayCalendarHeading: "完整日历",
    birthdaySearchPlaceholder: "搜索学生…",
    birthdayNoResults: "没有符合的学生。",
    birthdayToday: "今天",
    birthdayTomorrow: "明天",
    birthdayInDays: "{days} 天后",
    navBack: "返回",
    monthNames: [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ],
    resetHeading: "重置倒计时",
    resetDaily: "每日重置",
    resetCafe: "咖啡厅重置",
    resetHeadpat: "摸头恢复",
    sotdHeading: "每日学生",
    liveNowHeading: "正在进行",
    liveNowEndsIn: "剩余 {time}",
    toolRaidTitle: "总力战分数",
    toolRaidSubtitle: "将通关时间换算成分数",
    raidPageTitle: "总力战分数计算器",
    raidSubtitle: "在通关时间与分数之间换算",
    raidDurationLabel: "首领时限",
    raidBossHint: "首领：{list}",
    raidDifficultyLabel: "难度",
    raidModeTimeToScore: "时间 → 分数",
    raidModeScoreToTime: "分数 → 时间",
    raidClearTimeLabel: "通关时间",
    raidClearTimeHint: "M:SS.mmm — 例如 1:23.456",
    raidScoreLabel: "总力战分数",
    raidTotalScore: "总分",
    raidTeam: "第 {n} 队",
    raidAddTeam: "添加队伍",
    raidInvalidTime: "请输入如 1:23.456 的时间",
    raidInvalidScore: "请输入分数",
    toolGachaTitle: "抽卡记录",
    toolGachaSubtitle: "实时记录你的抽卡运气",
    gachaPageTitle: "抽卡概率记录器",
    gachaSubtitle: "边抽边记录，看看你的真实出货率",
    gachaPulls: "抽数",
    gachaThreeStars: "3★",
    gachaPickups: "UP",
    gachaRate: "3★ 概率",
    gachaExpected: "期望 {rate}",
    gachaSinceLast: "距上次 3★",
    gachaAddMiss: "+1 未出",
    gachaAddTen: "+10 未出",
    gachaAddThreeStar: "+1 3★",
    gachaAddPickup: "+1 UP",
    gachaUndo: "撤销",
    gachaReset: "重置",
    gachaResetConfirm: "重置本次记录？计数将被清空。",
    gachaCancel: "取消",
    gachaLucky: "手气不错",
    gachaUnlucky: "手气偏差",
    gachaEven: "接近期望",
    toolStudentsTitle: "学生图鉴",
    toolStudentsSubtitle: "浏览全部学生",
    studentsPageTitle: "学生图鉴",
    studentsSubtitle: "搜索并筛选全部学生",
    studentsSearchPlaceholder: "搜索学生…",
    studentsNoResults: "没有符合条件的学生。",
    studentsCount: "{n} 名学生",
    studentsFilters: "筛选",
    studentsClearFilters: "清除",
    studentsRarity: "稀有度",
    studentsAtkType: "攻击类型",
    studentsDefType: "防御类型",
    studentsSchool: "学院",
    studentsGlobalOnly: "仅国际服",
    studentDetailClub: "社团",
    studentDetailRole: "定位",
    studentDetailPosition: "站位",
    studentDetailWeapon: "武器",
    studentDetailBirthday: "生日",
    studentDetailAvailability: "实装情况",
    regionJapan: "日服",
    regionGlobal: "国际服",
    regionChina: "国服",
    positionFront: "前排",
    positionMiddle: "中排",
    positionBack: "后排",

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
    bondLevelRange: "好感度等级范围",
    bondDays: "天数 (~)",
    bondDaysUnit: "天",
    bondExp: "经验",
    bondQty: "数量",

    // Resource Calc
    resourcePageTitle: "资源计算器",
    resourceCharacter: "角色",
    resourceEleph: "秘石",
    resourceChooseCalc: "选择计算器类型",
    resourceCalculating: "计算中...",
    resourceSubtitle: "计算角色成长所需资源",
    resourceCharDesc: "计算升级所需经验",
    resourceElephDesc: "计算秘石资源",
    resourceCalculate: "计算资源",
    resourceSkill: "技能",
    resourceSkillDesc: "计算所需技能书",

    // Misc
    miscTitle: "关于",
    miscSettings: "设置",
    theme: "主题",
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

    // Buy Me a Coffee
    miscCoffeeItem: '请我喝杯茶',
    miscCoffeeItemDesc: '支持开发者 · 永久移除广告',
    miscCoffeeDrawerTitle: '请我喝杯茶',
    miscCoffeeDrawerDesc: '觉得好用？请我喝杯茶，永久移除广告。',
    miscCoffeeSmallLabel: '奶茶',
    miscCoffeeLargeLabel: '鸡饭',
    miscCoffeeBadge: '好吃！',
    miscCoffeeAdFreeNote: '两档均可永久移除广告',
    miscCoffeeButton: '请我',
    miscCoffeeRestore: '恢复购买',
    miscCoffeeThankYouTitle: '谢谢！',
    miscCoffeeThankYouDesc: '广告已移除，感谢您的支持！',
    miscCoffeeDone: '完成',
    miscCoffeeRestoreSuccess: '购买已恢复！广告已移除。',
    miscCoffeeRestoreFail: '未找到购买记录。',
    miscCoffeeAlreadyOwned: '感谢您的支持！随时欢迎再次请我喝杯奶茶 ☕',

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
    charaExpLevelConfig: "等级设置",
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
    elephWeaponUpgradeLabel: "武器升级",
    skillLevelConfig: "技能等级",
    skillExLabel: "EX技能",
    skillSkill1: "技能 1",
    skillSkill2: "技能 2",
    skillSkill3: "技能 3",
    skillBd1: "蓝光碟 T1",
    skillBd2: "蓝光碟 T2",
    skillBd3: "蓝光碟 T3",
    skillBd4: "蓝光碟 T4",
    skillTn1: "技术笔记 T1",
    skillTn2: "技术笔记 T2",
    skillTn3: "技术笔记 T3",
    skillTn4: "技术笔记 T4",
    skillSecretNotes: "秘传技术笔记",
    skillTotalCredits: "总信用点",
    skillValidationError: "目标等级必须大于或等于当前等级",
    skillArtifactNote: "奥帕茨为估算值，具体物品因学生而异。",
    skillOoLow: "奥帕茨（低阶）",
    skillOoHigh: "奥帕茨（高阶）",
  },

  ko: {
    // Banner
    pageTitle: "미래 배너",
    loading: "로딩 중...",
    errorText: "배너를 불러오지 못했습니다",
    retryButton: "다시 시도",
    searchPlaceholder: "배너 검색...",
    bannerEmptyTitle: "일치하는 배너 없음",
    bannerEmptyBody: "다른 이름으로 검색하거나 필터를 해제하세요.",
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
    toolBirthdayTitle: "학생 생일",
    toolBirthdaySubtitle: "모든 학생의 특별한 날",
    toolBirthdayDesc: "생일을 놓치지 마세요 — 누가 언제 생일인지 확인하세요",
    birthdayPageTitle: "학생 생일",
    birthdaySubtitle: "누가 언제 생일인지",
    birthdayTodayHeading: "오늘의 생일",
    birthdayTodayEmpty: "오늘은 생일이 없어요. 내일 다시 확인해 주세요!",
    birthdayUpcomingHeading: "다가오는 생일",
    birthdayCalendarHeading: "전체 달력",
    birthdaySearchPlaceholder: "학생 검색…",
    birthdayNoResults: "검색 결과가 없습니다.",
    birthdayToday: "오늘",
    birthdayTomorrow: "내일",
    birthdayInDays: "{days}일 후",
    navBack: "뒤로",
    monthNames: [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ],
    resetHeading: "리셋 타이머",
    resetDaily: "일일 리셋",
    resetCafe: "카페 리셋",
    resetHeadpat: "쓰다듬기 충전",
    sotdHeading: "오늘의 학생",
    liveNowHeading: "진행 중",
    liveNowEndsIn: "{time} 남음",
    toolRaidTitle: "총력전 점수",
    toolRaidSubtitle: "클리어 타임을 점수로 변환",
    raidPageTitle: "총력전 점수 계산기",
    raidSubtitle: "클리어 타임과 점수를 서로 변환",
    raidDurationLabel: "보스 제한시간",
    raidBossHint: "보스: {list}",
    raidDifficultyLabel: "난이도",
    raidModeTimeToScore: "시간 → 점수",
    raidModeScoreToTime: "점수 → 시간",
    raidClearTimeLabel: "클리어 타임",
    raidClearTimeHint: "M:SS.mmm — 예: 1:23.456",
    raidScoreLabel: "총력전 점수",
    raidTotalScore: "총점",
    raidTeam: "{n}팀",
    raidAddTeam: "팀 추가",
    raidInvalidTime: "1:23.456 형식으로 입력하세요",
    raidInvalidScore: "점수를 입력하세요",
    toolGachaTitle: "가챠 트래커",
    toolGachaSubtitle: "뽑기 운을 실시간으로 기록",
    gachaPageTitle: "가챠 확률 트래커",
    gachaSubtitle: "뽑을 때마다 기록하고 실제 확률을 확인하세요",
    gachaPulls: "뽑기 수",
    gachaThreeStars: "3★",
    gachaPickups: "픽업",
    gachaRate: "3★ 확률",
    gachaExpected: "기대치 {rate}",
    gachaSinceLast: "마지막 3★ 이후",
    gachaAddMiss: "+1 꽝",
    gachaAddTen: "+10 꽝",
    gachaAddThreeStar: "+1 3★",
    gachaAddPickup: "+1 픽업",
    gachaUndo: "실행 취소",
    gachaReset: "초기화",
    gachaResetConfirm: "이 세션을 초기화할까요? 기록이 모두 지워집니다.",
    gachaCancel: "취소",
    gachaLucky: "운이 좋아요",
    gachaUnlucky: "운이 나빠요",
    gachaEven: "기대치 수준",
    toolStudentsTitle: "학생 도감",
    toolStudentsSubtitle: "모든 학생 둘러보기",
    studentsPageTitle: "학생 도감",
    studentsSubtitle: "전체 학생을 검색하고 필터링",
    studentsSearchPlaceholder: "학생 검색…",
    studentsNoResults: "조건에 맞는 학생이 없습니다.",
    studentsCount: "학생 {n}명",
    studentsFilters: "필터",
    studentsClearFilters: "초기화",
    studentsRarity: "희귀도",
    studentsAtkType: "공격 속성",
    studentsDefType: "방어 속성",
    studentsSchool: "학원",
    studentsGlobalOnly: "글로벌만",
    studentDetailClub: "동아리",
    studentDetailRole: "역할",
    studentDetailPosition: "배치",
    studentDetailWeapon: "무기",
    studentDetailBirthday: "생일",
    studentDetailAvailability: "출시 여부",
    regionJapan: "일본",
    regionGlobal: "글로벌",
    regionChina: "중국",
    positionFront: "전열",
    positionMiddle: "중열",
    positionBack: "후열",

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
    bondLevelRange: "호감도 레벨 범위",
    bondDays: "일수 (~)",
    bondDaysUnit: "일",
    bondExp: "경험치",
    bondQty: "수량",

    // Resource Calc
    resourcePageTitle: "자원 계산기",
    resourceCharacter: "캐릭터",
    resourceEleph: "엘레프",
    resourceChooseCalc: "계산기 유형 선택",
    resourceCalculating: "계산 중...",
    resourceSubtitle: "캐릭터 성장에 필요한 자원을 계산하세요",
    resourceCharDesc: "레벨업에 필요한 경험치 계산",
    resourceElephDesc: "엘레프 자원 계산",
    resourceCalculate: "자원 계산",
    resourceSkill: "스킬",
    resourceSkillDesc: "필요한 스킬북 계산",

    // Misc
    miscTitle: "정보",
    miscSettings: "설정",
    theme: "테마",
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

    // Buy Me a Coffee
    miscCoffeeItem: '커피 한 잔 사줘요',
    miscCoffeeItemDesc: '개발자 응원 · 광고 제거',
    miscCoffeeDrawerTitle: '커피 한 잔 사줘요',
    miscCoffeeDrawerDesc: '앱이 마음에 드셨나요? 작은 응원이 광고를 영원히 없애줍니다.',
    miscCoffeeSmallLabel: '아메리카노',
    miscCoffeeLargeLabel: '치킨',
    miscCoffeeBadge: '맛있어!',
    miscCoffeeAdFreeNote: '두 가격 모두 광고를 영구 제거합니다',
    miscCoffeeButton: '결제',
    miscCoffeeRestore: '구매 복원',
    miscCoffeeThankYouTitle: '감사합니다！',
    miscCoffeeThankYouDesc: '광고가 제거되었습니다. 최고예요!',
    miscCoffeeDone: '완료',
    miscCoffeeRestoreSuccess: '구매가 복원되었습니다! 광고 제거 완료.',
    miscCoffeeRestoreFail: '이전 구매 내역을 찾을 수 없습니다.',
    miscCoffeeAlreadyOwned: '응원해 주셔서 감사해요! 언제든지 또 한 잔 사주셔도 좋아요 ☕',

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
    charaExpLevelConfig: "레벨 설정",
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
    elephWeaponUpgradeLabel: "무기 강화",
    skillLevelConfig: "스킬 레벨",
    skillExLabel: "EX 스킬",
    skillSkill1: "스킬 1",
    skillSkill2: "스킬 2",
    skillSkill3: "스킬 3",
    skillBd1: "블루레이 T1",
    skillBd2: "블루레이 T2",
    skillBd3: "블루레이 T3",
    skillBd4: "블루레이 T4",
    skillTn1: "기술 노트 T1",
    skillTn2: "기술 노트 T2",
    skillTn3: "기술 노트 T3",
    skillTn4: "기술 노트 T4",
    skillSecretNotes: "비전의 기술 노트",
    skillTotalCredits: "총 크레딧",
    skillValidationError: "목표 레벨은 현재 레벨 이상이어야 합니다",
    skillArtifactNote: "오파츠는 대략적인 추정치이며, 정확한 항목은 학생마다 다릅니다.",
    skillOoLow: "오파츠 (하급)",
    skillOoHigh: "오파츠 (상급)",
  },

  ja: {
    // Banner
    pageTitle: "今後のガチャ",
    loading: "読み込み中...",
    errorText: "バナーの読み込みに失敗しました",
    retryButton: "もう一度試す",
    searchPlaceholder: "バナーを検索...",
    bannerEmptyTitle: "該当するバナーなし",
    bannerEmptyBody: "別の名前で検索するか、フィルターを解除してください。",
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
    toolBirthdayTitle: "生徒の誕生日",
    toolBirthdaySubtitle: "すべての生徒の特別な日",
    toolBirthdayDesc: "誕生日を見逃さない — 誰がいつ祝うのかをチェック",
    birthdayPageTitle: "生徒の誕生日",
    birthdaySubtitle: "誰がいつ祝うのか",
    birthdayTodayHeading: "今日の誕生日",
    birthdayTodayEmpty: "今日は誕生日がありません。また明日チェックしてください！",
    birthdayUpcomingHeading: "まもなく",
    birthdayCalendarHeading: "年間カレンダー",
    birthdaySearchPlaceholder: "生徒を検索…",
    birthdayNoResults: "該当する生徒がいません。",
    birthdayToday: "今日",
    birthdayTomorrow: "明日",
    birthdayInDays: "{days}日後",
    navBack: "戻る",
    monthNames: [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ],
    resetHeading: "リセットタイマー",
    resetDaily: "デイリーリセット",
    resetCafe: "カフェリセット",
    resetHeadpat: "なでなで回復",
    sotdHeading: "今日の生徒",
    liveNowHeading: "開催中",
    liveNowEndsIn: "残り {time}",
    toolRaidTitle: "総力戦スコア",
    toolRaidSubtitle: "クリアタイムをスコアに変換",
    raidPageTitle: "総力戦スコア計算機",
    raidSubtitle: "クリアタイムとスコアを相互変換",
    raidDurationLabel: "ボス制限時間",
    raidBossHint: "ボス: {list}",
    raidDifficultyLabel: "難易度",
    raidModeTimeToScore: "タイム → スコア",
    raidModeScoreToTime: "スコア → タイム",
    raidClearTimeLabel: "クリアタイム",
    raidClearTimeHint: "M:SS.mmm — 例: 1:23.456",
    raidScoreLabel: "総力戦スコア",
    raidTotalScore: "合計スコア",
    raidTeam: "{n}チーム",
    raidAddTeam: "チームを追加",
    raidInvalidTime: "1:23.456 の形式で入力してください",
    raidInvalidScore: "スコアを入力してください",
    toolGachaTitle: "ガチャ記録",
    toolGachaSubtitle: "引きの運をリアルタイムで記録",
    gachaPageTitle: "ガチャ確率トラッカー",
    gachaSubtitle: "引くたびに記録して実際の排出率を確認",
    gachaPulls: "回数",
    gachaThreeStars: "3★",
    gachaPickups: "ピックアップ",
    gachaRate: "3★ 排出率",
    gachaExpected: "期待値 {rate}",
    gachaSinceLast: "前回の3★から",
    gachaAddMiss: "+1 ハズレ",
    gachaAddTen: "+10 ハズレ",
    gachaAddThreeStar: "+1 3★",
    gachaAddPickup: "+1 ピックアップ",
    gachaUndo: "元に戻す",
    gachaReset: "リセット",
    gachaResetConfirm: "この記録をリセットしますか？カウントは消去されます。",
    gachaCancel: "キャンセル",
    gachaLucky: "運がいい",
    gachaUnlucky: "運が悪い",
    gachaEven: "期待値どおり",
    toolStudentsTitle: "生徒図鑑",
    toolStudentsSubtitle: "すべての生徒を閲覧",
    studentsPageTitle: "生徒図鑑",
    studentsSubtitle: "全生徒を検索・絞り込み",
    studentsSearchPlaceholder: "生徒を検索…",
    studentsNoResults: "条件に合う生徒がいません。",
    studentsCount: "生徒 {n}人",
    studentsFilters: "絞り込み",
    studentsClearFilters: "クリア",
    studentsRarity: "レアリティ",
    studentsAtkType: "攻撃属性",
    studentsDefType: "防御属性",
    studentsSchool: "学園",
    studentsGlobalOnly: "グローバルのみ",
    studentDetailClub: "部活",
    studentDetailRole: "ロール",
    studentDetailPosition: "配置",
    studentDetailWeapon: "武器",
    studentDetailBirthday: "誕生日",
    studentDetailAvailability: "実装状況",
    regionJapan: "日本",
    regionGlobal: "グローバル",
    regionChina: "中国",
    positionFront: "前衛",
    positionMiddle: "中衛",
    positionBack: "後衛",

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
    bondLevelRange: "絆レベル範囲",
    bondDays: "日数 (~)",
    bondDaysUnit: "日",
    bondExp: "経験値",
    bondQty: "数量",

    // Resource Calc
    resourcePageTitle: "リソース計算機",
    resourceCharacter: "キャラクター",
    resourceEleph: "エレフ",
    resourceChooseCalc: "計算タイプを選択",
    resourceCalculating: "計算中...",
    resourceSubtitle: "キャラクター育成に必要なリソースを計算",
    resourceCharDesc: "レベルアップに必要な経験値を計算",
    resourceElephDesc: "エレフリソースを計算",
    resourceCalculate: "リソースを計算",
    resourceSkill: "スキル",
    resourceSkillDesc: "必要なスキルブックを計算",

    // Misc
    miscTitle: "情報",
    miscSettings: "設定",
    theme: "テーマ",
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

    // Buy Me a Coffee
    miscCoffeeItem: 'コーヒーをおごって',
    miscCoffeeItemDesc: '開発者を応援 · 広告を削除',
    miscCoffeeDrawerTitle: 'コーヒーをおごって',
    miscCoffeeDrawerDesc: 'アプリを気に入っていただけましたか？広告を永久に削除します。',
    miscCoffeeSmallLabel: 'コーヒー',
    miscCoffeeLargeLabel: 'ラーメン',
    miscCoffeeBadge: 'うまい！',
    miscCoffeeAdFreeNote: 'どちらも広告を永久に削除します',
    miscCoffeeButton: '支払う',
    miscCoffeeRestore: '購入を復元',
    miscCoffeeThankYouTitle: 'ありがとう！',
    miscCoffeeThankYouDesc: '広告を削除しました。ありがとうございます！',
    miscCoffeeDone: '完了',
    miscCoffeeRestoreSuccess: '購入が復元されました！広告を削除しました。',
    miscCoffeeRestoreFail: '以前の購入が見つかりませんでした。',
    miscCoffeeAlreadyOwned: 'ご支援ありがとうございます！またいつでもどうぞ ☕',

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
    charaExpLevelConfig: "レベル設定",
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
    elephWeaponUpgradeLabel: "武器強化",
    skillLevelConfig: "スキルレベル",
    skillExLabel: "EXスキル",
    skillSkill1: "スキル 1",
    skillSkill2: "スキル 2",
    skillSkill3: "スキル 3",
    skillBd1: "ブルーレイ T1",
    skillBd2: "ブルーレイ T2",
    skillBd3: "ブルーレイ T3",
    skillBd4: "ブルーレイ T4",
    skillTn1: "技術ノート T1",
    skillTn2: "技術ノート T2",
    skillTn3: "技術ノート T3",
    skillTn4: "技術ノート T4",
    skillSecretNotes: "極秘技術ノート",
    skillTotalCredits: "合計クレジット",
    skillValidationError: "目標レベルは現在のレベル以上である必要があります",
    skillArtifactNote: "オーパーツは概算です。正確な素材は生徒により異なります。",
    skillOoLow: "オーパーツ（下位）",
    skillOoHigh: "オーパーツ（上位）",
  },

  // Vietnamese. There is no official Vietnamese client, so this follows the
  // words Vietnamese Sensei actually use: game terms that the community keeps
  // in English (Bond, Eleph, Eligma, EX, BD, raid, banner, rate up) stay as
  // they are, everything around them is plain Vietnamese. Item and school
  // names follow SchaleDB's vi data where it has them.
  vi: {
    // Banner
    pageTitle: "Banner sắp tới",
    loading: "Đang tải banner...",
    errorText: "Không tải được banner",
    retryButton: "Thử lại",
    searchPlaceholder: "Tìm banner...",
    bannerEmptyTitle: "Không có banner phù hợp",
    bannerEmptyBody: "Thử tên khác hoặc bỏ bớt bộ lọc.",
    sortButton: "Sắp xếp",
    sortEarliest: "Sớm nhất trước",
    sortLatest: "Muộn nhất trước",
    filterAll: "Tất cả",
    filterNew: "Mới",
    filterRerun: "Rerun",
    filterFes: "Fes",
    filterCollab: "Collab",
    bannerSuffix: "Banner",
    newLabel: "Mới",
    language: "Ngôn ngữ",

    // Home
    appTitle: "Blue Archive",
    homeSubtitle: "Trợ thủ",
    toolBannerTitle: "Banner sắp tới",
    toolBannerSubtitle: "Theo dõi gacha",
    toolBannerDesc: "Theo dõi các banner sắp ra và lên kế hoạch quay hợp lý",
    toolBondTitle: "EXP Bond",
    toolBondSubtitle: "Tính mối quan hệ",
    toolBondDesc: "Tính cấp Bond và tối ưu mối quan hệ với học sinh",
    toolCharaTitle: "Nuôi nhân vật",
    toolCharaSubtitle: "Tối ưu tài nguyên",
    toolCharaDesc: "Lên kế hoạch nuôi nhân vật và quản lý tài nguyên thông minh",
    toolBirthdayTitle: "Sinh nhật học sinh",
    toolBirthdaySubtitle: "Ngày đặc biệt của từng học sinh",
    toolBirthdayDesc: "Không bỏ lỡ sinh nhật nào — xem ai sắp đón sinh nhật và vào ngày nào",
    birthdayPageTitle: "Sinh nhật học sinh",
    birthdaySubtitle: "Ai đón sinh nhật, và vào ngày nào",
    birthdayTodayHeading: "Sinh nhật hôm nay",
    birthdayTodayEmpty: "Hôm nay không có ai sinh nhật. Mai ghé lại nhé!",
    birthdayUpcomingHeading: "Sắp tới",
    birthdayCalendarHeading: "Lịch cả năm",
    birthdaySearchPlaceholder: "Tìm học sinh…",
    birthdayNoResults: "Không tìm thấy học sinh nào.",
    birthdayToday: "Hôm nay",
    birthdayTomorrow: "Ngày mai",
    birthdayInDays: "{days} ngày nữa",
    navBack: "Quay lại",
    monthNames: [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ],
    resetHeading: "Giờ reset",
    resetDaily: "Reset hằng ngày",
    resetCafe: "Reset Café",
    resetHeadpat: "Hồi lượt xoa đầu",
    sotdHeading: "Học sinh của ngày",
    liveNowHeading: "Đang diễn ra",
    liveNowEndsIn: "Còn {time}",
    toolRaidTitle: "Điểm raid",
    toolRaidSubtitle: "Quy đổi thời gian clear ra điểm",
    raidPageTitle: "Tính điểm raid",
    raidSubtitle: "Quy đổi qua lại giữa thời gian clear và điểm raid",
    raidDurationLabel: "Thời gian của boss",
    raidBossHint: "Boss: {list}",
    raidDifficultyLabel: "Độ khó",
    raidModeTimeToScore: "Thời gian → Điểm",
    raidModeScoreToTime: "Điểm → Thời gian",
    raidClearTimeLabel: "Thời gian clear",
    raidClearTimeHint: "M:SS.mmm — ví dụ 1:23.456",
    raidScoreLabel: "Điểm raid",
    raidTotalScore: "Tổng điểm",
    raidTeam: "Đội {n}",
    raidAddTeam: "Thêm đội",
    raidInvalidTime: "Nhập thời gian dạng 1:23.456",
    raidInvalidScore: "Nhập điểm",
    toolGachaTitle: "Theo dõi gacha",
    toolGachaSubtitle: "Ghi lại nhân phẩm mỗi lần quay",
    gachaPageTitle: "Theo dõi tỉ lệ gacha",
    gachaSubtitle: "Ghi lại từng lượt quay và xem tỉ lệ thật của bạn",
    gachaPulls: "Lượt quay",
    gachaThreeStars: "3★",
    gachaPickups: "Rate up",
    gachaRate: "Tỉ lệ 3★",
    gachaExpected: "kỳ vọng {rate}",
    gachaSinceLast: "Từ lần 3★ gần nhất",
    gachaAddMiss: "+1 xịt",
    gachaAddTen: "+10 xịt",
    gachaAddThreeStar: "+1 3★",
    gachaAddPickup: "+1 rate up",
    gachaUndo: "Hoàn tác",
    gachaReset: "Đặt lại",
    gachaResetConfirm: "Đặt lại phiên này? Mọi số liệu sẽ bị xóa.",
    gachaCancel: "Hủy",
    gachaLucky: "Đang hên",
    gachaUnlucky: "Đang xui",
    gachaEven: "Đúng tỉ lệ",
    toolStudentsTitle: "Học sinh",
    toolStudentsSubtitle: "Xem toàn bộ học sinh",
    studentsPageTitle: "Học sinh",
    studentsSubtitle: "Tìm kiếm và lọc toàn bộ danh sách",
    studentsSearchPlaceholder: "Tìm học sinh…",
    studentsNoResults: "Không có học sinh nào khớp bộ lọc.",
    studentsCount: "{n} học sinh",
    studentsFilters: "Bộ lọc",
    studentsClearFilters: "Xóa lọc",
    studentsRarity: "Độ hiếm",
    studentsAtkType: "Loại tấn công",
    studentsDefType: "Loại phòng thủ",
    studentsSchool: "Học viện",
    studentsGlobalOnly: "Chỉ bản Global",
    studentDetailClub: "Câu lạc bộ",
    studentDetailRole: "Vai trò",
    studentDetailPosition: "Vị trí",
    studentDetailWeapon: "Vũ khí",
    studentDetailBirthday: "Sinh nhật",
    studentDetailAvailability: "Phát hành",
    regionJapan: "Nhật Bản",
    regionGlobal: "Global",
    regionChina: "Trung Quốc",
    positionFront: "Hàng đầu",
    positionMiddle: "Hàng giữa",
    positionBack: "Hàng sau",

    // Bond Exp
    bondPageTitle: "Tính EXP Bond",
    bondInstruction: "Nhập cấp Bond hiện tại và cấp Bond muốn đạt",
    bondCurrentLevel: "Cấp hiện tại",
    bondTargetLevel: "Cấp mục tiêu",
    bondAdvancedSettings: "Cài đặt nâng cao",
    bondEstimatedConfig: "Thiết lập để ước tính số ngày",
    bondCafePat: "Xoa đầu ở Café /ngày",
    bondGift: "Quà (60 EXP) /tháng",
    bondCalculate: "Tính",
    bondRequiredExp: "EXP cần thiết",
    bondEstimatedTime: "Thời gian ước tính",
    bondMonths: "tháng",
    bondLessMonth: "chưa tới một tháng",
    bondRequiredResources: "Tài nguyên cần thiết",
    bondValidationError: 'Hãy đảm bảo "từ" trong khoảng 1-99, "đến" trong khoảng 2-100 và "từ" < "đến".',
    bondSource: "Nguồn",
    bondLevelRange: "Khoảng cấp Bond",
    bondDays: "Số ngày (~)",
    bondDaysUnit: "ngày",
    bondExp: "EXP",
    bondQty: "Số lượng",

    // Resource Calc
    resourcePageTitle: "Tính tài nguyên",
    resourceCharacter: "Nhân vật",
    resourceEleph: "Eleph",
    resourceChooseCalc: "Chọn công cụ tính",
    resourceCalculating: "Đang tính...",
    resourceSubtitle: "Tính tài nguyên cần để nuôi nhân vật",
    resourceCharDesc: "Tính EXP cần để lên cấp",
    resourceElephDesc: "Tính lượng Eleph cần dùng",
    resourceCalculate: "Tính tài nguyên",
    resourceSkill: "Kỹ năng",
    resourceSkillDesc: "Tính số BD và Ghi chú kỹ thuật cần",

    // Misc
    miscTitle: "Giới thiệu",
    miscSettings: "Cài đặt",
    theme: "Giao diện",
    miscSupport: "Hỗ trợ",
    miscFeedbackItem: "Gửi góp ý",
    miscFeedbackItemDesc: "Giúp ứng dụng tốt hơn",
    miscAboutSection: "Giới thiệu",
    miscVersion: "Phiên bản",
    miscDisclaimer: "Miễn trừ trách nhiệm",
    miscDisclaimerTap: "Chạm để xem",
    miscDisclaimerContent:
      "Ứng dụng này chỉ là một dự án do người hâm mộ làm. Mình không sở hữu bất kỳ tài sản hay quyền sở hữu trí tuệ nào liên quan đến nội dung này.",
    miscClose: "Đóng",
    miscFeedbackModalTitle: "Gửi góp ý",
    miscTitleLabel: "Tiêu đề *",
    miscDescLabel: "Mô tả *",
    miscTitleError: "Tiêu đề không được để trống.",
    miscFeedbackWait: "Vui lòng đợi {hours} giờ rồi hãy gửi góp ý tiếp.",
    miscSubmit: "Gửi",
    miscCancel: "Hủy",
    miscFeedbackSent: "Đã gửi góp ý! Cảm ơn bạn.",
    miscFeedbackFailed: "Gửi góp ý thất bại. Vui lòng thử lại.",

    // Buy Me a Coffee
    miscCoffeeItem: 'Mời mình ly cà phê',
    miscCoffeeItemDesc: 'Ủng hộ nhà phát triển · Gỡ quảng cáo',
    miscCoffeeDrawerTitle: 'Mời mình ly cà phê',
    miscCoffeeDrawerDesc: 'Thấy ứng dụng hữu ích? Một chút ủng hộ sẽ gỡ quảng cáo vĩnh viễn.',
    miscCoffeeSmallLabel: 'Cà phê sữa đá',
    miscCoffeeLargeLabel: 'Cơm gà',
    miscCoffeeBadge: 'Hời nhất!',
    miscCoffeeAdFreeNote: 'Cả hai mức đều gỡ toàn bộ quảng cáo vĩnh viễn',
    miscCoffeeButton: 'Ủng hộ',
    miscCoffeeRestore: 'Khôi phục giao dịch',
    miscCoffeeThankYouTitle: 'Cảm ơn bạn!',
    miscCoffeeThankYouDesc: 'Đã gỡ quảng cáo. Bạn tuyệt nhất!',
    miscCoffeeDone: 'Xong',
    miscCoffeeRestoreSuccess: 'Đã khôi phục giao dịch! Quảng cáo đã được gỡ.',
    miscCoffeeRestoreFail: 'Không tìm thấy giao dịch nào trước đây.',
    miscCoffeeAlreadyOwned: 'Cảm ơn bạn đã ủng hộ! Muốn mời mình thêm ly nữa thì lúc nào cũng được nhé ☕',

    // Home screen static text
    greeting: "Chào Sensei!",
    quickTools: "Công cụ nhanh",

    // Tabs
    tabHome: "Trang chủ",
    tabBanner: "Banner",
    tabBondExp: "Bond",
    tabCharaBuilder: "Nhân vật",
    tabMisc: "Khác",

    // Shared calc
    calcCurrentInventory: "Đang có",
    calcAvailableResources: "Tài nguyên đang có",

    // CharaExp
    charaExpLevelConfig: "Thiết lập cấp",
    charaExpInstruction: "Nhập cấp hiện tại và cấp mục tiêu",
    charaExpValidationError: 'Hãy đảm bảo "Cấp hiện tại" trong khoảng 1-89 và "Cấp mục tiêu" trong khoảng 2-90.',
    charaExpSuperiorReport: "Báo cáo hoạt động cao cấp",
    charaExpAdvancedReport: "Báo cáo hoạt động nâng cao",
    charaExpNormalReport: "Báo cáo hoạt động thường",
    charaExpNoviceReport: "Báo cáo hoạt động sơ cấp",
    charaExpCredits: "Credit",
    charaExpSuperiorReports: "Báo cáo hoạt động cao cấp",
    charaExpAdvancedReports: "Báo cáo hoạt động nâng cao",
    charaExpNormalReports: "Báo cáo hoạt động thường",
    charaExpNoviceReports: "Báo cáo hoạt động sơ cấp",

    // ElephCalc
    elephInstruction: "Nhập số sao hiện tại và số sao mục tiêu",
    elephCurrentRarity: "Sao hiện tại",
    elephTargetRarity: "Sao mục tiêu",
    elephWeaponRank: "Sao vũ khí",
    elephCurrentEleph: "Eleph học sinh đang có",
    elephValidationError: 'Hãy đảm bảo "Sao hiện tại" trong khoảng 1-4 và "Sao mục tiêu" trong khoảng 2-5.',
    elephInvalidCombination: "Tổ hợp số sao không hợp lệ",
    elephStudentEleph: "Eleph học sinh",
    elephResourceBreakdown: "Chi tiết tài nguyên",
    elephAdditionalEleph: "Eleph cần thêm",
    elephWeaponUpgradeEleph: "Eleph nâng vũ khí",
    elephEligmaCost: "Eligma ước tính",
    elephWeaponUpgradeLabel: "Nâng cấp vũ khí",
    skillLevelConfig: "Cấp kỹ năng",
    skillExLabel: "Kỹ năng EX",
    skillSkill1: "Kỹ năng 1",
    skillSkill2: "Kỹ năng 2",
    skillSkill3: "Kỹ năng 3",
    skillBd1: "BD T1",
    skillBd2: "BD T2",
    skillBd3: "BD T3",
    skillBd4: "BD T4",
    skillTn1: "Ghi chú kỹ thuật T1",
    skillTn2: "Ghi chú kỹ thuật T2",
    skillTn3: "Ghi chú kỹ thuật T3",
    skillTn4: "Ghi chú kỹ thuật T4",
    skillSecretNotes: "Giấy kỹ thuật bí mật",
    skillTotalCredits: "Tổng Credit",
    skillValidationError: "Cấp mục tiêu phải lớn hơn hoặc bằng cấp hiện tại",
    skillArtifactNote: "Lượng OOParts chỉ là ước tính; loại cụ thể tùy từng học sinh.",
    skillOoLow: "OOParts (bậc thấp)",
    skillOoHigh: "OOParts (bậc cao)",
  },

  // Thai. Blue Archive Global ships in Thai, so this uses the client's own
  // words: เซนเซ, นักเรียน, สายใย (bond), เอลเลฟ, เอลลิกมา, รายงาน/ตำราสกิล/BD
  // tiers ขั้นต่ำ → ขั้นสูงสุด, วัตถุหลงยุค (OOParts), and เรดบอส for Total
  // Assault. Banners are ตู้ and a bad pull is เกลือ, as Thai players say.
  th: {
    // Banner
    pageTitle: "ตู้ที่กำลังจะมา",
    loading: "กำลังโหลดตู้...",
    errorText: "โหลดข้อมูลตู้ไม่สำเร็จ",
    retryButton: "ลองอีกครั้ง",
    searchPlaceholder: "ค้นหาตู้...",
    bannerEmptyTitle: "ไม่พบตู้ที่ตรงกัน",
    bannerEmptyBody: "ลองค้นหาด้วยชื่ออื่น หรือล้างตัวกรอง",
    sortButton: "เรียงลำดับ",
    sortEarliest: "เร็วสุดก่อน",
    sortLatest: "ล่าสุดก่อน",
    filterAll: "ทั้งหมด",
    filterNew: "ใหม่",
    filterRerun: "รีรัน",
    filterFes: "เฟส",
    filterCollab: "คอลแลบ",
    bannerSuffix: "ตู้",
    newLabel: "ใหม่",
    language: "ภาษา",

    // Home
    appTitle: "Blue Archive",
    homeSubtitle: "ผู้ช่วย",
    toolBannerTitle: "ตู้ที่กำลังจะมา",
    toolBannerSubtitle: "ติดตามกาชา",
    toolBannerDesc: "ติดตามตู้ที่กำลังจะมา แล้ววางแผนการสุ่มให้คุ้มที่สุด",
    toolBondTitle: "EXP สายใย",
    toolBondSubtitle: "คำนวณความสัมพันธ์",
    toolBondDesc: "คำนวณระดับสายใยและวางแผนความสัมพันธ์กับนักเรียน",
    toolCharaTitle: "พัฒนานักเรียน",
    toolCharaSubtitle: "วางแผนทรัพยากร",
    toolCharaDesc: "วางแผนพัฒนานักเรียนพร้อมจัดการทรัพยากรอย่างคุ้มค่า",
    toolBirthdayTitle: "วันเกิดนักเรียน",
    toolBirthdaySubtitle: "วันสำคัญของนักเรียนทุกคน",
    toolBirthdayDesc: "ไม่พลาดทุกวันเกิด — ดูว่าใครเกิดวันไหน",
    birthdayPageTitle: "วันเกิดนักเรียน",
    birthdaySubtitle: "ใครจะฉลองวันเกิด และเมื่อไร",
    birthdayTodayHeading: "วันเกิดวันนี้",
    birthdayTodayEmpty: "วันนี้ไม่มีใครเกิด แวะมาดูใหม่พรุ่งนี้นะ!",
    birthdayUpcomingHeading: "ที่กำลังจะมาถึง",
    birthdayCalendarHeading: "ปฏิทินทั้งปี",
    birthdaySearchPlaceholder: "ค้นหานักเรียน…",
    birthdayNoResults: "ไม่พบนักเรียนที่ตรงกับการค้นหา",
    birthdayToday: "วันนี้",
    birthdayTomorrow: "พรุ่งนี้",
    birthdayInDays: "อีก {days} วัน",
    navBack: "ย้อนกลับ",
    monthNames: [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ],
    resetHeading: "เวลารีเซ็ต",
    resetDaily: "รีเซ็ตรายวัน",
    resetCafe: "รีเซ็ตคาเฟ่",
    resetHeadpat: "รอบลูบหัวถัดไป",
    sotdHeading: "นักเรียนประจำวัน",
    liveNowHeading: "เปิดอยู่ตอนนี้",
    liveNowEndsIn: "เหลือ {time}",
    toolRaidTitle: "คะแนนเรดบอส",
    toolRaidSubtitle: "แปลงเวลาเคลียร์เป็นคะแนน",
    raidPageTitle: "คำนวณคะแนนเรดบอส",
    raidSubtitle: "แปลงไปมาระหว่างเวลาเคลียร์กับคะแนนเรดบอส",
    raidDurationLabel: "เวลาจำกัดของบอส",
    raidBossHint: "บอส: {list}",
    raidDifficultyLabel: "ระดับความยาก",
    raidModeTimeToScore: "เวลา → คะแนน",
    raidModeScoreToTime: "คะแนน → เวลา",
    raidClearTimeLabel: "เวลาเคลียร์",
    raidClearTimeHint: "M:SS.mmm — เช่น 1:23.456",
    raidScoreLabel: "คะแนนเรดบอส",
    raidTotalScore: "คะแนนรวม",
    raidTeam: "ทีม {n}",
    raidAddTeam: "เพิ่มทีม",
    raidInvalidTime: "กรอกเวลาในรูปแบบ 1:23.456",
    raidInvalidScore: "กรอกคะแนน",
    toolGachaTitle: "บันทึกกาชา",
    toolGachaSubtitle: "เช็กดวงการสุ่มแบบเรียลไทม์",
    gachaPageTitle: "บันทึกเรทกาชา",
    gachaSubtitle: "บันทึกทุกครั้งที่สุ่ม แล้วดูเรทจริงของคุณ",
    gachaPulls: "จำนวนครั้งที่สุ่ม",
    gachaThreeStars: "3★",
    gachaPickups: "เรทอัป",
    gachaRate: "เรท 3★",
    gachaExpected: "ค่าคาดหวัง {rate}",
    gachaSinceLast: "นับจาก 3★ ล่าสุด",
    gachaAddMiss: "+1 เกลือ",
    gachaAddTen: "+10 เกลือ",
    gachaAddThreeStar: "+1 3★",
    gachaAddPickup: "+1 เรทอัป",
    gachaUndo: "เลิกทำ",
    gachaReset: "รีเซ็ต",
    gachaResetConfirm: "รีเซ็ตรอบนี้ไหม? ตัวเลขทั้งหมดจะถูกล้าง",
    gachaCancel: "ยกเลิก",
    gachaLucky: "ดวงดี",
    gachaUnlucky: "ดวงเกลือ",
    gachaEven: "ตามเรท",
    toolStudentsTitle: "นักเรียน",
    toolStudentsSubtitle: "ดูนักเรียนทุกคน",
    studentsPageTitle: "นักเรียน",
    studentsSubtitle: "ค้นหาและกรองรายชื่อนักเรียนทั้งหมด",
    studentsSearchPlaceholder: "ค้นหานักเรียน…",
    studentsNoResults: "ไม่พบนักเรียนที่ตรงกับตัวกรอง",
    studentsCount: "นักเรียน {n} คน",
    studentsFilters: "ตัวกรอง",
    studentsClearFilters: "ล้าง",
    studentsRarity: "ความหายาก",
    studentsAtkType: "ประเภทการโจมตี",
    studentsDefType: "ประเภทเกราะ",
    studentsSchool: "โรงเรียน",
    studentsGlobalOnly: "เฉพาะเซิร์ฟ Global",
    studentDetailClub: "ชมรม",
    studentDetailRole: "บทบาท",
    studentDetailPosition: "ตำแหน่ง",
    studentDetailWeapon: "อาวุธ",
    studentDetailBirthday: "วันเกิด",
    studentDetailAvailability: "การเปิดตัว",
    regionJapan: "ญี่ปุ่น",
    regionGlobal: "Global",
    regionChina: "จีน",
    positionFront: "แถวหน้า",
    positionMiddle: "แถวกลาง",
    positionBack: "แถวหลัง",

    // Bond Exp
    bondPageTitle: "คำนวณ EXP สายใย",
    bondInstruction: "กรอกระดับสายใยปัจจุบันและระดับที่ต้องการ",
    bondCurrentLevel: "ระดับปัจจุบัน",
    bondTargetLevel: "ระดับเป้าหมาย",
    bondAdvancedSettings: "ตั้งค่าขั้นสูง",
    bondEstimatedConfig: "ตั้งค่าสำหรับประมาณจำนวนวัน",
    bondCafePat: "ลูบหัวในคาเฟ่ /วัน",
    bondGift: "ของขวัญ (60 EXP) /เดือน",
    bondCalculate: "คำนวณ",
    bondRequiredExp: "EXP ที่ต้องใช้",
    bondEstimatedTime: "เวลาโดยประมาณ",
    bondMonths: "เดือน",
    bondLessMonth: "ไม่ถึงหนึ่งเดือน",
    bondRequiredResources: "ทรัพยากรที่ต้องใช้",
    bondValidationError: 'โปรดตรวจสอบว่า "จาก" อยู่ระหว่าง 1-99, "ถึง" อยู่ระหว่าง 2-100 และ "จาก" < "ถึง"',
    bondSource: "แหล่งที่มา",
    bondLevelRange: "ช่วงระดับสายใย",
    bondDays: "จำนวนวัน (~)",
    bondDaysUnit: "วัน",
    bondExp: "EXP",
    bondQty: "จำนวน",

    // Resource Calc
    resourcePageTitle: "คำนวณทรัพยากร",
    resourceCharacter: "ตัวละคร",
    resourceEleph: "เอลเลฟ",
    resourceChooseCalc: "เลือกประเภทการคำนวณ",
    resourceCalculating: "กำลังคำนวณ...",
    resourceSubtitle: "คำนวณทรัพยากรสำหรับพัฒนานักเรียน",
    resourceCharDesc: "คำนวณ EXP ที่ต้องใช้ในการอัปเลเวล",
    resourceElephDesc: "คำนวณเอลเลฟที่ต้องใช้",
    resourceCalculate: "คำนวณทรัพยากร",
    resourceSkill: "สกิล",
    resourceSkillDesc: "คำนวณ BD และตำราสกิลที่ต้องใช้",

    // Misc
    miscTitle: "เกี่ยวกับ",
    miscSettings: "การตั้งค่า",
    theme: "ธีม",
    miscSupport: "ช่วยเหลือ",
    miscFeedbackItem: "ส่งความคิดเห็น",
    miscFeedbackItemDesc: "ช่วยกันทำให้แอปดียิ่งขึ้น",
    miscAboutSection: "เกี่ยวกับ",
    miscVersion: "เวอร์ชัน",
    miscDisclaimer: "ข้อจำกัดความรับผิดชอบ",
    miscDisclaimerTap: "แตะเพื่อดู",
    miscDisclaimerContent:
      "แอปนี้เป็นเพียงโปรเจกต์ที่แฟนเกมทำขึ้น ผู้พัฒนาไม่ได้เป็นเจ้าของทรัพย์สินหรือทรัพย์สินทางปัญญาใด ๆ ที่เกี่ยวข้องกับเนื้อหานี้",
    miscClose: "ปิด",
    miscFeedbackModalTitle: "ส่งความคิดเห็น",
    miscTitleLabel: "หัวข้อ *",
    miscDescLabel: "รายละเอียด *",
    miscTitleError: "กรุณากรอกหัวข้อ",
    miscFeedbackWait: "โปรดรอ {hours} ชั่วโมงก่อนส่งความคิดเห็นครั้งถัดไป",
    miscSubmit: "ส่ง",
    miscCancel: "ยกเลิก",
    miscFeedbackSent: "ส่งความคิดเห็นแล้ว ขอบคุณมาก!",
    miscFeedbackFailed: "ส่งความคิดเห็นไม่สำเร็จ โปรดลองอีกครั้ง",

    // Buy Me a Coffee
    miscCoffeeItem: 'เลี้ยงกาแฟสักแก้ว',
    miscCoffeeItemDesc: 'สนับสนุนผู้พัฒนา · ลบโฆษณา',
    miscCoffeeDrawerTitle: 'เลี้ยงกาแฟสักแก้ว',
    miscCoffeeDrawerDesc: 'ชอบแอปนี้ไหม? สนับสนุนเล็ก ๆ น้อย ๆ แล้วไม่มีโฆษณาอีกตลอดไป',
    miscCoffeeSmallLabel: 'กาแฟเย็น',
    miscCoffeeLargeLabel: 'ข้าวมันไก่',
    miscCoffeeBadge: 'คุ้มสุด!',
    miscCoffeeAdFreeNote: 'ทั้งสองแบบลบโฆษณาทั้งหมดถาวร',
    miscCoffeeButton: 'สนับสนุน',
    miscCoffeeRestore: 'กู้คืนการซื้อ',
    miscCoffeeThankYouTitle: 'ขอบคุณ!',
    miscCoffeeThankYouDesc: 'ลบโฆษณาแล้ว คุณสุดยอดมาก!',
    miscCoffeeDone: 'เสร็จสิ้น',
    miscCoffeeRestoreSuccess: 'กู้คืนการซื้อแล้ว! ลบโฆษณาเรียบร้อย',
    miscCoffeeRestoreFail: 'ไม่พบประวัติการซื้อก่อนหน้า',
    miscCoffeeAlreadyOwned: 'ขอบคุณที่สนับสนุน! อยากเลี้ยงอีกเมื่อไรก็ได้เลยนะ ☕',

    // Home screen static text
    greeting: "สวัสดี เซนเซ!",
    quickTools: "เครื่องมือด่วน",

    // Tabs
    tabHome: "หน้าแรก",
    tabBanner: "ตู้",
    tabBondExp: "สายใย",
    tabCharaBuilder: "พัฒนา",
    tabMisc: "อื่นๆ",

    // Shared calc
    calcCurrentInventory: "ที่มีอยู่",
    calcAvailableResources: "ทรัพยากรที่มี",

    // CharaExp
    charaExpLevelConfig: "ตั้งค่าเลเวล",
    charaExpInstruction: "กรอกเลเวลปัจจุบันและเลเวลเป้าหมาย",
    charaExpValidationError: 'โปรดตรวจสอบว่า "เลเวลปัจจุบัน" อยู่ระหว่าง 1-89 และ "เลเวลเป้าหมาย" อยู่ระหว่าง 2-90',
    charaExpSuperiorReport: "รายงานขั้นสูงสุด",
    charaExpAdvancedReport: "รายงานขั้นสูง",
    charaExpNormalReport: "รายงานขั้นกลาง",
    charaExpNoviceReport: "รายงานขั้นต่ำ",
    charaExpCredits: "เครดิต",
    charaExpSuperiorReports: "รายงานขั้นสูงสุด",
    charaExpAdvancedReports: "รายงานขั้นสูง",
    charaExpNormalReports: "รายงานขั้นกลาง",
    charaExpNoviceReports: "รายงานขั้นต่ำ",

    // ElephCalc
    elephInstruction: "กรอกจำนวนดาวปัจจุบันและจำนวนดาวเป้าหมาย",
    elephCurrentRarity: "ดาวปัจจุบัน",
    elephTargetRarity: "ดาวเป้าหมาย",
    elephWeaponRank: "ดาวอาวุธเฉพาะ",
    elephCurrentEleph: "เอลเลฟที่มีอยู่",
    elephValidationError: 'โปรดตรวจสอบว่า "ดาวปัจจุบัน" อยู่ระหว่าง 1-4 และ "ดาวเป้าหมาย" อยู่ระหว่าง 2-5',
    elephInvalidCombination: "จำนวนดาวที่เลือกไม่ถูกต้อง",
    elephStudentEleph: "เอลเลฟนักเรียน",
    elephResourceBreakdown: "รายละเอียดทรัพยากร",
    elephAdditionalEleph: "เอลเลฟที่ต้องหาเพิ่ม",
    elephWeaponUpgradeEleph: "เอลเลฟสำหรับอัปอาวุธเฉพาะ",
    elephEligmaCost: "เอลลิกมาที่ต้องใช้โดยประมาณ",
    elephWeaponUpgradeLabel: "อัปเกรดอาวุธเฉพาะ",
    skillLevelConfig: "เลเวลสกิล",
    skillExLabel: "สกิล EX",
    skillSkill1: "สกิล 1",
    skillSkill2: "สกิล 2",
    skillSkill3: "สกิล 3",
    skillBd1: "BD ขั้นต่ำ",
    skillBd2: "BD ขั้นกลาง",
    skillBd3: "BD ขั้นสูง",
    skillBd4: "BD ขั้นสูงสุด",
    skillTn1: "ตำราสกิลขั้นต่ำ",
    skillTn2: "ตำราสกิลขั้นกลาง",
    skillTn3: "ตำราสกิลขั้นสูง",
    skillTn4: "ตำราสกิลขั้นสูงสุด",
    skillSecretNotes: "ตำราสกิลลับ",
    skillTotalCredits: "เครดิตรวม",
    skillValidationError: "เลเวลเป้าหมายต้องมากกว่าหรือเท่ากับเลเวลปัจจุบัน",
    skillArtifactNote: "จำนวนวัตถุหลงยุคเป็นค่าประมาณ ชนิดที่ใช้จริงแตกต่างกันไปตามนักเรียน",
    skillOoLow: "วัตถุหลงยุค (ขั้นต่ำ)",
    skillOoHigh: "วัตถุหลงยุค (ขั้นสูง)",
  },
};

export const atkTypeLabels: Record<string, Record<Locale, string>> = {
  explosive: { en: "Explosive", zh: "爆炸", ko: "폭발", ja: "爆発", vi: "Nổ",         th: "ระเบิด" },
  piercing:  { en: "Piercing",  zh: "贯通", ko: "관통", ja: "貫通", vi: "Xuyên giáp", th: "เจาะเกราะ" },
  mystic:    { en: "Mystic",    zh: "神秘", ko: "신비", ja: "神秘", vi: "Huyền bí",   th: "ลึกลับ" },
  sonic:     { en: "Sonic",     zh: "振动", ko: "진동", ja: "振動", vi: "Siêu thanh", th: "สั่นสะเทือน" },
  chemical:  { en: "Chemical",  zh: "化学", ko: "화학", ja: "化学", vi: "Hóa học",    th: "เคมี" },
};

export const bondResourceNames: Record<string, Record<Locale, string>> = {
  checkIn:       { en: "Cafe Check-In",      zh: "咖啡厅摸头",    ko: "카페 체크인",       ja: "カフェ撫で",      vi: "Xoa đầu ở Café",       th: "ลูบหัวในคาเฟ่" },
  mehGift2Star:  { en: "Small 2★ Gift",      zh: "普通2星礼物",   ko: "보통 2성 선물",     ja: "普通2★ギフト",   vi: "Quà 2★ (bình thường)", th: "ของขวัญ 2★ (ธรรมดา)" },
  likeGift2Star: { en: "Normal 2★ Gift",     zh: "喜爱2星礼物",   ko: "좋아하는 2성 선물", ja: "好き2★ギフト",   vi: "Quà 2★ (thích)",       th: "ของขวัญ 2★ (ชอบ)" },
  favorite2Star: { en: "Great 2★ Gift",      zh: "最爱2星礼物",   ko: "최애 2성 선물",     ja: "大好き2★ギフト", vi: "Quà 2★ (rất thích)",   th: "ของขวัญ 2★ (ชอบมาก)" },
  loved2Star:    { en: "Amazing 2★ Gift",    zh: "至爱2星礼物",   ko: "최고 2성 선물",     ja: "最愛2★ギフト",   vi: "Quà 2★ (yêu nhất)",    th: "ของขวัญ 2★ (ชอบที่สุด)" },
  mehGift3Star:  { en: "Small 3★ Gift",      zh: "普通3星礼物",   ko: "보통 3성 선물",     ja: "普通3★ギフト",   vi: "Quà 3★ (bình thường)", th: "ของขวัญ 3★ (ธรรมดา)" },
  likeGift3Star: { en: "Normal 3★ Gift",     zh: "喜爱3星礼物",   ko: "좋아하는 3성 선물", ja: "好き3★ギフト",   vi: "Quà 3★ (thích)",       th: "ของขวัญ 3★ (ชอบ)" },
  favorite3Star: { en: "Great 3★ Gift",      zh: "最爱3星礼物",   ko: "최애 3성 선물",     ja: "大好き3★ギフト", vi: "Quà 3★ (rất thích)",   th: "ของขวัญ 3★ (ชอบมาก)" },
  loved3Star:    { en: "Amazing 3★ Gift",    zh: "至爱3星礼物",   ko: "최고 3성 선물",     ja: "最愛3★ギフト",   vi: "Quà 3★ (yêu nhất)",    th: "ของขวัญ 3★ (ชอบที่สุด)" },
};

export const defTypeLabels: Record<string, Record<Locale, string>> = {
  light:     { en: "Light",     zh: "轻装", ko: "경장", ja: "軽装", vi: "Nhẹ",      th: "เบา" },
  heavy:     { en: "Heavy",     zh: "重装", ko: "중장", ja: "重装", vi: "Nặng",     th: "หนัก" },
  special:   { en: "Special",   zh: "特殊", ko: "특수", ja: "特殊", vi: "Đặc biệt", th: "พิเศษ" },
  elastic:   { en: "Elastic",   zh: "弹性", ko: "탄성", ja: "弾性", vi: "Đàn hồi",  th: "ยืดหยุ่น" },
  composite: { en: "Composite", zh: "复合", ko: "복합", ja: "複合", vi: "Phức hợp", th: "คอมโพสิต" },
};
