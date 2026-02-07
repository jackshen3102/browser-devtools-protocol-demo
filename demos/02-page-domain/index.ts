/**
 * Demo 02: Page Domain - 页面控制
 *
 * 学习目标:
 * 1. 使用 Page.navigate 导航到不同的 URL
 * 2. 监听页面生命周期事件（load, DOMContentLoaded）
 * 3. 获取页面框架树信息
 * 4. 截取页面截图
 * 5. 生成 PDF
 *
 * Page Domain 是 CDP 中最常用的域之一，提供了页面级别的控制能力
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 02: Page Domain - 页面控制');
  console.log('='.repeat(60));
  console.log();

  const client = new CDPClient();

  try {
    // 连接到浏览器
    const targets = await getTargets();
    const pageTarget = targets.find(t => t.type === 'page');

    if (!pageTarget) {
      console.error('❌ 没有找到可用的页面，请在 Chrome 中打开一个标签页');
      return;
    }

    await client.connect(pageTarget.webSocketDebuggerUrl);
    console.log(`✅ 已连接到: ${pageTarget.title || pageTarget.url}`);
    console.log();

    // 步骤 1: 启用 Page 域
    console.log('📋 步骤 1: 启用 Page 域');
    console.log('-'.repeat(60));
    await client.send('Page.enable');
    console.log('✅ Page 域已启用');
    console.log();

    // 步骤 2: 监听页面生命周期事件
    console.log('📋 步骤 2: 设置页面生命周期事件监听');
    console.log('-'.repeat(60));

    let loadStartTime = Date.now();

    client.on('Page.frameStartedLoading', (params) => {
      console.log('🔄 页面开始加载:', params.frameId);
      loadStartTime = Date.now();
    });

    client.on('Page.frameNavigated', (params) => {
      console.log('🧭 页面导航完成:', params.frame.url);
    });

    client.on('Page.domContentEventFired', (params) => {
      const time = Date.now() - loadStartTime;
      console.log(`📄 DOMContentLoaded 触发 (耗时: ${time}ms)`);
    });

    client.on('Page.loadEventFired', (params) => {
      const time = Date.now() - loadStartTime;
      console.log(`✅ Load 事件触发 (总耗时: ${time}ms)`);
    });

    console.log('✅ 事件监听已设置');
    console.log();

    // 步骤 3: 导航到第一个页面
    console.log('📋 步骤 3: 导航到 https://example.com');
    console.log('-'.repeat(60));

    const nav1 = await client.send('Page.navigate', {
      url: 'https://example.com'
    });
    console.log('导航响应:', nav1);

    // 等待页面加载完成
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log();

    // 步骤 4: 获取页面框架树
    console.log('📋 步骤 4: 获取页面框架树');
    console.log('-'.repeat(60));
    const frameTree = await client.send('Page.getFrameTree');
    console.log('框架树信息:');
    console.log(`  - Frame ID: ${frameTree.frameTree.frame.id}`);
    console.log(`  - URL: ${frameTree.frameTree.frame.url}`);
    console.log(`  - 安全源: ${frameTree.frameTree.frame.securityOrigin}`);
    console.log(`  - MIME 类型: ${frameTree.frameTree.frame.mimeType}`);
    if (frameTree.frameTree.childFrames) {
      console.log(`  - 子框架数量: ${frameTree.frameTree.childFrames.length}`);
    }
    console.log();

    // 步骤 5: 获取页面布局信息
    console.log('📋 步骤 5: 获取页面布局信息');
    console.log('-'.repeat(60));
    const layoutMetrics = await client.send('Page.getLayoutMetrics');
    console.log('布局指标:');
    console.log('  视口 (Viewport):');
    console.log(`    - 宽度: ${layoutMetrics.layoutViewport.clientWidth}px`);
    console.log(`    - 高度: ${layoutMetrics.layoutViewport.clientHeight}px`);
    console.log('  内容大小 (Content):');
    console.log(`    - 宽度: ${layoutMetrics.contentSize.width}px`);
    console.log(`    - 高度: ${layoutMetrics.contentSize.height}px`);
    console.log();

    // 步骤 6: 截取页面截图
    console.log('📋 步骤 6: 截取页面截图');
    console.log('-'.repeat(60));
    const screenshot = await client.send('Page.captureScreenshot', {
      format: 'png',
      quality: 80,
      captureBeyondViewport: false
    });
    console.log(`✅ 截图已生成 (Base64 长度: ${screenshot.data.length} 字符)`);
    console.log('💡 提示: 你可以将 screenshot.data 保存为 PNG 文件');
    console.log();

    // 步骤 7: 导航到另一个页面
    console.log('📋 步骤 7: 导航到 https://www.wikipedia.org');
    console.log('-'.repeat(60));

    await client.send('Page.navigate', {
      url: 'https://www.wikipedia.org'
    });

    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log();

    // 步骤 8: 生成 PDF（仅在无头模式下工作）
    console.log('📋 步骤 8: 尝试生成 PDF');
    console.log('-'.repeat(60));
    try {
      const pdf = await client.send('Page.printToPDF', {
        printBackground: true,
        landscape: false
      });
      console.log(`✅ PDF 已生成 (Base64 长度: ${pdf.data.length} 字符)`);
    } catch (error: any) {
      console.log('⚠️  PDF 生成失败（需要无头模式）:', error.message);
    }
    console.log();

    // 步骤 9: 重新加载页面
    console.log('📋 步骤 9: 重新加载当前页面');
    console.log('-'.repeat(60));
    await client.send('Page.reload', {
      ignoreCache: true  // 忽略缓存
    });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log();

    // 步骤 10: 停止页面加载
    console.log('📋 步骤 10: 测试停止加载');
    console.log('-'.repeat(60));

    // 开始导航到一个慢速页面
    client.send('Page.navigate', {
      url: 'https://httpbin.org/delay/5'
    });

    // 等待 1 秒后停止加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    await client.send('Page.stopLoading');
    console.log('✅ 已停止页面加载');
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 02 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Page Domain 的核心功能:');
    console.log('  1. ✅ Page.enable - 启用页面域');
    console.log('  2. ✅ Page.navigate - 导航到 URL');
    console.log('  3. ✅ Page.reload - 重新加载页面');
    console.log('  4. ✅ Page.stopLoading - 停止加载');
    console.log('  5. ✅ Page.getFrameTree - 获取框架树');
    console.log('  6. ✅ Page.getLayoutMetrics - 获取布局信息');
    console.log('  7. ✅ Page.captureScreenshot - 截图');
    console.log('  8. ✅ Page.printToPDF - 生成 PDF');
    console.log();
    console.log('页面生命周期事件:');
    console.log('  • Page.frameStartedLoading - 开始加载');
    console.log('  • Page.frameNavigated - 导航完成');
    console.log('  • Page.domContentEventFired - DOM 加载完成');
    console.log('  • Page.loadEventFired - 页面加载完成');
    console.log();
    console.log('下一步: npm run demo:03 学习 DOM Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
