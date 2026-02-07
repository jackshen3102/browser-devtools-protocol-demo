/**
 * CDPClient 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CDPClient, CDPError, CDPTimeoutError, CDPConnectionError } from './cdp-client.js';

describe('CDPClient', () => {
  let client: CDPClient;

  beforeEach(() => {
    client = new CDPClient({
      logLevel: 4, // NONE - 禁用日志
      autoReconnect: false,
    });
  });

  afterEach(() => {
    client.close();
  });

  describe('构造函数', () => {
    it('应该使用默认配置', () => {
      const defaultClient = new CDPClient();
      expect(defaultClient.isConnected()).toBe(false);
      defaultClient.close();
    });

    it('应该接受自定义配置', () => {
      const customClient = new CDPClient({
        logLevel: 0,
        maxRetries: 5,
        retryDelay: 2000,
        autoReconnect: false,
        commandTimeout: 60000,
      });
      expect(customClient.isConnected()).toBe(false);
      customClient.close();
    });
  });

  describe('连接状态', () => {
    it('初始状态应该未连接', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('重试次数应该为 0', () => {
      expect(client.getRetryCount()).toBe(0);
    });
  });

  describe('WebSocket URL 验证', () => {
    it('应该接受有效的 ws:// URL', async () => {
      // 注意：这个测试会尝试连接，可能会失败
      // 我们只测试 URL验证逻辑
      try {
        await client.connect('ws://localhost:9222');
      } catch (error) {
        // 连接失败是预期的，只要不是 URL 验证错误即可
        expect(error).not.toBeInstanceOf(CDPConnectionError);
        expect((error as CDPConnectionError).message).not.toContain('must use ws:// or wss://');
      }
    });

    it('应该接受有效的 wss:// URL', async () => {
      try {
        await client.connect('wss://localhost:9222');
      } catch (error) {
        expect(error).not.toBeInstanceOf(CDPConnectionError);
        expect((error as CDPConnectionError).message).not.toContain('must use ws:// or wss://');
      }
    });

    it('应该拒绝无效的协议', async () => {
      try {
        await client.connect('http://localhost:9222');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(CDPConnectionError);
        expect((error as CDPConnectionError).message).toContain('must use ws:// or wss://');
      }
    });

    it('应该拒绝无效的 URL', async () => {
      try {
        await client.connect('invalid-url');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(CDPConnectionError);
        expect((error as CDPConnectionError).message).toContain('Invalid WebSocket URL');
      }
    });
  });

  describe('发送命令', () => {
    it('未连接时应该抛出错误', async () => {
      await expect(client.send('Test.method')).rejects.toThrow('WebSocket not connected');
    });

    it('空方法名应该抛出错误', async () => {
      // 模拟已连接状态
      (client as any).connected = true;
      await expect(client.send('')).rejects.toThrow('Method must be a non-empty string');
    });

    it('null 方法名应该抛出错误', async () => {
      (client as any).connected = true;
      await expect(client.send(null as any)).rejects.toThrow('Method must be a non-empty string');
    });
  });

  describe('事件监听', () => {
    it('应该能够添加事件监听器', () => {
      const handler = vi.fn();
      client.on('Test.event', handler);
      // 验证监听器已添加（通过检查内部状态）
      expect((client as any).eventListeners.has('Test.event')).toBe(true);
    });

    it('应该能够移除事件监听器', () => {
      const handler = vi.fn();
      client.on('Test.event', handler);
      client.off('Test.event', handler);
      // 验证监听器已移除
      const listeners = (client as any).eventListeners.get('Test.event');
      expect(listeners?.has(handler)).toBe(false);
    });

    it('应该能够清除所有事件监听器', () => {
      client.on('Test.event1', vi.fn());
      client.on('Test.event2', vi.fn());
      (client as any).clearEventListeners();
      expect((client as any).eventListeners.size).toBe(0);
    });

    it('应该能够清除特定事件的所有监听器', () => {
      client.on('Test.event1', vi.fn());
      client.on('Test.event1', vi.fn());
      client.on('Test.event2', vi.fn());
      (client as any).clearEventListeners('Test.event1');
      expect((client as any).eventListeners.has('Test.event1')).toBe(false);
      expect((client as any).eventListeners.has('Test.event2')).toBe(true);
    });
  });

  describe('消息 ID 生成', () => {
    it('应该生成递增的消息 ID', () => {
      const id1 = (client as any).getNextMessageId();
      const id2 = (client as any).getNextMessageId();
      expect(id2).toBe(id1 + 1);
    });

    it('应该在达到最大值时循环', () => {
      (client as any).messageId = Number.MAX_SAFE_INTEGER - 1;
      const id1 = (client as any).getNextMessageId();
      const id2 = (client as any).getNextMessageId();
      expect(id1).toBe(Number.MAX_SAFE_INTEGER);
      expect(id2).toBe(0);
    });
  });

  describe('关闭连接', () => {
    it('应该清理所有待处理的请求', () => {
      // 添加一些待处理的请求
      (client as any).pendingRequests.set(1, {
        resolve: vi.fn(),
        reject: vi.fn(),
        timeout: setTimeout(() => {}, 1000),
      });
      (client as any).pendingRequests.set(2, {
        resolve: vi.fn(),
        reject: vi.fn(),
        timeout: setTimeout(() => {}, 1000),
      });
      
      client.close();
      expect((client as any).pendingRequests.size).toBe(0);
    });

    it('应该清理所有事件监听器', () => {
      client.on('Test.event1', vi.fn());
      client.on('Test.event2', vi.fn());
      client.close();
      expect((client as any).eventListeners.size).toBe(0);
    });

    it('应该重置连接状态', () => {
      (client as any).connected = true;
      client.close();
      expect(client.isConnected()).toBe(false);
    });
  });
});

describe('错误类', () => {
  describe('CDPError', () => {
    it('应该创建带有代码和数据的错误', () => {
      const error = new CDPError('Test error', 100, { extra: 'data' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(100);
      expect(error.data).toEqual({ extra: 'data' });
      expect(error.name).toBe('CDPError');
    });
  });

  describe('CDPTimeoutError', () => {
    it('应该创建超时错误', () => {
      const error = new CDPTimeoutError('Test.method');
      expect(error.message).toBe('CDP command timeout: Test.method');
      expect(error.name).toBe('CDPTimeoutError');
    });
  });

  describe('CDPConnectionError', () => {
    it('应该创建连接错误', () => {
      const error = new CDPConnectionError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('CDPConnectionError');
    });
  });
});
