import { NextResponse } from 'next/server';

const FEISHU_CONFIG = {
  APP_ID: 'cli_a9084a1b94b99bb4',
  APP_SECRET: 'Xl9sDmT9XjF8Vj3LlT9pC7JkP6R9bY5n',
  APP_TOKEN: 'BQJyby28AaMob3ss3ZicHttqnmb',
  TABLE_ID: 'tblYf3Evgym8glcO',
};

// 获取飞书访问令牌
async function getFeishuAccessToken(): Promise<string> {
  // 临时使用之前获取的Token
  // 生产环境应该从环境变量中读取App Secret，并通过飞书API动态获取
  return 't-g10424fxDP4D3N7WPFFXMN6VXAU5ICAPC2X3AQ4Y';

  // 正确的获取方式（需要有效的App Secret）:
  /*
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_CONFIG.APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET || FEISHU_CONFIG.APP_SECRET,
    }),
  });

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(`获取访问令牌失败: ${result.msg}`);
  }
  return result.tenant_access_token;
  */
}

export async function POST() {
  try {
    const accessToken = await getFeishuAccessToken();

    // 字段类型配置
    const fieldConfigs: { [key: string]: any } = {
      // 文本类型字段
      亚马逊主图: { type: 1, ui_type: 'Text' },
      类目: { type: 1, ui_type: 'Text' },
      站点: { type: 1, ui_type: 'Text' },
      产品名: { type: 1, ui_type: 'Text' },
      产品链接: { type: 1, ui_type: 'Text' },
      数据缺失: { type: 1, ui_type: 'Text' },

      // 数值类型字段（货币格式）
      实时售价本币: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      当前汇率: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.0000", type: "number" } } },
      产品成本: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      AMZ佣金: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      VAT: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      头程成本: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      FBA费: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      FBA仓储费: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      站内广告: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      退款费: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      其他: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      含广利润: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      不含广利润: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      产品成本RMB: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      头程单价: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "currency" } } },
      头程重量: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "number" } } },
      包装重量_lb: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00", type: "number" } } },

      // 百分比类型字段
      含广利润率: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00%", type: "percent" } } },
      不含广利润率: { type: 2, ui_type: 'Number', property: { formatter: { pattern: "0.00%", type: "percent" } } },
    };

    // 字段ID映射
    const fieldIdMap: { [key: string]: string } = {
      亚马逊主图: 'flddml4wmb',
      类目: 'fldwFTo9LY',
      站点: 'fldpcXFDal',
      产品名: 'fldH5INOVk',
      产品链接: 'fldEopW2To',
      数据缺失: 'fld5yJubY1',
      实时售价本币: 'fldduLim2A',
      当前汇率: 'fldGqxbueq',
      产品成本: 'fldqkx9xHY',
      AMZ佣金: 'fldh4aqTa4',
      VAT: 'fldr27MmNc',
      头程成本: 'fldBaQekUV',
      FBA费: 'fldsyK6Vpy',
      FBA仓储费: 'fldBjOiKdF',
      站内广告: 'fldvZNDMT8',
      退款费: 'fldsKugYYs',
      其他: 'fld7u5cm1v',
      含广利润: 'fld9hgF59K',
      含广利润率: 'fldDMEGiE5',
      不含广利润: 'fldeBbXY1b',
      不含广利润率: 'fldGfXzsAw',
      产品成本RMB: 'fldgzhcfxh',
      头程单价: 'fld0SJ7TcR',
      头程重量: 'fldplNQlvD',
      包装重量_lb: 'fldimq2vje',
    };

    const results: { field: string; success: boolean; message: string }[] = [];

    // 批量更新字段类型
    for (const [fieldName, fieldConfig] of Object.entries(fieldConfigs)) {
      try {
        const fieldId = fieldIdMap[fieldName];
        if (!fieldId) continue;

        const response = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/fields/${fieldId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fieldConfig),
          }
        );

        const result = await response.json();

        if (result.code === 0) {
          results.push({ field: fieldName, success: true, message: '更新成功' });
        } else {
          results.push({ field: fieldName, success: false, message: result.msg || '更新失败' });
        }
      } catch (error) {
        results.push({
          field: fieldName,
          success: false,
          message: error instanceof Error ? error.message : '未知错误',
        });
      }

      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `格式同步完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('同步飞书格式出错:', error);
    return NextResponse.json(
      {
        success: false,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}
