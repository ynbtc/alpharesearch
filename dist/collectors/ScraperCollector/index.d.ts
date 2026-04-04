import AbstractCollector from "../AbstractCollector";
import { Metrics, MetricsValue } from "../../types/Metrics";
import { Extension } from "../../types/Extension";
import { ProjectInfo } from "../../types/Scrape";
export declare class ScraperCollector extends AbstractCollector {
    private readonly extension;
    private readonly headless;
    private browser;
    private htmlContent;
    private collectedProjects;
    constructor(extension: Extension, headless: boolean);
    start(): Promise<void>;
    validateAndGenerateReport(): Promise<string>;
    stop(): Promise<void>;
    getMetrics(): Metrics;
    getMetricsValue(): MetricsValue;
    getCollectedProjects(): ProjectInfo[];
}
//# sourceMappingURL=index.d.ts.map