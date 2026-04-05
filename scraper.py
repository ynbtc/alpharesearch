# AlphaRadar Scraper

使用 Playwright 抓取 AlphaRadar 项目列表。

## 安装

```bash
pip install playwright
playwright install chromium
```

## 使用

```bash
python scraper.py
```

输出：`alpharadar-projects.json`

## 说明

- 使用 headless 浏览器访问 https://alpharadar.io/twitter
- 自动翻页抓取所有项目
- 提取项目名称、Twitter handle、分数、关注者数
