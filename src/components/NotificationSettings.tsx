import { useState, useEffect } from 'react';
import { Bell, X, Volume2 } from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationConfig {
  enabled: boolean;
  timeframes: {
    '1h': boolean;
    '4h': boolean;
    '1d': boolean;
  };
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  timeframes: {
    '1h': true,
    '4h': true,
    '1d': true,
  },
};

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const saved = localStorage.getItem('notificationConfig');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notification config:', e);
      }
    }
  }, []);

  const saveConfig = (newConfig: NotificationConfig) => {
    setConfig(newConfig);
    localStorage.setItem('notificationConfig', JSON.stringify(newConfig));
  };

  const handleTimeframeToggle = (timeframe: keyof NotificationConfig['timeframes']) => {
    const newConfig = {
      ...config,
      timeframes: {
        ...config.timeframes,
        [timeframe]: !config.timeframes[timeframe],
      },
    };
    saveConfig(newConfig);
  };

  const handleEnabledToggle = () => {
    const newConfig = {
      ...config,
      enabled: !config.enabled,
    };
    saveConfig(newConfig);
  };

  const testNotification = () => {
    const soundUrl = import.meta.env.VITE_NOTIFICATION_SOUND_URL || 'https://bigsoundbank.com/UPLOAD/mp3/1616.mp3';
    const audio = new Audio(soundUrl);
    audio.play().catch(err => {
      console.error('Failed to play notification:', err);
      alert('无法播放提示音。请确保浏览器允许播放音频，并且音频文件存在。');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">收线提示音设置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">启用提示音</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={handleEnabledToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">
              收线周期 (UTC+0)
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.timeframes['1h']}
                  onChange={() => handleTimeframeToggle('1h')}
                  disabled={!config.enabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">1小时</span>
                  <p className="text-xs text-gray-500">每小时整点提醒</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.timeframes['4h']}
                  onChange={() => handleTimeframeToggle('4h')}
                  disabled={!config.enabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">4小时</span>
                  <p className="text-xs text-gray-500">00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.timeframes['1d']}
                  onChange={() => handleTimeframeToggle('1d')}
                  disabled={!config.enabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">1天</span>
                  <p className="text-xs text-gray-500">每天 00:00 UTC 提醒</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={testNotification}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Volume2 className="w-5 h-5" />
            测试提示音
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong>提示：</strong>请确保浏览器允许播放音频。首次使用时，某些浏览器可能需要用户交互后才能播放声音。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
