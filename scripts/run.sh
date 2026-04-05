#!/bin/bash
# AlphaResearch 智能运行脚本
# 自动检测环境并选择最佳运行方式

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 解析参数
HEADLESS_FLAG="-l false"
EXTRA_ARGS=""

for arg in "$@"; do
  case "$arg" in
    --headless) HEADLESS_FLAG="-l true" ;;
    *) EXTRA_ARGS="$EXTRA_ARGS $arg" ;;
  esac
done

# 检测是否有图形界面
has_display() {
  [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]
}

# 检测 xvfb
has_xvfb() {
  command -v xvfb-run &> /dev/null
}

# 自动安装 xvfb（如果缺失）
auto_install_xvfb() {
  echo "[*] 检测到无图形界面环境，正在自动安装 Xvfb..."

  if [ -f /etc/debian_version ]; then
    sudo apt-get update -qq 2>/dev/null
    sudo apt-get install -y -qq xvfb 2>/dev/null
  elif [ -f /etc/redhat-release ]; then
    sudo yum install -y xorg-x11-server-Xvfb 2>/dev/null
  fi

  if ! has_xvfb; then
    echo "[!] 自动安装 Xvfb 失败，请手动运行: sudo apt-get install -y xvfb"
    exit 1
  fi

  echo "[✓] Xvfb 安装成功"
}

# 运行采集
run_scraper() {
  local CMD="NODE_NO_WARNINGS=1 node dist/index.js run-task collect $HEADLESS_FLAG $EXTRA_ARGS"

  if has_display; then
    # 有图形界面，直接运行
    echo "[*] 检测到图形界面 (DISPLAY=$DISPLAY)，直接运行..." >&2
    eval $CMD
  else
    # 无图形界面，使用 Xvfb
    if ! has_xvfb; then
      auto_install_xvfb
    fi

    echo "[*] 使用 Xvfb 虚拟显示器运行..." >&2
    xvfb-run --auto-servernum --server-args='-screen 0 1280x1280x24' bash -c "$CMD"
  fi
}

echo "==========================================" >&2
echo "AlphaResearch Skill Runner" >&2
echo "==========================================" >&2

run_scraper
