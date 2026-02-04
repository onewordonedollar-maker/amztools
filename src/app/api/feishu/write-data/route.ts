import { NextResponse } from 'next/server';

const FEISHU_CONFIG = {
  APP_ID: 'cli_a9084a1b94b99bb4',
  APP_SECRET: 'Xl9sDmT9XjF8Vj3LlT9pC7JkP6R9bY5n',
  APP_TOKEN: 'BQJyby28AaMob3ss3ZicHttqnmb',
  TABLE_ID: 'tblYf3Evgym8glcO',
};

// 飞书字段ID映射
const FEISHU_FIELD_IDS = {
  亚马逊主图: 'flddml4wmb',
  类目: 'fldwFTo9LY',
  站点: 'fldpcXFDal',
  产品名: 'fldH5INOVk',
  产品链接: 'fldEopW2To',
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
  数据缺失: 'fld5yJubY1',
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, message: '无效的数据格式' },
        { status: 400 }
      );
    }

    // 获取飞书访问令牌
    const accessToken = await getFeishuAccessToken();

    // 列映射
    const columnMap: { [key: string]: string } = {
      亚马逊主图: '亚马逊主图',
      类目: '类目',
      站点: '站点',
      产品名: '产品名',
      产品链接: '产品链接',
      实时售价本币: '实时售价本币',
      当前汇率: '当前汇率',
      产品成本: '产品成本',
      AMZ佣金: 'AMZ佣金',
      VAT: 'VAT',
      头程成本: '头程成本',
      FBA费: 'FBA费',
      FBA仓储费: 'FBA仓储费',
      站内广告: '站内广告',
      退款费: '退款费',
      其他: '其他',
      含广利润: '含广利润',
      含广利润率: '含广利润率',
      不含广利润: '不含广利润',
      不含广利润率: '不含广利润率',
      产品成本RMB: '产品成本RMB',
      头程单价: '头程单价',
      头程重量: '头程重量',
      包装重量_lb: '包装重量_lb',
      数据缺失: '数据缺失',
    };

    // 将数据转换为飞书API格式
    const records = data.map((item: any) => {
      const record: { [key: string]: any } = {};

      Object.entries(columnMap).forEach(([fieldName, dataKey]) => {
        const fieldId = FEISHU_FIELD_IDS[fieldName as keyof typeof FEISHU_FIELD_IDS];
        const value = item[dataKey];

        if (fieldId) {
          // 数值类型字段转换为数字
          if (typeof value === 'number') {
            record[fieldId] = value;
          } else {
            record[fieldId] = value || '';
          }
        }
      });

      return record;
    });

    // 批量写入飞书（每批最多500条）
    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const batch of batches) {
      try {
        const response = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records/batch_create`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              records: batch.map(r => ({ fields: r })),
            }),
          }
        );

        const result = await response.json();

        if (result.code === 0) {
          successCount += batch.length;
        } else {
          errorCount += batch.length;
          errors.push(`${result.msg} (code: ${result.code})`);
        }
      } catch (error) {
        errorCount += batch.length;
        errors.push(error instanceof Error ? error.message : '未知错误');
      }
    }

    if (errorCount > 0) {
      return NextResponse.json({
        success: false,
        message: `部分数据写入失败: 成功 ${successCount} 条，失败 ${errorCount} 条`,
        successCount,
        errorCount,
        errors,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `成功写入 ${successCount} 条数据到飞书表格！`,
        successCount,
        errorCount: 0,
      });
    }
  } catch (error) {
    console.error('写入飞书出错:', error);
    return NextResponse.json(
      {
        success: false,
        message: `写入失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}
