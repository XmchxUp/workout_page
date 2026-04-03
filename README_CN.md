# Workout Page

[English](./README.md)

将你的 [Hevy](https://hevy.com) 训练记录转化为一个完整的数据分析站点。

**目前只支持 Hevy 作为数据来源。**

## 在线演示

> https://xmchxup.github.io/workout_page/

---

## 功能面板

| 面板 | 说明 |
|---|---|
| 训练日历 | 年度热力图 + 螺旋视图，展示训练频率 |
| 训练记录表 | 完整训练日志，可展开查看每个动作详情 |
| 成就系统 | 60+ 枚徽章，包括连续训练、总量里程碑、PR、特殊日期等 |
| 肌肉覆盖 | 六边形雷达图，显示各肌群训练量及平衡评分（S/A/B/C）|
| 肌群分布 | 按肌群分类的甜甜圈图 |
| PR 墙 | 所有动作的历史最佳成绩 |
| 1RM 追踪 | 基于 Epley 公式估算的最大单次重量变化曲线 |
| E1RM 对比 | 多动作力量进步对比 |
| 训练负荷 | ATL/CTL/TSB 体能–疲劳–状态曲线 |
| 恢复评分 | 基于近期负荷估算的恢复状态 |
| 训练心跳 | 训练时间线，展示容量与强度 |
| 高光时刻 | 近期最佳组次和 PR |
| 容量地标 | 各肌群的 MEV/MAV/MRV 里程碑 |
| 疲劳曲线 | 单次训练内逐组表现变化 |
| 周期对比 | 月/季/年同比分析 |
| 与自己对比 | 自选时间窗口的横向对比 |
| 动作共现矩阵 | 哪些动作经常出现在同一次训练中 |
| 训练建议 | 基于历史数据的下次训练建议 |
| 年度总结 | Spotify Wrapped 风格的年度回顾 |

---

## 本地快速开始

### 环境要求

- Node.js ≥ 20
- pnpm（`npm install -g pnpm`）
- Python 3.11+（仅数据同步时需要）

### 第一步：Fork 或 Clone 本仓库

```bash
git clone https://github.com/YOUR_USERNAME/workout_page.git
cd workout_page
```

### 第二步：导出 Hevy 数据

根据你的 Hevy 账号类型选择对应方式：

#### 方式 A — Hevy Pro / 开发者 API Key

1. 前往 [hevy.com/settings](https://hevy.com/settings)，滚动到 **Developer** 区域，复制你的 API Key。
2. 运行：

```bash
pip install requests
python scripts/hevy_api_sync.py 你的API_KEY \
  --output src/static/workouts.json \
  --tz-offset 8          # 修改为你的 UTC 偏移，例如中国大陆为 8
```

脚本会拉取所有训练记录并写入 `src/static/workouts.json`。

后续只同步新增训练（增量模式）：

```bash
python scripts/hevy_api_sync.py 你的API_KEY \
  --output src/static/workouts.json \
  --incremental \
  --tz-offset 8
```

#### 方式 B — Hevy 免费版（浏览器自动化）

免费账号可以从 [hevy.com/settings?export](https://hevy.com/settings?export) 导出 CSV。此脚本用无头浏览器自动完成这一流程。

```bash
pip install requests playwright
playwright install chromium --with-deps

python scripts/hevy_web_export.py 你的邮箱 你的密码 \
  --output src/static/workouts.json \
  --tz-offset 8
```

#### 方式 C — 手动导出 CSV

1. 在浏览器中打开 [hevy.com/settings?export](https://hevy.com/settings?export)。
2. 点击 **Export Workout Data**，下载 CSV 文件。
3. 转换为 JSON：

```bash
python scripts/workout_sync.py \
  --input ~/Downloads/hevy_workouts.csv \
  --output src/static/workouts.json \
  --tz-offset 8
```

### 第三步：启动开发服务器

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:5173](http://localhost:5173)。

---

## 配置说明

### 界面语言

打开 `src/components/workout/WorkoutUI.tsx`，修改第 3 行：

```ts
export const IS_CHINESE = true;   // true = 中文标签，false = 英文标签
```

动作名称翻译由 `src/utils/exerciseTranslations.ts` 中的 `EXERCISE_CN` 映射表维护，可在此添加或覆盖条目。

### 时区偏移

所有同步脚本都支持 `--tz-offset 小时数` 参数，用于将 Hevy API 返回的 UTC 时间转换为本地时间后写入 `workouts.json`。

| 地区 | 参数值 |
|---|---|
| 中国大陆 / 新加坡（UTC+8）| `--tz-offset 8` |
| 日本 / 韩国（UTC+9）| `--tz-offset 9` |
| 英国夏令时（UTC+1）| `--tz-offset 1` |
| 美国东部冬令时（UTC-5）| `--tz-offset -5` |

### 站点标题、Logo 和导航

编辑 `src/static/site-metadata.ts`：

```ts
const data = {
  siteTitle: 'Workout Page',           // 浏览器标签页标题
  siteUrl: '/',                        // 站点根路径
  logo: 'https://...',                 // 头像图片地址
  description: '我的训练看板',
  navLinks: [],                        // 如需添加导航链接，在此配置
};
```

---

## GitHub Actions 自动同步

仓库内置的工作流（`.github/workflows/sync.yml`）每天 UTC 01:00 自动同步 Hevy 数据并重新部署站点。工作流使用官方 GitHub Pages 部署方式，无需 `gh-pages` 分支，站点路径前缀会自动从仓库名获取。

### 配置步骤

#### 1. 开启 GitHub Pages

在仓库中：**Settings → Pages → Source → GitHub Actions**。

#### 2. 开启 Actions 写权限

在仓库中：**Settings → Actions → General → Workflow permissions → Read and write permissions**（工作流提交数据更新和部署 Pages 均需要此权限）。

#### 3. 添加 Secrets

前往 **Settings → Secrets and variables → Actions → New repository secret**。

**如果你有 Hevy Pro / API 访问权限：**

| Secret 名称 | 值 |
|---|---|
| `HEVY_API_KEY` | hevy.com/settings 中的 API Key |

**如果你使用免费版：**

| Secret 名称 | 值 |
|---|---|
| `HEVY_EMAIL` | Hevy 账号邮箱 |
| `HEVY_PASSWORD` | Hevy 账号密码 |

> 只需设置其中一组。若 `HEVY_API_KEY` 已存在，则免费版步骤会自动跳过。

#### 4. 调整时区偏移

打开 `.github/workflows/sync.yml`，将两个同步步骤中的 `--tz-offset 8` 改为你的时区偏移值。

#### 5. 触发首次运行

前往 **Actions → Sync & Deploy → Run workflow**。

工作流完成后，站点将部署至 `https://YOUR_USERNAME.github.io/workout_page/`。

---

## 项目结构

```
workout_page/
├── scripts/
│   ├── hevy_api_sync.py      # Hevy Pro/API → workouts.json
│   ├── hevy_web_export.py    # Hevy 免费版 CSV 导出 → workouts.json
│   └── workout_sync.py       # 解析 Hevy CSV → workouts.json
├── src/
│   ├── components/
│   │   ├── workout/          # 19 个数据面板组件
│   │   ├── WorkoutCalendar/  # 热力图 + 螺旋日历
│   │   ├── WorkoutTable/     # 训练记录表格
│   │   ├── Header/           # 顶部导航栏（含主题切换）
│   │   └── Layout/           # 页面布局容器
│   ├── hooks/
│   │   ├── useWorkouts.ts    # 加载并暴露 workouts.json 数据
│   │   └── useTheme.ts       # 深色 / 浅色主题
│   ├── pages/
│   │   └── workouts.tsx      # 主页面
│   ├── static/
│   │   └── workouts.json     # 训练数据（由脚本生成）
│   ├── types/
│   │   └── workout.ts        # TypeScript 类型定义
│   └── utils/
│       ├── workoutCalcs.ts       # E1RM、连续训练天数、容量、PR 等计算
│       ├── workoutMuscles.ts     # 肌群映射与雷达图数据
│       └── exerciseTranslations.ts  # 动作名称中英对照表
├── .github/workflows/sync.yml   # 每日同步 + 部署工作流
├── requirements.txt             # Python 依赖（requests）
└── package.json
```

---

## 数据格式参考

`src/static/workouts.json` 是 `WorkoutSession` 对象数组，通常由脚本自动生成，无需手动编辑。格式如下：

```ts
interface WorkoutSession {
  id: string;                  // 12 位 hash，自动生成
  title: string;               // 例如 "Push Day"
  start_time: string;          // "YYYY-MM-DDTHH:MM:SS"
  end_time: string;
  duration_seconds: number;
  description: string;
  source: "hevy";
  exercises: WorkoutExercise[];
  total_volume_kg: number;     // 本次训练总容量（kg）
  total_sets: number;          // 有效组数
  exercise_count: number;      // 动作数量
}

interface WorkoutExercise {
  name: string;                // 例如 "Bench Press (Barbell)"
  notes: string;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  index: number;
  type: "normal" | "warmup" | "dropset" | "failure";
  weight_kg?: number;
  reps?: number;
  distance_km?: number;
  duration_seconds?: number;
  rpe?: number;
}
```

---

## 技术栈

| 层级 | 库 |
|---|---|
| UI 框架 | React 18 + TypeScript |
| 构建工具 | Vite 7 |
| 图表 | Recharts 2 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 6 |
| 数据同步 | Python 3.11 + requests / playwright |

---

## License

MIT
