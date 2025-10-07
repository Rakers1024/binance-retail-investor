import { useEffect, useState } from 'react';
import { TrendingUp, Users, Building2, RefreshCw } from 'lucide-react';
import RatioCard from './components/RatioCard';
import LineChart from './components/LineChart';
import { fetchGlobalLongShortRatio, fetchTopTraderLongShortRatio, fetchKlineData } from './services/binance';
import { calculateRetailRatio, calculateMA } from './utils/calculations';
import { RatioData, ChartDataPoint } from './types';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [inputSymbol, setInputSymbol] = useState('BTCUSDT');
  const [showDropdown, setShowDropdown] = useState(false);
  const [period, setPeriod] = useState('5m');
  const [bigUserProportion, setBigUserProportion] = useState(0.2);
  const [showPrice, setShowPrice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [globalData, setGlobalData] = useState<RatioData | null>(null);
  const [topTraderData, setTopTraderData] = useState<RatioData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

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
          const allMA120 = calculateMA(allPrices, 120);
          const allMA240 = calculateMA(allPrices, 240);

          const startIndex = klineData.length - globalRatios.length;
          ma120Values = allMA120.slice(startIndex);
          ma240Values = allMA240.slice(startIndex);
        }

        const chartPoints: ChartDataPoint[] = globalRatios.map((global, index) => {
          const topTrader = topTraderRatios[index];
          if (!topTrader) return null;

          const totalRatio = parseFloat(global.longShortRatio);
          const bigUserRatio = parseFloat(topTrader.longShortRatio);
          const retail = calculateRetailRatio(totalRatio, bigUserRatio, bigUserProportion);

          const kline = klineData ? klineData[klineData.length - globalRatios.length + index] : null;
          const price = kline ? parseFloat(kline.close) : undefined;

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
            ma240: ma240Values[index]
          };
        }).filter(Boolean) as ChartDataPoint[];

        setChartData(chartPoints);
        setLastUpdate(new Date());
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            加密货币散户多空比监控面板
          </h1>
          <p className="text-gray-600">
            实时监控散户交易者的多空情绪变化
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易对
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputSymbol}
                  onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSymbol(inputSymbol);
                      setShowDropdown(false);
                    }
                  }}
                  placeholder="输入交易对，如 BTCUSDT"
                  className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ASTER', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'AVAXUSDT', 'ATOMUSDT', 'APTUSDT', 'ARBUSDT']
                      .filter(s => s.includes(inputSymbol))
                      .map(s => (
                        <div
                          key={s}
                          onClick={() => {
                            setInputSymbol(s);
                            setSymbol(s);
                            setShowDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          {s.replace('USDT', '/USDT')}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间周期
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5m">5分钟</option>
                <option value="15m">15分钟</option>
                <option value="1h">1小时</option>
                <option value="4h">4小时</option>
                <option value="1d">1天</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="showPrice" className="text-sm font-medium text-gray-700">
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
              <div className="text-sm text-gray-500 ml-auto">
                最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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

        <div className="bg-white rounded-xl shadow-sm p-6 h-[600px] flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            散户多空比走势图
          </h2>
          <div className="flex-1">
            <LineChart data={chartData} showPrice={showPrice} />
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 散户多空比 = 通过整体多空比和大户多空比计算得出的散户交易者多空情绪</li>
            <li>• 数值大于1表示多头占优，小于1表示空头占优</li>
            <li>• 数据来源于币安永续合约市场，每{period === '5m' ? '5分钟' : period === '15m' ? '15分钟' : period === '1h' ? '1小时' : period === '4h' ? '4小时' : '1天'}更新一次</li>
            <li>• 大户占比可调整，默认20%，用于计算散户数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
