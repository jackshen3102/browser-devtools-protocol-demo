# Chrome DevTools Protocol (CDP) 学习项目

从零开始学习 Chrome DevTools Protocol，使用原生 WebSocket 直接与浏览器通信。

## 前置准备

### 1. 启动带调试端口的 Chrome

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**Windows:**
```bash
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### 2. 验证连接

浏览器启动后，访问 http://localhost:9222/json 应该能看到可用的调试目标列表。

### 3. 安装依赖

```bash
npm install
```

## 学习路线

### Demo 01: WebSocket 连接基础
**学习目标:**
- 理解 CDP 的通信机制（WebSocket）
- 掌握 CDP 消息格式（请求/响应/事件）
- 连接到浏览器并获取版本信息

```bash
npm run demo:01
```

**核心概念:**
- CDP 使用 WebSocket 进行双向通信
- 请求格式: `{ id, method, params }`
- 响应格式: `{ id, result }` 或 `{ id, error }`
- 事件格式: `{ method, params }`（没有 id）

---

### Demo 02: Page Domain - 页面控制
**学习目标:**
- 页面导航（navigate）
- 页面生命周期事件（load, DOMContentLoaded）
- 获取页面信息

```bash
npm run demo:02
```

**核心 CDP 命令:**
- `Page.enable` - 启用页面域事件
- `Page.navigate` - 导航到 URL
- `Page.getFrameTree` - 获取页面框架树
- 事件: `Page.loadEventFired`, `Page.domContentEventFired`

---

### Demo 03: DOM Domain - DOM 操作
**学习目标:**
- 获取 DOM 树结构
- 查询 DOM 节点
- 获取节点属性
- 修改节点内容

```bash
npm run demo:03
```

**核心 CDP 命令:**
- `DOM.enable` - 启用 DOM 域
- `DOM.getDocument` - 获取根文档节点
- `DOM.querySelector` - 查询单个节点
- `DOM.querySelectorAll` - 查询多个节点
- `DOM.getOuterHTML` - 获取节点 HTML
- `DOM.setOuterHTML` - 设置节点 HTML

---

### Demo 04: Network Domain - 网络监控
**学习目标:**
- 监听网络请求
- 拦截和修改请求
- 查看请求/响应数据
- 网络性能分析

```bash
npm run demo:04
```

**核心 CDP 命令:**
- `Network.enable` - 启用网络监控
- `Network.setRequestInterception` - 启用请求拦截
- `Network.continueInterceptedRequest` - 继续被拦截的请求
- 事件: `Network.requestWillBeSent`, `Network.responseReceived`, `Network.loadingFinished`

---

### Demo 05: Runtime Domain - JavaScript 执行
**学习目标:**
- 在页面上下文中执行 JavaScript
- 获取执行结果
- 处理异常
- 调用页面函数

```bash
npm run demo:05
```

**核心 CDP 命令:**
- `Runtime.enable` - 启用运行时域
- `Runtime.evaluate` - 执行 JavaScript 代码
- `Runtime.callFunctionOn` - 调用对象上的函数
- `Runtime.getProperties` - 获取对象属性

---

### Demo 06: Target Domain - 多标签页管理
**学习目标:**
- 创建新标签页
- 关闭标签页
- 切换标签页
- 管理多个 CDP 会话

```bash
npm run demo:06
```

**核心 CDP 命令:**
- `Target.setDiscoverTargets` - 启用目标发现
- `Target.createTarget` - 创建新标签页
- `Target.closeTarget` - 关闭标签页
- `Target.attachToTarget` - 附加到目标
- 事件: `Target.targetCreated`, `Target.targetDestroyed`

---

### Demo 07: Emulation Domain - 设备模拟
**学习目标:**
- 模拟移动设备
- 设置视口大小
- 模拟地理位置
- 设置 User-Agent

```bash
npm run demo:07
```

**核心 CDP 命令:**
- `Emulation.setDeviceMetricsOverride` - 设置设备指标
- `Emulation.setUserAgentOverride` - 设置 User-Agent
- `Emulation.setGeolocationOverride` - 设置地理位置
- `Emulation.setTouchEmulationEnabled` - 启用触摸模拟

---

### Demo 08: Performance Domain - 性能分析
**学习目标:**
- 收集性能指标
- 获取 FCP、LCP 等指标
- 分析资源加载时间
- 生成性能报告

```bash
npm run demo:08
```

**核心 CDP 命令:**
- `Performance.enable` - 启用性能监控
- `Performance.getMetrics` - 获取性能指标
- `PerformanceTimeline.enable` - 启用性能时间线
- 事件: `Performance.metrics`

---

### Demo 09: Storage Domain - 存储管理
**学习目标:**
- 管理 Cookie
- 操作 LocalStorage/SessionStorage
- 清除缓存
- 查看存储使用情况

```bash
npm run demo:09
```

**核心 CDP 命令:**
- `Storage.getCookies` - 获取 Cookie
- `Storage.setCookies` - 设置 Cookie
- `Storage.clearCookies` - 清除 Cookie
- `DOMStorage.getDOMStorageItems` - 获取存储项
- `Network.clearBrowserCache` - 清除缓存

---

### Demo 10: Debugger Domain - 调试功能
**学习目标:**
- 设置断点
- 单步执行
- 查看调用栈
- 查看变量值

```bash
npm run demo:10
```

**核心 CDP 命令:**
- `Debugger.enable` - 启用调试器
- `Debugger.setBreakpointByUrl` - 设置断点
- `Debugger.resume` - 继续执行
- `Debugger.stepOver` - 单步跳过
- `Debugger.stepInto` - 单步进入
- 事件: `Debugger.paused`, `Debugger.resumed`

---

## 学习建议

1. **按顺序学习**: 从 Demo 01 开始，逐步深入
2. **查看日志**: 每个 Demo 都会打印详细的 CDP 消息
3. **修改代码**: 尝试修改参数，观察不同效果
4. **阅读文档**: 参考 [CDP 官方文档](https://chromedevtools.github.io/devtools-protocol/)
5. **实时观察**: 运行 Demo 时观察浏览器窗口的变化

## 参考资源

- [CDP 协议文档](https://chromedevtools.github.io/devtools-protocol/)
- [CDP Viewer](https://chromedevtools.github.io/devtools-protocol/tot/) - 查看所有 Domain 和方法
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

## 项目结构

```
browser-cdp/
├── demos/              # 10 个渐进式 Demo
│   ├── 01-websocket-connection/
│   ├── 02-page-domain/
│   ├── ...
│   └── 10-debugger-domain/
├── utils/              # 工具函数
│   └── cdp-client.ts   # CDP WebSocket 客户端封装
└── docs/               # 学习笔记
```
