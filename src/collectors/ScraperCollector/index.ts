import { chromium, type BrowserContext } from "playwright";
import { join } from "path";
import AbstractCollector from "../AbstractCollector";
import { Metrics, MetricsValue } from "../../types/Metrics";
import { USER_DATA_PATH, EXTENSIONS_PATH, VIDEO_SIZE, REPORT_PATH } from "../../config";
import { log } from "../../utils/log";
import { Extension } from "../../types/Extension";
import { setExtensionData } from "../../lib/unzipExtension";
import { unlockWallet } from "./unlockWallet";
import { scrape as scrapeAlphaRadar } from "./PageCollector/AlphaRadar";
import { validateProjectsWithKOL, generateReport, saveReport } from "../../utils/report";
import { ProjectInfo } from "../../types/Scrape";

export class ScraperCollector extends AbstractCollector {
  private browser: BrowserContext | null = null;
  private htmlContent = "";
  private collectedProjects: ProjectInfo[] = [];

  constructor(
    private readonly extension: Extension,
    private readonly headless: boolean
  ) {
    super();
    this.extension = extension;
    this.headless = headless;
  }

  async start(): Promise<void> {
    if (!this.extension) {
      throw new Error("No extension installed");
    }

    await setExtensionData(this.extension.extensionId, this.extension.key);
    const extensionId = this.extension.extensionId;
    log(`Start scraping with extension ${extensionId}`);

    const dir = join(EXTENSIONS_PATH, extensionId);
    const options: any = {
      headless: this.headless,
      channel: "chromium",
      args: [
        `--load-extension=${dir}`,
        `--disable-extensions-except=${dir}`,
        "--no-sandbox",
        "--disable-gpu",
      ],
    };

    // 在 headless 模式或 Xvfb 环境下都录制视频
    if (this.headless || process.env.DISPLAY) {
      options.recordVideo = {
        dir: REPORT_PATH,
        size: VIDEO_SIZE,
      };
    }

    const browser = await chromium.launchPersistentContext(USER_DATA_PATH, options);
    const page = await browser.newPage();
    await page.setViewportSize(VIDEO_SIZE);

    this.browser = browser;

    await page.goto(this.extension.home);
    await page.waitForTimeout(5000);
    await unlockWallet(page);

    log("Starting AlphaRadar data collection...");
    const result = await scrapeAlphaRadar(page);

    this.htmlContent = result.htmlContent || "";
    this.collectedProjects = result.projects || [];
    log(`Collected ${this.collectedProjects.length} projects from AlphaRadar`);

    this.setReady(true);
  }

  async validateAndGenerateReport(): Promise<string> {
    if (this.collectedProjects.length === 0) {
      return "No projects collected";
    }

    log("Validating projects with KOL data...");
    const validatedProjects = await validateProjectsWithKOL(this.collectedProjects);
    const report = generateReport(validatedProjects);
    saveReport(report);
    console.log("\n" + "=".repeat(60));
    console.log(report);
    console.log("=".repeat(60) + "\n");
    return report;
  }

  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getMetrics(): Metrics {
    return {
      name: "scraper",
      value: this.getMetricsValue(),
    };
  }

  getMetricsValue(): MetricsValue {
    return {
      htmlContent: this.htmlContent,
      projects: this.collectedProjects,
    } as any;
  }

  getCollectedProjects(): ProjectInfo[] {
    return this.collectedProjects;
  }
}
