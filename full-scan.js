/**
 * AlphaResearch 完整流程：
 * 1. AlphaRadar 采集（7d 时间范围，单页）
 * 2. 非项目账号过滤
 * 3. Frontrun API 验证 KOL（3 ≤ KOL ≤ 100）
 * 4. twitter-cli 获取 Bio 作为项目介绍
 * 5. Bio 二次过滤（剔除个人账号）
 * 6. 生成报告
 */
const { chromium } = require('playwright');
const { join } = require('path');
const { execSync } = require('child_process');
const { setExtensionData } = require('./dist/lib/unzipExtension');
const { USER_DATA_PATH, EXTENSIONS_PATH } = require('./dist/config');

const EXTENSION_ID = 'mcohilncbfahbmgdjkbpemcciiolgcge';
const FRONTRUN_API_KEY = process.env.FRONTRUN_API_KEY || '3mJXkDFc6e9ijbj2TgOZhX8U006PUk7W';
const BASE_URL = 'https://api.frontrun.pro/api/v1/pro';
const ENV_FILE = '/root/.openclaw/workspace/skills/alpha-hunter/.env';

const NON_PROJECT_KEYWORDS = new Set([
  'research', 'analyst', 'analysis', 'alerts', 'alpha', 'trader', 'trading',
  'trades', 'capital', 'ventures', 'vc', 'fund', 'invest', 'investor',
  'news', 'media', 'daily', 'digest', 'calls', 'signal', 'kol', 'host',
  'spaces', 'podcast', 'thread', 'degenerate', 'degen',
]);

const NON_PROJECT_PATTERNS = [
  /^0x[a-f0-9]{4,}$/i, /\.eth$/i, /_eth$/i,
  /^(the|ser|mr|ms|dr|prof)/i, /guru|master|king|queen|lord|chief/i,
];

// Bio 中包含个人身份特征的关键词（表示这是个人账号而非项目）
const PERSONAL_BIO_PATTERNS = [
  // 职位/头衔
  /\b(co-?founder|founder|ceo|cto|cmo|coo|cfo|cpo)\b/i,
  /\b(head of|director|vp of|partner at|lead at|manager)\b/i,
  /\b(contributor|advisor|ambassador|advocate|evangelist)\b/i,
  /\b(engineer|developer|designer|architect)\s+(at|@)/i,
  // 个人描述
  /\b(prev|previously|formerly|ex-|前|曾在)\b/i,
  /\b(growing|building|working on|working at)\s+@/i,
  /\b(co-?own|own)\s+(ai\s+)?agents?\b/i,
  // KOL/博主/创作者
  /认证创作者|投研|资讯分享|日常记录|博主/,
  /\b(creator|influencer|content|blogger|vlogger)\b/i,
  /返佣|邀请码|大使/,
  // 营销/社区
  /\b(marketing|community\s+build|campaign\s+lead)\b/i,
  /\b(collector|advisor|consultant)\b/i,
  // 矿工/早期个人
  /\b(miner|block\s+miner|genesis\s+block)\b/i,
];

function isNonProject(handle, name) {
  const tokenize = s => s.toLowerCase().split(/[_\-\s]+/).filter(Boolean);
  const tokens = [...tokenize(handle), ...tokenize(name || '')];
  for (const t of tokens) { if (NON_PROJECT_KEYWORDS.has(t)) return true; }
  const raw = handle.replace(/^@/, '');
  for (const p of NON_PROJECT_PATTERNS) { if (p.test(raw) || p.test(name || '')) return true; }
  return false;
}

// 通过 Bio 判断是否为个人账号
function isPersonalAccount(bio) {
  if (!bio) return false;
  for (const pattern of PERSONAL_BIO_PATTERNS) {
    if (pattern.test(bio)) return true;
  }
  return false;
}

