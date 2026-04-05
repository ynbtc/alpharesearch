# AlphaResearch - 早期项目研究工具

import json
import re
import subprocess
import os
from pathlib import Path
from typing import List, Dict, Optional


class AlphaResearch:
    """
    AlphaRadar 早期项目抓取与分析工具
    
    功能：
    1. 从 AlphaRadar 抓取项目列表
    2. 通过 Frontrun.pro API 验证 KOL 关注数
    3. 过滤早期项目（3-100 KOL）
    4. 抓取 Twitter BIO
    5. 输出结构化日报
    """
    
    def __init__(
        self,
        frontrun_api_key: Optional[str] = None,
        twitter_auth_token: Optional[str] = None,
        twitter_ct0: Optional[str] = None
    ):
        """
        初始化
        
        Args:
            frontrun_api_key: Frontrun.pro API Key
            twitter_auth_token: Twitter auth_token (可选)
            twitter_ct0: Twitter ct0 (可选)
        """
        self.frontrun_api_key = frontrun_api_key or os.getenv('FRONTRUN_API_KEY')
        self.twitter_auth_token = twitter_auth_token or os.getenv('TWITTER_AUTH_TOKEN')
        self.twitter_ct0 = twitter_ct0 or os.getenv('TWITTER_CT0')
        
        # 过滤配置
        self.ban_handles = {
            'binancelabs', 'forbes', 'coinank', 'tim_cook', 'pete_rizzo_',
            'debankdefi', 'yieldguild', 'aravsrinivas', 'dogwifcoin',
            'rongplace', 'build_on_bob', 'web3alerts', 'razer'
        }
        self.bad_keywords = [
            'research', 'alert', 'alerts', 'media', 'newsletter',
            'podcast', 'host', 'trader', 'analyst', 'investor',
            'capital', 'ventures', 'fund'
        ]
        self.org_signals = [
            'protocol', 'network', 'app', 'xyz', 'chain', 'finance',
            'money', 'pay', 'dao', 'studio', 'cloud', 'ai', 'build',
            'market', 'wallet', 'infra', 'launch', 'exchange', 'tool',
            'layer', 'play', 'mini', 'mask', 'quest', 'game', 'nft',
            'defi', 'token', 'coin'
        ]
    
    def get_kol_count(self, handle: str) -> int:
        """
        获取 Twitter 账号的 KOL 关注数
        
        Args:
            handle: Twitter handle (如 @Yellow)
            
        Returns:
            KOL 关注数
        """
        if not self.frontrun_api_key:
            raise ValueError("Frontrun API Key 未设置")
            
        h = handle.lstrip('@')
        headers = [
            '-H', 'accept: application/json',
            '-H', f'Authorization: Bearer {self.frontrun_api_key}'
        ]
        cmd = ['curl', '-s', 
               f'https://api.frontrun.pro/api/v1/pro/twitter/{h}/smart-followers/count'] + headers
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        try:
            return int(json.loads(result.stdout).get('data', {}).get('totalCount', 0))
        except:
            return 0
    
    def get_twitter_bio(self, handle: str) -> str:
        """
        获取 Twitter 账号的 BIO
        
        Args:
            handle: Twitter handle
            
        Returns:
            BIO 文本（未翻译）
        """
        if not self.twitter_auth_token or not self.twitter_ct0:
            return ''
            
        h = handle.lstrip('@')
        env_vars = (
            f"export TWITTER_AUTH_TOKEN={self.twitter_auth_token} && "
            f"export TWITTER_CT0={self.twitter_ct0}"
        )
        cmd = f'{env_vars} && cd /tmp/twitter-cli && . .venv/bin/activate && twitter user {h} --json 2>/dev/null'
        
        result = subprocess.run(['bash', '-c', cmd], capture_output=True, text=True)
        try:
            data = json.loads(result.stdout)
            if data.get('ok'):
                return data.get('data', {}).get('bio', '')
        except:
            pass
        return ''
    
    def translate_bio(self, bio: str) -> str:
        """
        将英文 BIO 翻译为中文
        
        Args:
            bio: 英文 BIO
            
        Returns:
            中文翻译
        """
        if not bio:
            return '暂无公开简介'
            
        # 核心词汇翻译映射
        translations = {
            'ecosystem': '生态系统',
            'dedicated to': '致力于',
            'real-time': '实时',
            'non-custodial': '非托管',
            'cross-chain': '跨链',
            'trading': '交易',
            'powered by': '由...提供支持',
            'state channels': '状态通道',
            'token': '代币',
            'next-gen': '下一代',
            'sdk': 'SDK',
            'builders': '开发者',
            'platform': '平台',
            'protocol': '协议',
            'decentralized': '去中心化',
            'finance': '金融',
            'defi': 'DeFi',
            'nft': 'NFT',
            'game': '游戏',
            'gaming': '游戏',
            'metaverse': '元宇宙',
            'web3': 'Web3',
            'ai': 'AI',
            'artificial intelligence': '人工智能',
            'infrastructure': '基础设施',
            'liquidity': '流动性',
            'yield': '收益',
            'staking': '质押',
            'governance': '治理',
            'dao': 'DAO',
            'community': '社区',
            'wallet': '钱包',
            'bridge': '桥',
            'oracle': '预言机',
            'layer': '层',
            'scaling': '扩容',
            'solution': '解决方案',
            'network': '网络',
            'chain': '链',
            'blockchain': '区块链',
            'crypto': '加密',
            'cryptocurrency': '加密货币',
            'digital': '数字',
            'asset': '资产',
            'marketplace': '市场',
            'exchange': '交易所',
            'dex': 'DEX',
            'launchpad': '发射台',
            'incubator': '孵化器',
            'accelerator': '加速器',
            'fund': '基金',
            'venture': '风投',
            'capital': '资本',
            'investment': '投资',
            'research': '研究',
            'analytics': '分析',
            'data': '数据',
            'index': '指数',
            'aggregator': '聚合器',
            'tool': '工具',
            'suite': '套件',
            'dashboard': '仪表盘',
            'interface': '界面',
            'api': 'API',
            'framework': '框架',
            'library': '库',
            'integration': '集成',
            'connector': '连接器',
            'adapter': '适配器',
            'proxy': '代理',
            'relay': '中继',
            'gateway': '网关',
            'router': '路由器',
            'hub': '中心',
            'node': '节点',
            'validator': '验证者',
            'miner': '矿工',
            'staker': '质押者',
            'creator': '创作者',
            'builder': '建设者',
            'developer': '开发者',
            'user': '用户',
            'holder': '持有者',
            'member': '成员',
            'participant': '参与者',
            'contributor': '贡献者',
            'investor': '投资者',
            'trader': '交易员',
            'player': '玩家',
            'gamer': '游戏玩家',
            'collector': '收藏家',
            'artist': '艺术家',
            'designer': '设计师',
            'engineer': '工程师',
            'architect': '架构师',
            'founder': '创始人',
            'team': '团队',
            'company': '公司',
            'organization': '组织',
            'foundation': '基金会',
            'startup': '初创公司',
            'project': '项目',
            'product': '产品',
            'service': '服务',
            'application': '应用',
            'dapp': 'DApp',
            'app': '应用',
            'website': '网站',
            'portal': '门户',
            'system': '系统',
            'environment': '环境',
            'internet': '互联网',
            'web': '网络',
            'cloud': '云',
            'on-chain': '链上',
            'off-chain': '链下',
            'layer 1': '第一层',
            'layer 2': '第二层',
            'layer 3': '第三层',
            'l1': 'L1',
            'l2': 'L2',
            'l3': 'L3',
            'rollup': 'Rollup',
            'sidechain': '侧链',
            'parachain': '平行链',
            'shard': '分片',
        }
        
        result = bio.lower()
        for en, zh in translations.items():
            result = result.replace(en, zh)
        
        # 如果翻译后变化不大，返回原文
        if result == bio.lower():
            return bio
        return result
    
    def should_filter(self, name: str, handle: str) -> bool:
        """
        判断是否应该过滤该项目
        
        Args:
            name: 项目名称
            handle: Twitter handle
            
        Returns:
            True = 应该过滤掉
        """
        handle_clean = handle.lower().lstrip('@')
        
        # 检查黑名单
        if handle_clean in self.ban_handles:
            return True
        
        name_lower = name.lower()
        combined = f'{name_lower} {handle_clean}'
        
        # 检查是否有项目信号词
        has_org = any(s in combined for s in self.org_signals)
        
        if not has_org:
            # 没有项目信号，检查是否有负面关键词
            if any(kw in combined for kw in self.bad_keywords):
                return True
            # 项目名称带空格，可能是个人名字
            if ' ' in name:
                return True
        
        return False
    
    def parse_projects(self, raw_data: List[Dict]) -> List[Dict]:
        """
        解析原始项目数据
        
        Args:
            raw_data: AlphaRadar 原始项目列表
            
        Returns:
            解析后的项目列表
        """
        projects = []
        seen = set()
        
        for p in raw_data:
            # 提取 handle
            h = (p.get('twitterHandle') or '').strip()
            if not h and p.get('twitterUrl'):
                m = re.search(r'(?:twitter|x)\.com/([^/?#]+)', p['twitterUrl'], re.I)
                if m:
                    h = '@' + m.group(1)
            
            if not h:
                continue
            
            # 分离名称和 handle
            name = (p.get('name') or '').strip()
            if '@' in name:
                idx = name.rfind('@')
                maybe = name[idx:]
                if maybe.lower() == h.lower():
                    name = name[:idx].strip()
            
            # 去重
            key = h.lower()
            if key in seen:
                continue
            seen.add(key)
            
            # 过滤
            if self.should_filter(name, h):
                continue
            
            projects.append({
                'name': name,
                'handle': h,
                'twitterUrl': p.get('twitterUrl') or f"https://x.com/{h.lstrip('@')}"
            })
        
        return projects
    
    def get_early_stage_projects(
        self,
        raw_projects: List[Dict],
        min_kol: int = 3,
        max_kol: int = 100,
        limit: int = 20
    ) -> List[Dict]:
        """
        获取早期项目列表（核心方法）
        
        Args:
            raw_projects: AlphaRadar 原始项目数据
            min_kol: 最小 KOL 数
            max_kol: 最大 KOL 数
            limit: 返回项目数量上限
            
        Returns:
            符合条件的项目列表
        """
        # 解析项目
        projects = self.parse_projects(raw_projects)
        
        # 获取 KOL 和 BIO
        results = []
        for p in projects:
            kol = self.get_kol_count(p['handle'])
            if min_kol <= kol <= max_kol:
                bio = self.get_twitter_bio(p['handle'])
                results.append({
                    'name': p['name'],
                    'handle': p['handle'],
                    'twitterUrl': p['twitterUrl'],
                    'bio': self.translate_bio(bio),
                    'kol': kol
                })
        
        # 按 KOL 排序
        results.sort(key=lambda x: -x['kol'])
        return results[:limit]
    
    def generate_report(self, projects: List[Dict]) -> str:
        """
        生成日报
        
        Args:
            projects: 项目列表
            
        Returns:
            格式化的日报文本
        """
        from datetime import datetime
        date_str = datetime.now().strftime('%Y-%m-%d')
        
        lines = [f'📊 今日早期项目 ({date_str})\n']
        
        for i, p in enumerate(projects, 1):
            lines.append(f"{i}、项目名称：{p['name']}")
            lines.append(f"项目推特：{p['twitterUrl']}")
            lines.append(f"项目介绍：{p['bio']}")
            lines.append(f"KOL关注数：{p['kol']}⭐️\n")
        
        return '\n'.join(lines)


def main():
    """主函数 - 示例用法"""
    # 从环境变量读取配置
    ar = AlphaResearch()
    
    # 加载 AlphaRadar 数据（需提前抓取）
    # raw_data = json.loads(Path('alpharadar-projects.json').read_text())
    
    # 获取早期项目
    # projects = ar.get_early_stage_projects(raw_data)
    
    # 生成日报
    # report = ar.generate_report(projects)
    # print(report)
    
    print("AlphaResearch 初始化完成")
    print("请设置环境变量：")
    print("  - FRONTRUN_API_KEY: Frontrun.pro API Key")
    print("  - TWITTER_AUTH_TOKEN: (可选) Twitter auth token")
    print("  - TWITTER_CT0: (可选) Twitter ct0 token")


if __name__ == '__main__':
    main()
