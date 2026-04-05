# AlphaResearch

基于 Playwright 的 AlphaRadar 早期项目研究工具。自动采集 AlphaRadar 项目数据 → Frontrun.pro API 验证 KOL 关注数 → 生成项目研究报告。

**设计为可被其他 Agent 直接调用的 Skill，支持自动环境初始化。**

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

### Claude Code MCP 方式

在 Claude Code 配置文件中添加：

```json
{
  "mcpServers": {
    "alpharesearch": {
      "command": "node",
      "args": ["dist/mcp.js"],
      "cwd": "/path/to/alpharesearch",
      "env": {
        "FRONTRUN_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 命令行管道方式

```bash
# 输出 JSON 数据，可被其他程序消费
npm run skill 2>/dev/null

# 管道传递给 Claude Code
npm run prod:claude
```

### 其他 Agent 调用

任何 Agent 只需执行以下命令即可完成整个研究流程：

```bash
cd /path/to/alpharesearch && npm run setup && npm run skill
```

`setup` 脚本是幂等的，重复运行不会重复安装。

## 工作流程

```
Agent 调用 npm run skill
    ↓
scripts/run.sh 检测环境
    ↓ 无图形界面？自动安装/启动 Xvfb
Playwright + OKX Wallet 扩展
    ↓ 打开浏览器，加载扩展
采集 alpharadar.io/twitter
    ↓ 解析 DOM，翻页采集最多 50 页
Frontrun.pro API 验证
    ↓ 逐个验证 KOL 关注数
输出 JSON 结果
    ↓ 可被管道消费
生成研究报告
```

## 环境要求

- Node.js >= 18.0.0
- Linux / macOS（Windows 暂不支持 Xvfb 自动安装）

服务器环境无需手动安装任何系统依赖，`npm run setup` 会自动处理。

## 所有可用命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 一键初始化环境（适合 Agent 首次调用） |
| `npm run skill` | 智能采集（自动检测环境） |
| `npm run skill:report` | 采集并输出格式化报告 |
| `npm run prod` | 本地采集（需要图形界面） |
| `npm run prod:server` | 服务器采集（需要已安装 Xvfb） |
| `npm run prod:claude` | 管道输出到 Claude Code |
| `npm run build` | 编译 TypeScript |
| `npm run clean` | 清理编译产物 |

## MCP 工具

| 工具 | 功能 |
|------|------|
| `collect_alpharadar_projects` | 采集 AlphaRadar 项目 |
| `verify_kol_followers` | 验证 KOL 关注数 |
| `generate_project_report` | 生成研究报告 |

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
