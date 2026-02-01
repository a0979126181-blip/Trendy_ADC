export type TrendTab = 'CMF' | 'ID' | 'TOOLING' | 'UX' | 'UI' | 'PACKAGE' | 'VISUAL_COMM' | 'Custom';

export type TimeFrame = 'any' | 'week' | 'month' | 'year' | '3years';

export interface Strategy {
  description: string;
  keywords: string[];
  filterCriteria: string;
}

export interface ReportItem {
  url: string;
  title: string;
  summary: string;
  date: string;       // Added: Article date
  source: string;     // Added: Source name (e.g. "The Verge")
  tags: string[];     // Added: Tags relevant to this specific article
}

export interface ReportResult {
  topics: string[];   // Changed from single tab to array of topics
  reportDate: string;
  items: ReportItem[];
}