import { type Page } from 'playwright';
import { writeFile } from 'fs/promises';
import { ScrapeResult, ProjectInfo } from '../../../../types/Scrape';

/**
 * 点击某行的 Details 按钮，提取弹窗中的 AI 分析文本
 * @param page Playwright Page
 * @param rowIndex 当前行在表格中的索引（0-based）
 * @returns AI 分析文本，失败返回空字符串
 */
async function extractDetailDescription(page: Page, rowIndex: number): Promise<string> {
  try {
    const rows = await page.$$('.ant-table-row');
    if (rowIndex >= rows.length) return '';

    const row = rows[rowIndex];

    const detailBtn = await row.$('button:has-text("Details"), a:has-text("Details"), span:has-text("Details"), [class*="detail"]');
    if (!detailBtn) {
      console.log(`[detail] 行 ${rowIndex}: 未找到 Details 按钮`);
      return '';
    }

    await detailBtn.click();

    const modalSelectors = [
      '.ant-modal-body',
      '.ant-drawer-body',
      '.ant-modal-content',
      '.ant-drawer-content',
      '[class*="modal"]',
      '[class*="drawer"]',
      '[class*="detail-panel"]',
      '[class*="project-detail"]',
    ];

    let modalContent = '';

    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.waitForTimeout(2000);

        modalContent = await page.evaluate((sel) => {
          const modal = document.querySelector(sel);
          if (!modal) return '';

          const aiSelectors = [
            '[class*="ai-analysis"]',
            '[class*="analysis"]',
            '[class*="description"]',
            '[class*="summary"]',
            '[class*="intro"]',
            '[class*="about"]',
            '[class*="content"]',
            'p',
          ];

          for (const aiSel of aiSelectors) {
            const els = modal.querySelectorAll(aiSel);
            if (els.length > 0) {
              const texts = Array.from(els)
                .map(el => (el.textContent || '').trim())
                .filter(t => t.length > 20)
                .join(' ');
              if (texts.length > 20) return texts;
            }
          }

          const allText = (modal.textContent || '').trim();
          return allText.replace(/\s+/g, ' ').trim();
        }, selector);

        if (modalContent && modalContent.length > 20) break;
      } catch {
        continue;
      }
    }

    const closeSelectors = [
      '.ant-modal-close',
      '.ant-drawer-close',
      'button[aria-label="Close"]',
      '.ant-modal-close-x',
      'button.close',
      '[class*="close"]',
    ];

    for (const closeSelector of closeSelectors) {
      const closeBtn = await page.$(closeSelector);
      if (closeBtn) {
        await closeBtn.click().catch(() => {});
        await page.waitForTimeout(500);
        break;
      }
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    if (modalContent && modalContent.length > 20) {
      const cleaned = modalContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);
      console.log(`[detail] 行 ${rowIndex}: 提取到 ${cleaned.length} 字符 AI 分析`);
      return cleaned;
    }

    return '';
  } catch (error) {
    console.log(`[detail] 行 ${rowIndex}: 提取失败 - ${error}`);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
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
        console.log(`[detail] 正在获取 ${project.name} 的 AI 分析...`);
        const aiDescription = await extractDetailDescription(page, i);
        if (aiDescription) {
          project.description = aiDescription;
        }
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
