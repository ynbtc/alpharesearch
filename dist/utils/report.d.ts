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
 * 判断是否为非项目账号
 */
export declare function isNonProjectAccount(project: {
    name: string;
    twitterHandle: string;
    description?: string;
}): boolean;
/**
 * 生成 AlphaRadar 项目研究报告
 * @param projects 项目列表
 * @param date 报告日期
 * @returns 格式化的报告文本
 */
export declare function generateReport(projects: ProjectInfo[], date?: string): string;
/**
 * 验证项目并获取 KOL 数据
 * @param projects 项目列表
 * @returns 验证后的项目列表
 */
export declare function validateProjectsWithKOL(projects: ProjectInfo[]): Promise<ProjectInfo[]>;
/**
 * 保存报告到文件
 */
export declare function saveReport(report: string, filename?: string): string;
export {};
//# sourceMappingURL=report.d.ts.map