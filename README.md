# AlphaResearch

自动抓取 AlphaRadar 早期项目，通过 Frontrun.pro API 验证 KOL 关注数，输出结构化日报。

## 功能特性

- 🔍 **AlphaRadar 抓取** - 自动抓取最新项目列表
- 📊 **KOL 验证** - 通过 Frontrun.pro API 获取 KOL 关注数
- 🎯 **智能过滤** - 过滤 KOL 3-100 的早期项目（排除成熟项目）
- 🚫 **账号清洗** - 自动过滤个人账号、媒体、KOL、交易员账号
- 📝 **BIO 抓取** - 抓取 Twitter BIO 作为项目介绍
- 🌐 **自动翻译** - 英文 BIO 自动翻译为中文

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/ynbtc/alpharesearch.git
cd alpharesearch
```

### 2. 安装依赖

```bash
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium
```

### 3. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件填入真实值
```

`.env` 文件内容：
```bash
# 必需：Frontrun.pro API Key
FRONTRUN_API_KEY="your_api_key_here"

# 可选：Twitter Cookie（用于抓取 BIO）
# 如果不设置，项目介绍会显示"暂无公开简介"
TWITTER_AUTH_TOKEN="your_auth_token"
TWITTER_CT0="your_ct0_token"
```

### 4. 运行完整流程

```bash
# 步骤1：抓取 AlphaRadar 数据
python scraper.py
# 输出：alpharadar-projects.json

# 步骤2：分析并生成日报
python alpharesearch.py
```

## 输出示例

```
📊 今日早期项目 (2026-04-05)

1、项目名称：Yellow
项目推特：https://twitter.com/Yellow
项目介绍：致力于实时、非托管跨链交易的生态系统，由状态通道、YELLOW代币和下一代开发者SDK提供支持
KOL关注数：97⭐️

2、项目名称：Orb Markets
项目推特：https://twitter.com/Orb_Markets
项目介绍：互联网市场的用户界面
KOL关注数：93⭐️

3、项目名称：Clawlett
项目推特：https://twitter.com/clawlett_wallet
项目介绍：为所有AI代理构建的开源、不可篡改的钱包
KOL关注数：93⭐️
...
```

## 供其他 Agent 调用

### 方式一：Python 导入

```python
from alpharesearch import AlphaResearch
import json

# 初始化
ar = AlphaResearch(
    frontrun_api_key="your_key",
    twitter_auth_token="optional",  # 可选
    twitter_ct0="optional"          # 可选
)

# 加载 AlphaRadar 数据
with open('alpharadar-projects.json') as f:
    raw_data = json.load(f)

# 获取早期项目列表
projects = ar.get_early_stage_projects(
    raw_data,
    min_kol=3,      # 最小 KOL 数
    max_kol=100,    # 最大 KOL 数
    limit=20        # 返回数量上限
)

# 生成日报
report = ar.generate_report(projects)
print(report)

# 或单独使用某个功能
kol_count = ar.get_kol_count("@Yellow")          # 获取 KOL 数
bio = ar.get_twitter_bio("@Yellow")              # 获取 BIO
translated = ar.translate_bio(bio)               # 翻译 BIO
should_filter = ar.should_filter("Name", "@handle")  # 判断是否过滤
```

### 方式二：直接调用 Frontrun.pro API

```python
import requests

api_key = "your_api_key"
handle = "Yellow"

response = requests.get(
    f"https://api.frontrun.pro/api/v1/pro/twitter/{handle}/smart-followers/count",
    headers={"Authorization": f"Bearer {api_key}"}
)

kol_count = response.json()["data"]["totalCount"]
print(f"{handle}: {kol_count} KOL followers")
```

### 方式三：使用 twitter-cli 获取 BIO

