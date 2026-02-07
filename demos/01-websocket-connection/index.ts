/**
 * Demo 01: WebSocket 连接基础
 *
 * 学习目标:
 * 1. 理解 CDP 的通信机制（WebSocket）
 * 2. 掌握 CDP 消息格式（请求/响应/事件）
 * 3. 连接到浏览器并获取版本信息
 *
 * 运行前准备:
 * 1. 启动带调试端口的 Chrome:
 *    macOS: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
 *    Windows: chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
 * 2. 访问 http://localhost:9222/json 验证连接
 */

import { CDPClient, getTargets, getBrowserVersion } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 01: WebSocket 连接基础');
  console.log('='.repeat(60));
  console.log();

  try {
    // 步骤 1: 获取浏览器版本信息
    console.log('📋 步骤 1: 获取浏览器版本信息');
    console.log('-'.repeat(60));
    const version = await getBrowserVersion();
    console.log('浏览器信息:');
    console.log(`  - 产品: ${version.product}`);
    console.log(`  - 版本: ${version['Browser']}`);
    console.log(`  - User-Agent: ${version['User-Agent']}`);
    console.log(`  - WebKit 版本: ${version['WebKit-Version']}`);
    console.log();

    // 步骤 2: 获取可用的调试目标
    console.log('📋 步骤 2: 获取可用的调试目标（标签页）');
    console.log('-'.repeat(60));
    const targets = await getTargets();
    console.log(`找到 ${targets.length} 个目标:`);
    targets.forEach((target, index) => {
      console.log(`  ${index + 1}. ${target.type}: ${target.title || '(无标题)'}`);
      console.log(`     URL: ${target.url}`);
      console.log(`     WebSocket: ${target.webSocketDebuggerUrl}`);
    });
    console.log();

    // 步骤 3: 选择第一个页面类型的目标进行连接
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
      console.error('❌ 没有找到可用的页面目标，请在 Chrome 中打开一个标签页');
      return;
    }

    console.log('📋 步骤 3: 连接到目标页面');
    console.log('-'.repeat(60));
    console.log(`选择目标: ${pageTarget.title}`);
    console.log(`WebSocket URL: ${pageTarget.webSocketDebuggerUrl}`);
    console.log();

    // 步骤 4: 创建 CDP 客户端并连接
    const client = new CDPClient();
    await client.connect(pageTarget.webSocketDebuggerUrl);
    console.log();

    // 步骤 5: 发送一些基础命令
    console.log('📋 步骤 4: 发送 CDP 命令');
    console.log('-'.repeat(60));

    // 5.1 获取浏览器版本（通过 CDP）
    console.log('命令 1: Browser.getVersion');
    const browserVersion = await client.send('Browser.getVersion');
    console.log('📥 响应:', JSON.stringify(browserVersion, null, 2));
    console.log();

    // 5.2 获取当前页面的 URL
    console.log('命令 2: Target.getTargetInfo');
    const targetInfo = await client.send('Target.getTargetInfo', {
      targetId: pageTarget.targetId
    });
    console.log('📥 响应:', JSON.stringify(targetInfo, null, 2));
    console.log();

    // 步骤 6: 监听事件示例
    console.log('📋 步骤 5: 监听 CDP 事件');
    console.log('-'.repeat(60));
    console.log('启用 Page 域以接收页面事件...');

    // 监听页面加载事件
    client.on('Page.loadEventFired', (params) => {
      console.log('🎉 事件触发: Page.loadEventFired', params);
    });

    client.on('Page.domContentEventFired', (params) => {
      console.log('🎉 事件触发: Page.domContentEventFired', params);
    });

    // 启用 Page 域
    await client.send('Page.enable');
    console.log('✅ Page 域已启用，现在可以接收页面事件');
    console.log();

    // 步骤 7: 导航到一个页面来触发事件
    console.log('📋 步骤 6: 导航到新页面以触发事件');
    console.log('-'.repeat(60));
    console.log('导航到: https://example.com');
    await client.send('Page.navigate', { url: 'https://example.com' });

    // 等待页面加载完成
    console.log('等待页面加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 01 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了:');
    console.log('  1. ✅ 如何通过 HTTP 接口获取浏览器信息和目标列表');
    console.log('  2. ✅ 如何通过 WebSocket 连接到 CDP');
    console.log('  3. ✅ CDP 消息的格式：请求 { id, method, params }');
    console.log('  4. ✅ CDP 响应的格式：{ id, result } 或 { id, error }');
    console.log('  5. ✅ CDP 事件的格式：{ method, params }（没有 id）');
    console.log('  6. ✅ 如何发送命令和监听事件');
    console.log();
    console.log('下一步: npm run demo:02 学习 Page Domain');
    console.log();

    // 关闭连接
    client.close();

  } catch (error) {
    console.error('❌ 错误:', error);
    console.log();
    console.log('💡 提示:');
    console.log('  1. 确保 Chrome 已启动并开启调试端口 9222');
    console.log('  2. 访问 http://localhost:9222/json 检查连接');
    console.log('  3. 确保至少打开了一个标签页');
  }
}

main();
