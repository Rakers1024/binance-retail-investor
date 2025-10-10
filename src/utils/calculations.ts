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
  type: 'bullish' | 'bearish' | 'neutral';
}

export function detectTrendZones(
  retailRatios: number[],
  prices: number[]
): TrendZone[] {
  if (retailRatios.length < 2 || prices.length < 2) {
    return [];
  }

  const minLength = Math.min(retailRatios.length, prices.length);
  const pointClassifications: ('bullish' | 'bearish' | 'neutral')[] = [];

  for (let i = 0; i < minLength - 1; i++) {
    const retailSlope = retailRatios[i + 1] - retailRatios[i];
    const priceSlope = prices[i + 1] - prices[i];

    const slopeProduct = retailSlope * priceSlope;

    if (slopeProduct < 0) {
      pointClassifications[i] = priceSlope > 0 ? 'bullish' : 'bearish';
    } else {
      pointClassifications[i] = 'neutral';
    }
  }

  if (pointClassifications.length > 0) {
    pointClassifications.push(pointClassifications[pointClassifications.length - 1]);
  }

  const zones: TrendZone[] = [];
  if (pointClassifications.length === 0) {
    return zones;
  }

  let currentType = pointClassifications[0];
  let zoneStart = 0;

  for (let i = 1; i < pointClassifications.length; i++) {
    if (pointClassifications[i] !== currentType) {
      zones.push({
        startIndex: zoneStart,
        endIndex: i - 1,
        type: currentType
      });

      currentType = pointClassifications[i];
      zoneStart = i;
    }
  }

  zones.push({
    startIndex: zoneStart,
    endIndex: pointClassifications.length - 1,
    type: currentType
  });

  return zones;
}