async function getKOL(handle) {
  try {
    const res = await fetch(`${BASE_URL}/twitter/${handle}/smart-followers/count`, {
      headers: { 'accept': 'application/json', 'Authorization': `Bearer ${FRONTRUN_API_KEY}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.data?.totalCount || 0;
  } catch { return 0; }
}

function getBio(handle) {
  try {
    const output = execSync(`source ${ENV_FILE} 2>/dev/null; twitter user ${handle} 2>/dev/null`, {
      shell: '/bin/bash', timeout: 15000, encoding: 'utf-8'
    });
    const match = output.match(/bio:\s*'?(.+?)(?:'?\s*$)/m);
    return match ? match[1].replace(/^'|'$/g, '').trim() : '';
  } catch { return ''; }
}

(async () => {
  // Step 1: 启动浏览器 + 解锁钱包
  console.error('[*] Step 1: 启动浏览器...');
  await setExtensionData(EXTENSION_ID, '');
  const dir = join(EXTENSIONS_PATH, EXTENSION_ID);
  const browser = await chromium.launchPersistentContext(USER_DATA_PATH, {
    headless: false, channel: 'chromium',
    args: [`--load-extension=${dir}`, `--disable-extensions-except=${dir}`, '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1280 });

  await page.goto(`chrome-extension://${EXTENSION_ID}/home.html`, { timeout: 60000 });
  await page.waitForTimeout(12000);
  const iframe = page.frameLocator('#ui-ses-iframe');
  for (let i = 1; i <= 3; i++) {
    try {
      const cnt = await iframe.getByTestId('okd-input').count();
      if (cnt === 0) { console.error('[*] 钱包已解锁'); break; }
      await iframe.getByTestId('okd-input').click({ timeout: 10000 });
      await iframe.getByTestId('okd-input').fill('1234qwer');
      await iframe.getByTestId('okd-button').click();
      await page.waitForTimeout(3000);
      console.error('[*] 钱包解锁成功');
      break;
    } catch { await page.waitForTimeout(5000); }
  }

  // Step 2: 访问 AlphaRadar
  console.error('[*] Step 2: 访问 AlphaRadar...');
  await page.goto('https://alpharadar.io/twitter', { timeout: 60000 });
  await page.waitForTimeout(15000);

  // Step 3: 点击 7d 时间范围筛选器，等待表格刷新
  console.error('[*] Step 3: 选择 7d 时间范围...');
  try {
    await page.click('span:has-text("7d")', { timeout: 5000 });
    await page.waitForTimeout(8000); // 等待表格刷新
    console.error('[*] 已选择 7d，表格已刷新');
  } catch {
    console.error('[!] 7d 选择失败，使用默认范围');
  }

  // Step 4: 采集当前页面所有项目（7d 数据通常一页展示完）
  console.error('[*] Step 4: 采集当前页面项目...');
  const allProjects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.ant-table-row')).map(row => {
      let handle = '';
      let name = '';
      for (const link of Array.from(row.querySelectorAll('a'))) {
        const href = link.getAttribute('href') || '';
        const m = href.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
        if (m && m[1] !== 'intent') { handle = m[1]; name = link.textContent?.trim() || handle; break; }
      }
      if (!name) { const cells = row.querySelectorAll('td'); if (cells[0]) name = cells[0].textContent?.trim() || ''; }
      return { name, handle };
    }).filter(p => p.name || p.handle);
  });
  await browser.close();
  console.error(`[*] 采集到 ${allProjects.length} 个项目`);

  // Step 4: 去重 + 过滤
  const seen = new Set();
  const unique = allProjects.filter(p => {
    const k = (p.handle || p.name).toLowerCase();
    if (!k || seen.has(k)) return false; seen.add(k); return true;
  });
  const filtered = unique.filter(p => !isNonProject(p.handle || '', p.name || ''));
  console.error(`[*] 去重 ${unique.length} → 过滤后 ${filtered.length} 个`);

  // Step 5: Frontrun API 验证 + Twitter Bio
  console.error('[*] Step 5: Frontrun + Twitter Bio 验证...');
  const results = [];
  for (const p of filtered) {
    const handle = p.handle || p.name;
    const kol = await getKOL(handle);
    if (kol >= 3 && kol <= 100) {
      const bio = getBio(handle);
      // 二次过滤：通过 Bio 判断是否为个人账号
      if (isPersonalAccount(bio)) {
        console.error(`  🚫 ${handle}: ${kol}⭐ | 个人账号 | ${bio?.substring(0, 60)}`);
        continue;
      }
      results.push({ handle, name: p.name || handle, kol, bio });
      console.error(`  ✅ ${handle}: ${kol}⭐ | ${bio?.substring(0, 60) || '无bio'}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  // Step 6: 生成报告
  results.sort((a, b) => b.kol - a.kol);
  const top20 = results.slice(0, 20);
  const date = new Date().toISOString().split('T')[0];

  let report = `📊 今日热门项目 (${date})\n`;
  report += `筛选条件：3 ≤ KOL关注数 ≤ 100（早期 Alpha 项目）\n`;
  report += `共计：${top20.length} 个项目\n\n`;
  top20.forEach((p, i) => {
    report += `${i + 1}、项目名称：${p.name}\n`;
    report += `项目推特：https://x.com/${p.handle}\n`;
    report += `项目介绍：${p.bio || '暂无介绍'}\n`;
    report += `KOL关注数：${p.kol}⭐️\n\n`;
  });

  console.log(report.trim());
  console.error(`\n[*] 完成！共 ${top20.length} 个早期 Alpha 项目`);
})().catch(e => { console.error('[!] Fatal:', e.message); process.exit(1); });
