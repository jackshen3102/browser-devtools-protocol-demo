# Chrome DevTools Protocol 学习项目 - 项目总结

## 项目概述

这是一个从零开始学习 Chrome DevTools Protocol (CDP) 的完整项目，使用**原生 WebSocket** 直接与浏览器通信，不依赖任何高级封装库（如 Puppeteer）。

## 技术栈

- **Node.js** + **TypeScript**
- **WebSocket (ws)** - 用于 CDP 通信
- **tsx** - 用于直接运行 TypeScript

## 项目结构

```
browser-cdp/
├── README.md              # 完整的学习指南
├── QUICKSTART.md          # 快速开始指南
├── PROJECT_SUMMARY.md     # 项目总结（本文件）
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── .gitignore             # Git 忽略文件
│
├── utils/                 # 工具函数
│   └── cdp-client.ts      # CDP WebSocket 客户端封装
│
└── demos/                 # 10 个渐进式 Demo
    ├── 01-websocket-connection/   # WebSocket 连接基础
    ├── 02-page-domain/            # Page Domain
    ├── 03-dom-domain/             # DOM Domain
    ├── 04-network-domain/         # Network Domain
    ├── 05-runtime-domain/         # Runtime Domain
    ├── 06-target-domain/          # Target Domain
    ├── 07-emulation-domain/       # Emulation Domain
    ├── 08-performance-domain/     # Performance Domain
    ├── 09-storage-domain/         # Storage Domain
    └── 10-debugger-domain/        # Debugger Domain
```

## 核心组件

### 1. CDPClient 类 (`utils/cdp-client.ts`)

这是整个项目的核心，封装了 CDP 的 WebSocket 通信：

**主要功能：**
- ✅ WebSocket 连接管理
- ✅ 发送 CDP 命令（`send` 方法）
- ✅ 监听 CDP 事件（`on` 方法）
- ✅ 请求/响应匹配（通过 message id）
- ✅ 事件分发机制
- ✅ 错误处理和超时控制

**核心方法：**
```typescript
class CDPClient {
  async connect(wsUrl: string): Promise<void>
  async send(method: string, params?: object): Promise<any>
  on(eventName: string, callback: Function): void
  close(): void
}
```

### 2. 辅助函数

- `getTargets()` - 获取可用的调试目标
- `getBrowserVersion()` - 获取浏览器版本
- `sleep()` - 延迟执行
- `waitForEvent()` - 等待特定事件触发

## 10 个学习 Demo

### Demo 01: WebSocket 连接基础
**学习重点：**
- CDP 通信机制（WebSocket）
- 消息格式（请求、响应、事件）
- 连接到浏览器并获取信息

**核心命令：**
- `Browser.getVersion`
- `Target.getTargetInfo`
- `Page.enable`

---

### Demo 02: Page Domain
**学习重点：**
- 页面导航和生命周期
- 页面信息获取
- 截图和 PDF 生成

**核心命令：**
- `Page.navigate`
- `Page.reload`
- `Page.captureScreenshot`
- `Page.printToPDF`
- `Page.getFrameTree`

**事件：**
- `Page.loadEventFired`
- `Page.domContentEventFired`

---

### Demo 03: DOM Domain
**学习重点：**
- 获取和遍历 DOM 树
- CSS 选择器查询
- 修改 DOM 内容

**核心命令：**
- `DOM.getDocument`
- `DOM.querySelector`
- `DOM.querySelectorAll`
- `DOM.getOuterHTML`
- `DOM.setOuterHTML`
- `DOM.getBoxModel`

---

### Demo 04: Network Domain
**学习重点：**
- 监控网络请求和响应
- 网络性能分析
- Cookie 管理
- 网络条件模拟

**核心命令：**
- `Network.enable`
- `Network.getResponseBody`
- `Network.setCookie`
- `Network.emulateNetworkConditions`
- `Network.setBlockedURLs`

**事件：**
- `Network.requestWillBeSent`
- `Network.responseReceived`
- `Network.loadingFinished`

---

### Demo 05: Runtime Domain
**学习重点：**
- 在页面上下文中执行 JavaScript
- 获取执行结果
- 异常处理
- 对象属性查询

**核心命令：**
- `Runtime.evaluate`
- `Runtime.getProperties`
- `Runtime.callFunctionOn`

**事件：**
- `Runtime.consoleAPICalled`
- `Runtime.exceptionThrown`

---

### Demo 06: Target Domain
**学习重点：**
- 多标签页管理
- 创建和关闭标签页
- 标签页切换
- 多会话管理

**核心命令：**
- `Target.setDiscoverTargets`
- `Target.createTarget`
- `Target.closeTarget`
- `Target.activateTarget`
- `Target.attachToTarget`

**事件：**
- `Target.targetCreated`
- `Target.targetDestroyed`

---

### Demo 07: Emulation Domain
**学习重点：**
- 移动设备模拟
- User-Agent 设置
- 地理位置模拟
- 时区和语言设置

**核心命令：**
- `Emulation.setDeviceMetricsOverride`
- `Emulation.setUserAgentOverride`
- `Emulation.setGeolocationOverride`
- `Emulation.setTimezoneOverride`
- `Emulation.setTouchEmulationEnabled`

