import { RatioData } from '../types';

const BINANCE_API_BASE = 'https://fapi.binance.com';

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
