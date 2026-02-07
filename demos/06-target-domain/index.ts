/**
 * Demo 06: Target Domain - 多标签页管理
 *
 * 学习目标:
 * 1. 发现和管理浏览器中的所有目标（标签页、iframe 等）
 * 2. 创建新标签页
 * 3. 关闭标签页
 * 4. 在不同标签页之间切换
 * 5. 为每个标签页创建独立的 CDP 会话
 */

import { CDPClient, getTargets } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 06: Target Domain - 多标签页管理');
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

    // 步骤 1: 启用目标发现
    console.log('📋 步骤 1: 启用目标发现');
    console.log('-'.repeat(60));

    await client.send('Target.setDiscoverTargets', {
      discover: true
    });
    console.log('✅ 目标发现已启用');
    console.log();

    // 监听目标事件
    client.on('Target.targetCreated', (params) => {
      console.log(`🆕 新目标创建: ${params.targetInfo.type} - ${params.targetInfo.url}`);
    });

    client.on('Target.targetInfoChanged', (params) => {
      console.log(`🔄 目标信息变更: ${params.targetInfo.targetId}`);
    });

    client.on('Target.targetDestroyed', (params) => {
      console.log(`🗑️  目标已销毁: ${params.targetId}`);
    });

    // 步骤 2: 获取所有目标
    console.log('📋 步骤 2: 获取所有当前目标');
    console.log('-'.repeat(60));

    const allTargets = await client.send('Target.getTargets');
    console.log(`找到 ${allTargets.targetInfos.length} 个目标:\n`);

    allTargets.targetInfos.forEach((target: any, index: number) => {
      console.log(`${index + 1}. ${target.type.toUpperCase()}`);
      console.log(`   ID: ${target.targetId}`);
      console.log(`   标题: ${target.title || '(无标题)'}`);
      console.log(`   URL: ${target.url}`);
      console.log(`   已附加: ${target.attached ? '是' : '否'}`);
      console.log();
    });

    // 步骤 3: 创建新标签页
    console.log('📋 步骤 3: 创建新标签页');
    console.log('-'.repeat(60));

    const newTarget1 = await client.send('Target.createTarget', {
      url: 'https://example.com'
    });
    console.log(`✅ 新标签页已创建: ${newTarget1.targetId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newTarget2 = await client.send('Target.createTarget', {
      url: 'https://www.wikipedia.org'
    });
    console.log(`✅ 新标签页已创建: ${newTarget2.targetId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newTarget3 = await client.send('Target.createTarget', {
      url: 'https://github.com'
    });
    console.log(`✅ 新标签页已创建: ${newTarget3.targetId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 步骤 4: 再次获取所有目标
    console.log('📋 步骤 4: 查看更新后的目标列表');
    console.log('-'.repeat(60));

    const updatedTargets = await client.send('Target.getTargets');
    const pageTargets = updatedTargets.targetInfos.filter((t: any) => t.type === 'page');
    console.log(`当前页面类型的目标数量: ${pageTargets.length}\n`);

    pageTargets.forEach((target: any, index: number) => {
      console.log(`${index + 1}. ${target.title || '(加载中...)'}`);
      console.log(`   URL: ${target.url}`);
    });
    console.log();

    // 步骤 5: 附加到新标签页并操作
    console.log('📋 步骤 5: 附加到新标签页并执行操作');
    console.log('-'.repeat(60));

    // 创建一个新的 CDP 客户端连接到新标签页
    const newClient = new CDPClient();

    // 获取新标签页的 WebSocket URL
    const targetInfo = await client.send('Target.getTargetInfo', {
      targetId: newTarget1.targetId
    });

    // 通过 Browser Target 创建会话
    const session = await client.send('Target.attachToTarget', {
      targetId: newTarget1.targetId,
      flatten: true
    });
    console.log(`✅ 已附加到目标: ${session.sessionId}`);

    // 在新标签页中执行命令（使用 sessionId）
    await client.send('Runtime.enable', {}, session.sessionId);
    await client.send('Page.enable', {}, session.sessionId);

    const result = await client.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    }, session.sessionId);

    console.log(`新标签页的标题: ${result.result.value}`);
    console.log();

    // 步骤 6: 激活特定标签页
    console.log('📋 步骤 6: 激活特定标签页');
    console.log('-'.repeat(60));

    await client.send('Target.activateTarget', {
      targetId: newTarget2.targetId
    });
    console.log(`✅ 已激活标签页: ${newTarget2.targetId}`);
    console.log('(查看浏览器窗口，应该切换到 Wikipedia 标签页)');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 步骤 7: 关闭标签页
    console.log('📋 步骤 7: 关闭创建的标签页');
    console.log('-'.repeat(60));

    await client.send('Target.closeTarget', {
      targetId: newTarget1.targetId
    });
    console.log(`✅ 已关闭标签页: ${newTarget1.targetId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await client.send('Target.closeTarget', {
      targetId: newTarget2.targetId
    });
    console.log(`✅ 已关闭标签页: ${newTarget2.targetId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await client.send('Target.closeTarget', {
      targetId: newTarget3.targetId
    });
    console.log(`✅ 已关闭标签页: ${newTarget3.targetId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log();

    // 步骤 8: 创建后台标签页
    console.log('📋 步骤 8: 创建后台标签页（不激活）');
    console.log('-'.repeat(60));

    const backgroundTarget = await client.send('Target.createTarget', {
      url: 'https://example.org',
      background: true  // 在后台打开
    });
    console.log(`✅ 后台标签页已创建: ${backgroundTarget.targetId}`);
    console.log('(标签页已创建但不会切换到前台)');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 清理
    await client.send('Target.closeTarget', {
      targetId: backgroundTarget.targetId
    });
    console.log('✅ 后台标签页已关闭');
    console.log();

    // 步骤 9: 获取浏览器上下文
    console.log('📋 步骤 9: 获取浏览器上下文');
    console.log('-'.repeat(60));

    const contexts = await client.send('Target.getBrowserContexts');
    console.log(`浏览器上下文数量: ${contexts.browserContextIds.length}`);
    contexts.browserContextIds.forEach((contextId: string, index: number) => {
      console.log(`  ${index + 1}. ${contextId}`);
    });
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 06 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 Target Domain 的核心功能:');
    console.log('  1. ✅ Target.setDiscoverTargets - 启用目标发现');
    console.log('  2. ✅ Target.getTargets - 获取所有目标');
    console.log('  3. ✅ Target.createTarget - 创建新标签页');
    console.log('  4. ✅ Target.closeTarget - 关闭标签页');
    console.log('  5. ✅ Target.activateTarget - 激活标签页');
    console.log('  6. ✅ Target.attachToTarget - 附加到目标');
    console.log('  7. ✅ Target.getTargetInfo - 获取目标信息');
    console.log('  8. ✅ Target.getBrowserContexts - 获取浏览器上下文');
    console.log();
    console.log('Target 事件:');
    console.log('  • Target.targetCreated - 目标创建');
    console.log('  • Target.targetInfoChanged - 目标信息变更');
    console.log('  • Target.targetDestroyed - 目标销毁');
    console.log();
    console.log('实用场景:');
    console.log('  • 多标签页自动化');
    console.log('  • 并行处理多个页面');
    console.log('  • 管理浏览器窗口');
    console.log();
    console.log('下一步: npm run demo:07 学习 Emulation Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

main();
