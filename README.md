# AlphaRadar

基于 Playwright 的 AlphaRadar 数据采集工具，通过加载 OKX Wallet 浏览器扩展自动抓取页面数据，并以 JSON 格式输出采集结果，支持管道传递给其他命令进行分析。

## 环境要求

- Node.js >= 18.0.0

## 安装

```bash
npm install
```

安装时会自动执行 `postinstall`，完成以下操作：
1. 安装 Playwright Chromium 浏览器
2. 编译 TypeScript
3. 解压扩展数据

## 使用

### 采集

```bash
npm run prod
```

### 管道输出到 Claude Code

```bash
npm run prod:claude
```

## CLI 参数

```
scraper run-task <taskName>

Options:
  -i, --interval <number>   定时采集间隔，单位：小时（默认 1）
  -t, --timer <boolean>     启用定时执行（默认 false）
  -r, --remove <boolean>    执行前清理浏览器用户数据（默认 true）
  -l, --headless <boolean>  无头模式（默认 true）
```

## 服务器部署（无图形界面 Linux）

本项目依赖 Chrome 扩展，无法在纯 headless 模式下运行。在没有图形界面的 Linux 服务器上，需使用 Xvfb 虚拟显示器。

### 安装系统依赖

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y xvfb

# CentOS / RHEL
sudo yum install -y xorg-x11-server-Xvfb
```

### 安装项目

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
npm install   # postinstall 会自动安装 Chromium 及系统依赖
```

### 运行采集

```bash
# 服务器专用命令（通过 Xvfb 虚拟显示器运行）
npm run prod:server

# 管道输出到 Claude Code
npm run prod:server:claude
```

### 原理说明

- `xvfb-run` 会创建一个虚拟 X11 显示器
- `-l false` 让 Playwright 以非 headless 模式启动 Chromium
- Chrome 扩展（OKX Wallet）在虚拟显示器中正常加载和运行
- 所有页面操作（导航、点击、DOM 解析、翻页）与本地运行完全一致

### 故障排除

**问题**: `xvfb-run: command not found`
**解决**: `sudo apt-get install -y xvfb`

**问题**: Chromium 启动失败，报权限错误
**解决**: 确保启动参数包含 `--no-sandbox`（已在代码中添加）

**问题**: 采集到空数据
**解决**: 检查 `/tmp/alpharesearch-debug.png` 截图和 `/tmp/alpharesearch-debug.html` 页面内容，确认页面是否正常加载
