/**
 * Demo 04: Network Domain - 网络监控
 *
 * 学习目标:
 * 1. 监听所有网络请求和响应
 * 2. 获取请求和响应的详细信息
 * 3. 拦截和修改请求
 * 4. 分析网络性能
 * 5. 模拟网络条件
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

interface RequestInfo {
  requestId: string;
  url: string;
  method: string;
  startTime: number;
  responseReceived?: boolean;
  status?: number;
  mimeType?: string;
  size?: number;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 04: Network Domain - 网络监控');
  console.log('='.repeat(60));
  console.log();

  const client = new CDPClient();
  const requests = new Map<string, RequestInfo>();

  try {
    // 连接到浏览器
    const targets = await getTargets();
    const pageTarget = targets.find(t => t.type === 'page');

    if (!pageTarget) {
      console.error('❌ 没有找到可用的页面');
      return;
    }

    await client.connect(pageTarget.webSocketDebuggerUrl);
    console.log('✅ 已连接到浏览器');
    console.log();

    // 步骤 1: 启用网络监控
    console.log('📋 步骤 1: 启用网络监控');
    console.log('-'.repeat(60));
    await client.send('Network.enable');
    await client.send('Page.enable');
    console.log('✅ Network 和 Page 域已启用');
    console.log();

    // 步骤 2: 设置网络事件监听
    console.log('📋 步骤 2: 设置网络事件监听');
    console.log('-'.repeat(60));

    // 请求即将发送
    client.on('Network.requestWillBeSent', (params) => {
      requests.set(params.requestId, {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        startTime: params.timestamp
      });
      console.log(`📤 请求发送: ${params.request.method} ${params.request.url}`);
    });

    // 收到响应头
    client.on('Network.responseReceived', (params) => {
      const req = requests.get(params.requestId);
      if (req) {
        req.responseReceived = true;
        req.status = params.response.status;
        req.mimeType = params.response.mimeType;
      }
      console.log(`📥 收到响应: ${params.response.status} ${params.response.url}`);
      console.log(`   Content-Type: ${params.response.mimeType}`);
    });

    // 加载完成
    client.on('Network.loadingFinished', (params) => {
      const req = requests.get(params.requestId);
      if (req) {
        req.size = params.encodedDataLength;
        const duration = (params.timestamp - req.startTime) * 1000;
        console.log(`✅ 加载完成: ${req.url}`);
        console.log(`   大小: ${(req.size / 1024).toFixed(2)} KB, 耗时: ${duration.toFixed(2)}ms`);
      }
    });

    // 加载失败
    client.on('Network.loadingFailed', (params) => {
      console.log(`❌ 加载失败: ${params.errorText}`);
    });

    console.log('✅ 网络事件监听已设置');
    console.log();

    // 步骤 3: 导航到页面并监控网络请求
    console.log('📋 步骤 3: 导航到页面并监控网络请求');
    console.log('-'.repeat(60));
    await client.send('Page.navigate', { url: 'https://example.com' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log();

    // 等待所有请求完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 步骤 4: 统计网络请求
    console.log('📋 步骤 4: 网络请求统计');
    console.log('-'.repeat(60));
    console.log(`总请求数: ${requests.size}`);

    const byType = new Map<string, number>();
    let totalSize = 0;

    requests.forEach(req => {
      if (req.mimeType) {
        const type = req.mimeType.split('/')[0];
        byType.set(type, (byType.get(type) || 0) + 1);
      }
      if (req.size) {
        totalSize += req.size;
      }
    });

    console.log('\n按类型分类:');
    byType.forEach((count, type) => {
      console.log(`  - ${type}: ${count} 个`);
    });
    console.log(`\n总传输大小: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log();

    // 步骤 5: 获取特定请求的详细信息
    console.log('📋 步骤 5: 获取请求体和响应体');
    console.log('-'.repeat(60));

    const firstRequest = Array.from(requests.values())[0];
    if (firstRequest) {
      try {
        const responseBody = await client.send('Network.getResponseBody', {
          requestId: firstRequest.requestId
        });
        console.log(`请求: ${firstRequest.url}`);
        console.log(`响应体长度: ${responseBody.body.length} 字符`);
        console.log(`Base64 编码: ${responseBody.base64Encoded}`);
        console.log(`\n响应体预览 (前 200 字符):`);
        console.log(responseBody.body.substring(0, 200) + '...');
      } catch (error: any) {
        console.log('⚠️  无法获取响应体:', error.message);
      }
    }
    console.log();

    // 步骤 6: 清除缓存并重新加载
    console.log('📋 步骤 6: 清除缓存并重新加载');
    console.log('-'.repeat(60));
    requests.clear();

    await client.send('Network.clearBrowserCache');
    console.log('✅ 浏览器缓存已清除');

    await client.send('Page.reload', { ignoreCache: true });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`重新加载后的请求数: ${requests.size}`);
    console.log();

    // 步骤 7: 设置 Cookie
    console.log('📋 步骤 7: 设置 Cookie');
    console.log('-'.repeat(60));

    await client.send('Network.setCookie', {
      name: 'test_cookie',
      value: 'hello_cdp',
      domain: 'example.com',
      path: '/',
      secure: false,
      httpOnly: false
    });
    console.log('✅ Cookie 已设置');

    // 获取 Cookie
    const cookies = await client.send('Network.getCookies', {
      urls: ['https://example.com']
    });
    console.log(`\n当前 Cookie 数量: ${cookies.cookies.length}`);
    cookies.cookies.forEach((cookie: any) => {
      console.log(`  - ${cookie.name} = ${cookie.value}`);
    });
    console.log();

    // 步骤 8: 模拟网络条件
    console.log('📋 步骤 8: 模拟慢速网络');
    console.log('-'.repeat(60));

    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 100,        // 延迟 100ms
      downloadThroughput: 1024 * 1024 / 8,  // 1 Mbps 下载
      uploadThroughput: 512 * 1024 / 8      // 512 Kbps 上传
    });
    console.log('✅ 已设置网络条件: 延迟 100ms, 下载 1Mbps, 上传 512Kbps');

    requests.clear();
    await client.send('Page.reload');
    await waitForEvent(client, 'Page.loadEventFired', 15000);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('慢速网络下的加载情况:');
    requests.forEach(req => {
      if (req.size) {
        console.log(`  ${req.url.substring(0, 60)}`);
        console.log(`    大小: ${(req.size / 1024).toFixed(2)} KB`);
      }
    });

    // 恢复正常网络
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });
    console.log('\n✅ 已恢复正常网络条件');
    console.log();

    // 步骤 9: 阻止特定 URL
    console.log('📋 步骤 9: 阻止特定 URL 模式');
    console.log('-'.repeat(60));

    await client.send('Network.setBlockedURLs', {
      urls: ['*.png', '*.jpg', '*.gif']  // 阻止所有图片
    });
    console.log('✅ 已阻止所有图片资源 (*.png, *.jpg, *.gif)');

    requests.clear();
    await client.send('Page.reload');
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n阻止图片后的请求数: ${requests.size}`);
    console.log('(图片请求应该被阻止)');
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 04 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Network Domain 的核心功能:');
    console.log('  1. ✅ Network.enable - 启用网络监控');
    console.log('  2. ✅ Network.getResponseBody - 获取响应体');
    console.log('  3. ✅ Network.setCookie / getCookies - Cookie 管理');
    console.log('  4. ✅ Network.clearBrowserCache - 清除缓存');
    console.log('  5. ✅ Network.emulateNetworkConditions - 模拟网络条件');
    console.log('  6. ✅ Network.setBlockedURLs - 阻止特定 URL');
    console.log();
    console.log('网络事件:');
    console.log('  • Network.requestWillBeSent - 请求即将发送');
    console.log('  • Network.responseReceived - 收到响应');
    console.log('  • Network.loadingFinished - 加载完成');
    console.log('  • Network.loadingFailed - 加载失败');
    console.log();
    console.log('下一步: npm run demo:05 学习 Runtime Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
