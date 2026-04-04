type BasicValue = object | number | string | boolean | Array<any>;
export type MetricsValue = BasicValue | Record<string, BasicValue>;
export interface Metrics {
    name: string;
    description?: string;
    value: MetricsValue;
}
export type ScrapeMetricsValue = {
    htmlContent: string;
    projects?: Array<any>;
};
export {};
//# sourceMappingURL=Metrics.d.ts.map