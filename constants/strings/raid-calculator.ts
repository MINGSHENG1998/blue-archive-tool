import { defineStrings } from './define';

export const raidDifficultyStrings = defineStrings({
  en: { Normal: 'Normal', Hard: 'Hard', VeryHard: 'Very Hard', Hardcore: 'Hardcore', Extreme: 'Extreme', Insane: 'Insane', Torment: 'Torment', Lunatic: 'Lunatic' },
  zh: { Normal: '普通', Hard: '困难', VeryHard: '非常困难', Hardcore: '硬核', Extreme: '极限', Insane: '疯狂', Torment: '折磨', Lunatic: '狂乱' },
  ja: { Normal: 'ノーマル', Hard: 'ハード', VeryHard: 'ベリーハード', Hardcore: 'ハードコア', Extreme: 'エクストリーム', Insane: 'インセイン', Torment: 'トーメント', Lunatic: 'ルナティック' },
  ko: { Normal: '노멀', Hard: '하드', VeryHard: '베리 하드', Hardcore: '하드코어', Extreme: '익스트림', Insane: '인세인', Torment: '토먼트', Lunatic: '루나틱' },
  // vi/th players keep the upper raid tiers in English (Insane, Torment,
  // Lunatic are what guides and Discord call them); only the plain tiers
  // read naturally translated.
  vi: { Normal: 'Thường', Hard: 'Khó', VeryHard: 'Rất khó', Hardcore: 'Hardcore', Extreme: 'Extreme', Insane: 'Insane', Torment: 'Torment', Lunatic: 'Lunatic' },
  th: { Normal: 'ปกติ', Hard: 'ยาก', VeryHard: 'ยากมาก', Hardcore: 'Hardcore', Extreme: 'Extreme', Insane: 'Insane', Torment: 'Torment', Lunatic: 'Lunatic' },
});

// The raid score screen: the live-boss card and its "How it works" sheet.
// Thai keeps the raid mode names English inside a Thai phrase, the way Thai
// players write them.
export const raidCalculatorStrings = defineStrings({
  en: {
    onNow: 'On now', totalAssault: 'Total Assault', grandAssault: 'Grand Assault', multiFloor: 'Final Restriction Release',
    endsIn: 'Ends in {time}', durDays: '{days}d {hours}h', durHours: '{hours}h {minutes}m', durMinutes: '{minutes}m',
    weakTo: '{armor}: weak to {types}', useTimer: 'Use this boss’s timer',
    howScore: 'Score = time bonus + difficulty bonus + HP bonus.', howTime: 'Every second saved is worth more on higher difficulties.', howLive: 'The boss on now sets the timer for you.', timers: 'Boss timers',
  },
  zh: {
    onNow: '正在进行', totalAssault: '总力战', grandAssault: '大决战', multiFloor: '制约解除决战',
    endsIn: '{time}后结束', durDays: '{days}天{hours}小时', durHours: '{hours}小时{minutes}分', durMinutes: '{minutes}分钟',
    weakTo: '{armor}：克制属性 {types}', useTimer: '使用该首领的时限',
    howScore: '分数 = 时间分 + 难度分 + 血量分。', howTime: '难度越高，每节省一秒加分越多。', howLive: '当前首领会自动设定时限。', timers: '首领时限',
  },
  ja: {
    onNow: '開催中', totalAssault: '総力戦', grandAssault: '大決戦', multiFloor: '制約解除決戦',
    endsIn: '残り{time}', durDays: '{days}日{hours}時間', durHours: '{hours}時間{minutes}分', durMinutes: '{minutes}分',
    weakTo: '{armor}：有効な攻撃 {types}', useTimer: 'このボスの制限時間を使う',
    howScore: 'スコア = 時間スコア + 難易度スコア + HPスコア。', howTime: '難易度が高いほど、短縮した1秒の価値が上がります。', howLive: '開催中のボスに合わせて制限時間を自動で設定します。', timers: 'ボスの制限時間',
  },
  ko: {
    onNow: '진행 중', totalAssault: '총력전', grandAssault: '대결전', multiFloor: '제약해제결전',
    endsIn: '{time} 후 종료', durDays: '{days}일 {hours}시간', durHours: '{hours}시간 {minutes}분', durMinutes: '{minutes}분',
    weakTo: '{armor}: 유효 공격 {types}', useTimer: '이 보스의 제한 시간 사용',
    howScore: '점수 = 시간 점수 + 난이도 점수 + HP 점수.', howTime: '난이도가 높을수록 1초 단축의 가치가 커집니다.', howLive: '진행 중인 보스에 맞춰 제한 시간을 자동으로 설정합니다.', timers: '보스 제한 시간',
  },
  vi: {
    onNow: 'Đang diễn ra', totalAssault: 'Tổng lực chiến', grandAssault: 'Đại quyết chiến', multiFloor: 'Quyết chiến giải trừ hạn chế',
    endsIn: 'Kết thúc sau {time}', durDays: '{days} ngày {hours} giờ', durHours: '{hours} giờ {minutes} phút', durMinutes: '{minutes} phút',
    weakTo: '{armor}: yếu trước {types}', useTimer: 'Dùng thời gian của boss này',
    howScore: 'Điểm = điểm thời gian + điểm độ khó + điểm HP.', howTime: 'Độ khó càng cao, mỗi giây tiết kiệm càng có giá trị.', howLive: 'Boss đang diễn ra sẽ tự đặt thời gian giúp bạn.', timers: 'Thời gian của boss',
  },
  th: {
    onNow: 'กำลังจัดอยู่', totalAssault: 'ศึก Total Assault', grandAssault: 'ศึก Grand Assault', multiFloor: 'ศึก Final Restriction Release',
    endsIn: 'สิ้นสุดใน {time}', durDays: '{days} วัน {hours} ชม.', durHours: '{hours} ชม. {minutes} นาที', durMinutes: '{minutes} นาที',
    weakTo: '{armor}: แพ้ทาง {types}', useTimer: 'ใช้เวลาของบอสตัวนี้',
    howScore: 'คะแนน = โบนัสเวลา + โบนัสความยาก + โบนัส HP', howTime: 'ยิ่งความยากสูง ทุกวินาทีที่ประหยัดได้ยิ่งมีค่า', howLive: 'บอสที่กำลังจัดอยู่จะตั้งเวลาให้อัตโนมัติ', timers: 'เวลาของบอส',
  },
});
