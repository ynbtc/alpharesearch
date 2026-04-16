[English](README_EN.md)

# 🎯 AlphaResearch

> 基于 Playwright 的 AlphaRadar 早期项目自动化研究工具

[![GitHub stars](https://img.shields.io/github/stars/ynbtc/alpharesearch?style=social)](https://github.com/ynbtc/alpharesearch/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/Built%20for-OpenClaw-blue)](https://openclaw.ai)

自动采集 [AlphaRadar](https://alpharadar.io) 7 天内的项目数据 → Twitter Bio 获取项目介绍 → [Frontrun.pro](https://frontrun.pro) API 验证 KOL 关注数 → **三层智能过滤**（Handle/Bio/KOL）→ 生成每日早期 Alpha 项目研究报告。

**设计为可被其他 Agent 直接调用的 Skill，支持自动环境初始化，无需人工干预。**

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🔍 **自动采集** | AlphaRadar 7d 时间范围内的项目列表（单页采集） |
| 🐦 **Bio 获取** | 通过 Twitter Cookie 抓取项目主页 Bio 作为中文介绍 |
| 🚫 **三层过滤** | Handle 关键词过滤 → Bio 个人账号过滤 → KOL 区间过滤 |
| 📐 **KOL 验证** | Frontrun.pro API 验证，3 ≤ KOL 关注数 ≤ 100（锁定早期项目） |
| 📊 **中文报告** | 自动生成每日早期 Alpha 项目中文研究报告 |

---

## 🚀 快速开始

### 1. 克隆 & 安装

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # 自动安装所有依赖（Playwright + Chromium + 系统依赖）
```

### 2. 配置环境变量

```bash
# Twitter 认证（必需，用于获取项目 Bio）
export TWITTER_AUTH_TOKEN="your_auth_token"
export TWITTER_CT0="your_ct0"

# Frontrun.pro API（必需，用于 KOL 验证）
export FRONTRUN_API_KEY="your_api_key"
```

> 💡 **获取 Twitter Cookie**：登录 [x.com](https://x.com) → F12 → Application → Cookies → 复制 `auth_token` 和 `ct0`

### 3. 运行

```bash
# 方式一：通过 npm 脚本运行（自动使用 Xvfb）
npm run skill

# 方式二：快速采集脚本（推荐，包含完整过滤 + Bio + 中文报告）
cd alpharesearch
xvfb-run --auto-servernum node full-scan.js
```

---

## 🔄 筛选流程

```
AlphaRadar 页面加载
    ↓
点击 7d 时间范围筛选器
    ↓
等待表格刷新，采集当前页所有项目
    ↓
第一层过滤：Handle/Name 关键词匹配
    ↓ 剔除 KOL、交易员、博主、媒体号
    ↓ 剔除 0x 地址、.eth 域名、个人前缀
    ↓
Frontrun.pro API → KOL 关注数验证
    ↓
第二层过滤：KOL 区间 3 ≤ KOL ≤ 100
    ↓ 剔除无人关注（< 3）和已建立项目（> 100）
    ↓
Twitter Cookie → 获取项目 Bio
    ↓
第三层过滤：Bio 个人账号识别
    ↓ 剔除 founder/co-founder/CEO/CMO
    ↓ 剔除 KOL 博主/认证创作者/投研
    ↓ 剔除 营销/顾问/矿工等个人身份
    ↓
按 KOL 降序排列，取 Top 20
    ↓
📊 输出每日早期 Alpha 项目中文报告
```

---

## 📊 报告示例

```
📊 今日热门项目 (2026-04-16)
筛选条件：3 ≤ KOL关注数 ≤ 100（早期 Alpha 项目）
共计：12 个项目

1、项目名称：ShiftRWA
项目推特：https://x.com/ShiftRWA
项目介绍：将资本市场搬上链，推出代币化股票和ETF
KOL关注数：45⭐️

2、项目名称：trex_network
项目推特：https://x.com/trex_network
项目介绍：让受监管资产在每条区块链上保持合规的基础设施
KOL关注数：15⭐️

3、项目名称：chatterpay
项目推特：https://x.com/chatterpay
项目介绍：通过 WhatsApp 消息即可使用加密货币的支付工具
KOL关注数：10⭐️
```

---

## 🚫 三层过滤规则

### 第一层：Handle/Name 关键词过滤

按 handle/name 以 `_`、`-`、空格分词后逐词匹配：

> research, analyst, alpha, trader, capital, vc, fund, news, media, daily, kol, host, spaces, podcast, degen, calls, alerts, signal, thread, investor...

正则剔除：`0x` 地址、`.eth` 域名、个人前缀（`ser/mr/dr`）、品牌词（`guru/king/master`）

### 第二层：KOL 区间过滤

| KOL 关注数 | 判定 |
|-----------|------|
| < 3 | 无人关注，剔除 |
| 3 - 100 | ✅ 早期 Alpha 项目 |
| > 100 | 已建立项目，剔除 |

### 第三层：Bio 个人账号过滤

通过 Twitter Bio 识别并剔除个人账号：

| 类型 | 匹配关键词 |
|------|-----------|
| **职位/头衔** | founder, co-founder, CEO, CTO, CMO, COO, director, partner |
| **个人描述** | prev, previously, formerly, ex-, growing @, building @ |
| **KOL/博主** | 认证创作者, 投研, 资讯分享, 博主, creator, influencer |
| **营销/社区** | marketing, community build, campaign lead, advisor |
| **矿工/早期** | miner, genesis block, contributor |
| **返佣/推广** | 返佣, 邀请码, 大使, ambassador |

---

## 🔧 作为 Skill 被其他 Agent 调用

### 方式一：命令行直接调用

```bash
cd /path/to/alpharesearch
npm run setup
xvfb-run --auto-servernum node full-scan.js
```

### 方式二：MCP Server

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

---

## ⚙️ 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | 运行时 |
| npm | >= 8 | 包管理 |
| Playwright | >= 1.40 | 浏览器自动化 |
| Xvfb | 自动安装 | Linux 服务器虚拟显示 |
| twitter-cli | 已安装 | 获取 Twitter Bio |

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 一键初始化环境 |
| `npm run skill` | 智能运行采集（通过 Playwright） |
| `npm run build` | 编译 TypeScript |
| `npm run unzip` | 解压 OKX Wallet 扩展 |
| `node full-scan.js` | 快速采集（推荐，需在 xvfb-run 下运行） |

---

## 📁 项目结构

```
alpharesearch/
├── full-scan.js               # ⭐ 快速采集脚本（推荐入口）
├── scripts/
│   ├── setup.sh               # 环境初始化
│   └── run.sh                 # 智能运行器（自动检测 Xvfb）
├── src/
│   ├── index.ts               # CLI 入口
│   ├── mcp.js                 # MCP Server
│   ├── config/                # 配置（扩展列表、路径）
│   ├── collectors/
│   │   └── ScraperCollector/
│   │       ├── index.ts       # Playwright 控制器
│   │       ├── unlockWallet.ts # OKX Wallet 解锁（含重试）
│   │       └── PageCollector/
│   │           └── AlphaRadar/
│   │               └── index.ts  # AlphaRadar 7d 单页采集
│   ├── utils/
│   │   ├── report.ts          # 三层过滤 + 报告生成
│   │   ├── frontrun.ts        # Frontrun.pro API
│   │   └── ...
│   ├── types/
│   │   └── Scrape.ts          # ProjectInfo 接口
│   └── task/
│       └── scrape.ts          # 采集任务入口
├── extension.zip               # OKX Wallet 扩展包
├── package.json
├── tsconfig.json
├── README.md                   # 中文文档（本文件）
└── README_EN.md                # 英文文档
```

---

## 🐛 故障排除

| 问题 | 解决方案 |
|------|---------|
| Chromium 无法启动 | 运行 `npm run setup` 安装系统依赖 |
| 无图形界面 | 使用 `xvfb-run` 前缀运行，或用 `scripts/run.sh` |
| OKX Wallet 解锁超时 | 首次需等待较长时间加载，脚本已内置 3 次重试 |
| Frontrun API 401 | 检查 `FRONTRUN_API_KEY` 环境变量 |
| Twitter Bio 获取失败 | 检查 `TWITTER_AUTH_TOKEN` 和 `TWITTER_CT0` 是否过期 |
| AlphaRadar 采集为空 | 确保已运行 `npm run unzip` 解压扩展 |
| 浏览器进程残留 | 运行 `pkill -9 chromium` 清理后重试 |
| SingletonLock 冲突 | 删除 `extension/Chrome/*/SingletonLock` 后重试 |

---

## 🔒 隐私与安全

| 项目 | 处理方式 |
|------|---------|
| Twitter Cookie | 环境变量传入，不硬编码 |
| Frontrun API Key | 环境变量传入，不硬编码 |
| OKX Wallet 密码 | 仅用于本地扩展解锁，不传输 |
| 本地数据 | `.gitignore` 排除，不上传 |

---

## 📮 联系作者

- **Twitter**: [@yn_btc](https://x.com/yn_btc)
- **GitHub**: [@ynbtc](https://github.com/ynbtc)

---

## 📜 许可证

[MIT License](LICENSE) — 自由使用、修改和分发

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://x.com/yn_btc">yn_btc</a></sub>
</p>
