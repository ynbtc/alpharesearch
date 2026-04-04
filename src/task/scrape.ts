import { EXTENSIONS } from "../config";
import { log } from "../utils/log";
import { ScraperCollector } from "../collectors/ScraperCollector";
import { MetricsRegistry } from "../registry/MetricsRegistry";

async function run() {
  const [, , extensionId, , headless] = process.argv;
  const extension = EXTENSIONS.find((data) => data.extensionId === extensionId);
  if (extension) {
    const registry = new MetricsRegistry();
    const scraperCollector = new ScraperCollector(
      extension,
      headless === "true"
    );
    await registry.register(scraperCollector);

    const timer = setTimeout(async () => {
      clearTimeout(timer);
      await registry.stopAll();
      const reportData = registry.exportMetricsValue() as Record<string, any>;
      const payload = {
        scrape: reportData,
      };
      console.log(JSON.stringify(payload, null, 2));
    }, 1000);
  } else {
    log("ExtensionId invalid");
  }
}

(async () => {
  try {
    await run();
  } catch (error) {
    process.stderr.write(`Run scrape error: ${error}\n`);
  }
})();
