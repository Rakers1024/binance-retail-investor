export interface RatioData {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}

export interface RetailCalculation {
  retailRatio: number;
  retailLong: number;
  retailShort: number;
}

export interface ChartDataPoint {
  timestamp: number;
  retailRatio: number;
  totalRatio: number;
  bigUserRatio: number;
  retailLong?: number;
  retailShort?: number;
  totalLong?: number;
  totalShort?: number;
  bigUserLong?: number;
  bigUserShort?: number;
}
