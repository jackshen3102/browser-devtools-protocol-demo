import WebSocket from 'ws';

/**
 * CDP 消息类型定义
 */
export interface CDPRequest {
  id: number;
  method: string;
  params?: Record<string, any>;
}

export interface CDPResponse {
  id: number;
  result?: any;
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
 * CDP 客户端类
 * 封装 WebSocket 通信，提供发送命令和监听事件的能力
 */
export class CDPClient {
  private ws: WebSocket | null = null;
  private messageId = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  private eventListeners = new Map<string, Set<(params: any) => void>>();
  private connected = false;

  /**
   * 连接到 CDP WebSocket 端点
   */
  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.connected = true;
        console.log('✅ CDP WebSocket 连接成功');
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket 错误:', error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.log('🔌 WebSocket 连接已关闭');
      });
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // 如果有 id，说明是响应
      if ('id' in message) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          if (message.error) {
            pending.reject(new Error(`CDP Error: ${message.error.message}`));
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
      console.error('❌ 解析消息失败:', error);
    }
  }

  /**
   * 发送 CDP 命令
   */
  async send(method: string, params?: Record<string, any>): Promise<any> {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket 未连接');
    }

    const id = this.messageId++;
    const request: CDPRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const message = JSON.stringify(request);
      console.log(`📤 发送命令: ${method}`, params || '');

      this.ws!.send(message, (error) => {
        if (error) {
          this.pendingRequests.delete(id);
          reject(error);
        }
      });

      // 设置超时（30秒）
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`命令超时: ${method}`));
        }
      }, 30000);
    });
  }

  /**
   * 监听 CDP 事件
   */
  on(eventName: string, callback: (params: any) => void): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);
  }

  /**
   * 移除事件监听
   */
  off(eventName: string, callback: (params: any) => void): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(eventName: string, params: any): void {
    console.log(`📥 收到事件: ${eventName}`, params || '');

    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(params);
        } catch (error) {
          console.error(`❌ 事件处理器错误 (${eventName}):`, error);
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
      this.pendingRequests.clear();
      this.eventListeners.clear();
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * 获取可用的 CDP 目标列表
 */
export async function getTargets(host = 'localhost', port = 9222): Promise<any[]> {
  const response = await fetch(`http://${host}:${port}/json/list`);
  if (!response.ok) {
    throw new Error(`无法获取目标列表: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取浏览器版本信息
 */
export async function getBrowserVersion(host = 'localhost', port = 9222): Promise<any> {
  const response = await fetch(`http://${host}:${port}/json/version`);
  if (!response.ok) {
    throw new Error(`无法获取浏览器版本: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 辅助函数：等待指定时间
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 辅助函数：等待特定事件触发
 */
export function waitForEvent(
  client: CDPClient,
  eventName: string,
  timeout = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off(eventName, handler);
      reject(new Error(`等待事件超时: ${eventName}`));
    }, timeout);

    const handler = (params: any) => {
      clearTimeout(timer);
      client.off(eventName, handler);
      resolve(params);
    };

    client.on(eventName, handler);
  });
}
