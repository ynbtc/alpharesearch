import { type Page } from 'playwright';
import { writeFile } from 'fs/promises';
import { ScrapeResult, ProjectInfo } from '../../../../types/Scrape';

/**
 * 点击表格行的 Details 按钮，提取弹窗中的 AI 分析文本，最多 500 字符
 */
async function extractDetailDescription(page: Page, rowIndex: number): Promise<string> {
  try {
    const rows = await page.$$('.ant-table-row');
    if (rowIndex >= rows.length) return '';

    const row = rows[rowIndex];

    // 尝试点击 Details 按钮
    const detailsBtn = await row.$('button, a').catch(() => null);
    const allBtns = await row.$$('button, a');
    let clicked = false;
    for (const btn of allBtns) {
      const text = (await btn.textContent() || '').trim().toLowerCase();
      if (text === 'details' || text === '详情') {
        await btn.click().catch(() => {});
        clicked = true;
        break;
      }
    }
    if (!clicked) return '';

    // 等待弹窗出现
    const modalSelectors = [
      '.ant-modal-body',
      '.ant-drawer-body',
      '.ant-modal-content',
      '.ant-drawer-content',
      '[class*="modal-body"]',
      '[class*="drawer-body"]',
    ];

    let modalEl = null;
    for (const sel of modalSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        modalEl = await page.$(sel);
        if (modalEl) break;
      } catch {
        // try next
      }
    }

    if (!modalEl) {
      await page.keyboard.press('Escape').catch(() => {});
      return '';
    }

    // 提取 AI 分析文本
    const textSelectors = [
      '[class*="analysis"]',
      '[class*="description"]',
      '[class*="summary"]',
      '[class*="ai"]',
      '[class*="content"]',
      'p',
    ];

    let aiText = '';
    for (const sel of textSelectors) {
      const els = await modalEl.$$(sel);
      for (const el of els) {
        const txt = ((await el.textContent()) || '').trim();
        if (txt.length > 20) {
          aiText = txt;
          break;
        }
      }
      if (aiText) break;
    }

    // 如果没有匹配到特定选择器，取弹窗整体文本
    if (!aiText) {
      aiText = ((await modalEl.textContent()) || '').trim();
    }

    // 关闭弹窗
    const closeSelectors = ['.ant-modal-close', '.ant-drawer-close', '[aria-label="Close"]', '[class*="close"]'];
    let closed = false;
    for (const sel of closeSelectors) {
      const closeBtn = await page.$(sel);
      if (closeBtn) {
        await closeBtn.click().catch(() => {});
        closed = true;
        break;
      }
    }
    if (!closed) {
      await page.keyboard.press('Escape').catch(() => {});
    }

    await page.waitForTimeout(500);

    return aiText.slice(0, 500);
  } catch {
    // 兜底关闭弹窗
    await page.keyboard.press('Escape').catch(() => {});
    return '';
  }
}

const url = 'https://alpharadar.io/twitter';

async function extractProjectsFromDom(page: Page): Promise<ProjectInfo[]> {
  return page.evaluate(() => {
    const txt = (el: Element | null | undefined) => (el?.textContent || '').trim();
    const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
    const items: ProjectInfo[] = [];
    const seen = new Set<string>();

    const rows = Array.from(document.querySelectorAll('.ant-table-row'));

    for (const row of rows) {
      const cells = row.querySelectorAll('.ant-table-cell');
      if (cells.length < 7) continue;

      const firstCell = cells[0];
      const rawLines = txt(firstCell).split(/\n+/).map(clean).filter(Boolean);
      const twitterLink = firstCell.querySelector('a[href*="twitter.com"], a[href*="x.com"]') as HTMLAnchorElement | null;
      const twitterUrl = twitterLink?.href || '';
      let twitterHandle = rawLines.find(v => v.startsWith('@')) || '';
      if (!twitterHandle && twitterUrl) {
        const m = twitterUrl.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
        if (m) twitterHandle = '@' + m[1];
      }
      const projectName = rawLines.find(v => !v.startsWith('@') && v !== 'Details' && v !== 'Action') || '';

      const key = `${projectName}|${twitterHandle}`;
      if (!projectName || seen.has(key)) continue;
      seen.add(key);

      const categoryCell = cells[7] || cells[6];
      const categoryText = clean(txt(categoryCell)).replace(/Details\s*Action$/i, '').trim();

      items.push({
        name: projectName,
        twitterHandle,
        twitterUrl,
        description: '',
        time: clean(txt(cells[2] || cells[1])),
        score: clean(txt(cells[3] || cells[2])),
        followers: clean(txt(cells[4] || cells[3])),
        status: clean(txt(cells[5] || cells[4])),
        type: clean(txt(cells[6] || cells[5])),
        category: categoryText,
      });
    }

    return items;
  });
}

async function navigateToNextPage(page: Page): Promise<boolean> {
  const selectors = [
    'button.ant-pagination-next:not([disabled])',
    '.ant-pagination-next button:not([disabled])',
    '.ant-pagination-next:not(.ant-pagination-disabled)',
    'li.ant-pagination-next:not(.ant-pagination-disabled)',
  ];

  for (const selector of selectors) {
    const nextBtn = await page.$(selector);
    if (nextBtn) {
      await nextBtn.click().catch(() => {});
      await page.waitForTimeout(2500);
      return true;
    }
  }
  return false;
}

export const scrape = async (page: Page): Promise<ScrapeResult> => {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForTimeout(8000);

  const title = await page.title().catch(() => '');
  const content = await page.content();
  await page.screenshot({ path: '/tmp/alpharesearch-debug.png', fullPage: true }).catch(() => {});
  await writeFile('/tmp/alpharesearch-debug.html', content, 'utf8').catch(() => {});

  console.log('[alpharadar] title:', title);
  console.log('[alpharadar] has table:', content.includes('table'));
  console.log('[alpharadar] has Members can view full data:', content.includes('Members can view full data'));
  console.log('[alpharadar] has Wallet Connection:', content.includes('Wallet Connection'));
  console.log('[alpharadar] has Connect Wallet:', content.includes('Connect Wallet'));

  const allProjects: ProjectInfo[] = [];
  const seen = new Set<string>();

  for (let pageNum = 1; pageNum <= 50; pageNum++) {
    console.log(`[*] 采集第 ${pageNum} 页...`);

    const projects = await extractProjectsFromDom(page);
    console.log(`[alpharadar] dom extracted ${projects.length} candidates`);

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const key = `${project.name}_${project.twitterHandle}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (!project.description || project.description.length < 10) {
        const aiDescription = await extractDetailDescription(page, i);
        if (aiDescription) project.description = aiDescription;
      }

      allProjects.push(project);
    }

    const hasNext = await navigateToNextPage(page);
    if (!hasNext) break;
  }

  console.log(`[*] 共采集 ${allProjects.length} 个项目`);
  await page.close();

  return {
    htmlContent: JSON.stringify(allProjects, null, 2),
    projects: allProjects,
  };
};
