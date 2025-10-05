interface RatioCardProps {
  title: string;
  ratio: number;
  longPercent: number;
  shortPercent: number;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export default function RatioCard({
  title,
  ratio,
  longPercent,
  shortPercent,
  icon,
  highlight = false
}: RatioCardProps) {
  const isLongDominant = ratio > 1;

  return (
    <div className={`rounded-xl p-6 shadow-md transition-all ${
      highlight
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white border-2 border-blue-500'
        : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${highlight ? 'text-white' : 'text-gray-700'}`}>
          {title}
        </h3>
        {icon && <div className={highlight ? 'text-blue-400' : 'text-gray-400'}>{icon}</div>}
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${
            highlight ? 'text-white' : isLongDominant ? 'text-green-600' : 'text-red-600'
          }`}>
            {ratio.toFixed(3)}
          </span>
          <span className={`text-sm ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>
            多空比
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${highlight ? 'text-green-400' : 'text-green-600'}`}>
              多头
            </span>
            <span className={`text-sm font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>
              {(longPercent * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${longPercent * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className={`text-sm font-medium ${highlight ? 'text-red-400' : 'text-red-600'}`}>
              空头
            </span>
            <span className={`text-sm font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>
              {(shortPercent * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${shortPercent * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
