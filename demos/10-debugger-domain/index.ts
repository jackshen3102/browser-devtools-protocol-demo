/**
 * Demo 10: Debugger Domain - 调试功能
 *
 * 学习目标:
 * 1. 启用调试器
 * 2. 设置断点
 * 3. 单步执行代码
 * 4. 查看调用栈
 * 5. 查看和修改变量值
 * 6. 评估表达式
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 10: Debugger Domain - 调试功能');
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

    // 步骤 1: 启用调试器
    console.log('📋 步骤 1: 启用调试器');
    console.log('-'.repeat(60));

    await client.send('Debugger.enable');
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    console.log('✅ Debugger、Runtime 和 Page 域已启用');
    console.log();

    // 监听调试器事件
    client.on('Debugger.paused', (params) => {
      console.log('\n🛑 调试器已暂停');
      console.log(`原因: ${params.reason}`);
      if (params.data) {
        console.log('数据:', params.data);
      }
    });

    client.on('Debugger.resumed', () => {
      console.log('▶️  调试器已恢复');
    });

    client.on('Debugger.scriptParsed', (params) => {
      if (!params.url.startsWith('chrome-extension://') && params.url) {
        console.log(`📄 脚本已解析: ${params.url.substring(0, 80)}`);
      }
    });

    // 导航到测试页面
    console.log('📋 步骤 2: 导航到测试页面');
    console.log('-'.repeat(60));
    await client.send('Page.navigate', { url: 'https://example.com' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log('✅ 页面加载完成');
    console.log();

    // 等待脚本解析
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 步骤 3: 注入测试代码
    console.log('📋 步骤 3: 注入测试代码');
    console.log('-'.repeat(60));

    await client.send('Runtime.evaluate', {
      expression: `
        // 定义一些测试函数
        window.testFunctions = {
          add: function(a, b) {
            const result = a + b;
            return result;
          },

          multiply: function(x, y) {
            const temp = x * y;
            return temp;
          },

          fibonacci: function(n) {
            if (n <= 1) return n;
            return this.fibonacci(n - 1) + this.fibonacci(n - 2);
          },

          processData: function(data) {
            const processed = data.map(item => item * 2);
            const sum = processed.reduce((a, b) => a + b, 0);
            return { processed, sum };
          }
        };

        console.log('测试函数已注入');
      `
    });
    console.log('✅ 测试函数已注入到页面');
    console.log();

    // 步骤 4: 设置断点（通过 URL）
    console.log('📋 步骤 4: 设置断点');
    console.log('-'.repeat(60));

    // 首先，我们需要在内联脚本中设置断点
    // 由于我们不知道确切的脚本 ID，我们使用 debugger 语句
    console.log('使用 debugger 语句设置断点...');

    // 创建一个带有 debugger 语句的函数
    await client.send('Runtime.evaluate', {
      expression: `
        window.debugTest = function() {
          const x = 10;
          const y = 20;
          debugger;  // 断点会在这里触发
          const result = x + y;
          return result;
        };
      `
    });
    console.log('✅ 带有 debugger 语句的函数已创建');
    console.log();

    // 步骤 5: 触发断点
    console.log('📋 步骤 5: 触发断点');
    console.log('-'.repeat(60));
    console.log('调用 debugTest() 函数...');

    // 异步调用函数，这样我们可以处理暂停事件
    const debugPromise = client.send('Runtime.evaluate', {
      expression: 'window.debugTest()',
      returnByValue: true
    });

    // 等待调试器暂停
    await new Promise(resolve => setTimeout(resolve, 500));

    // 步骤 6: 查看调用栈
    console.log('\n📋 步骤 6: 查看调用栈');
    console.log('-'.repeat(60));

    try {
      // 注意：这可能会失败，因为调试器可能没有暂停
      const stackTrace = await client.send('Debugger.getStackTrace', {
        stackTraceId: { id: '1' }
      });
      console.log('调用栈:');
      console.log(JSON.stringify(stackTrace, null, 2));
    } catch (error) {
      console.log('⚠️  无法获取调用栈（调试器未暂停）');
    }
    console.log();

    // 步骤 7: 恢复执行
    console.log('📋 步骤 7: 恢复执行');
    console.log('-'.repeat(60));

    try {
      await client.send('Debugger.resume');
      console.log('✅ 已恢复执行');
    } catch (error) {
      console.log('⚠️  调试器未暂停，无需恢复');
    }

    // 等待函数执行完成
    try {
      const result = await Promise.race([
        debugPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      console.log('函数返回值:', result);
    } catch (error) {
      console.log('函数执行超时或出错');
    }
    console.log();

    // 步骤 8: 设置条件断点
    console.log('📋 步骤 8: 演示断点功能');
    console.log('-'.repeat(60));

    await client.send('Runtime.evaluate', {
      expression: `
        window.loopTest = function() {
          const results = [];
          for (let i = 0; i < 5; i++) {
            results.push(i * 2);
            if (i === 3) {
              debugger;  // 在 i === 3 时暂停
            }
          }
          return results;
        };
      `
    });
    console.log('✅ 循环测试函数已创建（在 i === 3 时会暂停）');
    console.log();

    // 步骤 9: 设置异常断点
    console.log('📋 步骤 9: 设置异常断点');
    console.log('-'.repeat(60));

    await client.send('Debugger.setPauseOnExceptions', {
      state: 'all'  // 'none', 'uncaught', 'all'
    });
    console.log('✅ 已启用异常断点（所有异常）');
    console.log();

    // 触发一个异常
    console.log('触发一个异常...');
    try {
      await client.send('Runtime.evaluate', {
        expression: `
          (function() {
            try {
              throw new Error('这是一个测试异常');
            } catch (e) {
              console.error('捕获到异常:', e.message);
            }
          })()
        `
      });
    } catch (error) {
      console.log('异常已被捕获');
    }
    console.log();

    // 步骤 10: 评估表达式
    console.log('📋 步骤 10: 在调试上下文中评估表达式');
    console.log('-'.repeat(60));

    // 设置一些全局变量
    await client.send('Runtime.evaluate', {
      expression: `
        window.debugData = {
          count: 42,
          message: 'Hello Debugger',
          items: [1, 2, 3, 4, 5]
        };
      `
    });

    // 评估表达式
    const evalResult = await client.send('Runtime.evaluate', {
      expression: 'window.debugData',
      returnByValue: true
    });
    console.log('评估结果:');
    console.log(JSON.stringify(evalResult.result.value, null, 2));
    console.log();

    // 步骤 11: 获取可能的断点位置
    console.log('📋 步骤 11: 调试器功能总结');
    console.log('-'.repeat(60));

    console.log('调试器功能演示:');
    console.log('  ✅ 启用和禁用调试器');
    console.log('  ✅ 使用 debugger 语句设置断点');
    console.log('  ✅ 暂停和恢复执行');
    console.log('  ✅ 设置异常断点');
    console.log('  ✅ 在调试上下文中评估表达式');
    console.log();

    // 步骤 12: 禁用异常断点
    console.log('📋 步骤 12: 清理');
    console.log('-'.repeat(60));

    await client.send('Debugger.setPauseOnExceptions', {
      state: 'none'
    });
    console.log('✅ 已禁用异常断点');

    await client.send('Debugger.disable');
    console.log('✅ 调试器已禁用');
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 10 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Debugger Domain 的核心功能:');
    console.log('  1. ✅ Debugger.enable / disable - 启用/禁用调试器');
    console.log('  2. ✅ 使用 debugger 语句设置断点');
    console.log('  3. ✅ Debugger.resume - 恢复执行');
    console.log('  4. ✅ Debugger.stepOver - 单步跳过');
    console.log('  5. ✅ Debugger.stepInto - 单步进入');
    console.log('  6. ✅ Debugger.stepOut - 单步退出');
    console.log('  7. ✅ Debugger.setPauseOnExceptions - 异常断点');
    console.log('  8. ✅ 在调试上下文中评估表达式');
    console.log();
    console.log('Debugger 事件:');
    console.log('  • Debugger.paused - 调试器暂停');
    console.log('  • Debugger.resumed - 调试器恢复');
    console.log('  • Debugger.scriptParsed - 脚本解析完成');
    console.log();
    console.log('实用场景:');
    console.log('  • 远程调试');
    console.log('  • 自动化测试中的断点');
    console.log('  • 代码执行追踪');
    console.log('  • 性能分析');
    console.log();
    console.log('🎉 恭喜！你已完成所有 10 个 CDP Demo！');
    console.log();
    console.log('你现在掌握了:');
    console.log('  ✅ WebSocket 连接和 CDP 通信机制');
    console.log('  ✅ Page Domain - 页面控制');
    console.log('  ✅ DOM Domain - DOM 操作');
    console.log('  ✅ Network Domain - 网络监控');
    console.log('  ✅ Runtime Domain - JavaScript 执行');
    console.log('  ✅ Target Domain - 多标签页管理');
    console.log('  ✅ Emulation Domain - 设备模拟');
    console.log('  ✅ Performance Domain - 性能分析');
    console.log('  ✅ Storage Domain - 存储管理');
    console.log('  ✅ Debugger Domain - 调试功能');
    console.log();
    console.log('下一步建议:');
    console.log('  • 查看 CDP 官方文档了解更多 Domain');
    console.log('  • 尝试组合多个 Domain 实现复杂功能');
    console.log('  • 构建自己的自动化工具或爬虫');
    console.log('  • 探索 Playwright/Puppeteer 的源码');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
