/**
 * Demo 配置文件
 * 集中管理所有 Demo 的配置参数
 */

/**
 * Demo 测试 URL 配置
 */
export const DEMO_URLS = {
  example: 'https://example.com',
  wikipedia: 'https://www.wikipedia.org',
  httpbin: 'https://httpbin.org',
  coze: 'https://www.coze.cn/share/7540658064019521831',
} as const;

/**
 * Demo 超时配置（毫秒）
 */
export const DEMO_TIMEOUTS = {
  pageLoad: 10000,
  network: 5000,
  event: 10000,
  command: 30000,
} as const;

/**
 * Chrome 调试端口配置
 */
export const CHROME_CONFIG = {
  defaultHost: 'localhost',
  defaultPort: 9222,
} as const;

/**
 * 日志配置
 */
export const LOG_CONFIG = {
  /** 是否显示调试日志 */
  showDebugLogs: false,
  /** 是否显示发送的命令 */
  showCommands: true,
  /** 是否显示接收的事件 */
  showEvents: true,
} as const;

/**
 * 网络模拟配置
 */
export const NETWORK_CONFIG = {
  slowNetwork: {
    offline: false,
    latency: 100, // 延迟 100ms
    downloadThroughput: 1024 * 1024 / 8, // 1 Mbps 下载
    uploadThroughput: 512 * 1024 / 8, // 512 Kbps 上传
  },
  fastNetwork: {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  },
} as const;

/**
 * 截图配置
 */
export const SCREENSHOT_CONFIG = {
  defaultFormat: 'png' as const,
  defaultQuality: 80,
  captureBeyondViewport: false,
} as const;

/**
 * PDF 配置
 */
export const PDF_CONFIG = {
  printBackground: true,
  landscape: false,
} as const;
