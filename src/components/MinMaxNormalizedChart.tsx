import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../types';
import { formatTimestamp, formatDate } from '../utils/calculations';

interface MinMaxNormalizedChartProps {
  data: ChartDataPoint[];
}

export default function MinMaxNormalizedChart({ data }: MinMaxNormalizedChartProps) {
  const option = useMemo(() => {
    if (data.length === 0 || !data[0].price) {
      return {};
    }

    const retailRatios = data.map(d => d.retailRatio);
    const bigUserRatios = data.map(d => d.bigUserRatio);
    const prices = data.map(d => d.price!).filter(p => p !== null && p !== undefined);
    const ma7Data = data.map(d => d.ma120).filter(m => m !== null && m !== undefined) as number[];
    const ma25Data = data.map(d => d.ma240).filter(m => m !== null && m !== undefined) as number[];

    const minRetailRatio = Math.min(...retailRatios);
    const maxRetailRatio = Math.max(...retailRatios);
    const minBigUserRatio = Math.min(...bigUserRatios);
    const maxBigUserRatio = Math.max(...bigUserRatios);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minMa7 = ma7Data.length > 0 ? Math.min(...ma7Data) : minPrice;
    const maxMa7 = ma7Data.length > 0 ? Math.max(...ma7Data) : maxPrice;
    const minMa25 = ma25Data.length > 0 ? Math.min(...ma25Data) : minPrice;
    const maxMa25 = ma25Data.length > 0 ? Math.max(...ma25Data) : maxPrice;

    const timestamps = data.map(d => formatTimestamp(d.timestamp));
    const normalizedRetailRatio = retailRatios.map(r => ((r - minRetailRatio) / (maxRetailRatio - minRetailRatio)) * 100);
    const normalizedBigUserRatio = bigUserRatios.map(r => ((r - minBigUserRatio) / (maxBigUserRatio - minBigUserRatio)) * 100);
    const normalizedPrice = data.map(d => d.price ? ((d.price - minPrice) / (maxPrice - minPrice)) * 100 : null);
    const normalizedMa7 = data.map(d => d.ma120 ? ((d.ma120 - minMa7) / (maxMa7 - minMa7)) * 100 : null);
    const normalizedMa25 = data.map(d => d.ma240 ? ((d.ma240 - minMa25) / (maxMa25 - minMa25)) * 100 : null);

    const pricesOriginal = data.map(d => d.price ?? null);

    const series: any[] = [
      {
        name: '散户多空比 (归一)',
        type: 'line',
        data: normalizedRetailRatio,
        yAxisIndex: 0,
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
        name: '大户多空比 (归一)',
        type: 'line',
        data: normalizedBigUserRatio,
        yAxisIndex: 0,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#f59e0b',
          width: 2
        },
        itemStyle: {
          color: '#f59e0b'
        }
      },
      {
        name: '价格 (归一)',
        type: 'line',
        data: normalizedPrice,
        yAxisIndex: 0,
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
      },
      {
        name: '价格（原始）',
        type: 'line',
        data: pricesOriginal,
        yAxisIndex: 1,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#fbbf24',
          width: 1.5,
          type: 'dashed'
        }
      }
    ];

    const ma7Original = data.map(d => d.ma120 ?? null);
    const ma25Original = data.map(d => d.ma240 ?? null);

    if (normalizedMa7.some(m => m !== null)) {
      series.push({
        name: 'MA7 (归一)',
        type: 'line',
        data: normalizedMa7,
        yAxisIndex: 0,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#86efac',
          width: 1.5
        }
      });
    }

    if (normalizedMa25.some(m => m !== null)) {
      series.push({
        name: 'MA25 (归一)',
        type: 'line',
        data: normalizedMa25,
        yAxisIndex: 0,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#22c55e',
          width: 1.5
        }
      });
    }

    if (ma7Original.some(m => m !== null)) {
      series.push({
        name: 'MA7（原始）',
        type: 'line',
        data: ma7Original,
        yAxisIndex: 1,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#86efac',
          width: 1,
          type: 'dotted'
        }
      });
    }

    if (ma25Original.some(m => m !== null)) {
      series.push({
        name: 'MA25（原始）',
        type: 'line',
        data: ma25Original,
        yAxisIndex: 1,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#22c55e',
          width: 1,
          type: 'dotted'
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
            tooltip += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
              <span style="color: ${param.color};">●</span>
              <span style="color: #d1d5db; flex: 1;">${param.seriesName}:</span>
              <span style="color: ${param.color}; font-weight: bold;">${param.value !== null ? param.value.toFixed(2) : 'N/A'}</span>
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
        right: '70',
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
      yAxis: [
        {
          type: 'value',
          name: '归一化值 (0-100)',
          position: 'left',
          min: 0,
          max: 100,
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
        {
          type: 'value',
          name: '价格 ($)',
          position: 'right',
          scale: true,
          axisLabel: {
            formatter: '${value}',
            color: '#fbbf24'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#fbbf24'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: series
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
