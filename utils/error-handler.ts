/**
 * 错误处理工具
 * 提供统一的错误处理和用户友好的错误提示
 */

import { CDPError, CDPTimeoutError, CDPConnectionError } from './cdp-client.js';

/**
 * 错误类型
 */
export enum ErrorType {
  CONNECTION = 'CONNECTION',
  TIMEOUT = 'TIMEOUT',
  PROTOCOL = 'PROTOCOL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 错误提示信息
 */
const ERROR_MESSAGES: Record<ErrorType, string[]> = {
  [ErrorType.CONNECTION]: [
    '请确保 Chrome 已启动并开启调试端口 9222',
    'macOS: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug',
    'Windows: chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\\temp\\chrome-debug',
    'Linux: google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug',
  ],
  [ErrorType.TIMEOUT]: [
    '操作超时，请检查网络连接',
    '可能原因：页面加载缓慢、网络不稳定',
  ],
  [ErrorType.PROTOCOL]: [
    'CDP 协议错误，请检查命令参数',
    '参考 CDP 文档: https://chromedevtools.github.io/devtools-protocol/',
  ],
  [ErrorType.UNKNOWN]: [
    '未知错误，请查看详细错误信息',
  ],
};

/**
 * 判断错误类型
 */
function classifyError(error: unknown): ErrorType {
  if (error instanceof CDPConnectionError) {
    return ErrorType.CONNECTION;
  }
  if (error instanceof CDPTimeoutError) {
    return ErrorType.TIMEOUT;
  }
  if (error instanceof CDPError) {
    return ErrorType.PROTOCOL;
  }
  return ErrorType.UNKNOWN;
}

/**
 * 格式化错误信息
 */
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 处理 Demo 错误
 * @param error - 错误对象
 * @param demoName - Demo 名称
 * @param showTips - 是否显示提示信息，默认 true
 */
export function handleDemoError(
  error: unknown,
  demoName: string,
  showTips = true
): void {
  console.error(`\n❌ ${demoName} 失败`);
  console.error(`错误信息: ${formatErrorMessage(error)}\n`);

  if (showTips) {
    const errorType = classifyError(error);
    const tips = ERROR_MESSAGES[errorType];

    console.log('💡 提示:');
    tips.forEach((tip, index) => {
      console.log(`  ${index + 1}. ${tip}`);
    });
    console.log();
  }
}

/**
 * 创建带重试的异步函数
 * @param fn - 要执行的异步函数
 * @param maxRetries - 最大重试次数
 * @param retryDelay - 重试延迟（毫秒）
 * @returns Promise<T> - 函数执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  retryDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`⚠️  尝试 ${attempt}/${maxRetries} 失败，${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}

/**
 * 创建带超时的异步函数
 * @param fn - 要执行的异步函数
 * @param timeout - 超时时间（毫秒）
 * @param timeoutMessage - 超时错误消息
 * @returns Promise<T> - 函数执行结果
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  timeoutMessage = '操作超时'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeout)
    ),
  ]);
}

/**
 * 验证是否已连接到浏览器
 * @param isConnected - 连接状态
 * @throws {Error} - 当未连接时抛出错误
 */
export function assertConnected(isConnected: boolean): void {
  if (!isConnected) {
    throw new CDPConnectionError('未连接到浏览器，请先调用 connect() 方法');
  }
}

/**
 * 验证参数不为空
 * @param value - 要验证的值
 * @param paramName - 参数名称
 * @throws {Error} - 当参数为空时抛出错误
 */
export function assertNotEmpty(value: unknown, paramName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new Error(`参数 ${paramName} 不能为空`);
  }
}
