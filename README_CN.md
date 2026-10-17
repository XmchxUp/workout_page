# Workout Page

[English](./README.md)

把你的 [Hevy](https://hevy.com) 训练记录变成数据分析站：训练日历、PR 追踪、肌肉热力图、负荷曲线、成就徽章和年度总结。

在线演示：https://xmchxup.github.io/workout_page/

## 快速开始

需要 Node.js 20+、pnpm，以及 Python 3.11+（仅数据同步时需要）。

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/workout_page.git
cd workout_page
```

### 2. 导出 Hevy 数据

按账号类型三选一，三种方式都会生成 `src/static/workouts.json`。

**Hevy Pro 或 API Key。** 从 [hevy.com/settings](https://hevy.com/settings) 的 Developer 区复制 Key，然后运行：

```bash
pip install -r requirements.txt
python scripts/hevy_api_sync.py 你的API_KEY --output src/static/workouts.json --tz-offset 8
```

之后加 `--incremental` 只拉取新增训练。

**Hevy 免费版。** 用无头浏览器自动完成 [hevy.com/settings?export](https://hevy.com/settings?export) 的 CSV 导出流程：

```bash
pip install -r requirements.txt
playwright install chromium --with-deps
python scripts/hevy_web_export.py 你的邮箱 你的密码 --output src/static/workouts.json --tz-offset 8
```

**手动导出 CSV。** 从 [hevy.com/settings?export](https://hevy.com/settings?export) 下载 CSV 后转换：

```bash
python scripts/workout_sync.py --input ~/Downloads/hevy_workouts.csv --output src/static/workouts.json --tz-offset 8
```

`--tz-offset` 把 UTC 时间换算为本地时间（北京用 `8`，东京用 `9`，纽约冬令时用 `-5`）。`workout_sync.py` 自动识别 Hevy 和 Strong 格式，也可用 `--source hevy` 或 `--source strong` 手动指定。

### 3. 运行

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:5173](http://localhost:5173)。其他脚本：`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm preview`。

## 配置

界面语言：改 `src/components/workout/WorkoutUI.tsx` 里的 `IS_CHINESE` 开关。动作中文名在 `src/utils/exerciseTranslations.ts` 的 `EXERCISE_CN` 映射表里维护。

站点标题、Logo 和简介：改 `src/static/site-metadata.ts`。

## 自动同步

`.github/workflows/sync.yml` 每天 UTC 01:00 自动同步数据并重新部署到 GitHub Pages（不需要 `gh-pages` 分支）。

1. 仓库 Settings 里把 Pages 源设为 GitHub Actions。
2. Settings、Actions、General 里给 Workflow 开读写权限。
3. 加 Secrets：Pro 或 API 用户加 `HEVY_API_KEY`，免费版加 `HEVY_EMAIL` 和 `HEVY_PASSWORD`。有 `HEVY_API_KEY` 时会自动跳过免费版步骤。
4. 把 workflow 里两处 `--tz-offset 8` 改成你的时区。
5. 去 Actions、Sync and Deploy 手动跑一次。

完成后站点地址是 `https://YOUR_USERNAME.github.io/workout_page/`。

## License

MIT
