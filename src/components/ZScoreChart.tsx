import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../types';
import { formatTimestamp, formatDate } from '../utils/calculations';

interface ZScoreChartProps {
  data: ChartDataPoint[];
}

function calculateZScore(values: number[]): number[] {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  if (std === 0) return values.map(() => 0);

  return values.map(val => (val - mean) / std);
}

export default function ZScoreChart({ data }: ZScoreChartProps) {
  const option = useMemo(() => {
    if (data.length === 0 || !data[0].price) {
      return {};
    }

    const retailRatios = data.map(d => d.retailRatio);
    const prices = data.map(d => d.price!);
    const ma7Data = data.map(d => d.ma120 || 0);
    const ma25Data = data.map(d => d.ma240 || 0);

    const zRetailRatios = calculateZScore(retailRatios);
    const zPrices = calculateZScore(prices.filter(p => p !== null && p !== undefined));
    const zMa7 = calculateZScore(ma7Data.filter(m => m !== null && m !== undefined && m !== 0));
    const zMa25 = calculateZScore(ma25Data.filter(m => m !== null && m !== undefined && m !== 0));

    const timestamps = data.map(d => formatTimestamp(d.timestamp));

    let ma7Index = 0;
    let ma25Index = 0;
    const zMa7Mapped = data.map(d => d.ma120 ? zMa7[ma7Index++] : null);
    const zMa25Mapped = data.map(d => d.ma240 ? zMa25[ma25Index++] : null);

    const series: any[] = [
      {
        name: '散户多空比 Z-Score',
        type: 'line',
        data: zRetailRatios,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: 'rgb(59, 130, 246)',
          width: 3
        },
        itemStyle: {
          color: 'rgb(59, 130, 246)'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(59, 130, 246, 0.2)'
            }, {
              offset: 1,
              color: 'rgba(59, 130, 246, 0)'
            }]
          }
        }
      },
      {
        name: '价格 Z-Score',
        type: 'line',
        data: zPrices,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#a78bfa',
          width: 2
        },
        itemStyle: {
          color: '#a78bfa'
        }
      }
    ];

    if (zMa7Mapped.some(m => m !== null)) {
      series.push({
        name: 'MA7 Z-Score',
        type: 'line',
        data: zMa7Mapped,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#86efac',
          width: 1.5
        }
      });
    }

    if (zMa25Mapped.some(m => m !== null)) {
      series.push({
        name: 'MA25 Z-Score',
        type: 'line',
        data: zMa25Mapped,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#22c55e',
          width: 1.5
        }
      });
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        borderWidth: 1,
        textStyle: {
          color: '#fff'
        },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';

          const dataIndex = params[0].dataIndex;
          const point = data[dataIndex];

          let tooltip = `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #374151; color: #e5e7eb;">
              ${formatDate(point.timestamp)}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">`;

          params.forEach(param => {
            const absValue = Math.abs(param.value);
            let signal = '';
            if (absValue > 2) signal = ' (极端)';
            else if (absValue > 1) signal = ' (异常)';

            tooltip += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
              <span style="color: ${param.color};">●</span>
              <span style="color: #d1d5db; flex: 1;">${param.seriesName}:</span>
              <span style="color: ${param.color}; font-weight: bold;">${param.value !== null ? param.value.toFixed(3) : 'N/A'}${signal}</span>
            </div>`;
          });

          tooltip += `</div>
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #374151; font-size: 10px; color: #9ca3af;">
              原始值: 散户=${point.retailRatio.toFixed(3)}, 价格=$${point.price?.toFixed(2)}
            </div>
          </div>`;
          return tooltip;
        }
      },
      legend: {
        data: series.map(s => s.name),
        top: 10,
        left: 'center',
        textStyle: {
          color: '#6b7280',
          fontSize: 12
        },
        icon: 'rect',
        itemWidth: 20,
        itemHeight: 3,
        itemGap: 15
      },
      grid: {
        left: '50',
        right: '50',
        top: '40',
        bottom: '40',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Z-Score',
        scale: true,
        axisLabel: {
          formatter: '{value}',
          color: '#9ca3af'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#e5e7eb',
            opacity: 0.2
          }
        }
      },
      series: series,
      visualMap: {
        show: false,
        pieces: [
          { gte: 2, color: '#ef4444' },
          { gt: 1, lt: 2, color: '#f59e0b' },
          { gte: -1, lte: 1, color: '#10b981' },
          { gt: -2, lt: -1, color: '#f59e0b' },
          { lte: -2, color: '#ef4444' }
        ]
      }
    };
  }, [data]);

  if (data.length === 0 || !data[0].price) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        需要价格数据
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
