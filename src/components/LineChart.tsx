import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../types';
import { formatTimestamp, formatDate, detectTrendZones } from '../utils/calculations';

interface LineChartProps {
  data: ChartDataPoint[];
  showPrice: boolean;
}

export default function LineChart({ data, showPrice }: LineChartProps) {
  const option = useMemo(() => {
    if (data.length === 0) {
      return {};
    }

    const timestamps = data.map(d => formatTimestamp(d.timestamp));
    const retailRatios = data.map(d => d.retailRatio);
    const totalRatios = data.map(d => d.totalRatio);
    const bigUserRatios = data.map(d => d.bigUserRatio);
    const prices = data.map(d => d.price ?? null);
    const ma120 = data.map(d => d.ma120 ?? null);
    const ma240 = data.map(d => d.ma240 ?? null);

    const trendZones = showPrice && prices.some(p => p !== null)
      ? detectTrendZones(retailRatios, prices.filter(p => p !== null) as number[], 1)
      : [];

    const markAreas = trendZones.map((zone, index) => {
      const isLastZone = index === trendZones.length - 1;

      return [
        {
          xAxis: zone.startIndex,
          itemStyle: {
            color: isLastZone
              ? zone.type === 'bullish'
                ? 'rgba(59, 130, 246, 0.25)'
                : zone.type === 'bearish'
                ? 'rgba(59, 130, 246, 0.25)'
                : 'rgba(59, 130, 246, 0.15)'
              : zone.type === 'bullish'
              ? 'rgba(34, 197, 94, 0.15)'
              : zone.type === 'bearish'
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(156, 163, 175, 0.08)'
          }
        },
        {
          xAxis: zone.endIndex,
          label: {
            show: zone.type !== 'neutral',
            position: 'insideTop',
            formatter: zone.type === 'bullish' ? '涨行情' : zone.type === 'bearish' ? '跌行情' : '',
            color: isLastZone
              ? '#3b82f6'
              : zone.type === 'bullish' ? '#22c55e' : zone.type === 'bearish' ? '#ef4444' : '#9ca3af',
            fontSize: 11,
            fontWeight: 'bold'
          }
        }
      ];
    });

    const series: any[] = [
      {
        name: '散户',
        type: 'line',
        data: retailRatios,
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
              color: 'rgba(59, 130, 246, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(59, 130, 246, 0)'
            }]
          }
        },
        markArea: markAreas.length > 0 ? {
          silent: true,
          data: markAreas
        } : undefined
      },
      {
        name: '整体',
        type: 'line',
        data: totalRatios,
        yAxisIndex: 0,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#10b981',
          width: 2
        },
        itemStyle: {
          color: '#10b981'
        }
      },
      {
        name: '大户',
        type: 'line',
        data: bigUserRatios,
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
      }
    ];

    if (showPrice && prices.some(p => p !== null)) {
      series.push({
        name: '价格',
        type: 'line',
        data: prices,
        yAxisIndex: 1,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#a78bfa',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#a78bfa'
        }
      });

      if (ma120.some(m => m !== null)) {
        series.push({
          name: 'MA7',
          type: 'line',
          data: ma120,
          yAxisIndex: 1,
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: '#86efac',
            width: 1.5
          }
        });
      }

      if (ma240.some(m => m !== null)) {
        series.push({
          name: 'MA25',
          type: 'line',
          data: ma240,
          yAxisIndex: 1,
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: '#22c55e',
            width: 1.5
          }
        });
      }
    }

    const yAxis: any[] = [
      {
        type: 'value',
        name: '多空比',
        position: 'left',
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
      }
    ];

    if (showPrice && prices.some(p => p !== null)) {
      yAxis.push({
        type: 'value',
        name: '价格',
        position: 'right',
        scale: true,
        axisLabel: {
          formatter: '${value}',
          color: '#a78bfa'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#a78bfa'
          }
        },
        splitLine: {
          show: false
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
            <div style="display: flex; flex-direction: column; gap: 12px;">`;

          tooltip += `<div style="background: rgba(59, 130, 246, 0.2); padding: 10px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.5);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: rgb(147, 197, 253); font-weight: 600; font-size: 11px;">散户多空比</span>
              <span style="color: rgb(191, 219, 254); font-weight: bold; font-size: 12px;">${point.retailRatio.toFixed(3)}</span>
            </div>
            ${point.retailLong !== undefined ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80;"></div>
                <span style="color: #d1d5db;">多头:</span>
                <span style="color: #86efac; font-weight: 500;">${point.retailLong.toFixed(1)}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #f87171;"></div>
                <span style="color: #d1d5db;">空头:</span>
                <span style="color: #fca5a5; font-weight: 500;">${point.retailShort!.toFixed(1)}%</span>
              </div>
            </div>` : ''}
          </div>`;

          tooltip += `<div style="background: rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.5);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: rgb(110, 231, 183); font-weight: 600; font-size: 11px;">整体多空比</span>
              <span style="color: rgb(167, 243, 208); font-weight: bold; font-size: 12px;">${point.totalRatio.toFixed(3)}</span>
            </div>
            ${point.totalLong !== undefined ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80;"></div>
                <span style="color: #d1d5db;">多头:</span>
                <span style="color: #86efac; font-weight: 500;">${point.totalLong.toFixed(1)}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #f87171;"></div>
                <span style="color: #d1d5db;">空头:</span>
                <span style="color: #fca5a5; font-weight: 500;">${point.totalShort!.toFixed(1)}%</span>
              </div>
            </div>` : ''}
          </div>`;

          tooltip += `<div style="background: rgba(245, 158, 11, 0.2); padding: 10px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.5);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: rgb(252, 211, 77); font-weight: 600; font-size: 11px;">大户多空比</span>
              <span style="color: rgb(253, 230, 138); font-weight: bold; font-size: 12px;">${point.bigUserRatio.toFixed(3)}</span>
            </div>
            ${point.bigUserLong !== undefined ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80;"></div>
                <span style="color: #d1d5db;">多头:</span>
                <span style="color: #86efac; font-weight: 500;">${point.bigUserLong.toFixed(1)}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #f87171;"></div>
                <span style="color: #d1d5db;">空头:</span>
                <span style="color: #fca5a5; font-weight: 500;">${point.bigUserShort!.toFixed(1)}%</span>
              </div>
            </div>` : ''}
          </div>`;

          if (showPrice && point.price) {
            tooltip += `<div style="background: rgba(167, 139, 250, 0.2); padding: 10px; border-radius: 6px; border: 1px solid rgba(167, 139, 250, 0.5);">
              <div style="display: flex; justify-content: space-between; margin-bottom: ${point.ma120 || point.ma240 ? '8px' : '0'};">
                <span style="color: rgb(196, 181, 253); font-weight: 600; font-size: 11px;">价格</span>
                <span style="color: rgb(221, 214, 254); font-weight: bold; font-size: 12px;">$${point.price.toFixed(2)}</span>
              </div>
              ${point.ma120 ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                <span style="color: rgb(134, 239, 172);">MA7:</span>
                <span style="color: rgb(187, 247, 208); font-weight: 500;">$${point.ma120.toFixed(2)}</span>
              </div>` : ''}
              ${point.ma240 ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span style="color: rgb(34, 197, 94);">MA25:</span>
                <span style="color: rgb(134, 239, 172); font-weight: 500;">$${point.ma240.toFixed(2)}</span>
              </div>` : ''}
            </div>`;
          }

          tooltip += '</div></div>';
          return tooltip;
        }
      },
      legend: {
        data: series.map(s => ({
          name: s.name,
          icon: 'rect',
          itemStyle: {
            color: s.lineStyle?.color || s.itemStyle?.color
          }
        })),
        top: 10,
        left: 'center',
        textStyle: {
          color: '#6b7280',
          fontSize: 12
        },
        itemWidth: 20,
        itemHeight: 3,
        itemGap: 15
      },
      grid: {
        left: '50',
        right: showPrice ? '70' : '10',
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
          fontSize: 10,
          interval: 0,
          rotate: 0,
          formatter: (value: string) => value
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: yAxis,
      series: series
    };
  }, [data, showPrice]);

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        加载数据中...
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
