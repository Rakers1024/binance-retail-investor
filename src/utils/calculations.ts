import { RetailCalculation } from '../types';

export function calculateRetailRatio(
  totalRatio: number,
  bigRatio: number,
  bigProp: number = 0.2
): RetailCalculation {
  const totalLong = totalRatio / (1 + totalRatio);
  const totalShort = 1 - totalLong;

  const bigLong = bigRatio / (1 + bigRatio);
  const bigShort = 1 - bigLong;

  const retailLong = (totalLong - bigLong * bigProp) / (1 - bigProp);
  const retailShort = (totalShort - bigShort * bigProp) / (1 - bigProp);

  const retailRatio = retailLong / retailShort;

  return {
    retailRatio,
    retailLong,
    retailShort
  };
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day}\n${hour}:${minute}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculateMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      result.push(sum / period);
    }
  }

  return result;
}

export interface TrendZone {
  startIndex: number;
  endIndex: number;
  type: 'bullish' | 'bearish';
}

export function calculateSlope(values: number[], startIdx: number, endIdx: number): number {
  if (startIdx >= endIdx || startIdx < 0 || endIdx >= values.length) {
    return 0;
  }

  const x1 = startIdx;
  const x2 = endIdx;
  const y1 = values[startIdx];
  const y2 = values[endIdx];

  return (y2 - y1) / (x2 - x1);
}

export function detectTrendZones(
  retailRatios: number[],
  prices: number[],
  windowSize: number = 2
): TrendZone[] {
  if (retailRatios.length < windowSize * 3 || prices.length < windowSize * 3) {
    return [];
  }

  const zones: TrendZone[] = [];
  let currentType: 'bullish' | 'bearish' | null = null;
  let zoneStart: number | null = null;

  for (let i = windowSize * 2; i < prices.length - windowSize; i++) {
    const prevRetailSlope = calculateSlope(retailRatios, i - windowSize * 2, i - windowSize);
    const currRetailSlope = calculateSlope(retailRatios, i - windowSize, i);

    const prevPriceSlope = calculateSlope(prices, i - windowSize * 2, i - windowSize);
    const currPriceSlope = calculateSlope(prices, i - windowSize, i);

    if (
      prevRetailSlope * currRetailSlope < 0 &&
      prevPriceSlope * currPriceSlope < 0
    ) {
      const newType: 'bullish' | 'bearish' = currPriceSlope > 0 ? 'bullish' : 'bearish';

      if (currentType !== newType) {
        if (zoneStart !== null && currentType !== null) {
          zones.push({
            startIndex: zoneStart,
            endIndex: i - 1,
            type: currentType
          });
        }

        currentType = newType;
        zoneStart = i;
      }
    }
  }

  if (zoneStart !== null && currentType !== null) {
    zones.push({
      startIndex: zoneStart,
      endIndex: prices.length - 1,
      type: currentType
    });
  }

  return zones;
}
