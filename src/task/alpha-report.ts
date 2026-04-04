import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { getKOLFollowers } from '../utils/frontrun';
import { generateReport } from '../utils/report';
import { ProjectInfo } from '../types/Scrape';

function parseProjectsFromJsonString(raw: string): ProjectInfo[] {
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean);
}

async function run() {
  const [, , inputRaw] = process.argv;
  if (!inputRaw) throw new Error('Missing projects JSON string');

  const projects = parseProjectsFromJsonString(inputRaw);
  console.log(`[alpha-report] loaded ${projects.length} projects`);

  const validated: ProjectInfo[] = [];
  for (const project of projects) {
    const handle = (project.twitterHandle || '').replace(/^@/, '');
    if (!handle) continue;
    const kol = await getKOLFollowers(handle);
    if (kol !== null && kol >= 3) {
      validated.push({ ...project, kolFollowers: kol });
      console.log(`[✓] ${project.name}: ${kol} KOL 关注`);
    }
  }

  const report = generateReport(validated);
  const reportsDir = resolve(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

  const date = new Date().toISOString().split('T')[0];
  const txtPath = resolve(reportsDir, `alpha_report_${date}.txt`);
  const jsonPath = resolve(reportsDir, `alpha_report_${date}.json`);

  writeFileSync(txtPath, report, 'utf8');
  writeFileSync(jsonPath, JSON.stringify({ totalProjects: projects.length, qualifiedProjects: validated.length, projects: validated, report }, null, 2), 'utf8');

  console.log(`[*] 报告已保存: ${txtPath}`);
  console.log(`[*] JSON已保存: ${jsonPath}`);
  console.log(JSON.stringify({ totalProjects: projects.length, qualifiedProjects: validated.length, projects: validated, report }, null, 2));
}

run().catch((err) => {
  process.stderr.write(`[alpha-report] failed: ${err}\n`);
  process.exit(1);
});