---

### Demo 08: Performance Domain
**学习重点：**
- 收集性能指标
- Web Vitals (FCP, LCP)
- 资源加载分析
- 内存使用监控

**核心命令：**
- `Performance.enable`
- `Performance.getMetrics`
- 通过 Runtime 获取 Navigation Timing
- 通过 Runtime 获取 Resource Timing

---

### Demo 09: Storage Domain
**学习重点：**
- Cookie 管理
- LocalStorage/SessionStorage 操作
- 缓存清除
- 存储配额查询

**核心命令：**
- `Network.setCookie` / `getCookies` / `deleteCookies`
- `DOMStorage.getDOMStorageItems`
- `DOMStorage.setDOMStorageItem`
- `Storage.clearDataForOrigin`
- `Storage.getUsageAndQuota`

---

### Demo 10: Debugger Domain
**学习重点：**
- 启用调试器
- 设置断点
- 单步执行
- 异常断点

**核心命令：**
- `Debugger.enable`
- `Debugger.resume`
- `Debugger.stepOver`
- `Debugger.setPauseOnExceptions`

**事件：**
- `Debugger.paused`
- `Debugger.resumed`

---

## CDP 核心概念

### 1. 消息格式

**请求：**
```json
{
  "id": 1,
  "method": "Page.navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

**响应：**
```json
{
  "id": 1,
  "result": {
    "frameId": "..."
  }
}
```

**事件：**
```json
{
  "method": "Page.loadEventFired",
  "params": {
    "timestamp": 123456.789
  }
}
```

### 2. Domain 分类

CDP 协议按功能分为多个 Domain：

- **Browser** - 浏览器级别操作
- **Page** - 页面控制
- **DOM** - DOM 操作
- **Network** - 网络监控
- **Runtime** - JavaScript 执行
- **Debugger** - 调试功能
- **Target** - 目标管理
- **Emulation** - 设备模拟
- **Performance** - 性能监控
- **Storage** - 存储管理
- **Security** - 安全相关
- **Input** - 输入模拟
- **Overlay** - 页面覆盖层
- 等等...

### 3. 通信流程

```
1. 启动 Chrome (--remote-debugging-port=9222)
2. 获取目标列表 (HTTP GET /json/list)
3. 连接 WebSocket (ws://localhost:9222/devtools/page/xxx)
4. 发送命令 (JSON-RPC)
5. 接收响应和事件
6. 关闭连接
```

## 使用方法

### 1. 启动 Chrome
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

### 2. 运行 Demo
```bash
npm install
npm run demo:01  # 运行第一个 Demo
npm run demo:02  # 运行第二个 Demo
# ... 依此类推
```

## 学习建议

1. **按顺序学习**：从 Demo 01 开始，逐步深入
2. **阅读代码**：每个 Demo 都有详细注释
3. **动手实践**：修改代码，尝试不同参数
4. **观察效果**：运行时观察浏览器窗口变化
5. **查阅文档**：参考 [CDP 官方文档](https://chromedevtools.github.io/devtools-protocol/)

## 实用场景

通过这个项目，你可以实现：

- ✅ **网页自动化** - 自动填表、点击、导航
- ✅ **网页爬虫** - 抓取动态内容、处理 JavaScript
- ✅ **性能监控** - 收集 Web Vitals、资源加载时间
- ✅ **自动化测试** - E2E 测试、截图对比
- ✅ **设备测试** - 模拟移动设备、不同网络条件
- ✅ **调试工具** - 远程调试、日志收集
- ✅ **数据采集** - Cookie 管理、存储操作

## 进阶方向

1. **深入学习更多 Domain**
   - Input Domain（模拟鼠标、键盘）
   - Overlay Domain（页面元素高亮）
   - Security Domain（证书管理）

2. **构建实用工具**
   - 网页截图服务
   - 性能监控平台
   - 自动化测试框架

3. **研究源码**
   - Puppeteer 源码
   - Playwright 源码
   - Chrome DevTools 前端

4. **协议扩展**
   - 自定义 CDP 命令
   - 浏览器扩展开发

## 参考资源

- [CDP 官方文档](https://chromedevtools.github.io/devtools-protocol/)
- [CDP Viewer](https://chromedevtools.github.io/devtools-protocol/tot/) - 查看所有 Domain
- [Puppeteer](https://pptr.dev/) - 高级封装库
- [Playwright](https://playwright.dev/) - 跨浏览器自动化

## 总结

这个项目提供了一个完整的 CDP 学习路径，从最基础的 WebSocket 连接到复杂的调试功能。通过 10 个渐进式 Demo，你将：

- ✅ 理解 CDP 的底层通信机制
- ✅ 掌握 10 个核心 Domain 的使用
- ✅ 学会如何直接使用 CDP 协议
- ✅ 为深入学习浏览器自动化打下基础

**重要提示：** 这个项目专注于 CDP 协议本身的学习，不涉及 React、Vite 等前端框架。如果你需要构建可视化界面，可以在此基础上添加前端项目。

祝学习愉快！🚀
