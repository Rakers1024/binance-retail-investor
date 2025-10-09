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
