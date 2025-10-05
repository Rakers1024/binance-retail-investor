import { useState } from 'react';
import { ChartDataPoint } from '../types';
import { formatTimestamp, formatDate } from '../utils/calculations';

interface LineChartProps {
  data: ChartDataPoint[];
}

export default function LineChart({ data }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        加载数据中...
      </div>
    );
  }

  const maxRatio = Math.max(...data.map(d => Math.max(d.retailRatio, d.totalRatio, d.bigUserRatio)));
  const minRatio = Math.min(...data.map(d => Math.min(d.retailRatio, d.totalRatio, d.bigUserRatio)));
  const range = maxRatio - minRatio;
  const padding = range * 0.1;

  const chartHeight = 280;
  const chartWidth = 1000;
  const leftMargin = 40;
  const rightMargin = 10;
  const chartArea = chartWidth - leftMargin - rightMargin;

  const getY = (value: number) => {
    return chartHeight - ((value - (minRatio - padding)) / (range + padding * 2)) * chartHeight;
  };

  const getX = (index: number) => {
    return leftMargin + (index / (data.length - 1)) * chartArea;
  };

  const createPath = (dataKey: 'retailRatio' | 'totalRatio' | 'bigUserRatio') => {
    return data.map((point, index) => {
      const x = getX(index);
      const y = getY(point[dataKey]);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const svgY = ((event.clientY - rect.top) / rect.height) * chartHeight;

    if (svgX >= leftMargin && svgX <= chartWidth - rightMargin) {
      const relativeX = svgX - leftMargin;
      const pointIndex = Math.round((relativeX / chartArea) * (data.length - 1));

      if (pointIndex >= 0 && pointIndex < data.length) {
        setHoveredPoint(pointIndex);
        setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }
    } else {
      setHoveredPoint(null);
      setMousePosition(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  const gridLines = 5;
  const yAxisValues = Array.from({ length: gridLines }, (_, i) => {
    return minRatio - padding + ((range + padding * 2) / (gridLines - 1)) * i;
  });

  return (
    <div className="relative w-full h-80">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="retailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yAxisValues.map((value, i) => (
          <g key={i}>
            <line
              x1={leftMargin}
              y1={getY(value)}
              x2={chartWidth - rightMargin}
              y2={getY(value)}
              stroke="#e5e7eb"
              strokeWidth="0.2"
            />
            <text
              x={leftMargin - 5}
              y={getY(value)}
              fontSize="12"
              fill="#9ca3af"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {value.toFixed(2)}
            </text>
          </g>
        ))}

        <path
          d={createPath('totalRatio')}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.5"
        />

        <path
          d={createPath('bigUserRatio')}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.5"
        />

        <path
          d={createPath('retailRatio')}
          fill="none"
          stroke="rgb(59, 130, 246)"
          strokeWidth="3"
        />

        <path
          d={`${createPath('retailRatio')} L ${chartWidth - rightMargin} ${chartHeight} L ${leftMargin} ${chartHeight} Z`}
          fill="url(#retailGradient)"
        />

        {hoveredPoint !== null && (
          <>
            <line
              x1={getX(hoveredPoint)}
              y1="0"
              x2={getX(hoveredPoint)}
              y2={chartHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <circle
              cx={getX(hoveredPoint)}
              cy={getY(data[hoveredPoint].retailRatio)}
              r="5"
              fill="rgb(59, 130, 246)"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx={getX(hoveredPoint)}
              cy={getY(data[hoveredPoint].totalRatio)}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx={getX(hoveredPoint)}
              cy={getY(data[hoveredPoint].bigUserRatio)}
              r="4"
              fill="#f59e0b"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-xs text-gray-500">
        {[0, Math.floor(data.length / 2), data.length - 1].map(index => (
          <span key={index}>{formatTimestamp(data[index].timestamp)}</span>
        ))}
      </div>

      <div className="absolute top-0 right-0 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>散户</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500 opacity-50"></div>
          <span>整体</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-amber-500 opacity-50"></div>
          <span>大户</span>
        </div>
      </div>

      {hoveredPoint !== null && mousePosition && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${mousePosition.x + 15}px`,
            top: `${mousePosition.y - 10}px`,
            transform: mousePosition.x > window.innerWidth / 2 ? 'translateX(-100%) translateX(-30px)' : 'none'
          }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[280px] border border-gray-700">
            <div className="font-bold mb-3 text-sm text-gray-200 pb-2 border-b border-gray-700">
              {formatDate(data[hoveredPoint].timestamp)}
            </div>

            <div className="space-y-3">
              <div className="bg-blue-900/30 rounded-lg p-2.5 border border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300 font-semibold text-xs">散户多空比</span>
                  <span className="font-bold text-sm text-blue-200">{data[hoveredPoint].retailRatio.toFixed(3)}</span>
                </div>
                {data[hoveredPoint].retailLong !== undefined && (
                  <div className="flex justify-between text-xs mt-1.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">多头:</span>
                      <span className="text-green-300 font-medium">{data[hoveredPoint].retailLong!.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-gray-300">空头:</span>
                      <span className="text-red-300 font-medium">{data[hoveredPoint].retailShort!.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-green-900/30 rounded-lg p-2.5 border border-green-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-300 font-semibold text-xs">整体多空比</span>
                  <span className="font-bold text-sm text-green-200">{data[hoveredPoint].totalRatio.toFixed(3)}</span>
                </div>
                {data[hoveredPoint].totalLong !== undefined && (
                  <div className="flex justify-between text-xs mt-1.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">多头:</span>
                      <span className="text-green-300 font-medium">{data[hoveredPoint].totalLong!.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-gray-300">空头:</span>
                      <span className="text-red-300 font-medium">{data[hoveredPoint].totalShort!.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-900/30 rounded-lg p-2.5 border border-amber-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-300 font-semibold text-xs">大户多空比</span>
                  <span className="font-bold text-sm text-amber-200">{data[hoveredPoint].bigUserRatio.toFixed(3)}</span>
                </div>
                {data[hoveredPoint].bigUserLong !== undefined && (
                  <div className="flex justify-between text-xs mt-1.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">多头:</span>
                      <span className="text-green-300 font-medium">{data[hoveredPoint].bigUserLong!.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-gray-300">空头:</span>
                      <span className="text-red-300 font-medium">{data[hoveredPoint].bigUserShort!.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
