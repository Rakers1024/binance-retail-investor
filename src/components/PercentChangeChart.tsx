import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../types';
import { formatTimestamp, formatDate, detectTrendZones } from '../utils/calculations';

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
    const candlestickData = data.map(d => d.open && d.close && d.low && d.high ? [d.open, d.close, d.low, d.high] : null);
    const volumes = data.map(d => d.volume ?? null);
    const volumeColors = data.map(d => {
      if (d.close && d.open) {
        return d.close >= d.open ? '#22c55e' : '#ef4444';
      }
      return 'rgba(156, 163, 175, 0.5)';
    });

    const trendZones = detectTrendZones(
      retailRatioPercent,
      prices.filter(p => p !== null) as number[],
      1
    );

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
        },
        markArea: markAreas.length > 0 ? {
          silent: true,
          data: markAreas
        } : undefined
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
        type: 'candlestick',
        data: candlestickData,
        yAxisIndex: 1,
        itemStyle: {
          color: '#22c55e',
          color0: '#ef4444',
          borderColor: '#22c55e',
          borderColor0: '#ef4444'
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

    if (volumes.some(v => v !== null)) {
      series.push({
        name: '交易量',
        type: 'bar',
        data: volumes.map((v, i) => ({
          value: v,
          itemStyle: { color: volumeColors[i] }
        })),
        yAxisIndex: 2,
        barMaxWidth: 10
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

          if (point.price) {
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

            if (point.volume) {
              tooltip += `<div style="background: rgba(156, 163, 175, 0.2); padding: 10px; border-radius: 6px; border: 1px solid rgba(156, 163, 175, 0.5); margin-top: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: rgb(209, 213, 219); font-weight: 600; font-size: 11px;">交易量</span>
                  <span style="color: rgb(229, 231, 235); font-weight: bold; font-size: 12px;">${point.volume >= 1000000 ? (point.volume / 1000000).toFixed(2) + 'M' : point.volume >= 1000 ? (point.volume / 1000).toFixed(2) + 'K' : point.volume.toFixed(2)}</span>
                </div>
              </div>`;
            }
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
        right: volumes.some(v => v !== null) ? '140' : '70',
        top: '40',
        bottom: '40',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: true,
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
        },
        ...(volumes.some(v => v !== null) ? [{
          type: 'value',
          name: '交易量',
          position: 'right',
          offset: 60,
          scale: true,
          axisLabel: {
            formatter: (value: number) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toFixed(0);
            },
            color: '#9ca3af'
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#9ca3af'
            }
          },
          splitLine: {
            show: false
          }
        }] : [])
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
