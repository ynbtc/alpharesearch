import { type Page } from 'playwright';
import { writeFile } from 'fs/promises';
import { ScrapeResult, ProjectInfo } from '../../../../types/Scrape';

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
      const twitterHandle = rawLines.find(v => v.startsWith('@')) || '';
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

    for (const project of projects) {
      const key = `${project.name}_${project.twitterHandle}`;
      if (!seen.has(key)) {
        seen.add(key);
        allProjects.push(project);
      }
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
