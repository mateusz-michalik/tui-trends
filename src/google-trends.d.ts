declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string | string[];
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
    resolution?: string;
    granularTimeResolution?: boolean;
  }

  interface GoogleTrendsApi {
    interestOverTime(options: TrendsOptions): Promise<string>;
    interestByRegion(options: TrendsOptions): Promise<string>;
    relatedQueries(options: TrendsOptions): Promise<string>;
    relatedTopics(options: TrendsOptions): Promise<string>;
    dailyTrends(options: TrendsOptions): Promise<string>;
    realTimeTrends(options: TrendsOptions): Promise<string>;
  }

  const googleTrends: GoogleTrendsApi;
  export = googleTrends;
}
