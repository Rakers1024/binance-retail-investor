import { RatioData, KlineData } from '../types';

const BINANCE_API_BASE = 'https://fapi.binance.com';
const BINANCE_SPOT_API = 'https://api.binance.com';

export async function fetchGlobalLongShortRatio(
  symbol: string = 'BTCUSDT',
  period: string = '5m',
  limit: number = 30
): Promise<RatioData[]> {
  const url = `${BINANCE_API_BASE}/futures/data/globalLongShortAccountRatio`;
  const params = new URLSearchParams({
    symbol,
    period,
    limit: limit.toString()
  });

  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchTopTraderLongShortRatio(
  symbol: string = 'BTCUSDT',
  period: string = '5m',
  limit: number = 30
): Promise<RatioData[]> {
  const url = `${BINANCE_API_BASE}/futures/data/topLongShortAccountRatio`;
  const params = new URLSearchParams({
    symbol,
    period,
    limit: limit.toString()
  });

  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchKlineData(
  symbol: string = 'BTCUSDT',
  interval: string = '5m',
  limit: number = 30
): Promise<KlineData[]> {
  const url = `${BINANCE_SPOT_API}/api/v3/klines`;
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: limit.toString()
  });

  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch kline data: ${response.statusText}`);
  }

  const rawData = await response.json();

  return rawData.map((item: any[]) => ({
    openTime: item[0],
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4],
    volume: item[5],
    closeTime: item[6],
    quoteAssetVolume: item[7],
    numberOfTrades: item[8],
    takerBuyBaseAssetVolume: item[9],
    takerBuyQuoteAssetVolume: item[10],
    ignore: item[11]
  }));
}
