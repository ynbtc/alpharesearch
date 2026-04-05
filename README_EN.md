[中文](README.md)

# AlphaResearch

A Playwright-based AlphaRadar early-stage project research tool. Automatically collects AlphaRadar project data → verifies KOL follower counts via Frontrun.pro API → generates project research reports.

**Designed to be called directly by other Agents as a Skill, with automatic environment initialization requiring no manual intervention.**

## Quick Start

### One-Click Initialization (Recommended for Agents)

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # Automatically installs all dependencies (Xvfb, Chromium system libs, npm packages)
```

### Run Collection

```bash
npm run skill          # Auto-detect environment, smart selection of run mode
npm run skill:report   # Collect and output formatted report
```

`scripts/run.sh` automatically detects the runtime environment:
- **With GUI**: Launch browser directly
- **Without GUI (server)**: Automatically install and use Xvfb virtual display
- **Missing dependencies**: Automatically install xvfb and Chromium system libraries

## Calling as a Skill from Other Agents

### Method 1: Direct Command Line

Any Agent only needs to execute the following command to complete the entire research workflow:

```bash
cd /path/to/alpharesearch && npm run setup && npm run skill
```

The `setup` script is idempotent — running it multiple times will not reinstall.

### Method 2: Claude Code MCP

Add to your Claude Code config file:

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

Config file locations:
- macOS: `~/Library/Application Support/Claude/settings.json`
- Linux: `~/.config/claude/settings.json`

### Method 3: Command Line Pipe

```bash
# Output JSON data, consumable by other programs
npm run skill 2>/dev/null

# Pipe to Claude Code
npm run prod:claude
```

## Workflow

```
Agent calls npm run skill
    ↓
scripts/run.sh detects environment
    ↓ No GUI? Auto install/start Xvfb
Playwright + OKX Wallet Extension
    ↓ Open browser, load wallet extension
Collect alpharadar.io/twitter
    ↓ Parse DOM, paginate up to 50 pages
Frontrun.pro API Verification
    ↓ Verify KOL follower count per project
Filter + Sort
    ↓ Projects with KOL ≥ 3, sorted by follower count
Output JSON / Generate Report
```

## Requirements

- Node.js >= 18.0.0
- Linux / macOS (Windows does not support automatic Xvfb installation)

No manual system dependency installation needed in server environments — `npm run setup` handles everything automatically.

## All Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | One-click environment initialization (run on first Agent call) |
| `npm run skill` | Smart collection (auto-detect environment, recommended) |
| `npm run skill:report` | Collect and output formatted JSON report |
| `npm run prod` | Local collection (requires GUI or DISPLAY set) |
| `npm run prod:server` | Server collection (requires Xvfb installed) |
| `npm run prod:claude` | Pipe output to Claude Code |
| `npm run build` | Compile TypeScript |
| `npm run clean` | Clean build artifacts |
| `npm run zip` | Package extension data |
| `npm run unzip` | Unpack extension data |

## MCP Tools

| Tool | Function |
|------|----------|
| `collect_alpharadar_projects` | Collect AlphaRadar projects |
| `verify_kol_followers` | Verify KOL follower counts |
| `generate_project_report` | Generate research report |

## CLI Parameters

```
scraper run-task
  --filter <type>          Filter: all / early-stage / high-score (default: all)
  --min-kol <number>       Minimum KOL followers (default: 3)
  --headless <bool>        Headless mode (default: true)
  --max-pages <number>     Maximum pages to collect (default: 50)
```

## Project Structure

```
alpharesearch/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── mcp.js                # MCP Server (Claude Code integration)
│   ├── collectors/           # Collectors
│   ├── task/                 # Task logic (scrape, zip, unzip)
│   ├── utils/                # Utilities (report, frontrun)
│   ├── config/               # Configuration
│   ├── lib/                  # Library files
│   ├── registry/             # Registry
│   └── types/                # TypeScript type definitions
├── scripts/
│   ├── setup.sh              # One-click environment setup script
│   └── run.sh                # Smart run script
├── extension.zip             # OKX Wallet extension (archive)
├── package.json
├── tsconfig.json
└── .gitignore
```

## Troubleshooting

**Problem**: `xvfb-run: command not found`
**Solution**: Run `npm run setup` or `sudo apt-get install -y xvfb`

**Problem**: Chromium fails to start
**Solution**: Run `npx playwright install --with-deps chromium`

**Problem**: Empty data collected
**Solution**: Check `/tmp/alpharesearch-debug.png` screenshot to confirm the page loaded correctly

**Problem**: Frontrun API returns 401
**Solution**: Check the `FRONTRUN_API_KEY` environment variable

## License

MIT
