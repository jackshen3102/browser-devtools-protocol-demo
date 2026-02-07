/**
 * Demo 08: Performance Domain - 性能分析
 *
 * 学习目标:
 * 1. 收集页面性能指标
 * 2. 获取 FCP、LCP 等 Web Vitals 指标
 * 3. 分析资源加载时间
 * 4. 监控内存使用
 * 5. 生成性能报告
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 08: Performance Domain - 性能分析');
  console.log('='.repeat(60));
  console.log();

  const client = new CDPClient();

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

    // 步骤 1: 启用性能监控
    console.log('📋 步骤 1: 启用性能监控');
    console.log('-'.repeat(60));

    await client.send('Performance.enable');
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    console.log('✅ Performance、Page 和 Runtime 域已启用');
    console.log();

    // 步骤 2: 导航到测试页面并收集指标
    console.log('📋 步骤 2: 导航到测试页面');
    console.log('-'.repeat(60));

    const startTime = Date.now();
    await client.send('Page.navigate', { url: 'https://www.wikipedia.org' });
    await waitForEvent(client, 'Page.loadEventFired', 15000);
    const loadTime = Date.now() - startTime;

    console.log(`✅ 页面加载完成，耗时: ${loadTime}ms`);
    console.log();

    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 步骤 3: 获取性能指标
    console.log('📋 步骤 3: 获取性能指标');
    console.log('-'.repeat(60));

    const metrics = await client.send('Performance.getMetrics');
    console.log('性能指标:\n');

    // 格式化并显示关键指标
    const metricMap = new Map<string, number>();
    metrics.metrics.forEach((metric: any) => {
      metricMap.set(metric.name, metric.value);
    });

    // 显示关键指标
    const keyMetrics = [
      'Timestamp',
      'Documents',
      'Frames',
      'JSEventListeners',
      'Nodes',
      'LayoutCount',
      'RecalcStyleCount',
      'LayoutDuration',
      'RecalcStyleDuration',
      'ScriptDuration',
      'TaskDuration',
      'JSHeapUsedSize',
      'JSHeapTotalSize'
    ];

    keyMetrics.forEach(name => {
      const value = metricMap.get(name);
      if (value !== undefined) {
        let displayValue = value.toString();

        // 格式化特定指标
        if (name.includes('Duration')) {
          displayValue = `${(value * 1000).toFixed(2)} ms`;
        } else if (name.includes('Size')) {
          displayValue = `${(value / 1024 / 1024).toFixed(2)} MB`;
        } else if (name === 'Timestamp') {
          displayValue = new Date(value * 1000).toISOString();
        }

        console.log(`  ${name.padEnd(25)}: ${displayValue}`);
      }
    });
    console.log();

    // 步骤 4: 获取 Navigation Timing 指标
    console.log('📋 步骤 4: 获取 Navigation Timing 指标');
    console.log('-'.repeat(60));

    const navTiming = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const timing = performance.timing;
          const navigation = performance.navigation;
          return {
            // 导航类型
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount,

            // 时间指标（相对于 navigationStart）
            domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
            tcpConnection: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domProcessing: timing.domComplete - timing.domLoading,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,

            // 关键时间点
            timeToFirstByte: timing.responseStart - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Navigation Timing 指标:\n');
    const timingData = navTiming.result.value;
    console.log(`  导航类型: ${['Navigate', 'Reload', 'Back/Forward'][timingData.navigationType] || 'Unknown'}`);
    console.log(`  重定向次数: ${timingData.redirectCount}`);
    console.log(`\n时间分解:`);
    console.log(`  DNS 查询: ${timingData.domainLookup}ms`);
    console.log(`  TCP 连接: ${timingData.tcpConnection}ms`);
    console.log(`  请求时间: ${timingData.request}ms`);
    console.log(`  响应时间: ${timingData.response}ms`);
    console.log(`  DOM 处理: ${timingData.domProcessing}ms`);
    console.log(`\n关键指标:`);
    console.log(`  TTFB (首字节时间): ${timingData.timeToFirstByte}ms`);
    console.log(`  DOM Interactive: ${timingData.domInteractive}ms`);
    console.log(`  DOMContentLoaded: ${timingData.domContentLoaded}ms`);
    console.log(`  Load Complete: ${timingData.loadComplete}ms`);
    console.log();

    // 步骤 5: 获取 Resource Timing 指标
    console.log('📋 步骤 5: 获取资源加载时间');
    console.log('-'.repeat(60));

    const resourceTiming = await client.send('Runtime.evaluate', {
      expression: `
        performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          type: entry.initiatorType,
          duration: Math.round(entry.duration),
          size: entry.transferSize || 0,
          startTime: Math.round(entry.startTime)
        })).sort((a, b) => b.duration - a.duration).slice(0, 10)
      `,
      returnByValue: true
    });

    console.log('加载最慢的 10 个资源:\n');
    resourceTiming.result.value.forEach((resource: any, index: number) => {
      console.log(`${index + 1}. ${resource.type.toUpperCase()}`);
      console.log(`   URL: ${resource.name.substring(0, 80)}${resource.name.length > 80 ? '...' : ''}`);
      console.log(`   耗时: ${resource.duration}ms, 大小: ${(resource.size / 1024).toFixed(2)} KB`);
    });
    console.log();

    // 步骤 6: 获取 Paint Timing 指标
    console.log('📋 步骤 6: 获取 Paint Timing 指标');
    console.log('-'.repeat(60));

    const paintTiming = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const paints = {};
          performance.getEntriesByType('paint').forEach(entry => {
            paints[entry.name] = Math.round(entry.startTime);
          });
          return paints;
        })()
      `,
      returnByValue: true
    });

    console.log('Paint Timing 指标:');
    const paints = paintTiming.result.value;
    if (paints['first-paint']) {
      console.log(`  FP (First Paint): ${paints['first-paint']}ms`);
    }
    if (paints['first-contentful-paint']) {
      console.log(`  FCP (First Contentful Paint): ${paints['first-contentful-paint']}ms`);
    }
    console.log();

    // 步骤 7: 获取 Largest Contentful Paint (LCP)
    console.log('📋 步骤 7: 获取 LCP 指标');
    console.log('-'.repeat(60));

    const lcp = await client.send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve({
              lcp: Math.round(lastEntry.startTime),
              element: lastEntry.element?.tagName || 'unknown',
              size: lastEntry.size
            });
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          // 10 秒后超时
          setTimeout(() => resolve({ error: 'timeout' }), 10000);
        })
      `,
      awaitPromise: true,
      returnByValue: true
    });

    if (lcp.result.value.lcp) {
      console.log(`LCP (Largest Contentful Paint): ${lcp.result.value.lcp}ms`);
      console.log(`  元素: ${lcp.result.value.element}`);
      console.log(`  大小: ${lcp.result.value.size} px²`);
    } else {
      console.log('⚠️  无法获取 LCP 指标');
    }
    console.log();

    // 步骤 8: 获取内存使用情况
    console.log('📋 步骤 8: 获取内存使用情况');
    console.log('-'.repeat(60));

    const memoryInfo = await client.send('Runtime.evaluate', {
      expression: `
        performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      `,
      returnByValue: true
    });

    if (memoryInfo.result.value) {
      const mem = memoryInfo.result.value;
      console.log('JavaScript 堆内存:');
      console.log(`  已使用: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  总大小: ${(mem.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  限制: ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  使用率: ${((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(2)}%`);
    } else {
      console.log('⚠️  内存信息不可用（需要启用 --enable-precise-memory-info）');
    }
    console.log();

    // 步骤 9: 生成性能评分
    console.log('📋 步骤 9: 生成性能评分');
    console.log('-'.repeat(60));

    const fcp = paints['first-contentful-paint'] || 0;
    const lcpValue = lcp.result.value.lcp || 0;
    const totalLoad = timingData.loadComplete || 0;

    function getScore(value: number, good: number, poor: number): string {
      if (value <= good) return '🟢 优秀';
      if (value <= poor) return '🟡 需要改进';
      return '🔴 差';
    }

    console.log('Web Vitals 评分:\n');
    console.log(`  FCP: ${fcp}ms ${getScore(fcp, 1800, 3000)}`);
    console.log(`  LCP: ${lcpValue}ms ${getScore(lcpValue, 2500, 4000)}`);
    console.log(`  总加载时间: ${totalLoad}ms ${getScore(totalLoad, 3000, 5000)}`);
    console.log();

    console.log('评分标准:');
    console.log('  FCP: ≤1.8s (优秀), ≤3s (需要改进), >3s (差)');
    console.log('  LCP: ≤2.5s (优秀), ≤4s (需要改进), >4s (差)');
    console.log('  总加载: ≤3s (优秀), ≤5s (需要改进), >5s (差)');
    console.log();

    // 步骤 10: 禁用性能监控
    console.log('📋 步骤 10: 禁用性能监控');
    console.log('-'.repeat(60));

    await client.send('Performance.disable');
    console.log('✅ 性能监控已禁用');
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 08 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Performance Domain 的核心功能:');
    console.log('  1. ✅ Performance.enable - 启用性能监控');
    console.log('  2. ✅ Performance.getMetrics - 获取性能指标');
    console.log('  3. ✅ 通过 Runtime.evaluate 获取详细的性能数据');
    console.log('  4. ✅ Navigation Timing API - 页面加载时间分解');
    console.log('  5. ✅ Resource Timing API - 资源加载分析');
    console.log('  6. ✅ Paint Timing API - FP 和 FCP');
    console.log('  7. ✅ LCP (Largest Contentful Paint)');
    console.log('  8. ✅ 内存使用监控');
    console.log();
    console.log('关键性能指标 (Web Vitals):');
    console.log('  • FCP (First Contentful Paint) - 首次内容绘制');
    console.log('  • LCP (Largest Contentful Paint) - 最大内容绘制');
    console.log('  • TTFB (Time to First Byte) - 首字节时间');
    console.log('  • DOM Interactive - DOM 可交互时间');
    console.log();
    console.log('实用场景:');
    console.log('  • 性能监控和优化');
    console.log('  • 自动化性能测试');
    console.log('  • 生成性能报告');
    console.log('  • 识别性能瓶颈');
    console.log();
    console.log('下一步: npm run demo:09 学习 Storage Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
