[中文](README.md)

# 🎯 AlphaResearch

> Playwright-based AlphaRadar early-stage project automated research tool

[![GitHub stars](https://img.shields.io/github/stars/ynbtc/alpharesearch?style=social)](https://github.com/ynbtc/alpharesearch/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/Built%20for-OpenClaw-blue)](https://openclaw.ai)

Automatically collects [AlphaRadar](https://alpharadar.io) 7-day project data → fetches Twitter Bio for project descriptions → verifies KOL follower counts via [Frontrun.pro](https://frontrun.pro) API → **3-layer smart filtering** (Handle/Bio/KOL) → generates daily early Alpha project research reports.

**Designed as a Skill for Agents, with automatic environment initialization and zero manual intervention.**

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🔍 **Auto-collect** | AlphaRadar project list within 7d time range (single page) |
| 🐦 **Bio Fetching** | Fetches project Twitter Bio via Cookie as project description |
| 🚫 **3-Layer Filtering** | Handle keyword filter → Bio personal account filter → KOL range filter |
| 📐 **KOL Verification** | Frontrun.pro API, 3 ≤ KOL followers ≤ 100 (targeting early projects) |
| 📊 **Reports** | Auto-generated daily early Alpha project reports |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # Auto-installs all dependencies (Playwright + Chromium + system deps)
```

### 2. Set Environment Variables

```bash
# Twitter auth (required for fetching project Bio)
export TWITTER_AUTH_TOKEN="your_auth_token"
export TWITTER_CT0="your_ct0"

# Frontrun.pro API (required for KOL verification)
export FRONTRUN_API_KEY="your_api_key"
```

> 💡 **Get Twitter Cookie**: Login [x.com](https://x.com) → F12 → Application → Cookies → Copy `auth_token` and `ct0`

### 3. Run

```bash
# Option 1: Via npm script (auto Xvfb)
npm run skill

# Option 2: Quick scan script (recommended, full filtering + Bio + report)
cd alpharesearch
xvfb-run --auto-servernum node full-scan.js
```

---

## 🔄 Filtering Pipeline

```
Load AlphaRadar page
    ↓
Click 7d time range selector
    ↓
Wait for table refresh, collect all projects on current page
    ↓
Layer 1: Handle/Name keyword matching
    ↓ Remove KOLs, traders, bloggers, media accounts
    ↓ Remove 0x addresses, .eth domains, personal prefixes
    ↓
Frontrun.pro API → KOL follower count verification
    ↓
Layer 2: KOL range filter (3 ≤ KOL ≤ 100)
    ↓ Remove no-follower projects (< 3) and established projects (> 100)
    ↓
Twitter Cookie → Fetch project Bio
    ↓
Layer 3: Bio personal account detection
    ↓ Remove founder/co-founder/CEO/CMO
    ↓ Remove KOL bloggers/creators/researchers
    ↓ Remove marketing/advisors/miners
    ↓
Sort by KOL descending, Top 20
    ↓
📊 Output daily early Alpha project report
```

---

## 📊 Report Example

```
📊 Today's Hot Projects (2026-04-16)
Filter: 3 ≤ KOL followers ≤ 100 (Early Alpha Projects)
Total: 12 projects

1. Project: ShiftRWA
   Twitter: https://x.com/ShiftRWA
   Description: Shifting capital markets on-chain with tokenized Stocks and ETFs
   KOL Followers: 45⭐️

2. Project: trex_network
   Twitter: https://x.com/trex_network
   Description: Infrastructure keeping regulated assets compliant across blockchains
   KOL Followers: 15⭐️

3. Project: chatterpay
   Twitter: https://x.com/chatterpay
   Description: Use crypto with just WhatsApp messages
   KOL Followers: 10⭐️
```

---

## 🚫 3-Layer Filtering Rules

### Layer 1: Handle/Name Keyword Filter

Tokenizes handle/name by `_`, `-`, space, then matches:

> research, analyst, alpha, trader, capital, vc, fund, news, media, daily, kol, host, spaces, podcast, degen, calls, alerts, signal, thread, investor...

Regex exclusions: `0x` addresses, `.eth` domains, personal prefixes (`ser/mr/dr`), brand words (`guru/king/master`)

### Layer 2: KOL Range Filter

| KOL Followers | Verdict |
|--------------|---------|
| < 3 | No attention, removed |
| 3 - 100 | ✅ Early Alpha project |
| > 100 | Established project, removed |

### Layer 3: Bio Personal Account Filter

Detects and removes personal accounts via Twitter Bio:

| Type | Keywords |
|------|----------|
| **Titles** | founder, co-founder, CEO, CTO, CMO, director, partner |
| **Personal** | prev, previously, formerly, ex-, growing @, building @ |
| **KOL/Creator** | creator, influencer, blogger, content |
| **Marketing** | marketing, community build, campaign lead, advisor |
| **Miners** | miner, genesis block, contributor |
| **Promo** | ambassador, advocate, evangelist |

---

## 🔧 Use as Agent Skill

### Option 1: CLI

```bash
cd /path/to/alpharesearch
npm run setup
xvfb-run --auto-servernum node full-scan.js
```

### Option 2: MCP Server

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

### Option 3: Pipe Mode

```bash
npm run skill 2>/dev/null | your-agent-process
```

---

## ⚙️ Requirements

| Dependency | Version | Notes |
|-----------|---------|-------|
| Node.js | >= 18 | Runtime |
| npm | >= 8 | Package manager |
| Playwright | >= 1.40 | Browser automation |
| Xvfb | Auto-installed | Linux virtual display |
| twitter-cli | Installed | Fetch Twitter Bio |

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | One-click environment init |
| `npm run skill` | Smart collection run (via Playwright) |
| `npm run build` | Compile TypeScript |
| `npm run unzip` | Extract OKX Wallet extension |
| `node full-scan.js` | Quick scan (recommended, run under xvfb-run) |

---

## 📁 Project Structure

```
alpharesearch/
├── full-scan.js               # ⭐ Quick scan script (recommended entry)
├── scripts/
│   ├── setup.sh               # Environment initialization
│   └── run.sh                 # Smart runner (auto-detect Xvfb)
├── src/
│   ├── index.ts               # CLI entry point
│   ├── mcp.js                 # MCP Server
│   ├── config/                # Config (extension list, paths)
│   ├── collectors/
│   │   └── ScraperCollector/
│   │       ├── index.ts       # Playwright controller
│   │       ├── unlockWallet.ts # OKX Wallet unlock (with retry)
│   │       └── PageCollector/
│   │           └── AlphaRadar/
│   │               └── index.ts  # AlphaRadar 7d single-page collection
│   ├── utils/
│   │   ├── report.ts          # 3-layer filtering + report generation
│   │   ├── frontrun.ts        # Frontrun.pro API
│   │   └── ...
│   ├── types/
│   │   └── Scrape.ts          # ProjectInfo interface
│   └── task/
│       └── scrape.ts          # Collection task entry
├── extension.zip               # OKX Wallet extension package
├── package.json
├── tsconfig.json
├── README.md                   # Chinese documentation
└── README_EN.md                # English documentation (this file)
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Chromium fails to launch | Run `npm run setup` to install system deps |
| No display | Use `xvfb-run` prefix, or use `scripts/run.sh` |
| OKX Wallet unlock timeout | First load takes time; script has built-in 3x retry |
| Frontrun API 401 | Check `FRONTRUN_API_KEY` env variable |
| Twitter Bio fetch fails | Check if `TWITTER_AUTH_TOKEN` and `TWITTER_CT0` are expired |
| AlphaRadar collection empty | Ensure `npm run unzip` has been run |
| Browser process lingering | Run `pkill -9 chromium` then retry |
| SingletonLock conflict | Delete `extension/Chrome/*/SingletonLock` then retry |

---

## 🔒 Privacy & Security

| Item | Handling |
|------|---------|
| Twitter Cookie | Passed via env vars, never hardcoded |
| Frontrun API Key | Passed via env vars, never hardcoded |
| OKX Wallet Password | Local extension unlock only, never transmitted |
| Local Data | `.gitignore` excluded, never uploaded |

---

## 📮 Contact

- **Twitter**: [@yn_btc](https://x.com/yn_btc)
- **GitHub**: [@ynbtc](https://github.com/ynbtc)

---

## 📜 License

[MIT License](LICENSE) — Free to use, modify, and distribute.

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://x.com/yn_btc">yn_btc</a></sub>
</p>
