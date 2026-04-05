import { type Page } from 'playwright';
import { getKOLFollowers } from './frontrun';

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

interface ReportProject {
  rank: number;
  name: string;
  twitterHandle: string;
  twitterUrl: string;
  description: string;
  kolFollowers: number;
}

/**
 * 非项目账号关键词黑名单（按 _ - 空格分词后匹配）
 */
const NON_PROJECT_KEYWORDS = [
  'research', 'analyst', 'analysis', 'alerts', 'alpha',
  'trader', 'trading', 'trades', 'capital', 'ventures',
  'vc', 'fund', 'invest', 'investor', 'news', 'media',
  'daily', 'digest', 'calls', 'signal', 'kol', 'host',
  'spaces', 'podcast', 'thread', 'degenerate', 'degen',
];

/**
 * 个人号/非项目号的正则模式
 */
const NON_PROJECT_PATTERNS = [
  /^0x[a-f0-9]{4,}$/i,
  /\.eth$/i,
  /_eth$/i,
  /^(the|ser|mr|ms|dr|prof)/i,
  /guru|master|king|queen|lord|chief/i,
];

/**
 * 判断是否为非项目账号
 */
export function isNonProjectAccount(project: { name: string; twitterHandle: string; description?: string }): boolean {
  const handle = (project.twitterHandle || '').replace('@', '').toLowerCase();
  const name = (project.name || '').toLowerCase();

  const handleWords = handle.split(/[_\s-]+/);
  const nameWords = name.split(/[_\s-]+/);
  const allWords = [...handleWords, ...nameWords];

  for (const word of allWords) {
    if (NON_PROJECT_KEYWORDS.includes(word)) {
      return true;
    }
  }

  for (const pattern of NON_PROJECT_PATTERNS) {
    if (pattern.test(handle) || pattern.test(name)) {
      return true;
    }
  }

  return false;
}

/**
 * 生成 AlphaRadar 项目研究报告
 * @param projects 项目列表
 * @param date 报告日期
 * @returns 格式化的报告文本
 */
export function generateReport(
  projects: ProjectInfo[],
  date: string = new Date().toISOString().split('T')[0]
): string {
  // 筛选早期 Alpha 项目（3 ≤ KOL ≤ 100）
  const qualifiedProjects = projects
    .filter(p => {
      const kol = p.kolFollowers || 0;
      return kol >= 3 && kol <= 100;
    })
    .sort((a, b) => (b.kolFollowers || 0) - (a.kolFollowers || 0))
    .slice(0, 20);

  if (qualifiedProjects.length === 0) {
    return `📊 今日热门项目 (${date})\n\n暂无符合条件的项目（3 ≤ KOL关注数 ≤ 100）`;
  }

  let report = `📊 今日热门项目 (${date})\n`;
  report += `筛选条件：3 ≤ KOL关注数 ≤ 100（早期 Alpha 项目）\n`;
  report += `共计：${qualifiedProjects.length} 个项目\n\n`;

  qualifiedProjects.forEach((project, index) => {
    const rank = index + 1;
    const description = (project.description && project.description.length > 10)
      ? project.description
      : generateDescription(project);

    report += `${rank}、项目名称：${project.name}\n`;
    report += `项目推特：${project.twitterUrl}\n`;
    report += `项目介绍：${description}\n`;
    report += `KOL关注数：${project.kolFollowers}⭐️\n\n`;
  });

  return report.trim();
}

/**
 * 根据项目信息生成描述
 */
function generateDescription(project: ProjectInfo): string {
  // 如果有原始描述，使用原始描述
  if (project.description && project.description.length > 10) {
    return project.description;
  }

  // 根据类型和分类生成描述
  const typeMap: Record<string, string> = {
    'AI': 'AI 驱动的',
    'DeFi': '去中心化金融',
    'NFT': 'NFT 生态',
    'GameFi': '游戏金融',
    'SocialFi': '社交金融',
    'Infrastructure': '基础设施',
  };

  const category = project.category || 'Web3';
  const type = typeMap[project.type] || project.type || '创新';
  
  // 生成描述
  const descriptions = [
    `专注${category}领域的${type}项目`,
    `${type}解决方案，致力于${category}创新`,
    `下一代${category}平台，融合${type}技术`,
    `基于${type}的${category}生态系统`,
    `${category}赛道的${type}基础设施`,
  ];

  // 根据项目名称哈希选择描述
  const hash = project.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return descriptions[hash % descriptions.length];
}

/**
 * 验证项目并获取 KOL 数据
 * @param projects 项目列表
 * @returns 验证后的项目列表
 */
export async function validateProjectsWithKOL(
  projects: ProjectInfo[]
): Promise<ProjectInfo[]> {
  console.log(`[*] 开始验证 ${projects.length} 个项目的 KOL 数据...`);

  const validatedProjects: ProjectInfo[] = [];

  for (const project of projects) {
    if (isNonProjectAccount(project)) {
      console.log(`[✗] ${project.name}: 非项目账号（KOL/媒体/交易员），跳过`);
      continue;
    }

    const kolCount = await getKOLFollowers(project.twitterHandle);

    if (kolCount !== null && kolCount >= 3 && kolCount <= 100) {
      validatedProjects.push({
        ...project,
        kolFollowers: kolCount
      });
      console.log(`[✓] ${project.name}: ${kolCount} KOL 关注`);
    } else if (kolCount !== null && kolCount > 100) {
      console.log(`[✗] ${project.name}: ${kolCount} KOL 关注（> 100，疑似老项目，跳过）`);
    } else if (kolCount !== null && kolCount < 3) {
      console.log(`[✗] ${project.name}: ${kolCount} KOL 关注（< 3，跳过）`);
    } else {
      console.log(`[✗] ${project.name}: API 查询失败`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[*] 验证完成：${validatedProjects.length}/${projects.length} 个项目符合条件（3 ≤ KOL ≤ 100）`);
  return validatedProjects;
}

/**
 * 保存报告到文件
 */
export function saveReport(report: string, filename?: string): string {
  const fs = require('fs');
  const path = require('path');
  
  const outputDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const date = new Date().toISOString().split('T')[0];
  const outputFile = filename || `alpha_report_${date}.txt`;
  const outputPath = path.join(outputDir, outputFile);
  
  fs.writeFileSync(outputPath, report, 'utf-8');
  console.log(`[*] 报告已保存: ${outputPath}`);
  
  return outputPath;
}