```bash
# 安装 twitter-cli
git clone https://github.com/public-clis/twitter-cli.git
cd twitter-cli
python -m venv .venv
source .venv/bin/activate
pip install .

# 设置环境变量
export TWITTER_AUTH_TOKEN="your_token"
export TWITTER_CT0="your_ct0"

# 获取用户 BIO
twitter user Yellow --json
```

## 项目过滤规则

### KOL 范围过滤
| 条件 | 说明 |
|-----|------|
| KOL ≥ 3 | 排除完全没有 KOL 关注的项目 |
| KOL ≤ 100 | 排除过于成熟的项目（大机构已入场） |

### 账号类型过滤
自动排除包含以下关键词的账号：
- **媒体/新闻**：research, alert, alerts, media, news, newsletter
- **KOL/交易员**：trader, analyst, investor, host, podcast
- **机构**：capital, ventures, fund

### 项目信号识别
识别以下关键词判断是否为项目账号：
- protocol, network, app, chain, finance, money, pay
- dao, studio, cloud, ai, build, market, wallet
- infra, launch, exchange, tool, layer, game, nft
- defi, token, coin

## 数据流程

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  AlphaRadar.io  │────▶│  scraper.py     │────▶│  原始项目数据   │
│  (项目列表页)    │     │  (Playwright)   │     │  (JSON)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  结构化日报      │◀────│  alpharesearch  │◀────│  数据清洗过滤   │
│  (中文输出)      │     │  (分析+翻译)    │     │  (KOL验证)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Frontrun.pro   │
                       │  (KOL数据API)   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  twitter-cli    │
                       │  (BIO抓取)      │
                       └─────────────────┘
```

## 核心类说明

### AlphaResearch 类

```python
class AlphaResearch:
    """
    AlphaRadar 早期项目分析工具
    
    主要方法：
    - get_kol_count(handle) -> int: 获取 KOL 关注数
    - get_twitter_bio(handle) -> str: 获取 Twitter BIO
    - translate_bio(bio) -> str: 翻译 BIO 为中文
    - should_filter(name, handle) -> bool: 判断是否过滤
    - parse_projects(raw_data) -> List[Dict]: 解析原始数据
    - get_early_stage_projects(raw_data, min_kol, max_kol, limit) -> List[Dict]: 获取早期项目
    - generate_report(projects) -> str: 生成日报
    """
```

## 技术栈

| 组件 | 用途 |
|-----|------|
| Python 3.8+ | 核心语言 |
| Playwright | 浏览器自动化抓取 |
| requests | HTTP 请求 |
| twitter-cli | Twitter BIO 抓取 |
| Frontrun.pro API | KOL 数据获取 |

## 获取 Twitter Cookie

1. 登录 https://x.com
2. 打开浏览器开发者工具 (F12)
3. 切换到 Application/应用 → Cookies
4. 复制 `auth_token` 和 `ct0`

## 获取 Frontrun.pro API Key

1. 安装 Frontrun.pro 浏览器插件
2. 打开插件开发者工具
3. 查看 Network 请求头中的 `Authorization: Bearer xxx`

## 隐私与安全

- ✅ Twitter Cookie 仅存储在本地 `.env` 文件
- ✅ `.env` 已加入 `.gitignore`，不会上传到 GitHub
- ✅ 示例代码中使用占位符代替真实 token
- ⚠️ 定期更换 Twitter Cookie 和 API Key

## 常见问题

### Q: 为什么有些项目显示"暂无公开简介"？
A: Twitter BIO 抓取需要有效的 Twitter Cookie。如果未设置或 Cookie 过期，会显示此提示。

### Q: KOL 数为什么和 Twitter 显示的关注者数不同？
A: Frontrun.pro 的 KOL 数只统计"聪明钱"关注者（机构、KOL、交易员），不是总关注者数。

### Q: 如何调整过滤规则？
A: 修改 `AlphaResearch` 类中的 `ban_handles`、`bad_keywords`、`org_signals` 列表。

## License

MIT

## 贡献

欢迎提交 Issue 和 PR！
