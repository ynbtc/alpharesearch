[English](README_EN.md)

# AlphaResearch

基于 Playwright 的 AlphaRadar 早期项目研究工具。自动采集 AlphaRadar 项目数据 → Frontrun.pro API 验证 KOL 关注数 → 生成项目研究报告。

**设计为可被其他 Agent 直接调用的 Skill，支持自动环境初始化，无需人工干预。**

## 快速开始

### 一键初始化（Agent 推荐）

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm run setup   # 自动安装所有依赖（Xvfb、Chromium 系统库、npm 包）
```

### 运行采集

```bash
npm run skill          # 自动检测环境，智能选择运行方式
npm run skill:report   # 采集并输出格式化报告
```

`scripts/run.sh` 会自动检测运行环境：
- **有图形界面**：直接启动浏览器
- **无图形界面（服务器）**：自动安装并使用 Xvfb 虚拟显示器
- **缺少依赖**：自动安装 xvfb 和 Chromium 系统库

## 作为 Skill 被其他 Agent 调用

### 方式一：命令行直接调用

任何 Agent 只需执行以下命令即可完成整个研究流程：

```bash
cd /path/to/alpharesearch && npm run setup && npm run skill
```

`setup` 脚本是幂等的，重复运行不会重复安装。

### 方式二：Claude Code MCP

在 Claude Code 配置文件中添加：

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

配置文件位置：
- macOS: `~/Library/Application Support/Claude/settings.json`
- Linux: `~/.config/claude/settings.json`

### 方式三：命令行管道

```bash
# 输出 JSON 数据，可被其他程序消费
npm run skill 2>/dev/null

# 管道传递给 Claude Code
npm run prod:claude
```

## 工作流程

```
Agent 调用 npm run skill
    ↓
scripts/run.sh 检测环境
    ↓ 无图形界面？自动安装/启动 Xvfb
Playwright + OKX Wallet 扩展
    ↓ 打开浏览器，加载钱包扩展
采集 alpharadar.io/twitter
    ↓ 解析 DOM，翻页采集最多 50 页
Frontrun.pro API 验证
    ↓ 逐个验证项目 KOL 关注数
筛选 + 排序
    ↓ KOL ≥ 3 的项目，按关注数排序
输出 JSON / 生成报告
```

## 环境要求

- Node.js >= 18.0.0
- Linux / macOS（Windows 暂不支持 Xvfb 自动安装）

服务器环境无需手动安装任何系统依赖，`npm run setup` 会自动处理。

## 所有可用命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 一键初始化环境（Agent 首次调用时运行） |
| `npm run skill` | 智能采集（自动检测环境，推荐） |
| `npm run skill:report` | 采集并输出格式化 JSON 报告 |
| `npm run prod` | 本地采集（需要图形界面或已设置 DISPLAY） |
| `npm run prod:server` | 服务器采集（需要已安装 Xvfb） |
| `npm run prod:claude` | 管道输出到 Claude Code |
| `npm run build` | 编译 TypeScript |
| `npm run clean` | 清理编译产物 |
| `npm run zip` | 打包扩展数据 |
| `npm run unzip` | 解压扩展数据 |

## MCP 工具

| 工具 | 功能 |
|------|------|
| `collect_alpharadar_projects` | 采集 AlphaRadar 项目 |
| `verify_kol_followers` | 验证 KOL 关注数 |
| `generate_project_report` | 生成研究报告 |

## CLI 参数

```
scraper run-task
  --filter <type>          筛选条件：all / early-stage / high-score（默认：all）
  --min-kol <number>       最小 KOL 关注数（默认：3）
  --headless <bool>        无头模式（默认：true）
  --max-pages <number>     最大采集页数（默认：50）
```

## 项目结构

```
alpharesearch/
├── src/
│   ├── index.ts              # CLI 入口
│   ├── mcp.js                # MCP Server（Claude Code 集成）
│   ├── collectors/           # 采集器
│   ├── task/                 # 任务逻辑（scrape、zip、unzip）
│   ├── utils/                # 工具函数（report、frontrun）
│   ├── config/               # 配置
│   ├── lib/                  # 库文件
│   ├── registry/             # 注册表
│   └── types/                # TypeScript 类型定义
├── scripts/
│   ├── setup.sh              # 一键环境初始化脚本
│   └── run.sh                # 智能运行脚本
├── extension.zip             # OKX Wallet 扩展（压缩包）
├── package.json
├── tsconfig.json
└── .gitignore
```

## 故障排除

**问题**: `xvfb-run: command not found`
**解决**: 运行 `npm run setup` 或 `sudo apt-get install -y xvfb`

**问题**: Chromium 启动失败
**解决**: 运行 `npx playwright install --with-deps chromium`

**问题**: 采集到空数据
**解决**: 检查 `/tmp/alpharesearch-debug.png` 截图确认页面是否正常加载

**问题**: Frontrun API 返回 401
**解决**: 检查 `FRONTRUN_API_KEY` 环境变量

## 许可证

MIT
