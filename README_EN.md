[中文](README.md)

# AlphaResearch

A Playwright-based AlphaRadar early-stage project research tool. Automatically collects AlphaRadar project data → extracts AI analysis → verifies KOL follower counts via Frontrun.pro API → intelligently filters early Alpha projects → generates project research reports.

**Designed to be invoked directly by other Agents as a Skill, with automatic environment initialization requiring no manual intervention.**

## Core Features

- 🔍 **Auto-collect** AlphaRadar project lists (multi-page pagination)
- 🤖 **Extract AI analysis** by clicking Details popups to obtain project AI descriptions
- 🚫 **Smart filtering** of non-project accounts (KOLs/traders/media/individual influencers, etc.)
- 📐 **Range filtering** 3 ≤ KOL followers ≤ 100 (targeting early Alpha projects)
- 📊 **Generate reports** daily early Alpha project research reports

## Quick Start

### One-click Initialization (Recommended for Agents)

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # Automatically installs all dependencies
```

### Run Collection

```bash
npm run skill          # Auto-detect environment, smart run mode
npm run skill:report   # Collect and output formatted report
```

## Filtering Pipeline

```
AlphaRadar table page-by-page collection
    ↓
Click Details row by row → Extract AI analysis
    ↓
Non-project account filtering (keyword + regex matching)
    ↓ Remove KOLs, traders, bloggers, media accounts, individual influencers
Frontrun.pro API → KOL follower count
    ↓
Range filter 3 ≤ KOL ≤ 100
    ↓ Remove no-follower projects (< 3) and established projects (> 100)
Sort by KOL descending, Top 20
    ↓
📊 Output daily early Alpha project report
```

## Report Example

```
📊 Today's Hot Projects (2026-04-06)
Filter: 3 ≤ KOL followers ≤ 100 (Early Alpha Projects)
Total: 12 projects

1. Project: Surgexyz_
   Twitter: https://x.com/Surgexyz_
   Description: Next-gen startup discovery layer focused on AI unicorn incubation
   KOL Followers: 93⭐️

2. Project: 24_Hours_Art
   Twitter: https://x.com/24_Hours_Art
   Description: Digital art marketplace and creative economy platform
   KOL Followers: 55⭐️
```

## Invoking as a Skill from Other Agents

### Option 1: Direct CLI

```bash
cd /path/to/alpharesearch && npm run setup && npm run skill
```

### Option 2: Claude Code MCP

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

## Requirements

| Dependency | Version |
|-----------|---------|
| Node.js | >= 18 |
| npm | >= 8 |
| Playwright | >= 1.40 |
| Xvfb | Auto-installed (Linux servers) |

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | One-click environment initialization |
| `npm run skill` | Smart collection run |
| `npm run skill:report` | Collect and output report |
| `npm run build` | Compile TypeScript |
| `npm run prod` | Direct run (requires display) |
| `npm run prod:server` | Xvfb mode run |

## Non-Project Account Filtering Rules

Tokens from handle/name are matched against these keywords:
> research, analyst, alpha, trader, capital, vc, fund, news, media, daily, kol, host, spaces, podcast, degen, calls, alerts, signal, thread, investor...

Regex exclusions: 0x addresses, .eth domains, personal prefixes (ser/mr/dr), brand words (guru/king/master)

## Project Structure

```
alpharesearch/
├── scripts/
│   ├── setup.sh          # Environment initialization
│   └── run.sh            # Smart runner
├── src/
│   ├── index.ts          # CLI entry point
│   ├── mcp.js            # MCP Server
│   ├── config/           # Config (extension list, paths)
│   ├── collectors/
│   │   └── ScraperCollector/
│   │       ├── index.ts  # Playwright controller
│   │       ├── unlockWallet.ts
│   │       └── PageCollector/
│   │           └── AlphaRadar/
│   │               └── index.ts  # Collection + Details AI analysis extraction
│   ├── utils/
│   │   ├── report.ts     # Filtering + report generation
│   │   ├── frontrun.ts   # Frontrun.pro API
│   │   └── ...
│   ├── types/
│   │   └── Scrape.ts     # ProjectInfo interface
│   └── task/
│       └── scrape.ts     # Collection task entry
├── extension.zip          # OKX Wallet extension
├── package.json
├── tsconfig.json
├── README.md             # Chinese documentation
└── README_EN.md          # English documentation
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chromium fails to launch | Run `npm run setup` to install system dependencies |
| No display environment | `scripts/run.sh` automatically uses Xvfb |
| Frontrun API 401 | Check `FRONTRUN_API_KEY` environment variable |
| AlphaRadar collection fails | Ensure `npm run unzip` has been run to extract extension |
| Details popup extraction empty | Normal behavior, falls back to template description |

## License

MIT
