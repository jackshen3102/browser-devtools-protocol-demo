/**
 * Demo 09: Storage Domain - 存储管理
 *
 * 学习目标:
 * 1. 管理 Cookie（查看、设置、删除）
 * 2. 操作 LocalStorage 和 SessionStorage
 * 3. 清除缓存和数据
 * 4. 查看存储使用情况
 * 5. 管理 IndexedDB
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 09: Storage Domain - 存储管理');
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
    await client.send('Network.enable');
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOMStorage.enable');
    console.log('✅ Network、Page、Runtime 和 DOMStorage 域已启用');
    console.log();

    // 导航到测试页面
    console.log('📋 准备: 导航到测试页面');
    console.log('-'.repeat(60));
    await client.send('Page.navigate', { url: 'https://example.com' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log('✅ 页面加载完成');
    console.log();

    // 步骤 1: 设置 Cookie
    console.log('📋 步骤 1: 设置 Cookie');
    console.log('-'.repeat(60));

    await client.send('Network.setCookie', {
      name: 'user_id',
      value: '12345',
      domain: 'example.com',
      path: '/',
      secure: false,
      httpOnly: false,
      sameSite: 'Lax'
    });
    console.log('✅ Cookie "user_id" 已设置');

    await client.send('Network.setCookie', {
      name: 'session_token',
      value: 'abc-def-ghi',
      domain: 'example.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
      expires: Date.now() / 1000 + 3600  // 1 小时后过期
    });
    console.log('✅ Cookie "session_token" 已设置（HttpOnly, Secure）');

    await client.send('Network.setCookie', {
      name: 'preferences',
      value: JSON.stringify({ theme: 'dark', lang: 'zh-CN' }),
      domain: 'example.com',
      path: '/'
    });
    console.log('✅ Cookie "preferences" 已设置');
    console.log();

    // 步骤 2: 获取所有 Cookie
    console.log('📋 步骤 2: 获取所有 Cookie');
    console.log('-'.repeat(60));

    const cookies = await client.send('Network.getCookies', {
      urls: ['https://example.com']
    });

    console.log(`找到 ${cookies.cookies.length} 个 Cookie:\n`);
    cookies.cookies.forEach((cookie: any, index: number) => {
      console.log(`${index + 1}. ${cookie.name} = ${cookie.value}`);
      console.log(`   Domain: ${cookie.domain}`);
      console.log(`   Path: ${cookie.path}`);
      console.log(`   Secure: ${cookie.secure ? '是' : '否'}`);
      console.log(`   HttpOnly: ${cookie.httpOnly ? '是' : '否'}`);
      console.log(`   SameSite: ${cookie.sameSite || 'None'}`);
      if (cookie.expires) {
        const expireDate = new Date(cookie.expires * 1000);
        console.log(`   过期时间: ${expireDate.toLocaleString()}`);
      }
      console.log();
    });

    // 步骤 3: 删除特定 Cookie
    console.log('📋 步骤 3: 删除特定 Cookie');
    console.log('-'.repeat(60));

    await client.send('Network.deleteCookies', {
      name: 'user_id',
      domain: 'example.com',
      path: '/'
    });
    console.log('✅ Cookie "user_id" 已删除');

    const remainingCookies = await client.send('Network.getCookies', {
      urls: ['https://example.com']
    });
    console.log(`剩余 Cookie 数量: ${remainingCookies.cookies.length}`);
    console.log();

    // 步骤 4: 操作 LocalStorage
    console.log('📋 步骤 4: 操作 LocalStorage');
    console.log('-'.repeat(60));

    // 设置 LocalStorage 数据
    await client.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('username', 'cdp_user');
        localStorage.setItem('settings', JSON.stringify({
          notifications: true,
          theme: 'dark',
          language: 'zh-CN'
        }));
        localStorage.setItem('last_visit', new Date().toISOString());
      `
    });
    console.log('✅ 已向 LocalStorage 写入数据');

    // 获取 storage ID
    const storageId = {
      securityOrigin: 'https://example.com',
      isLocalStorage: true
    };

    // 读取 LocalStorage
    const localStorageItems = await client.send('DOMStorage.getDOMStorageItems', {
      storageId
    });

    console.log('\nLocalStorage 内容:');
    localStorageItems.entries.forEach((entry: string[]) => {
      console.log(`  ${entry[0]}: ${entry[1]}`);
    });
    console.log();

    // 步骤 5: 操作 SessionStorage
    console.log('📋 步骤 5: 操作 SessionStorage');
    console.log('-'.repeat(60));

    await client.send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('page_views', '5');
        sessionStorage.setItem('scroll_position', '1234');
        sessionStorage.setItem('temp_data', 'temporary');
      `
    });
    console.log('✅ 已向 SessionStorage 写入数据');

    const sessionStorageId = {
      securityOrigin: 'https://example.com',
      isLocalStorage: false
    };

    const sessionStorageItems = await client.send('DOMStorage.getDOMStorageItems', {
      storageId: sessionStorageId
    });

    console.log('\nSessionStorage 内容:');
    sessionStorageItems.entries.forEach((entry: string[]) => {
      console.log(`  ${entry[0]}: ${entry[1]}`);
    });
    console.log();

    // 步骤 6: 修改存储项
    console.log('📋 步骤 6: 修改存储项');
    console.log('-'.repeat(60));

    await client.send('DOMStorage.setDOMStorageItem', {
      storageId,
      key: 'username',
      value: 'updated_user'
    });
    console.log('✅ LocalStorage "username" 已更新');

    // 验证修改
    const updatedValue = await client.send('Runtime.evaluate', {
      expression: 'localStorage.getItem("username")',
      returnByValue: true
    });
    console.log(`新值: ${updatedValue.result.value}`);
    console.log();

    // 步骤 7: 删除存储项
    console.log('📋 步骤 7: 删除存储项');
    console.log('-'.repeat(60));

    await client.send('DOMStorage.removeDOMStorageItem', {
      storageId,
      key: 'last_visit'
    });
    console.log('✅ LocalStorage "last_visit" 已删除');

    const afterDelete = await client.send('DOMStorage.getDOMStorageItems', {
      storageId
    });
    console.log(`剩余项数: ${afterDelete.entries.length}`);
    console.log();

    // 步骤 8: 清除所有存储
    console.log('📋 步骤 8: 清除特定源的所有数据');
    console.log('-'.repeat(60));

    await client.send('Storage.clearDataForOrigin', {
      origin: 'https://example.com',
      storageTypes: 'local_storage,session_storage,cookies'
    });
    console.log('✅ 已清除 example.com 的所有存储数据');

    // 验证清除
    const afterClear = await client.send('Network.getCookies', {
      urls: ['https://example.com']
    });
    console.log(`Cookie 数量: ${afterClear.cookies.length}`);

    const localStorageAfterClear = await client.send('Runtime.evaluate', {
      expression: 'localStorage.length',
      returnByValue: true
    });
    console.log(`LocalStorage 项数: ${localStorageAfterClear.result.value}`);
    console.log();

    // 步骤 9: 查看缓存存储
    console.log('📋 步骤 9: 查看缓存存储');
    console.log('-'.repeat(60));

    try {
      const cacheNames = await client.send('CacheStorage.requestCacheNames', {
        securityOrigin: 'https://example.com'
      });
      console.log(`Cache Storage 数量: ${cacheNames.caches.length}`);
      if (cacheNames.caches.length > 0) {
        cacheNames.caches.forEach((cache: any) => {
          console.log(`  - ${cache.cacheName}`);
        });
      } else {
        console.log('  (无缓存)');
      }
    } catch (error) {
      console.log('⚠️  该站点没有使用 Cache Storage');
    }
    console.log();

    // 步骤 10: 获取存储使用情况
    console.log('📋 步骤 10: 获取存储使用情况');
    console.log('-'.repeat(60));

    const usage = await client.send('Storage.getUsageAndQuota', {
      origin: 'https://example.com'
    });

    console.log('存储配额信息:');
    console.log(`  已使用: ${(usage.usage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  配额: ${(usage.quota / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  使用率: ${((usage.usage / usage.quota) * 100).toFixed(2)}%`);
    console.log();

    if (usage.usageBreakdown) {
      console.log('使用情况分解:');
      usage.usageBreakdown.forEach((item: any) => {
        console.log(`  ${item.storageType}: ${(item.usage / 1024).toFixed(2)} KB`);
      });
      console.log();
    }

    // 步骤 11: 清除浏览器缓存
    console.log('📋 步骤 11: 清除浏览器缓存');
    console.log('-'.repeat(60));

    await client.send('Network.clearBrowserCache');
    console.log('✅ 浏览器缓存已清除');
    console.log();

    // 步骤 12: 清除浏览器 Cookie
    console.log('📋 步骤 12: 清除所有浏览器 Cookie');
    console.log('-'.repeat(60));

    await client.send('Network.clearBrowserCookies');
    console.log('✅ 所有浏览器 Cookie 已清除');
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 09 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Storage Domain 的核心功能:');
    console.log('  1. ✅ Network.setCookie / getCookies / deleteCookies - Cookie 管理');
    console.log('  2. ✅ DOMStorage.getDOMStorageItems - 获取存储项');
    console.log('  3. ✅ DOMStorage.setDOMStorageItem - 设置存储项');
    console.log('  4. ✅ DOMStorage.removeDOMStorageItem - 删除存储项');
    console.log('  5. ✅ Storage.clearDataForOrigin - 清除源的数据');
    console.log('  6. ✅ Storage.getUsageAndQuota - 获取存储配额');
    console.log('  7. ✅ Network.clearBrowserCache - 清除缓存');
    console.log('  8. ✅ Network.clearBrowserCookies - 清除 Cookie');
    console.log();
    console.log('存储类型:');
    console.log('  • Cookie - HTTP Cookie');
    console.log('  • LocalStorage - 持久化本地存储');
    console.log('  • SessionStorage - 会话存储');
    console.log('  • IndexedDB - 结构化数据存储');
    console.log('  • Cache Storage - Service Worker 缓存');
    console.log();
    console.log('实用场景:');
    console.log('  • 自动化测试中的数据清理');
    console.log('  • Cookie 管理和注入');
    console.log('  • 存储配额监控');
    console.log('  • 隐私数据清除');
    console.log();
    console.log('下一步: npm run demo:10 学习 Debugger Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
