import WebSocket from 'ws';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * CDP 客户端配置选项
 */
export interface CDPClientOptions {
  /** 日志级别 */
  logLevel?: LogLevel;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 命令超时时间（毫秒） */
  commandTimeout?: number;
}

/**
 * CDP 错误类
 */
export class CDPError extends Error {
  constructor(
    message: string,
    public code: number,
    public data?: any
  ) {
    super(message);
    this.name = 'CDPError';
  }
}

/**
 * CDP 超时错误类
 */
export class CDPTimeoutError extends Error {
  constructor(method: string) {
    super(`CDP command timeout: ${method}`);
    this.name = 'CDPTimeoutError';
  }
}

/**
 * CDP 连接错误类
 */
export class CDPConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CDPConnectionError';
  }
}

/**
 * CDP 消息类型定义
 */
export interface CDPRequest {
  id: number;
  method: string;
  params?: Record<string, any>;
}

export interface CDPResponse<T = any> {
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface CDPEvent {
  method: string;
  params?: Record<string, any>;
}

/**
 * 事件处理器类型
 */
export type CDPEventHandler<T = unknown> = (params: T) => void;

/**
 * CDP 客户端类
 * 封装 WebSocket 通信，提供发送命令和监听事件的能力
 */
export class CDPClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private eventListeners = new Map<string, Set<CDPEventHandler>>();
  private connected = false;
  private retryCount = 0;
  private options: Required<CDPClientOptions>;

  constructor(options: CDPClientOptions = {}) {
    this.options = {
      logLevel: LogLevel.INFO,
      maxRetries: 3,
      retryDelay: 1000,
      autoReconnect: true,
      commandTimeout: 30000,
      ...options,
    };
  }

