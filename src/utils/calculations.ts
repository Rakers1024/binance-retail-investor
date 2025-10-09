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

export function detectTrendZones(
  retailRatios: number[],
  prices: number[],
  windowSize: number = 2
): TrendZone[] {
  const dataLength = Math.min(retailRatios.length, prices.length);

  if (dataLength < windowSize + 1) {
    return [];
  }

  // 第一步：为每个数据点计算其趋势状态
  const pointStates: ('bullish' | 'bearish' | 'neutral' | null)[] = new Array(dataLength).fill(null);

  for (let i = windowSize; i < dataLength; i++) {
    const retailSlope = calculateSlope(retailRatios, i - windowSize, i);
    const priceSlope = calculateSlope(prices, i - windowSize, i);
    const slopeProduct = retailSlope * priceSlope;

    if (slopeProduct < 0) {
      // 散户和价格反向运动
      const state = priceSlope > 0 ? 'bullish' : 'bearish';
      pointStates[i] = state;

      // 将同一窗口内的所有点都标记为相同状态
      for (let j = i - windowSize; j < i; j++) {
        if (pointStates[j] === null) {
          pointStates[j] = state;
        }
      }
    } else if (slopeProduct > 0) {
      // 散户和价格同向运动
      const state = 'neutral';
      pointStates[i] = state;

      // 将同一窗口内的所有点都标记为相同状态
      for (let j = i - windowSize; j < i; j++) {
        if (pointStates[j] === null) {
          pointStates[j] = state;
        }
      }
    }
    // slopeProduct === 0 时保持 null
  }

  // 第二步：识别连续相同状态的区间
  const zones: TrendZone[] = [];
  let currentType: 'bullish' | 'bearish' | 'neutral' | null = null;
  let zoneStart: number | null = null;

  for (let i = 0; i < dataLength; i++) {
    const state = pointStates[i];

    if (state === null) {
      // 遇到无效点，结束当前区间
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
      // 开始新区间
      currentType = state;
      zoneStart = i;
    } else if (currentType !== state) {
      // 状态改变，结束当前区间，开始新区间
      zones.push({
        startIndex: zoneStart!,
        endIndex: i - 1,
        type: currentType
      });
      currentType = state;
      zoneStart = i;
    }
    // 如果 state === currentType，继续当前区间
  }

  // 处理最后一个区间
  if (currentType !== null && zoneStart !== null) {
    zones.push({
      startIndex: zoneStart,
      endIndex: dataLength - 1,
      type: currentType
    });
  }

  // 第三步：可选的合并相邻同类区间（如果有需要的话）
  // 这里已经保证了区间不重叠，因为我们是逐点处理的

  return zones;
}
