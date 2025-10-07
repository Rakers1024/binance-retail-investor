import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../types';
import { formatTimestamp, formatDate } from '../utils/calculations';

interface PercentChangeChartProps {
  data: ChartDataPoint[];
}

export default function PercentChangeChart({ data }: PercentChangeChartProps) {
  const option = useMemo(() => {
    if (data.length === 0 || !data[0].price) {
      return {};
    }

    const baseRetailRatio = data[0].retailRatio;
    const baseBigUserRatio = data[0].bigUserRatio;
    const basePrice = data[0].price!;

    const timestamps = data.map(d => formatTimestamp(d.timestamp));
    const retailRatioPercent = data.map(d => ((d.retailRatio - baseRetailRatio) / baseRetailRatio) * 100);
    const bigUserRatioPercent = data.map(d => ((d.bigUserRatio - baseBigUserRatio) / baseBigUserRatio) * 100);
    const pricePercent = data.map(d => d.price ? ((d.price - basePrice) / basePrice) * 100 : null);

    const ma7Percent = data.map(d => d.ma120 ? ((d.ma120 - basePrice) / basePrice) * 100 : null);
    const ma25Percent = data.map(d => d.ma240 ? ((d.ma240 - basePrice) / basePrice) * 100 : null);

    const prices = data.map(d => d.price ?? null);

    const series: any[] = [
      {
        name: '散户多空比变化%',
        type: 'line',
        data: retailRatioPercent,
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
        name: '大户多空比变化%',
        type: 'line',
        data: bigUserRatioPercent,
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
        name: '价格变化%',
        type: 'line',
        data: pricePercent,
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
        data: prices,
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

    if (ma7Percent.some(m => m !== null)) {
      series.push({
        name: 'MA7变化%',
        type: 'line',
        data: ma7Percent,
        yAxisIndex: 0,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#86efac',
          width: 1.5
        }
      });
    }

    if (ma25Percent.some(m => m !== null)) {
      series.push({
        name: 'MA25变化%',
        type: 'line',
        data: ma25Percent,
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
              <span style="color: ${param.color}; font-weight: bold;">${param.value !== null ? param.value.toFixed(2) : 'N/A'}%</span>
            </div>`;
          });

          tooltip += '</div></div>';
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
          name: '变化百分比 (%)',
          position: 'left',
          scale: true,
          axisLabel: {
            formatter: '{value}%',
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
