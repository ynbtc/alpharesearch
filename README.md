# AlphaResearch

自动抓取 AlphaRadar 早期项目，通过 Frontrun.pro API 验证 KOL 关注数，输出结构化日报。

## 功能

- 🔍 从 AlphaRadar 抓取最新项目列表
- 📊 通过 Frontrun.pro API 获取 KOL 关注数
- 🎯 过滤 KOL 3-100 的早期项目（排除成熟项目）
- 🚫 自动过滤个人账号、媒体、KOL、交易员账号
- 📝 抓取 Twitter BIO 作为项目介绍
- 🌐 英文 BIO 自动翻译为中文

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 必需：Frontrun.pro API Key
export FRONTRUN_API_KEY="your_api_key_here"

# 可选：Twitter Cookie（用于抓取 BIO）
# 如果不设置，项目介绍会显示"暂无公开简介"
export TWITTER_AUTH_TOKEN="your_auth_token"
export TWITTER_CT0="your_ct0_token"
```

### 3. 运行

```bash
python alpharesearch.py
```

## 输出示例

```
📊 今日早期项目 (2026-04-05)

1、项目名称：Yellow
项目推特：https://twitter.com/Yellow
项目介绍：致力于实时、非托管跨链交易的生态系统
KOL关注数：97⭐️

2、项目名称：Orb Markets
项目推特：https://twitter.com/Orb_Markets
项目介绍：互联网市场的用户界面
KOL关注数：93⭐️
...
```

## 供其他 Agent 调用

### Python 方式

```python
from alpharesearch import AlphaResearch

# 初始化
ar = AlphaResearch(
    frontrun_api_key="your_key",
    twitter_auth_token="optional",
    twitter_ct0="optional"
)

# 获取项目列表
projects = ar.get_early_stage_projects(
    min_kol=3,
    max_kol=100,
    limit=20
)

for p in projects:
    print(f"{p['name']}: KOL={p['kol']}, Bio={p['bio']}")
```

### API 方式

```python
import requests

# 获取原始项目数据
response = requests.get(
    "https://api.frontrun.pro/api/v1/pro/twitter/{handle}/smart-followers/count",
    headers={"Authorization": f"Bearer {api_key}"}
)
kol_count = response.json()["data"]["totalCount"]
```

## 项目过滤规则

| 过滤类型 | 规则 |
|---------|------|
| KOL 范围 | 3 ≤ KOL ≤ 100 |
| 排除关键词 | research, alert, media, news, capital, ventures, fund, trader, analyst, podcast |
| 项目信号 | protocol, network, app, chain, finance, dao, wallet, defi, token 等 |

## 技术栈

- Python 3.8+
- Playwright（浏览器自动化）
- twitter-cli（Twitter BIO 抓取）
- Frontrun.pro API

## 隐私说明

- Twitter Cookie 仅存储在本地环境变量，不上传到 GitHub
- 示例代码中使用占位符代替真实 token

## License

MIT
