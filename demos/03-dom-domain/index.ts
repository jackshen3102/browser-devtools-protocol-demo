/**
 * Demo 03: DOM Domain - DOM 操作
 *
 * 学习目标:
 * 1. 获取完整的 DOM 树
 * 2. 使用 CSS 选择器查询节点
 * 3. 获取节点的 HTML 内容
 * 4. 修改节点内容
 * 5. 获取节点属性
 */

import { CDPClient, getTargets, waitForEvent } from '../../utils/cdp-client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Demo 03: DOM Domain - DOM 操作');
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
    await client.send('Page.enable');
    await client.send('DOM.enable');
    console.log('✅ Page 和 DOM 域已启用');
    console.log();

    // 导航到测试页面
    console.log('📋 步骤 1: 导航到测试页面');
    console.log('-'.repeat(60));
    await client.send('Page.navigate', { url: 'https://www.coze.cn/share/7540658064019521831?share_id=7540662329311723815&secret=P73SuDbH&from=home_case_list' });
    await waitForEvent(client, 'Page.loadEventFired', 10000);
    console.log('✅ 页面加载完成');
    console.log();

    // 步骤 2: 获取根文档节点
    console.log('📋 步骤 2: 获取根文档节点');
    console.log('-'.repeat(60));
    const doc = await client.send('DOM.getDocument', {
      depth: -1,  // -1 表示获取整个 DOM 树
      pierce: true  // 穿透 shadow DOM
    });
    console.log('文档节点信息:');
    console.log(`  - Node ID: ${doc.root.nodeId}`);
    console.log(`  - Node Type: ${doc.root.nodeType} (${getNodeTypeName(doc.root.nodeType)})`);
    console.log(`  - Node Name: ${doc.root.nodeName}`);
    console.log(`  - 子节点数量: ${doc.root.childNodeCount || 0}`);
    console.log();

    // 辅助函数：打印 DOM 树
    function printDOMTree(node: any, indent = 0) {
      const prefix = '  '.repeat(indent);
      let info = `${prefix}- ${node.nodeName}`;

      if (node.nodeType === 1) {  // Element
        if (node.attributes) {
          const attrs = [];
          for (let i = 0; i < node.attributes.length; i += 2) {
            attrs.push(`${node.attributes[i]}="${node.attributes[i + 1]}"`);
          }
          if (attrs.length > 0) {
            info += ` [${attrs.join(', ')}]`;
          }
        }
      } else if (node.nodeType === 3 && node.nodeValue) {  // Text
        const text = node.nodeValue.trim();
        if (text) {
          info += `: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
        }
      }

      console.log(info);

      if (node.children) {
        node.children.forEach((child: any) => printDOMTree(child, indent + 1));
      }
    }

    console.log('📋 步骤 3: 打印 DOM 树结构（前 3 层）');
    console.log('-'.repeat(60));
    const docShallow = await client.send('DOM.getDocument', { depth: 3 });
    printDOMTree(docShallow.root);
    console.log();

    // 步骤 4: 使用 CSS 选择器查询节点
    console.log('📋 步骤 4: 使用 CSS 选择器查询节点');
    console.log('-'.repeat(60));

    // 查询 h1 标签
    const h1Result = await client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'h1'
    });
    console.log(`查询 "h1" 标签: NodeId = ${h1Result.nodeId}`);

    // 查询所有 p 标签
    const pResults = await client.send('DOM.querySelectorAll', {
      nodeId: doc.root.nodeId,
      selector: 'p'
    });
    console.log(`查询所有 "p" 标签: 找到 ${pResults.nodeIds.length} 个`);

    // 查询所有链接
    const linkResults = await client.send('DOM.querySelectorAll', {
      nodeId: doc.root.nodeId,
      selector: 'a'
    });
    console.log(`查询所有 "a" 标签: 找到 ${linkResults.nodeIds.length} 个`);
    console.log();

    // 步骤 5: 获取节点的 HTML 内容
    console.log('📋 步骤 5: 获取节点的 HTML 内容');
    console.log('-'.repeat(60));

    if (h1Result.nodeId) {
      const outerHTML = await client.send('DOM.getOuterHTML', {
        nodeId: h1Result.nodeId
      });
      console.log('h1 标签的 outerHTML:');
      console.log(outerHTML.outerHTML);
      console.log();
    }

    // 步骤 6: 获取节点属性
    console.log('📋 步骤 6: 获取节点属性');
    console.log('-'.repeat(60));

    if (linkResults.nodeIds.length > 0) {
      const linkNodeId = linkResults.nodeIds[0];
      const attributes = await client.send('DOM.getAttributes', {
        nodeId: linkNodeId
      });
      console.log('第一个链接的属性:');
      for (let i = 0; i < attributes.attributes.length; i += 2) {
        console.log(`  - ${attributes.attributes[i]}: ${attributes.attributes[i + 1]}`);
      }
      console.log();
    }

    // 步骤 7: 修改节点内容
    console.log('📋 步骤 7: 修改节点内容');
    console.log('-'.repeat(60));

    if (h1Result.nodeId) {
      console.log('修改 h1 标签的内容...');
      await client.send('DOM.setOuterHTML', {
        nodeId: h1Result.nodeId,
        outerHTML: '<h1 style="color: red;">Hello from CDP! 🚀</h1>'
      });
      console.log('✅ h1 标签已修改（查看浏览器窗口）');

      // 等待 2 秒让用户看到变化
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log();
    }

    // 步骤 8: 获取盒模型信息
    console.log('📋 步骤 8: 获取元素的盒模型');
    console.log('-'.repeat(60));

    if (h1Result.nodeId) {
      const boxModel = await client.send('DOM.getBoxModel', {
        nodeId: h1Result.nodeId
      });
      console.log('h1 元素的盒模型:');
      console.log(`  - Content: [${boxModel.model.content.join(', ')}]`);
      console.log(`  - Padding: [${boxModel.model.padding.join(', ')}]`);
      console.log(`  - Border: [${boxModel.model.border.join(', ')}]`);
      console.log(`  - Margin: [${boxModel.model.margin.join(', ')}]`);
      console.log(`  - Width: ${boxModel.model.width}px`);
      console.log(`  - Height: ${boxModel.model.height}px`);
      console.log();
    }

    // 步骤 9: 聚焦到元素
    console.log('📋 步骤 9: 聚焦到元素');
    console.log('-'.repeat(60));

    // 查找输入框（如果有）
    const inputResult = await client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'input'
    });

    if (inputResult.nodeId) {
      await client.send('DOM.focus', {
        nodeId: inputResult.nodeId
      });
      console.log('✅ 已聚焦到输入框');
    } else {
      console.log('⚠️  页面上没有输入框');
    }
    console.log();

    // 步骤 10: 请求子节点
    console.log('📋 步骤 10: 动态请求子节点');
    console.log('-'.repeat(60));

    const bodyResult = await client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: 'body'
    });

    if (bodyResult.nodeId) {
      const childNodes = await client.send('DOM.requestChildNodes', {
        nodeId: bodyResult.nodeId,
        depth: 1
      });
      console.log('✅ 已请求 body 的子节点');
    }
    console.log();

    // 总结
    console.log('='.repeat(60));
    console.log('✅ Demo 03 完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('你学到了 DOM Domain 的核心功能:');
    console.log('  1. ✅ DOM.enable - 启用 DOM 域');
    console.log('  2. ✅ DOM.getDocument - 获取文档节点');
    console.log('  3. ✅ DOM.querySelector - 查询单个节点');
    console.log('  4. ✅ DOM.querySelectorAll - 查询多个节点');
    console.log('  5. ✅ DOM.getOuterHTML - 获取节点 HTML');
    console.log('  6. ✅ DOM.setOuterHTML - 设置节点 HTML');
    console.log('  7. ✅ DOM.getAttributes - 获取节点属性');
    console.log('  8. ✅ DOM.getBoxModel - 获取盒模型');
    console.log('  9. ✅ DOM.focus - 聚焦到元素');
    console.log('  10. ✅ DOM.requestChildNodes - 请求子节点');
    console.log();
    console.log('下一步: npm run demo:04 学习 Network Domain');
    console.log();

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    client.close();
  }
}

function getNodeTypeName(nodeType: number): string {
  const types: Record<number, string> = {
    1: 'ELEMENT_NODE',
    3: 'TEXT_NODE',
    8: 'COMMENT_NODE',
    9: 'DOCUMENT_NODE',
    10: 'DOCUMENT_TYPE_NODE',
    11: 'DOCUMENT_FRAGMENT_NODE'
  };
  return types[nodeType] || 'UNKNOWN';
}

main();
