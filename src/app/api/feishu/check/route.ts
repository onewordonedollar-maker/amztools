import { NextResponse } from 'next/server';

const FEISHU_CONFIG = {
  APP_ID: 'cli_a9084a1b94b99bb4',
  APP_TOKEN: 'BQJyby28AaMob3ss3ZicHttqnmb',
  TABLE_ID: 'tblYf3Evgym8glcO',
};

export async function GET() {
  const results: { name: string; success: boolean; message: string; details?: any }[] = [];

  // 测试1: 检查App Token是否有效
  try {
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}`, {
      headers: {
        'Authorization': 'Bearer t-g10424fxDP4D3N7WPFFXMN6VXAU5ICAPC2X3AQ4Y',
      },
    });
    const data = await response.json();
    results.push({
      name: 'App Token',
      success: data.code === 0,
      message: data.code === 0 ? 'App Token有效' : `App Token无效: ${data.msg}`,
      details: data,
    });
  } catch (error) {
    results.push({
      name: 'App Token',
      success: false,
      message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }

  // 测试2: 检查表格是否可访问
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}`,
      {
        headers: {
          'Authorization': 'Bearer t-g10424fxDP4D3N7WPFFXMN6VXAU5ICAPC2X3AQ4Y',
        },
      }
    );
    const data = await response.json();
    results.push({
      name: '表格访问',
      success: data.code === 0,
      message: data.code === 0 ? '表格可访问' : `表格不可访问: ${data.msg}`,
      details: data,
    });
  } catch (error) {
    results.push({
      name: '表格访问',
      success: false,
      message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }

  // 测试3: 检查字段列表
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/fields`,
      {
        headers: {
          'Authorization': 'Bearer t-g10424fxDP4D3N7WPFFXMN6VXAU5ICAPC2X3AQ4Y',
        },
      }
    );
    const data = await response.json();
    results.push({
      name: '字段列表',
      success: data.code === 0,
      message: data.code === 0 ? `可读取 ${data.data?.items?.length || 0} 个字段` : `无法读取字段: ${data.msg}`,
      details: data,
    });
  } catch (error) {
    results.push({
      name: '字段列表',
      success: false,
      message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }

  // 测试4: 尝试创建一条测试记录
  try {
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer t-g10424fxDP4D3N7WPFFXMN6VXAU5ICAPC2X3AQ4Y',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            flddml4wmb: 'https://example.com/test.jpg',
            fldwFTo9LY: '测试类目',
          },
        }),
      }
    );
    const data = await response.json();
    results.push({
      name: '写入测试',
      success: data.code === 0,
      message: data.code === 0 ? '可以写入数据' : `无法写入数据: ${data.msg} (code: ${data.code})`,
      details: data,
    });
  } catch (error) {
    results.push({
      name: '写入测试',
      success: false,
      message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  });
}
