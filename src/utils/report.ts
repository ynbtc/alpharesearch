import { execSync } from 'child_process';
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

/**
 * 非项目账号关键词黑名单
 * 匹配推特用户名(handle)、项目名称(name)中的特征词
 */
const NON_PROJECT_KEYWORDS = [
  // 研究/分析类
  'research', 'analyst', 'analysis',
  // Alpha/信号类
  'alpha', 'alerts', 'calls', 'signal',
  // 交易类
  'trader', 'trading', 'trades',
  // 投资机构类
  'capital', 'ventures', 'vc', 'fund', 'invest', 'investor',
  // 媒体/资讯类
  'news', 'media', 'daily', 'digest', 'report', 'update',
  // KOL/个人品牌类
  'kol', 'host', 'spaces', 'podcast', 'thread',
  // Degen/玩家类
  'degenerate', 'degen',
  // 常见个人号后缀
  'eth', 'nft', 'crypto', 'web3',
];

/**
 * 个人号/非项目号的名称模式（正则）
 */
const NON_PROJECT_PATTERNS = [
  /^0x[a-f0-9]+$/i,                              // 0x 开头的地址风格昵称
  /^\w+\.eth$/i,                                  // ENS 域名风格
  /^\w+_eth$/i,                                   // xxx_eth 风格
  /^[A-Z][a-z]+([A-Z][a-z]+)+$/,                 // CamelCase 个人名 (如 JohnDoe, JohnSmithJones)
  /^(the|ser|mr|ms|dr|prof)\w+/i,                // 个人前缀
  /guru|master|king|queen|lord|chief/i,           // 个人品牌词
];

/**
 * 判断是否为非项目账号（KOL/交易员/博主/媒体/个人号等）
 * 通过将 handle/name 按分隔符拆词后与关键词黑名单精确匹配
 */
export function isNonProjectAccount(project: ProjectInfo): boolean {
  const handle = (project.twitterHandle || '').replace('@', '').toLowerCase();
  const name = (project.name || '').toLowerCase();

  // 将 handle 和 name 按 _、-、空格拆分为独立单词，进行精确匹配
  const handleWords = handle.split(/[_\-\s]+/).filter(Boolean);
  const nameWords = name.split(/[_\-\s]+/).filter(Boolean);

  for (const keyword of NON_PROJECT_KEYWORDS) {
    if (handleWords.includes(keyword) || nameWords.includes(keyword)) {
      return true;
    }
  }

  // 检查正则模式（对完整 handle 和 name 进行匹配）
  for (const pattern of NON_PROJECT_PATTERNS) {
    if (pattern.test(handle) || pattern.test(name)) {
      return true;
    }
  }

  return false;
}

/** Minimum BIO length to be considered valid */
const MIN_BIO_LENGTH = 5;
/** KOL followers per star in report rating */
const KOL_PER_STAR = 20;
/** Maximum stars shown in report */
const MAX_STARS = 5;
/** Valid Twitter handle pattern: alphanumeric and underscores only */
const VALID_HANDLE_RE = /^[A-Za-z0-9_]{1,50}$/;

/**
 * 通过 twitter-cli 获取推特用户 BIO
 * 需要先安装: pip install twitter-cli 或 uv tool install twitter-cli
 * @param handle Twitter 用户名（不含 @）
 * @returns BIO 文本，失败返回 null
 */
async function getTwitterBio(handle: string): Promise<string | null> {
  if (!handle) return null;

  const cleanHandle = handle.replace('@', '').trim();

  // Validate handle to prevent shell command injection
  if (!VALID_HANDLE_RE.test(cleanHandle)) {
    return null;
  }

  try {
    const result = execSync(
      `twitter user ${cleanHandle} --json 2>/dev/null`,
      { timeout: 15000, encoding: 'utf-8' }
    );

    const data = JSON.parse(result);
    const bio = data?.description || data?.bio || data?.user?.description || null;

    if (bio && bio.length > MIN_BIO_LENGTH) {
      console.log(`[bio] ${cleanHandle}: ${bio.substring(0, 50)}...`);
      return bio.trim();
    }
    return null;
  } catch {
    // twitter-cli 未安装或执行失败，静默降级
    return null;
  }
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
    const description = project.description && project.description.length > 10
      ? project.description
      : generateDescription(project);
    const stars = '⭐️'.repeat(Math.min(Math.ceil((project.kolFollowers || 0) / KOL_PER_STAR), MAX_STARS));

    report += `${rank}、项目名称：${project.name}\n`;
    report += `项目推特：${project.twitterUrl}\n`;
    report += `项目介绍：${description}\n`;
    report += `KOL关注数：${project.kolFollowers}${stars}\n\n`;
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
    // 先检查是否为非项目账号（KOL/媒体/交易员等）
    if (isNonProjectAccount(project)) {
      console.log(`[✗] ${project.name}: 非项目账号（KOL/媒体/交易员），跳过`);
      continue;
    }

    const kolCount = await getKOLFollowers(project.twitterHandle);

    if (kolCount !== null && kolCount >= 3 && kolCount <= 100) {
      // 尝试获取 Twitter BIO 作为项目介绍
      const bio = await getTwitterBio(project.twitterHandle);
      validatedProjects.push({
        ...project,
        kolFollowers: kolCount,
        description: bio || project.description,
      });
      console.log(`[✓] ${project.name}: ${kolCount} KOL 关注`);
    } else if (kolCount !== null && kolCount > 100) {
      console.log(`[✗] ${project.name}: ${kolCount} KOL 关注（> 100，疑似老项目，跳过）`);
    } else if (kolCount !== null && kolCount < 3) {
      console.log(`[✗] ${project.name}: ${kolCount} KOL 关注（< 3，跳过）`);
    } else {
      console.log(`[✗] ${project.name}: API 查询失败`);
    }

    // 延迟避免限流
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
