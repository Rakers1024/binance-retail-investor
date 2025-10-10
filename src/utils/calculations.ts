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
  retailRatios: (number | null)[],
  prices: (number | null)[],
  minZoneWidth: number = 2
): TrendZone[] {
  if (retailRatios.length < 2 || prices.length < 2 || retailRatios.length !== prices.length) {
    return [];
  }

  const pointClassifications: (('bullish' | 'bearish' | 'neutral') | null)[] = new Array(retailRatios.length).fill(null);

  for (let i = 0; i < retailRatios.length - 1; i++) {
    const currentRetail = retailRatios[i];
    const nextRetail = retailRatios[i + 1];
    const currentPrice = prices[i];
    const nextPrice = prices[i + 1];

    if (currentRetail === null || nextRetail === null || currentPrice === null || nextPrice === null) {
      pointClassifications[i] = null;
      continue;
    }

    const retailSlope = nextRetail - currentRetail;
    const priceSlope = nextPrice - currentPrice;
    const slopeProduct = retailSlope * priceSlope;

    if (slopeProduct < 0) {
      pointClassifications[i] = priceSlope > 0 ? 'bullish' : 'bearish';
    } else {
      pointClassifications[i] = 'neutral';
    }
  }

  if (pointClassifications.length > 0 && pointClassifications[pointClassifications.length - 2] !== null) {
    pointClassifications[pointClassifications.length - 1] = pointClassifications[pointClassifications.length - 2];
  }

  const zones: TrendZone[] = [];
  let currentType: 'bullish' | 'bearish' | 'neutral' | null = null;
  let zoneStart: number | null = null;

  for (let i = 0; i < pointClassifications.length; i++) {
    const classification = pointClassifications[i];

    if (classification === null) {
      if (currentType !== null && zoneStart !== null) {
        zones.push({
          startIndex: zoneStart,
          endIndex: i - 1,
          type: currentType
        });
      }
      currentType = null;
      zoneStart = null;
      continue;
    }

    if (currentType === null) {
      currentType = classification;
      zoneStart = i;
    } else if (classification !== currentType) {
      if (zoneStart !== null) {
        zones.push({
          startIndex: zoneStart,
          endIndex: i - 1,
          type: currentType
        });
      }
      currentType = classification;
      zoneStart = i;
    }
  }

  if (currentType !== null && zoneStart !== null) {
    zones.push({
      startIndex: zoneStart,
      endIndex: pointClassifications.length - 1,
      type: currentType
    });
  }

  return zones.filter(zone => {
    const zoneWidth = zone.endIndex - zone.startIndex + 1;
    return zoneWidth >= minZoneWidth;
  });
}
