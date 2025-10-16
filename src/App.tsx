import { useEffect, useState } from 'react';
import { TrendingUp, Users, Building2, RefreshCw, ChevronDown, ChevronUp, Sun, Moon, Monitor } from 'lucide-react';
import RatioCard from './components/RatioCard';
import LineChart from './components/LineChart';
import PercentChangeChart from './components/PercentChangeChart';
import MinMaxNormalizedChart from './components/MinMaxNormalizedChart';
import ZScoreChart from './components/ZScoreChart';
import { fetchGlobalLongShortRatio, fetchTopTraderLongShortRatio, fetchKlineData } from './services/binance';
import { calculateRetailRatio, calculateMA, detectTrendZones } from './utils/calculations';
import { RatioData, ChartDataPoint } from './types';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [customSymbol, setCustomSymbol] = useState('');
  const [period, setPeriod] = useState('1h');
  const [bigUserProportion, setBigUserProportion] = useState(0.2);
  const [showPrice, setShowPrice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [globalData, setGlobalData] = useState<RatioData | null>(null);
  const [topTraderData, setTopTraderData] = useState<RatioData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [expandedCharts, setExpandedCharts] = useState<{ [key: string]: boolean }>({
    raw: false,
    percent: false,
    minmax: false
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [periodTrends, setPeriodTrends] = useState<{ [key: string]: 'bullish' | 'bearish' | 'neutral' | null }>({});

  const toggleChart = (chartKey: string) => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartKey]: !prev[chartKey]
    }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />;
      case 'dark':
        return <Moon size={20} />;
      case 'system':
        return <Monitor size={20} />;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = [
        fetchGlobalLongShortRatio(symbol, period, 30),
        fetchTopTraderLongShortRatio(symbol, period, 30)
      ];

      if (showPrice) {
        promises.push(fetchKlineData(symbol, period, 1000));
      }

      const results = await Promise.all(promises);
      const globalRatios = results[0] as any[];
      const topTraderRatios = results[1] as any[];
      const klineData = showPrice && results[2] ? results[2] as any[] : null;

      if (globalRatios.length > 0 && topTraderRatios.length > 0) {
        setGlobalData(globalRatios[globalRatios.length - 1]);
        setTopTraderData(topTraderRatios[topTraderRatios.length - 1]);

        let ma120Values: (number | null)[] = [];
        let ma240Values: (number | null)[] = [];

        if (klineData && klineData.length > 0) {
          const allPrices = klineData.map((k: any) => parseFloat(k.close));
          const allMA7 = calculateMA(allPrices, 7);
          const allMA25 = calculateMA(allPrices, 25);

          const startIndex = klineData.length - globalRatios.length;
          ma120Values = allMA7.slice(startIndex);
          ma240Values = allMA25.slice(startIndex);
        }

        const chartPoints: ChartDataPoint[] = globalRatios.map((global, index) => {
          const topTrader = topTraderRatios[index];
          if (!topTrader) return null;

          const totalRatio = parseFloat(global.longShortRatio);
          const bigUserRatio = parseFloat(topTrader.longShortRatio);
          const retail = calculateRetailRatio(totalRatio, bigUserRatio, bigUserProportion);

          const kline = klineData ? klineData[klineData.length - globalRatios.length + index] : null;
          const price = kline ? parseFloat(kline.close) : undefined;
          const volume = kline ? parseFloat(kline.volume) : undefined;

          return {
            timestamp: global.timestamp,
            retailRatio: retail.retailRatio,
            totalRatio,
            bigUserRatio,
            retailLong: retail.retailLong * 100,
            retailShort: retail.retailShort * 100,
            totalLong: parseFloat(global.longAccount) * 100,
            totalShort: parseFloat(global.shortAccount) * 100,
            bigUserLong: parseFloat(topTrader.longAccount) * 100,
            bigUserShort: parseFloat(topTrader.shortAccount) * 100,
            price,
            ma120: ma120Values[index],
            ma240: ma240Values[index],
            volume
          };
        }).filter(Boolean) as ChartDataPoint[];

        setChartData(chartPoints);
        setLastUpdate(new Date());

        // 计算当前周期的最新行情趋势
        if (showPrice && chartPoints.length > 0 && chartPoints[0].price) {
          const retailRatios = chartPoints.map(d => d.retailRatio);
          const prices = chartPoints.map(d => d.price!).filter(p => p !== null && p !== undefined);
          const trendZones = detectTrendZones(retailRatios, prices, 1);

          // 获取最后一个趋势区间的类型
          if (trendZones.length > 0) {
            const lastZone = trendZones[trendZones.length - 1];
            setPeriodTrends(prev => ({
              ...prev,
              [period]: lastZone.type
            }));
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [symbol, period, bigUserProportion, showPrice]);

  const retailData = globalData && topTraderData
    ? calculateRetailRatio(
        parseFloat(globalData.longShortRatio),
        parseFloat(topTraderData.longShortRatio),
        bigUserProportion
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              加密货币散户多空比监控面板
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              实时监控散户交易者的多空情绪变化
            </p>
          </div>
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
            title={`当前主题: ${theme === 'system' ? '跟随系统' : theme === 'light' ? '浅色' : '深色'}`}
          >
            {getThemeIcon()}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6 transition-colors">
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                交易对
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setSymbol(s);
                      setCustomSymbol('');
                      setPeriodTrends({});
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      symbol === s && !customSymbol
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {s.replace('USDT', '/USDT')}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">或</span>
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setCustomSymbol(value);
                      if (value) {
                        setSymbol(value);
                        setPeriodTrends({});
                      }
                    }}
                    placeholder="输入其他交易对，如 LINKUSDT"
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[240px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  时间周期
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '5m', label: '5分' },
                    { value: '15m', label: '15分' },
                    { value: '30m', label: '30分' },
                    { value: '1h', label: '1小时' },
                    { value: '2h', label: '2小时' },
                    { value: '4h', label: '4小时' },
                    { value: '6h', label: '6小时' },
                    { value: '12h', label: '12小时' },
                    { value: '1d', label: '1日' }
                  ].map(option => {
                    const trend = periodTrends[option.value];
                    const isActive = period === option.value;

                    let buttonClass = 'px-3 py-2 rounded-lg font-medium transition-all text-sm ';

                    if (isActive) {
                      buttonClass += 'bg-blue-600 text-white shadow-md';
                    } else if (trend === 'bullish') {
                      buttonClass += 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500 dark:border-green-600 hover:bg-green-200 dark:hover:bg-green-900/40';
                    } else if (trend === 'bearish') {
                      buttonClass += 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-900/40';
                    } else {
                      buttonClass += 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600';
                    }

                    return (
                      <button
                        key={option.value}
                        onClick={() => setPeriod(option.value)}
                        className={buttonClass}
                        title={trend === 'bullish' ? '涨行情' : trend === 'bearish' ? '跌行情' : undefined}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    大户占比 ({(bigUserProportion * 100).toFixed(0)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={bigUserProportion}
                    onChange={(e) => setBigUserProportion(parseFloat(e.target.value))}
                    className="w-40"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPrice"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="showPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    显示价格曲线
                  </label>
                </div>

                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  刷新
                </button>

                {lastUpdate && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 lg:ml-auto whitespace-nowrap">
                    最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {retailData && (
            <RatioCard
              title="散户多空比"
              ratio={retailData.retailRatio}
              longPercent={retailData.retailLong}
              shortPercent={retailData.retailShort}
              icon={<Users size={24} />}
              highlight={true}
            />
          )}

          {globalData && (
            <RatioCard
              title="整体多空比"
              ratio={parseFloat(globalData.longShortRatio)}
              longPercent={parseFloat(globalData.longAccount)}
              shortPercent={parseFloat(globalData.shortAccount)}
              icon={<TrendingUp size={24} />}
            />
          )}

          {topTraderData && (
            <RatioCard
              title="大户多空比"
              ratio={parseFloat(topTraderData.longShortRatio)}
              longPercent={parseFloat(topTraderData.longAccount)}
              shortPercent={parseFloat(topTraderData.shortAccount)}
              icon={<Building2 size={24} />}
            />
          )}
        </div>

        {showPrice && chartData.length > 0 && chartData[0].price && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 h-[600px] flex flex-col transition-colors">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Z-Score 标准化图（高级）
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                考虑均值和标准差，突出异常偏离。|Z| &gt; 1 为异常，|Z| &gt; 2 为极端信号
              </p>
            </div>
            <div className="flex-1">
              <ZScoreChart data={chartData} />
            </div>
          </div>
        )}

        {!showPrice && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 h-[600px] flex flex-col transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              散户多空比走势图（原始数据 - 双Y轴）
            </h2>
            <div className="flex-1">
              <LineChart data={chartData} showPrice={showPrice} />
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
            <button
              onClick={() => toggleChart('raw')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-gray-100"
            >
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  散户多空比走势图（原始数据 - 双Y轴）
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  原始多空比数据和价格曲线的双Y轴展示
                </p>
              </div>
              {expandedCharts.raw ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedCharts.raw && (
              <div className="px-6 pb-6 h-[600px]">
                <LineChart data={chartData} showPrice={showPrice} />
              </div>
            )}
          </div>

          {showPrice && chartData.length > 0 && chartData[0].price && (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
                <button
                  onClick={() => toggleChart('percent')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-gray-100"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      百分比变化归一化图（推荐）
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      从起点计算变化百分比，统一尺度。金叉（蓝线上穿紫线）= 潜在上涨，死叉 = 转跌
                    </p>
                  </div>
                  {expandedCharts.percent ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedCharts.percent && (
                  <div className="px-6 pb-6 h-[600px]">
                    <PercentChangeChart data={chartData} />
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
                <button
                  onClick={() => toggleChart('minmax')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-gray-100"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Min-Max 归一化图（0-100）
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      将所有数据缩放到0-100范围，交叉点清晰可见，适合查看历史全貌
                    </p>
                  </div>
                  {expandedCharts.minmax ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedCharts.minmax && (
                  <div className="px-6 pb-6 h-[600px]">
                    <MinMaxNormalizedChart data={chartData} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 transition-colors">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">说明</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• 散户多空比 = 通过整体多空比和大户多空比计算得出的散户交易者多空情绪</li>
            <li>• 数值大于1表示多头占优，小于1表示空头占优</li>
            <li>• 数据来源于币安永续合约市场，每{
              period === '5m' ? '5分钟' :
              period === '15m' ? '15分钟' :
              period === '30m' ? '30分钟' :
              period === '1h' ? '1小时' :
              period === '2h' ? '2小时' :
              period === '4h' ? '4小时' :
              period === '6h' ? '6小时' :
              period === '12h' ? '12小时' :
              '1天'
            }更新一次</li>
            <li>• 大户占比可调整，默认20%，用于计算散户数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
