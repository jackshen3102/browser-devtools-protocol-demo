# 快速开始指南

## 第一步：启动带调试端口的 Chrome

在运行任何 Demo 之前，你需要先启动一个带有远程调试端口的 Chrome 浏览器。

### macOS
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

### Windows
```bash
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

### Linux
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**重要提示：**
- `--remote-debugging-port=9222` 开启调试端口
- `--user-data-dir` 使用临时用户目录，避免影响你的正常浏览器配置
- 启动后，浏览器会打开一个新窗口

## 第二步：验证连接

在浏览器中访问：http://localhost:9222/json

你应该能看到类似这样的 JSON 输出：
```json
[
  {
    "description": "",
    "devtoolsFrontendUrl": "/devtools/inspector.html?ws=localhost:9222/devtools/page/...",
    "id": "...",
    "title": "New Tab",
    "type": "page",
    "url": "chrome://newtab/",
    "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/..."
  }
]
```

如果看到这个输出，说明 CDP 已经就绪！

## 第三步：安装依赖

```bash
cd browser-cdp
npm install
```

## 第四步：运行第一个 Demo

```bash
npm run demo:01
```

你应该能看到类似这样的输出：
```
============================================================
Demo 01: WebSocket 连接基础
============================================================

📋 步骤 1: 获取浏览器版本信息
------------------------------------------------------------
浏览器信息:
  - 产品: Chrome/xxx
  - 版本: Chrome/xxx
  ...
```

## 学习路径

按照顺序运行所有 Demo，每个 Demo 都会教你一个新的 CDP Domain：

```bash
npm run demo:01  # WebSocket 连接基础
npm run demo:02  # Page Domain - 页面控制
npm run demo:03  # DOM Domain - DOM 操作
npm run demo:04  # Network Domain - 网络监控
npm run demo:05  # Runtime Domain - JavaScript 执行
npm run demo:06  # Target Domain - 多标签页管理
npm run demo:07  # Emulation Domain - 设备模拟
npm run demo:08  # Performance Domain - 性能分析
npm run demo:09  # Storage Domain - 存储管理
npm run demo:10  # Debugger Domain - 调试功能
```

## 常见问题

### Q: 运行 Demo 时提示 "没有找到可用的页面"
**A:** 确保 Chrome 已启动并且至少打开了一个标签页。

### Q: 连接超时或无法连接
**A:**
1. 检查 Chrome 是否正在运行
2. 访问 http://localhost:9222/json 确认端口开放
3. 确保没有防火墙阻止 9222 端口

### Q: Demo 运行时浏览器没有反应
**A:** 查看浏览器窗口，有些 Demo 会在页面上显示效果（如修改 DOM、截图等）

### Q: 如何停止 Chrome
**A:** 直接关闭 Chrome 窗口即可。如果需要重新启动，再次运行启动命令。

## 下一步

- 阅读每个 Demo 的源代码，理解 CDP 命令的使用
- 修改 Demo 代码，尝试不同的参数
- 查看 [CDP 官方文档](https://chromedevtools.github.io/devtools-protocol/) 了解更多命令
- 尝试组合多个 Domain 实现自己的功能

## 提示

- 每个 Demo 都有详细的注释和输出，仔细阅读
- 可以同时打开 Chrome DevTools 观察效果
- 运行 Demo 时观察浏览器窗口的变化
- 有些 Demo 会修改页面内容或创建新标签页

祝学习愉快！🚀
