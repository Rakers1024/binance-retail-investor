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
  price?: number;
}

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}
