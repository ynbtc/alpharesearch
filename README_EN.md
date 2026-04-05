[中文](README.md)

# AlphaResearch

A Playwright-based AlphaRadar early-stage project research tool. Automatically collects AlphaRadar project data → validates KOL follower counts via Frontrun.pro API → generates project research reports.

**Designed to be called directly as a Skill by other Agents, with automatic environment initialization.**

## Quick Start

### One-click Initialization (Recommended for Agents)

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # Automatically installs all dependencies (Xvfb, Chromium system libs, npm packages)
```

### Run Collection

```bash
npm run skill          # Auto-detects environment and selects the best run mode
npm run skill:report   # Collect and output a formatted report
```

`scripts/run.sh` automatically detects the runtime environment:
- **With display**: launches browser directly
- **Headless (server)**: automatically installs and uses Xvfb virtual display
- **Missing dependencies**: automatically installs xvfb and Chromium system libraries

## Calling as a Skill from Other Agents

### Claude Code MCP Method

Add the following to your Claude Code configuration file:

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

### Command-line Pipe Method

```bash
# Output JSON data for consumption by other programs
npm run skill 2>/dev/null

# Pipe to Claude Code
npm run prod:claude
```

### Other Agent Invocation

Any Agent can complete the entire research workflow with:

```bash
cd /path/to/alpharesearch && npm run setup && npm run skill
```

The `setup` script is idempotent — running it multiple times will not reinstall dependencies.

## Workflow

```
Agent calls npm run skill
    ↓
scripts/run.sh detects environment
    ↓ No display? Automatically installs/starts Xvfb
Playwright + OKX Wallet extension
    ↓ Opens browser, loads extension
Scrapes alpharadar.io/twitter
    ↓ Parses DOM, paginates up to 50 pages
Frontrun.pro API validation
    ↓ Validates KOL follower count for each project
Outputs JSON results
    ↓ Consumable via pipe
Generates research report
```

## Requirements

- Node.js >= 18.0.0
- Linux / macOS (Windows does not support automatic Xvfb installation)

No manual system dependency installation is needed for server environments — `npm run setup` handles everything automatically.

## All Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | One-click environment initialization (ideal for first Agent call) |
| `npm run skill` | Smart collection (auto-detects environment) |
| `npm run skill:report` | Collect and output formatted report |
| `npm run prod` | Local collection (requires display) |
| `npm run prod:server` | Server collection (requires Xvfb already installed) |
| `npm run prod:claude` | Pipe output to Claude Code |
| `npm run build` | Compile TypeScript |
| `npm run clean` | Clean build artifacts |

## CLI Arguments

| Argument | Description |
|----------|-------------|
| `--report` | Output formatted report instead of raw JSON |
| `--max-pages <n>` | Maximum number of pages to scrape (default: 50) |
| `--min-kol <n>` | Minimum KOL follower count filter (default: 3) |

## MCP Tools

| Tool | Function |
|------|----------|
| `collect_alpharadar_projects` | Collect AlphaRadar projects |
| `verify_kol_followers` | Verify KOL follower counts |
| `generate_project_report` | Generate research report |

## Project Structure

```
alpharesearch/
├── src/
│   ├── mcp.js          # MCP Server (handwritten, not compiled)
│   └── ScraperCollector/
│       └── index.ts    # Main scraper logic
├── scripts/
│   ├── setup.sh        # Environment initialization script
│   └── run.sh          # Smart runner script
├── extension.zip       # OKX Wallet extension
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

**Problem**: `xvfb-run: command not found`
**Solution**: Run `npm run setup` or `sudo apt-get install -y xvfb`

**Problem**: Chromium fails to start
**Solution**: Run `npx playwright install --with-deps chromium`

**Problem**: Empty data collected
**Solution**: Check `/tmp/alpharesearch-debug.png` screenshot to verify the page loaded correctly

**Problem**: Frontrun API returns 401
**Solution**: Check the `FRONTRUN_API_KEY` environment variable

## License

MIT
