[English](README_EN.md)

# AlphaResearch

基于 Playwright 的 AlphaRadar 早期项目研究工具。自动采集 AlphaRadar 项目数据 → 提取 AI 分析 → Frontrun.pro API 验证 KOL 关注数 → 智能筛选早期 Alpha 项目 → 生成项目研究报告。

**设计为可被其他 Agent 直接调用的 Skill，支持自动环境初始化，无需人工干预。**

## 核心功能

- 🔍 **自动采集** AlphaRadar 项目列表（多页翻页）
- 🤖 **提取 AI 分析** 点击 Details 弹窗获取项目 AI 分析作为介绍
- 🚫 **智能剔除** 非项目账号（KOL/交易员/媒体/个人大V 等）
- 📐 **区间过滤** 3 ≤ KOL关注数 ≤ 100（锁定早期 Alpha 项目）
- 📊 **生成报告** 每日早期 Alpha 项目研究报告

## 快速开始

### 一键初始化（Agent 推荐）

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # 自动安装所有依赖
```

### 运行采集

```bash
npm run skill          # 自动检测环境，智能选择运行方式
npm run skill:report   # 采集并输出格式化报告
```

## 筛选流程

```
AlphaRadar 表格逐页采集
    ↓
逐行点击 Details → 提取 AI 分析
    ↓
非项目账号剔除（关键词 + 正则匹配）
    ↓ 剔除 KOL、交易员、博主、媒体号、个人大V
Frontrun.pro API → KOL 关注数
    ↓
区间过滤 3 ≤ KOL ≤ 100
    ↓ 剔除无人关注（< 3）和老项目（> 100）
按 KOL 降序排列，取 Top 20
    ↓
📊 输出每日早期 Alpha 项目报告
```

## 报告示例

```
📊 今日热门项目 (2026-04-06)
筛选条件：3 ≤ KOL关注数 ≤ 100（早期 Alpha 项目）
共计：12 个项目

1、项目名称：Surgexyz_
项目推特：https://x.com/Surgexyz_
项目介绍：下一代创业公司发现层，专注AI独角兽孵化
KOL关注数：93⭐️

2、项目名称：24_Hours_Art
项目推特：https://x.com/24_Hours_Art
项目介绍：数字艺术市场与创意经济平台
KOL关注数：55⭐️
```

## 作为 Skill 被其他 Agent 调用

### 方式一：命令行直接调用

```bash
cd /path/to/alpharesearch && npm run setup && npm run skill
```

### 方式二：Claude Code MCP

```json
{
  "mcpServers": {
    "alpharesearch": {
      "command": "node",
      "args": ["src/mcp.js"],
      "cwd": "/path/to/alpharesearch",
      "env": {
        "FRONTRUN_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 方式三：管道模式

```bash
npm run skill 2>/dev/null | your-agent-process
```

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18 |
| npm | >= 8 |
| Playwright | >= 1.40 |
| Xvfb | 自动安装（Linux 服务器） |

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 一键初始化环境 |
| `npm run skill` | 智能运行采集 |
| `npm run skill:report` | 采集并输出报告 |
| `npm run build` | 编译 TypeScript |
| `npm run prod` | 直接运行（需图形界面） |
| `npm run prod:server` | Xvfb 模式运行 |

## 非项目账号剔除规则

按 handle/name 分词后匹配以下关键词：
> research, analyst, alpha, trader, capital, vc, fund, news, media, daily, kol, host, spaces, podcast, degen, calls, alerts, signal, thread, investor...

正则剔除：0x 地址、.eth 域名、个人前缀（ser/mr/dr）、品牌词（guru/king/master）

## 项目结构

```
alpharesearch/
├── scripts/
│   ├── setup.sh          # 环境初始化
│   └── run.sh            # 智能运行器
├── src/
│   ├── index.ts          # CLI 入口
│   ├── mcp.js            # MCP Server
│   ├── config/           # 配置（扩展列表、路径）
│   ├── collectors/
│   │   └── ScraperCollector/
│   │       ├── index.ts  # Playwright 控制器
│   │       ├── unlockWallet.ts
│   │       └── PageCollector/
│   │           └── AlphaRadar/
│   │               └── index.ts  # 采集 + Details AI 分析提取
│   ├── utils/
│   │   ├── report.ts     # 筛选 + 报告生成
│   │   ├── frontrun.ts   # Frontrun.pro API
│   │   └── ...
│   ├── types/
│   │   └── Scrape.ts     # ProjectInfo 接口
│   └── task/
│       └── scrape.ts     # 采集任务入口
├── extension.zip          # OKX Wallet 扩展
├── package.json
├── tsconfig.json
├── README.md             # 中文文档
└── README_EN.md          # 英文文档
```

## 故障排除

| 问题 | 解决方案 |
|------|---------|
| Chromium 无法启动 | 运行 `npm run setup` 安装系统依赖 |
| 无图形界面 | `scripts/run.sh` 会自动使用 Xvfb |
| Frontrun API 401 | 检查 `FRONTRUN_API_KEY` 环境变量 |
| AlphaRadar 采集失败 | 确保已运行 `npm run unzip` 解压扩展 |
| Details 弹窗提取为空 | 正常现象，会降级使用模板描述 |

## 许可证

MIT

