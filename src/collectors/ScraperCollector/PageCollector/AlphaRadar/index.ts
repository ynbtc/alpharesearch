import { type Page } from 'playwright';
import { ScrapeResult } from '../../../../types/Scrape';

const url = 'https://alpharadar.io/twitter';

interface ProjectInfo {
  name: string;
  twitterHandle: string;
  twitterUrl: string;
  description: string;
  score: string;
  followers: string;
  time: string;
  status: string;
  type: string;
  category: string;
  kolFollowers?: number;
}

async function extractProjects(page: Page): Promise<ProjectInfo[]> {
  await page.waitForSelector('table tbody tr', { timeout: 30000 });

  const projects = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const data: any[] = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const nameCell = cells[0];
        const nameText = nameCell.textContent?.trim() || '';
        const nameParts = nameText.split('\n').map(s => s.trim()).filter(s => s);

        const projectName = nameParts[0] || '';
        const twitterHandle = nameParts[1] || '';

        const twitterLink = nameCell.querySelector('a[href*="x.com"], a[href*="twitter.com"]');
        const twitterUrl = twitterLink?.getAttribute('href') || `https://x.com/${twitterHandle.replace('@', '')}`;

        data.push({
          name: projectName,
          twitterHandle: twitterHandle,
          twitterUrl: twitterUrl,
          time: cells[1]?.textContent?.trim() || '',
          score: cells[2]?.textContent?.trim() || '',
          followers: cells[3]?.textContent?.trim() || '',
          status: cells[4]?.textContent?.trim() || '',
          type: cells[5]?.textContent?.trim() || '',
          category: cells[6]?.textContent?.trim() || '',
        });
      }
    });

    return data;
  });

  return projects;
}

async function navigateToNextPage(page: Page): Promise<boolean> {
  try {
    const nextBtn = await page.$('button.ant-pagination-next:not([disabled])');
    if (!nextBtn) return false;

    await nextBtn.click();
    await page.waitForTimeout(3000);
    return true;
  } catch {
    return false;
  }
}

export const scrape = async (page: Page): Promise<ScrapeResult> => {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/tmp/alpharesearch-debug.png', fullPage: true }).catch(() => {});

  const content = await page.content();
  if (!content.includes('table') || !content.includes('tbody')) {
    console.log('[alpharadar] page content preview:', content.slice(0, 1200));
    return { htmlContent: content };
  }

  const allProjects: ProjectInfo[] = [];
  const seen = new Set<string>();

  for (let pageNum = 1; pageNum <= 50; pageNum++) {
    console.log(`[*] 采集第 ${pageNum} 页...`);

    const projects = await extractProjects(page);

    for (const project of projects) {
      const key = `${project.name}_${project.twitterHandle}`;
      if (!seen.has(key) && project.name) {
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