  /**
   * 日志输出
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level >= this.options.logLevel) {
      const prefix = ['🐛', 'ℹ️', '⚠️', '❌'][level];
      console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * 验证 WebSocket URL
   */
  private validateWebSocketUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
        throw new CDPConnectionError('WebSocket URL must use ws:// or wss:// protocol');
      }
    } catch (error) {
      throw new CDPConnectionError(`Invalid WebSocket URL: ${url}`);
    }
  }

  /**
   * 获取下一个消息 ID
   */
  private getNextMessageId(): number {
    this.messageId = (this.messageId + 1) % Number.MAX_SAFE_INTEGER;
    return this.messageId;
  }

  /**
   * 连接到 CDP WebSocket 端点
   * @param wsUrl - WebSocket URL
   * @throws {CDPConnectionError} 当连接失败时
   */
  async connect(wsUrl: string): Promise<void> {
    this.validateWebSocketUrl(wsUrl);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.connected = true;
        this.retryCount = 0;
        this.log(LogLevel.INFO, 'CDP WebSocket 连接成功');
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        this.log(LogLevel.ERROR, 'WebSocket 错误:', error.message);
        reject(new CDPConnectionError(error.message));
      });

      this.ws.on('close', async () => {
        this.connected = false;
        this.log(LogLevel.INFO, 'WebSocket 连接已关闭');

        // 自动重连逻辑
        if (this.options.autoReconnect && this.retryCount < this.options.maxRetries) {
          this.retryCount++;
          this.log(
            LogLevel.INFO,
            `尝试重连 (${this.retryCount}/${this.options.maxRetries})...`
          );
          await new Promise(r => setTimeout(r, this.options.retryDelay));
          try {
            await this.connect(wsUrl);
          } catch (error) {
            this.log(LogLevel.ERROR, '重连失败:', error);
          }
        }
      });
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data as string);

      // 如果有 id，说明是响应
      if ('id' in message) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          if (message.error) {
            pending.reject(
              new CDPError(
                message.error.message,
                message.error.code,
                message.error.data
              )
            );
          } else {
            pending.resolve(message.result);
          }
          this.pendingRequests.delete(message.id);
        }
      }
      // 如果没有 id，说明是事件
      else if ('method' in message) {
        this.emitEvent(message.method, message.params);
      }
    } catch (error) {
      this.log(LogLevel.ERROR, '解析消息失败:', error);
    }
  }

  /**
   * 发送 CDP 命令
   * @template T - 响应数据类型
   * @param method - CDP 方法名（格式: Domain.method）
   * @param params - 命令参数
   * @returns Promise<T> - 命令响应结果
   * @throws {Error} - 当 WebSocket 未连接时
   * @throws {CDPError} - 当 CDP 返回错误时
   * @throws {CDPTimeoutError} - 当命令超时时
   *
   * @example
   * ```typescript
   * const version = await client.send<{product: string}>('Browser.getVersion');
   * console.log(version.product);
   * ```
   */
  async send<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    if (!method || typeof method !== 'string') {
      throw new Error('Method must be a non-empty string');
    }

    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    const id = this.getNextMessageId();
    const request: CDPRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new CDPTimeoutError(method));
        }
      }, this.options.commandTimeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const message = JSON.stringify(request);
      this.log(LogLevel.DEBUG, `发送命令: ${method}`, params || '');

      this.ws!.send(message, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pendingRequests.delete(id);
          reject(error);
        }
      });
    });
  }

  /**
   * 监听 CDP 事件
   * @template T - 事件参数类型
   * @param eventName - 事件名称
   * @param callback - 事件处理器
   */
  on<T = unknown>(eventName: string, callback: CDPEventHandler<T>): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);
  }

  /**
   * 移除事件监听
   * @param eventName - 事件名称
   * @param callback - 事件处理器
   */
  off<T = unknown>(eventName: string, callback: CDPEventHandler<T>): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 清除事件监听器
   * @param eventName - 可选，指定事件名称，不传则清除所有
   */
  clearEventListeners(eventName?: string): void {
    if (eventName) {
      this.eventListeners.delete(eventName);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(eventName: string, params: any): void {
    this.log(LogLevel.DEBUG, `收到事件: ${eventName}`, params || '');

    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(params);
        } catch (error) {
          this.log(LogLevel.ERROR, `事件处理器错误 (${eventName}):`, error);
        }
      });
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.retryCount = 0;
      
      // 清理所有待处理的请求
      this.pendingRequests.forEach((pending) => {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Connection closed'));
      });
      this.pendingRequests.clear();
      
      // 清理所有事件监听器
      this.clearEventListeners();
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取重试次数
   */
  getRetryCount(): number {
    return this.retryCount;
  }
}

/**
 * 获取可用的 CDP 目标列表
 * @param host - 主机地址，默认 localhost
 * @param port - 端口号，默认 9222
 * @returns Promise<Target[]> - 目标列表
 */
export async function getTargets(
  host = 'localhost',
  port = 9222
): Promise<any[]> {
  const response = await fetch(`http://${host}:${port}/json/list`);
  if (!response.ok) {
    throw new Error(`无法获取目标列表: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取浏览器版本信息
 * @param host - 主机地址，默认 localhost
 * @param port - 端口号，默认 9222
 * @returns Promise<VersionInfo> - 版本信息
 */
export async function getBrowserVersion(
  host = 'localhost',
  port = 9222
): Promise<any> {
  const response = await fetch(`http://${host}:${port}/json/version`);
  if (!response.ok) {
    throw new Error(`无法获取浏览器版本: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 辅助函数：等待指定时间
 * @param ms - 等待时间（毫秒）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 辅助函数：等待特定事件触发
 * @param client - CDP 客户端实例
 * @param eventName - 事件名称
 * @param timeout - 超时时间（毫秒），默认 10000
 * @returns Promise<T> - 事件参数
 */
export function waitForEvent<T = any>(
  client: CDPClient,
  eventName: string,
  timeout = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off(eventName, handler);
      reject(new Error(`等待事件超时: ${eventName}`));
    }, timeout);

    const handler = (params: T) => {
      clearTimeout(timer);
      client.off(eventName, handler);
      resolve(params);
    };

    client.on(eventName, handler);
  });
}
