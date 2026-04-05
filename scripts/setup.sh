#!/bin/bash
set -e

echo "=========================================="
echo "AlphaResearch 环境自动初始化"
echo "=========================================="

# 检测操作系统
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "$ID"
  elif [ -f /etc/debian_version ]; then
    echo "debian"
  elif [ -f /etc/redhat-release ]; then
    echo "centos"
  else
    echo "unknown"
  fi
}

OS=$(detect_os)
echo "[*] 检测到操作系统: $OS"

# 安装系统依赖
install_system_deps() {
  echo "[*] 安装系统依赖..."

  case "$OS" in
    ubuntu|debian)
      sudo apt-get update -qq
      sudo apt-get install -y -qq xvfb libgbm-dev libnss3 libatk-bridge2.0-0 \
        libdrm2 libxcomposite1 libxdamage1 libxrandr2 libcups2 \
        libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
        libglu1-mesa fonts-liberation libappindicator3-1 \
        libgtk-3-0 libx11-xcb1 2>/dev/null
      ;;
    centos|rhel|fedora)
      sudo yum install -y xorg-x11-server-Xvfb libXcomposite libXdamage \
        libXrandr cups-libs pango cairo alsa-lib atk at-spi2-atk \
        gtk3 libdrm mesa-libgbm nss 2>/dev/null
      ;;
    *)
      echo "[!] 无法自动安装系统依赖，请手动安装 xvfb 和 Chromium 所需库"
      echo "    Ubuntu/Debian: sudo apt-get install -y xvfb libgbm-dev libnss3 ..."
      ;;
  esac
}

# 检查 Node.js
check_node() {
  if ! command -v node &> /dev/null; then
    echo "[!] 未找到 Node.js，请先安装 Node.js >= 18"
    echo "    推荐: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
  fi

  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo "[!] Node.js 版本过低 ($(node -v))，需要 >= 18"
    exit 1
  fi
  echo "[✓] Node.js $(node -v)"
}

# 检查 xvfb
check_xvfb() {
  if ! command -v xvfb-run &> /dev/null; then
    echo "[*] xvfb-run 未安装，正在安装..."
    install_system_deps
  fi

  if command -v xvfb-run &> /dev/null; then
    echo "[✓] Xvfb 已就绪"
  else
    echo "[!] Xvfb 安装失败，请手动安装"
    exit 1
  fi
}

# 安装 npm 依赖
install_npm_deps() {
  echo "[*] 安装 npm 依赖..."
  npm install
  echo "[✓] npm 依赖安装完成"
}

# 验证环境
verify_env() {
  echo ""
  echo "=========================================="
  echo "环境验证"
  echo "=========================================="

  local all_ok=true

  # 检查 xvfb-run
  if command -v xvfb-run &> /dev/null; then
    echo "[✓] xvfb-run"
  else
    echo "[✗] xvfb-run"
    all_ok=false
  fi

  # 检查 node
  if command -v node &> /dev/null; then
    echo "[✓] node $(node -v)"
  else
    echo "[✗] node"
    all_ok=false
  fi

  # 检查 dist/index.js
  if [ -f "dist/index.js" ]; then
    echo "[✓] dist/index.js (已编译)"
  else
    echo "[✗] dist/index.js (未编译，请运行 npm run build)"
    all_ok=false
  fi

  # 检查 extension 目录
  if [ -d "extension/Chrome" ]; then
    echo "[✓] extension/Chrome (扩展已解压)"
  else
    echo "[✗] extension/Chrome (扩展未解压，请运行 npm run unzip)"
    all_ok=false
  fi

  echo ""
  if [ "$all_ok" = true ]; then
    echo "✅ 环境就绪！可以运行: npm run skill"
  else
    echo "❌ 部分组件缺失，请检查上述输出"
  fi
}

# 主流程
check_node
check_xvfb
install_system_deps
install_npm_deps
verify_env

echo ""
echo "=========================================="
echo "🚀 快速开始"
echo "=========================================="
echo ""
echo "  采集项目:     npm run skill"
echo "  含报告输出:   npm run skill:report"
echo "  本地运行:     npm run prod"
echo ""
