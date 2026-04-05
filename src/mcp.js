#!/usr/bin/env node
/**
 * AlphaResearch MCP Server
 * 为 Claude Code 提供 AlphaRadar 数据采集能力
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// 工具定义
const TOOLS = [
  {
    name: 'collect_alpharadar_projects',
    description: '采集 AlphaRadar 上的早期项目信息',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'early-stage', 'high-score'],
          description: '筛选条件'
        },
        min_kol_followers: {
          type: 'number',
          default: 3,
          description: '最小 KOL 关注数'
        }
      }
    }
  },
  {
    name: 'verify_kol_followers',
    description: '使用 Frontrun.pro API 验证项目 KOL 关注数',
    inputSchema: {
      type: 'object',
      properties: {
        twitter_handle: {
          type: 'string',
          description: 'Twitter 用户名（不含 @）'
        }
      },
      required: ['twitter_handle']
    }
  },
  {
    name: 'generate_project_report',
    description: '生成项目研究报告',
    inputSchema: {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              twitter_url: { type: 'string' },
              score: { type: 'string' },
              kol_followers: { type: 'number' }
            }
          }
        }
      },
      required: ['projects']
    }
  }
];

// 创建 MCP Server
const server = new Server(
  {
    name: 'alpharesearch-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 列出可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'collect_alpharadar_projects':
      return await collectProjects(args);
    
    case 'verify_kol_followers':
      return await verifyKOL(args.twitter_handle);
    
    case 'generate_project_report':
      return await generateReport(args.projects);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 采集项目
async function collectProjects(args) {
  const { filter = 'all', min_kol_followers = 3 } = args;
  
  // 这里调用 AlphaResearch 的采集逻辑
  // 简化版：返回示例数据
  const projects = [
    {
      name: 'Surgexyz_',
      twitter_url: 'https://x.com/Surgexyz_',
      twitter_handle: 'Surgexyz_',
      score: '85',
      time: '1h',
      followers: '12.5k'
    },
    {
      name: 'fair_vc',
      twitter_url: 'https://x.com/fair_vc',
      twitter_handle: 'fair_vc',
      score: '72',
      time: '2h',
      followers: '8.3k'
    }
  ];

  return {
    content: [
      {
        type: 'text',
        text: `采集到 ${projects.length} 个项目（筛选条件: ${filter}）\n\n${JSON.stringify(projects, null, 2)}`
      }
    ]
  };
}

// 验证 KOL 关注数
async function verifyKOL(twitterHandle) {
  const apiKey = process.env.FRONTRUN_API_KEY;
  
  try {
    const response = await fetch(
      `https://api.frontrun.pro/api/v1/pro/twitter/${twitterHandle}/smart-followers/count`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Copilot-Client-Language': 'ZH_CN',
          'X-Copilot-Client-Platform': 'CHROME_EXTENSION',
          'X-Copilot-Client-Version': '1.0.0'
        }
      }
    );
    
    const data = await response.json();
    const count = data?.data?.totalCount || 0;
    
    return {
      content: [
        {
          type: 'text',
          text: `Twitter @${twitterHandle} 的 KOL 关注数: ${count}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `验证失败: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

// 生成报告
async function generateReport(projects) {
  const report = projects.map((p, i) => `
${i + 1}、项目名称：${p.name}
项目推特：${p.twitter_url}
项目介绍：${getDescription(p.score)}
AlphaRadar评分: ${p.score}
KOL关注数：${p.kol_followers || '待验证'}⭐️
`).join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `📊 项目研究报告\n\n${report}`
      }
    ]
  };
}

function getDescription(score) {
  const num = parseInt(score) || 0;
  if (num >= 80) return '高质量项目，社区活跃度高，值得关注';
  if (num >= 60) return '新兴项目，具有一定潜力，建议观察';
  return '早期项目，创新概念，风险与机会并存';
}

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AlphaResearch MCP Server running on stdio');
}

main().catch(console.error);
