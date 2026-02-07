/**
 * Demo 07: Emulation Domain - 设备模拟
 *
 * 学习目标:
 * 1. 模拟移动设备
 * 2. 设置视口大小和设备像素比
 * 3. 模拟地理位置
 * 4. 设置 User-Agent
 * 5. 模拟触摸事件
 * 6. 设置时区和语言
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 07: Emulation Domain - 设备模拟');
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
    await client.send('Emulation.enable');
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    console.log('✅ Emulation、Page 和 Runtime 域已启用');
    console.log();

    // 步骤 1: 设置移动设备视口
    console.log('📋 步骤 1: 模拟 iPhone 12 Pro');
    console.log('-'.repeat(60));

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: {
        type: 'portraitPrimary',
        angle: 0
      }
    });
    console.log('✅ 视口已设置为 iPhone 12 Pro (390x844, 3x)');
    console.log();

    // 步骤 2: 设置 User-Agent
    console.log('📋 步骤 2: 设置移动设备 User-Agent');
    console.log('-'.repeat(60));

    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

    await client.send('Emulation.setUserAgentOverride', {
      userAgent: mobileUA,
      platform: 'iPhone'
    });
    console.log('✅ User-Agent 已设置为 iPhone');
    console.log();

    // 步骤 3: 启用触摸事件模拟
    console.log('📋 步骤 3: 启用触摸事件模拟');
    console.log('-'.repeat(60));

    await client.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });
    console.log('✅ 触摸事件已启用（最多 5 个触摸点）');
    console.log();

    // 导航到测试页面
    console.log('📋 步骤 4: 导航到测试页面');
    console.log('-'.repeat(60));

    await client.send('Page.navigate', { url: 'https://www.whatismybrowser.com' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log('✅ 页面加载完成');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 验证设备信息
    console.log('📋 步骤 5: 验证模拟的设备信息');
    console.log('-'.repeat(60));

    const deviceInfo = await client.send('Runtime.evaluate', {
      expression: `({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: screen.width,
        screenHeight: screen.height,
        devicePixelRatio: window.devicePixelRatio,
        isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
        touchPoints: navigator.maxTouchPoints
      })`,
      returnByValue: true
    });

    console.log('当前设备信息:');
    console.log(JSON.stringify(deviceInfo.result.value, null, 2));
    console.log();

    // 步骤 6: 切换到横屏模式
    console.log('📋 步骤 6: 切换到横屏模式');
    console.log('-'.repeat(60));

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 844,
      height: 390,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: {
        type: 'landscapePrimary',
        angle: 90
      }
    });
    console.log('✅ 已切换到横屏模式 (844x390)');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 步骤 7: 模拟 iPad
    console.log('📋 步骤 7: 模拟 iPad Pro 11"');
    console.log('-'.repeat(60));

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 834,
      height: 1194,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: {
        type: 'portraitPrimary',
        angle: 0
      }
    });

    await client.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      platform: 'iPad'
    });

    console.log('✅ 已切换到 iPad Pro 11" (834x1194, 2x)');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 步骤 8: 模拟地理位置
    console.log('📋 步骤 8: 模拟地理位置（纽约）');
    console.log('-'.repeat(60));

    await client.send('Emulation.setGeolocationOverride', {
      latitude: 40.7128,    // 纽约纬度
      longitude: -74.0060,  // 纽约经度
      accuracy: 100
    });
    console.log('✅ 地理位置已设置为纽约 (40.7128, -74.0060)');
    console.log();

    // 测试地理位置
    await client.send('Page.navigate', { url: 'https://example.com' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);

    const geoTest = await client.send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                });
              },
              (error) => {
                resolve({ error: error.message });
              }
            );
          } else {
            resolve({ error: 'Geolocation not supported' });
          }
        })
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('地理位置 API 返回:');
    console.log(JSON.stringify(geoTest.result.value, null, 2));
    console.log();

    // 步骤 9: 设置时区
    console.log('📋 步骤 9: 设置时区为东京');
    console.log('-'.repeat(60));

    await client.send('Emulation.setTimezoneOverride', {
      timezoneId: 'Asia/Tokyo'
    });
    console.log('✅ 时区已设置为 Asia/Tokyo');

    const timezoneTest = await client.send('Runtime.evaluate', {
      expression: `({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: new Date().toString(),
        offset: new Date().getTimezoneOffset()
      })`,
      returnByValue: true
    });

    console.log('时区信息:');
    console.log(JSON.stringify(timezoneTest.result.value, null, 2));
    console.log();

    // 步骤 10: 设置语言
    console.log('📋 步骤 10: 设置语言为日语');
    console.log('-'.repeat(60));

    await client.send('Emulation.setLocaleOverride', {
      locale: 'ja-JP'
    });
    console.log('✅ 语言已设置为日语 (ja-JP)');

    const localeTest = await client.send('Runtime.evaluate', {
      expression: `({
        language: navigator.language,
        languages: navigator.languages,
        dateFormat: new Date().toLocaleDateString(),
        numberFormat: (1234567.89).toLocaleString()
      })`,
      returnByValue: true
    });

    console.log('语言信息:');
    console.log(JSON.stringify(localeTest.result.value, null, 2));
    console.log();

    // 步骤 11: 模拟暗黑模式
    console.log('📋 步骤 11: 模拟暗黑模式');
    console.log('-'.repeat(60));

    await client.send('Emulation.setEmulatedMedia', {
      features: [
        {
          name: 'prefers-color-scheme',
          value: 'dark'
        }
      ]
    });
    console.log('✅ 已启用暗黑模式');

    const darkModeTest = await client.send('Runtime.evaluate', {
      expression: `
        window.matchMedia('(prefers-color-scheme: dark)').matches
      `,
      returnByValue: true
    });

    console.log(`暗黑模式检测: ${darkModeTest.result.value ? '已启用' : '未启用'}`);
    console.log();

    // 步骤 12: 恢复默认设置
    console.log('📋 步骤 12: 恢复默认设置');
    console.log('-'.repeat(60));

    await client.send('Emulation.clearDeviceMetricsOverride');
    await client.send('Emulation.clearGeolocationOverride');
    await client.send('Emulation.setTimezoneOverride', { timezoneId: '' });
    await client.send('Emulation.setLocaleOverride', { locale: '' });
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await client.send('Emulation.setEmulatedMedia', { features: [] });

    console.log('✅ 所有模拟设置已清除');
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 07 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Emulation Domain 的核心功能:');
    console.log('  1. ✅ Emulation.setDeviceMetricsOverride - 设置设备指标');
    console.log('  2. ✅ Emulation.setUserAgentOverride - 设置 User-Agent');
    console.log('  3. ✅ Emulation.setTouchEmulationEnabled - 启用触摸模拟');
    console.log('  4. ✅ Emulation.setGeolocationOverride - 设置地理位置');
    console.log('  5. ✅ Emulation.setTimezoneOverride - 设置时区');
    console.log('  6. ✅ Emulation.setLocaleOverride - 设置语言');
    console.log('  7. ✅ Emulation.setEmulatedMedia - 模拟媒体特性');
    console.log('  8. ✅ 清除各种模拟设置');
    console.log();
    console.log('实用场景:');
    console.log('  • 移动端网页测试');
    console.log('  • 响应式设计验证');
    console.log('  • 地理位置相关功能测试');
    console.log('  • 多语言和时区测试');
    console.log('  • 暗黑模式测试');
    console.log();
    console.log('下一步: npm run demo:08 学习 Performance Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
