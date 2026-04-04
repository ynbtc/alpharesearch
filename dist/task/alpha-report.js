"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const frontrun_1 = require("../utils/frontrun");
const report_1 = require("../utils/report");
function parseProjectsFromJsonString(raw) {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr))
        return [];
    return arr.filter(Boolean);
}
async function run() {
    const [, , inputRaw] = process.argv;
    if (!inputRaw)
        throw new Error('Missing projects JSON string');
    const projects = parseProjectsFromJsonString(inputRaw);
    console.log(`[alpha-report] loaded ${projects.length} projects`);
    const validated = [];
    for (const project of projects) {
        const handle = (project.twitterHandle || '').replace(/^@/, '');
        if (!handle)
            continue;
        const kol = await (0, frontrun_1.getKOLFollowers)(handle);
        if (kol !== null && kol >= 3) {
            validated.push({ ...project, kolFollowers: kol });
            console.log(`[✓] ${project.name}: ${kol} KOL 关注`);
        }
    }
    const report = (0, report_1.generateReport)(validated);
    const reportsDir = (0, path_1.resolve)(process.cwd(), 'reports');
    if (!(0, fs_1.existsSync)(reportsDir))
        (0, fs_1.mkdirSync)(reportsDir, { recursive: true });
    const date = new Date().toISOString().split('T')[0];
    const txtPath = (0, path_1.resolve)(reportsDir, `alpha_report_${date}.txt`);
    const jsonPath = (0, path_1.resolve)(reportsDir, `alpha_report_${date}.json`);
    (0, fs_1.writeFileSync)(txtPath, report, 'utf8');
    (0, fs_1.writeFileSync)(jsonPath, JSON.stringify({ totalProjects: projects.length, qualifiedProjects: validated.length, projects: validated, report }, null, 2), 'utf8');
    console.log(`[*] 报告已保存: ${txtPath}`);
    console.log(`[*] JSON已保存: ${jsonPath}`);
    console.log(JSON.stringify({ totalProjects: projects.length, qualifiedProjects: validated.length, projects: validated, report }, null, 2));
}
run().catch((err) => {
    process.stderr.write(`[alpha-report] failed: ${err}\n`);
    process.exit(1);
});
//# sourceMappingURL=alpha-report.js.map