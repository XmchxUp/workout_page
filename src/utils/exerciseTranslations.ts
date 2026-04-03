// ─────────────────────────────────────────────────────────────────────────────
// Exercise name translations  EN → ZH
// Keys are exact names as they appear in workout data (case-sensitive).
// ─────────────────────────────────────────────────────────────────────────────
export const EXERCISE_CN: Record<string, string> = {
  // ── 胸部 Chest ─────────────────────────────────────────────────────────────
  'Bench Press (Barbell)':            '杠铃卧推',
  'Bench Press (Smith Machine)':      '史密斯卧推',
  'Incline Bench Press (Barbell)':    '上斜杠铃卧推',
  'Incline Bench Press (Dumbbell)':   '上斜哑铃卧推',
  'Incline Chest Press (Machine)':    '上斜胸推机',
  'Decline Bench Press (Barbell)':    '下斜杠铃卧推',
  'Decline Bench Press (Dumbbell)':   '下斜哑铃卧推',
  'Chest Fly (Machine)':              '蝴蝶机夹胸',
  'Chest Fly (Dumbbell)':             '哑铃飞鸟',
  'Cable Fly Crossovers':             '绳索交叉飞鸟',
  'Chest Dip':                        '胸部双杠撑',
  'Bench Dip':                        '凳上三头撑',
  'Push Up':                          '俯卧撑',
  'Pushup':                           '俯卧撑',
  '俯卧撑':                            '俯卧撑',
  'Pec Deck (Machine)':               'PE机夹胸',
  'Chest Press (Machine)':            '胸推机',

  // ── 背部 Back ──────────────────────────────────────────────────────────────
  'Lat Pulldown (Cable)':             '绳索高位下拉',
  'Lat Pulldown (Machine)':           '器械高位下拉',
  'Lat Pulldown (Close Grip)':        '窄握高位下拉',
  'Seated Row (Machine)':             '坐姿划船机',
  'Cable Row (Seated)':               '绳索坐姿划船',
  'Bent Over Row (Barbell)':          '俯身杠铃划船',
  'Bent Over Row (Dumbbell)':         '俯身哑铃划船',
  'One Arm Row (Dumbbell)':           '单臂哑铃划船',
  'Pull Up':                          '引体向上',
  'Pull Up (Assisted)':               '辅助引体向上',
  'Chin Up':                          '正握引体向上',
  'Face Pull':                        '绳索面拉',
  'Deadlift (Barbell)':               '杠铃硬拉',
  'Romanian Deadlift (Barbell)':      '罗马尼亚硬拉',
  'Pullover (Dumbbell)':              '哑铃直臂下拉',
  'Pullover (Machine)':               '器械直臂下拉',
  'T-Bar Row':                        'T杆划船',
  'Rear Delt Reverse Fly (Machine)':  '器械反向飞鸟',

  // ── 肩部 Shoulders ─────────────────────────────────────────────────────────
  'Shoulder Press (Dumbbell)':        '哑铃肩推',
  'Shoulder Press (Barbell)':         '杠铃肩推',
  'Seated Shoulder Press (Machine)':  '坐姿肩推机',
  'Seated Overhead Press (Barbell)':  '坐姿杠铃过头推',
  'Arnold Press (Dumbbell)':          '阿诺德推举',
  'Lateral Raise (Dumbbell)':         '哑铃侧平举',
  'Lateral Raise (Machine)':          '器械侧平举',
  'Lateral Raise (Cable)':            '绳索侧平举',
  'Front Raise (Dumbbell)':           '哑铃前平举',
  'Front Raise (Barbell)':            '杠铃前平举',
  'Upright Row (Barbell)':            '正立杠铃划船',
  'Upright Row (Dumbbell)':           '正立哑铃划船',
  'Military Press (Barbell)':         '军事推举',
  'Shrug (Barbell)':                  '杠铃耸肩',
  'Shrug (Dumbbell)':                 '哑铃耸肩',

  // ── 二头肌 Biceps ──────────────────────────────────────────────────────────
  'Bicep Curl (Dumbbell)':            '哑铃弯举',
  'Bicep Curl (Barbell)':             '杠铃弯举',
  'Bicep Curl (Cable)':               '绳索弯举',
  'Biceps Curl (Dumbbell)':           '哑铃弯举',
  'Biceps Curl (Barbell)':            '杠铃弯举',
  'EZ Bar Biceps Curl':               'EZ杠弯举',
  'Hammer Curl (Dumbbell)':           '锤式弯举',
  'Hammer Curl (Cable)':              '绳索锤式弯举',
  'Preacher Curl (Dumbbell)':         '哑铃牧师弯举',
  'Preacher Curl (Machine)':          '牧师弯举机',
  'Preacher Curl (Barbell)':          '杠铃牧师弯举',
  'Concentration Curl (Dumbbell)':    '专注弯举',
  'Incline Curl (Dumbbell)':          '斜板弯举',

  // ── 三头肌 Triceps ─────────────────────────────────────────────────────────
  'Triceps Pressdown':                '绳索下压',
  'Triceps Rope Pushdown':            '绳索下压',
  'Tricep Pushdown (Cable Bar)':      '直杆下压',
  'Triceps Extension (Dumbbell)':     '哑铃臂屈伸',
  'Overhead Triceps Extension (Cable)': '绳索过头臂屈伸',
  'Overhead Triceps Extension (Dumbbell)': '哑铃过头臂屈伸',
  'Skullcrusher (Barbell)':           '颅骨破碎者',
  'Skullcrusher (Dumbbell)':          '哑铃颅骨破碎',
  'Close Grip Bench Press (Barbell)': '窄握卧推',

  // ── 腹部 Core/Abs ──────────────────────────────────────────────────────────
  'Crunch':                           '卷腹',
  'Crunch (Machine)':                 '卷腹机',
  'Decline Crunch':                   '下斜卷腹',
  'Sit Up':                           '仰卧起坐',
  'Leg Raise':                        '悬挂举腿',
  'Lying Leg Raise':                  '仰卧举腿',
  'Hanging Leg Raise':                '悬挂举腿',
  'Ab Wheel':                         '腹轮训练',
  'Plank':                            '平板支撑',
  'Torso Rotation':                   '躯干旋转',
  'Russian Twist':                    '俄罗斯转体',
  'Cable Crunch':                     '绳索卷腹',

  // ── 腿部 Legs ──────────────────────────────────────────────────────────────
  'Squat (Barbell)':                  '杠铃深蹲',
  'Squat (Smith Machine)':            '史密斯深蹲',
  'Squat (Dumbbell)':                 '哑铃深蹲',
  'Leg Press (Machine)':              '腿举机',
  'Leg Press Horizontal (Machine)':   '水平腿举机',
  'Leg Extension (Machine)':          '腿屈伸机',
  'Seated Leg Curl (Machine)':        '坐姿腿弯举机',
  'Lying Leg Curl (Machine)':         '俯卧腿弯举机',
  'Romanian Deadlift (Dumbbell)':     '哑铃罗马尼亚硬拉',
  'Hack Squat (Machine)':             '哈克深蹲机',
  'Lunge (Dumbbell)':                 '哑铃弓步',
  'Lunge (Barbell)':                  '杠铃弓步',
  'Step Up (Dumbbell)':               '哑铃踏台阶',
  'Calf Raise (Machine)':             '器械提踵',
  'Seated Calf Raise (Machine)':      '坐姿提踵机',
  'Standing Calf Raise':              '站姿提踵',

  // ── 臀部 Glutes ────────────────────────────────────────────────────────────
  'Hip Thrust (Barbell)':             '杠铃臀推',
  'Hip Thrust (Machine)':             '臀推机',
  'Glute Bridge':                     '臀桥',
  'Hip Abduction (Machine)':          '髋外展机',
  'Hip Extension (Machine)':          '髋伸展机',
  'Donkey Kick':                      '驴踢腿',

  // ── 有氧 / 其他 ────────────────────────────────────────────────────────────
  'Treadmill':                        '跑步机',
  'Walking':                          '步行',
  'Hiking':                           '徒步登山',
  'Warm Up':                          '热身',
  'Warm up':                          '热身',
  'warmup':                           '热身',
};

/**
 * Returns the Chinese name for an exercise, or the original name if no
 * translation is found.
 */
export function translateExercise(name: string): string {
  return EXERCISE_CN[name] ?? name;
}

/**
 * Returns true if a Chinese translation exists for this exercise name.
 */
export function hasTranslation(name: string): boolean {
  return name in EXERCISE_CN;
}
