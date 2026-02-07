/**
 * Demo 05: Runtime Domain - JavaScript 执行
 *
 * 学习目标:
 * 1. 在页面上下文中执行 JavaScript 代码
 * 2. 获取执行结果和返回值
 * 3. 处理异常和错误
 * 4. 调用页面上的函数
 * 5. 获取对象属性
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 05: Runtime Domain - JavaScript 执行');
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

    // 启用必要的域
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    console.log('✅ Runtime 和 Page 域已启用');
    console.log();

    // 导航到测试页面
    console.log('📋 准备: 导航到测试页面');
    console.log('-'.repeat(60));
    await client.send('Page.navigate', { url: 'https://example.com' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log('✅ 页面加载完成');
    console.log();

    // 步骤 1: 执行简单的 JavaScript 表达式
    console.log('📋 步骤 1: 执行简单的 JavaScript 表达式');
    console.log('-'.repeat(60));

    const result1 = await client.send('Runtime.evaluate', {
      expression: '1 + 1',
      returnByValue: true
    });
    console.log('表达式: 1 + 1');
    console.log('结果:', result1.result.value);
    console.log();

    const result2 = await client.send('Runtime.evaluate', {
      expression: '"Hello, " + "CDP!"',
      returnByValue: true
    });
    console.log('表达式: "Hello, " + "CDP!"');
    console.log('结果:', result2.result.value);
    console.log();

    // 步骤 2: 获取页面信息
    console.log('📋 步骤 2: 获取页面信息');
    console.log('-'.repeat(60));

    const pageInfo = await client.send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        url: location.href,
        userAgent: navigator.userAgent,
        cookies: document.cookie,
        screenWidth: screen.width,
        screenHeight: screen.height
      })`,
      returnByValue: true
    });
    console.log('页面信息:');
    console.log(JSON.stringify(pageInfo.result.value, null, 2));
    console.log();

    // 步骤 3: 操作 DOM
    console.log('📋 步骤 3: 通过 JavaScript 操作 DOM');
    console.log('-'.repeat(60));

    await client.send('Runtime.evaluate', {
      expression: `
        const h1 = document.querySelector('h1');
        if (h1) {
          h1.style.color = 'blue';
          h1.style.fontSize = '48px';
          h1.textContent = 'Modified by CDP Runtime! 🎨';
        }
      `
    });
    console.log('✅ 已修改 h1 标签样式（查看浏览器窗口）');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 步骤 4: 获取 DOM 元素数量
    console.log('📋 步骤 4: 统计 DOM 元素');
    console.log('-'.repeat(60));

    const domStats = await client.send('Runtime.evaluate', {
      expression: `({
        totalElements: document.querySelectorAll('*').length,
        divs: document.querySelectorAll('div').length,
        paragraphs: document.querySelectorAll('p').length,
        links: document.querySelectorAll('a').length,
        images: document.querySelectorAll('img').length
      })`,
      returnByValue: true
    });
    console.log('DOM 统计:');
    console.log(JSON.stringify(domStats.result.value, null, 2));
    console.log();

    // 步骤 5: 执行异步代码
    console.log('📋 步骤 5: 执行异步代码');
    console.log('-'.repeat(60));

    const asyncResult = await client.send('Runtime.evaluate', {
      expression: `
        new Promise(resolve => {
          setTimeout(() => {
            resolve('异步操作完成！');
          }, 1000);
        })
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('异步结果:', asyncResult.result.value);
    console.log();

    // 步骤 6: 处理异常
    console.log('📋 步骤 6: 处理 JavaScript 异常');
    console.log('-'.repeat(60));

    const errorResult = await client.send('Runtime.evaluate', {
      expression: 'throw new Error("这是一个测试错误")',
      returnByValue: true
    });

    if (errorResult.exceptionDetails) {
      console.log('捕获到异常:');
      console.log(`  消息: ${errorResult.exceptionDetails.text}`);
      console.log(`  行号: ${errorResult.exceptionDetails.lineNumber}`);
      console.log(`  列号: ${errorResult.exceptionDetails.columnNumber}`);
    }
    console.log();

    // 步骤 7: 调用页面函数
    console.log('📋 步骤 7: 定义并调用页面函数');
    console.log('-'.repeat(60));

    // 先定义一个函数
    await client.send('Runtime.evaluate', {
      expression: `
        window.myFunction = function(name, age) {
          return {
            message: 'Hello, ' + name + '!',
            info: 'You are ' + age + ' years old.',
            timestamp: Date.now()
          };
        }
      `
    });
    console.log('✅ 已定义 window.myFunction');

    // 调用函数
    const funcResult = await client.send('Runtime.evaluate', {
      expression: 'window.myFunction("CDP", 5)',
      returnByValue: true
    });
    console.log('函数返回值:');
    console.log(JSON.stringify(funcResult.result.value, null, 2));
    console.log();

    // 步骤 8: 获取对象属性
    console.log('📋 步骤 8: 获取对象属性');
    console.log('-'.repeat(60));

    // 获取 window 对象的引用
    const windowObj = await client.send('Runtime.evaluate', {
      expression: 'window',
      returnByValue: false  // 返回对象引用
    });

    if (windowObj.result.objectId) {
      // 获取对象的属性列表
      const properties = await client.send('Runtime.getProperties', {
        objectId: windowObj.result.objectId,
        ownProperties: true
      });

      console.log(`window 对象的属性数量: ${properties.result.length}`);
      console.log('\n前 10 个属性:');
      properties.result.slice(0, 10).forEach((prop: any) => {
        console.log(`  - ${prop.name}: ${prop.value?.type || 'unknown'}`);
      });
    }
    console.log();

    // 步骤 9: 执行复杂的数据提取
    console.log('📋 步骤 9: 提取页面上的所有链接');
    console.log('-'.repeat(60));

    const links = await client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href,
          target: a.target || '_self'
        }))
      `,
      returnByValue: true
    });

    console.log(`找到 ${links.result.value.length} 个链接:`);
    links.result.value.forEach((link: any, index: number) => {
      console.log(`  ${index + 1}. ${link.text || '(无文本)'}`);
      console.log(`     URL: ${link.href}`);
    });
    console.log();

    // 步骤 10: 监听控制台消息
    console.log('📋 步骤 10: 监听控制台消息');
    console.log('-'.repeat(60));

    client.on('Runtime.consoleAPICalled', (params) => {
      const args = params.args.map((arg: any) => arg.value || arg.description).join(' ');
      console.log(`🖥️  Console.${params.type}: ${args}`);
    });

    // 在页面上触发一些控制台输出
    await client.send('Runtime.evaluate', {
      expression: `
        console.log('这是一条日志消息');
        console.warn('这是一条警告消息');
        console.error('这是一条错误消息');
        console.info('这是一条信息消息');
      `
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log();

    // 步骤 11: 注入自定义脚本
    console.log('📋 步骤 11: 注入自定义脚本到页面');
    console.log('-'.repeat(60));

    await client.send('Runtime.evaluate', {
      expression: `
        // 创建一个浮动通知
        const notification = document.createElement('div');
        notification.textContent = '✅ CDP 脚本已注入！';
        notification.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px 25px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: Arial, sans-serif;
          font-size: 16px;
        \`;
        document.body.appendChild(notification);

        // 3 秒后移除
        setTimeout(() => {
          notification.remove();
        }, 3000);
      `
    });
    console.log('✅ 已在页面上显示通知（查看浏览器窗口）');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 05 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Runtime Domain 的核心功能:');
    console.log('  1. ✅ Runtime.enable - 启用运行时域');
    console.log('  2. ✅ Runtime.evaluate - 执行 JavaScript 代码');
    console.log('  3. ✅ Runtime.getProperties - 获取对象属性');
    console.log('  4. ✅ returnByValue - 返回值或对象引用');
    console.log('  5. ✅ awaitPromise - 等待 Promise 完成');
    console.log('  6. ✅ 异常处理 - exceptionDetails');
    console.log();
    console.log('Runtime 事件:');
    console.log('  • Runtime.consoleAPICalled - 控制台 API 调用');
    console.log('  • Runtime.exceptionThrown - 异常抛出');
    console.log();
    console.log('实用技巧:');
    console.log('  • 可以执行任意 JavaScript 代码');
    console.log('  • 可以操作 DOM、读取数据、调用 API');
    console.log('  • 可以注入自定义脚本到页面');
    console.log('  • 支持异步代码和 Promise');
    console.log();
    console.log('下一步: npm run demo:06 学习 Target Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
