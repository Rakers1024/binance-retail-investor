import { NotificationConfig } from '../components/NotificationSettings';

export class NotificationService {
  private audio: HTMLAudioElement | null = null;
  private checkInterval: number | null = null;
  private lastNotificationTime: { [key: string]: number } = {};

  constructor() {
    const soundUrl = import.meta.env.VITE_NOTIFICATION_SOUND_URL || 'https://bigsoundbank.com/UPLOAD/mp3/1616.mp3';
    this.audio = new Audio(soundUrl);
  }

  start() {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = window.setInterval(() => {
      this.checkAndNotify();
    }, 1000);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private getConfig(): NotificationConfig {
    const saved = localStorage.getItem('notificationConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notification config:', e);
      }
    }

    return {
      enabled: true,
      timeframes: {
        '5m': false,
        '15m': false,
        '30m': false,
        '1h': true,
        '2h': false,
        '4h': true,
        '6h': false,
        '12h': false,
        '1d': true,
      },
    };
  }

  private checkAndNotify() {
    const config = this.getConfig();

    if (!config.enabled) {
      return;
    }

    const now = new Date();
    const utcTime = new Date(now.toISOString());
    const hours = utcTime.getUTCHours();
    const minutes = utcTime.getUTCMinutes();
    const seconds = utcTime.getUTCSeconds();

    if (seconds === 0) {
      if (config.timeframes['5m'] && minutes % 5 === 0) {
        this.notify('5m');
      }

      if (config.timeframes['15m'] && minutes % 15 === 0) {
        this.notify('15m');
      }

      if (config.timeframes['30m'] && minutes % 30 === 0) {
        this.notify('30m');
      }

      if (minutes === 0) {
        if (config.timeframes['1h']) {
          this.notify('1h');
        }

        if (config.timeframes['2h'] && hours % 2 === 0) {
          this.notify('2h');
        }

        if (config.timeframes['4h'] && hours % 4 === 0) {
          this.notify('4h');
        }

        if (config.timeframes['6h'] && hours % 6 === 0) {
          this.notify('6h');
        }

        if (config.timeframes['12h'] && hours % 12 === 0) {
          this.notify('12h');
        }

        if (config.timeframes['1d'] && hours === 0) {
          this.notify('1d');
        }
      }
    }
  }

  private notify(timeframe: string) {
    const now = Date.now();
    const lastTime = this.lastNotificationTime[timeframe] || 0;

    if (now - lastTime < 50000) {
      return;
    }

    this.lastNotificationTime[timeframe] = now;

    if (this.audio) {
      this.audio.play().catch(err => {
        console.error('Failed to play notification:', err);
      });
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('收线提醒', {
        body: `${timeframe} 周期已收线`,
        icon: '/favicon.ico',
      });
    }
  }

  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export const notificationService = new NotificationService();
