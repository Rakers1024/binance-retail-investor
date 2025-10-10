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

/**
 * 合并相邻的同类型区间
 */
function mergeAdjacentZones(zones: TrendZone[]): TrendZone[] {
  if (zones.length <= 1) return zones;

  const merged: TrendZone[] = [];
  let current = zones[0];

  for (let i = 1; i < zones.length; i++) {
    const next = zones[i];
    
    // 如果相邻区间类型相同且连续，则合并
    if (current.type === next.type && current.endIndex + 1 >= next.startIndex) {
      current = {
        startIndex: current.startIndex,
        endIndex: Math.max(current.endIndex, next.endIndex),
        type: current.type
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  
  merged.push(current);
  return merged;
}

export function detectTrendZones(
  retailRatios: number[],
  prices: number[],
  windowSize: number = 1
): TrendZone[] {
  const minLength = Math.min(retailRatios.length, prices.length);
  if (minLength < 2) {
    return [];
  }

  const pointZones: TrendZone[] = [];

  // 按时间顺序，依次取两个时间点位数据计算斜率
  for (let i = 1; i < minLength; i++) {
    const retailSlope = calculateSlope(retailRatios, i - 1, i);
    const priceSlope = calculateSlope(prices, i - 1, i);

    const slopeProduct = retailSlope * priceSlope;

    let zoneType: 'bullish' | 'bearish' | 'neutral';

    if (slopeProduct < 0) {
      // 散户多空比斜率 × 价格曲线斜率 < 0
      if (priceSlope > 0) {
        zoneType = 'bullish';  // 涨行情
      } else {
        zoneType = 'bearish'; // 跌行情
      }
    } else {
      // 散户多空比斜率 × 价格曲线斜率 >= 0 (包括 > 0 和 = 0 的情况)
      zoneType = 'neutral'; // 中性区间
    }

    pointZones.push({
      startIndex: i - 1,
      endIndex: i,
      type: zoneType
    });
  }

  // 合并相邻的同类型区间
  const mergedZones = mergeAdjacentZones(pointZones);

  return mergedZones;
}
