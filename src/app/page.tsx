'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface ProductData {
  id: number;
  亚马逊主图: string;
  类目: string;
  站点: string;
  产品名: string;
  产品链接: string;
  实时售价本币: number;
  当前汇率: number;
  产品成本: number;
  产品成本RMB: number;
  AMZ佣金: number;
  VAT: number;
  头程单价: number;
  头程重量: number;
  包装重量_lb: number;
  头程成本: number;
  FBA费: number;
  FBA仓储费: number;
  站内广告: number;
  退款费: number;
  其他: number;
  含广利润: number;
  含广利润率: number;
  不含广利润: number;
  不含广利润率: number;
  数据缺失: string;
}

export default function ProfitCalculator() {
  const [data, setData] = useState<ProductData[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 列顺序定义（按照用户给定的序号顺序）
  const columnOrder = [
    '亚马逊主图',        // 1
    '类目',              // 2
    '站点',              // 3
    '产品名',            // 4
    '产品链接',          // 5
    '实时售价本币',      // 6
    '当前汇率',          // 7
    '产品成本',          // 8
    'AMZ佣金',           // 9
    'VAT',               // 10
    '头程成本',          // 11
    'FBA费',             // 12
    'FBA仓储费',         // 13
    '站内广告',          // 14
    '退款费',            // 15
    '其他',              // 16
    '含广利润',          // 17
    '含广利润率',        // 18
    '不含广利润',        // 19
    '不含广利润率',      // 20
    '产品成本RMB',       // 21
    '头程单价',          // 22
    '头程重量',          // 23
    '包装重量_lb',       // 24
    '数据缺失',          // 25
  ];

  // 计算利润数据
  const calculateProfit = (item: ProductData): ProductData => {
    // 检查数据缺失
    const isMissing = !item.实时售价本币 || !item.亚马逊主图 || !item.包装重量_lb || item.包装重量_lb <= 0;
    
    if (isMissing) {
      return {
        ...item,
        数据缺失: '是',
      };
    }

    // 计算头程重量
    const 头程重量 = item.包装重量_lb * 0.454;

    // 计算头程成本
    const 头程成本 = item.当前汇率 > 0 ? item.头程单价 / item.当前汇率 * 头程重量 : 0;

    // 计算产品成本
    const 产品成本 = item.当前汇率 > 0 ? item.产品成本RMB / item.当前汇率 : 0;

    // 计算各种费用
    const AMZ佣金 = item.实时售价本币 * 0.15;
    const 站内广告 = item.实时售价本币 * 0.20;
    const 退款费 = item.实时售价本币 * 0.05;

    // 计算含广利润
    const 含广利润 = 
      item.实时售价本币 - 
      产品成本 - 
      AMZ佣金 - 
      item.VAT - 
      头程成本 - 
      item.FBA费 - 
      item.FBA仓储费 - 
      站内广告 - 
      退款费 - 
      item.其他;

    // 计算含广利润率
    const 含广利润率 = item.实时售价本币 > 0 ? (含广利润 / item.实时售价本币) * 100 : 0;

    // 计算不含广告利润
    const 不含广利润 = 
      item.实时售价本币 - 
      产品成本 - 
      AMZ佣金 - 
      item.VAT - 
      头程成本 - 
      item.FBA费 - 
      item.FBA仓储费 - 
      退款费 - 
      item.其他;

    // 计算不含广利润率
    const 不含广利润率 = item.实时售价本币 > 0 ? (不含广利润 / item.实时售价本币) * 100 : 0;

    return {
      ...item,
      头程重量,
      头程成本,
      产品成本,
      AMZ佣金,
      站内广告,
      退款费,
      含广利润,
      含广利润率,
      不含广利润,
      不含广利润率,
      数据缺失: '否',
    };
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // 跳过表头，从第二行开始
      const rows = jsonData.slice(1);

      const parsedData: ProductData[] = rows
        .map((row, index) => {
          // 列映射（0-based索引）
          const 主图 = row[7] || ''; // H列
          const 类目 = row[10] || ''; // K列
          const 产品名 = row[5] || ''; // F列
          const 产品链接 = row[6] || ''; // G列
          const 价格 = row[22] || 0; // W列
          const FBA费 = row[30] || 0; // AE列
          const 包装重量Raw = row[58] || 0; // BG列
          // 去除单位，只保留数值
          const 包装重量 = typeof 包装重量Raw === 'string'
            ? parseFloat(包装重量Raw.replace(/[^\d.]/g, '')) || 0
            : 包装重量Raw;

          return {
            id: index,
            亚马逊主图: 主图,
            类目,
            站点: 'US',
            产品名,
            产品链接,
            实时售价本币: 价格,
            当前汇率: 0,
            产品成本: 0,
            产品成本RMB: 0,
            AMZ佣金: 0,
            VAT: 0,
            头程单价: 6.5,
            头程重量: 0,
            包装重量_lb: 包装重量,
            头程成本: 0,
            FBA费,
            FBA仓储费: 0,
            站内广告: 0,
            退款费: 0,
            其他: 0,
            含广利润: 0,
            含广利润率: 0,
            不含广利润: 0,
            不含广利润率: 0,
            数据缺失: '否',
          };
        })
        .filter((item) => item.实时售价本币 > 0 || item.亚马逊主图)
        .map(calculateProfit);

      setData(parsedData);
    };

    reader.readAsBinaryString(file);
  };

  // 更新单元格数据
  const updateCell = (id: number, field: keyof ProductData, value: string | number) => {
    setData(prev => 
      prev.map(item => {
        if (item.id === id) {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const updatedItem = { ...item, [field]: numValue };
          return calculateProfit(updatedItem);
        }
        return item;
      })
    );
  };

  // 获取列字母（0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, ...）
  const getColumnLetter = (index: number): string => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  // 导出Excel
  const exportToExcel = () => {
    if (data.length === 0) return;

    // 列字母映射
    const columns: { [key: string]: string } = {};
    columnOrder.forEach((col, index) => {
      columns[col] = getColumnLetter(index);
    });

    // 构建表头
    const header = columnOrder;
    const aoa: any[][] = [header];

    // 构建数据行（带公式）
    data.forEach((item, rowIndex) => {
      const row = 2 + rowIndex; // Excel行号（从1开始，表头是第1行）
      const rowData: any[] = [];

      // 检查该行是否数据缺失
      const isMissing = item.数据缺失 === '是';

      // 基础字体样式
      const baseFontStyle = {
        name: "Arial",
        size: 11
      };

      // 数据缺失的字体颜色为红色，正常为黑色
      const fontColor = isMissing ? "FF0000" : "000000";

      columnOrder.forEach((col) => {
        const value = item[col as keyof ProductData];
        const colLetter = columns[col];

        // 为利润和利润率相关的列添加公式
        if (col === '产品成本') {
          // 产品成本 = 产品成本RMB / 当前汇率
          rowData.push({ f: `=${columns['产品成本RMB']}${row}/${columns['当前汇率']}${row}`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === 'AMZ佣金') {
          // AMZ佣金 = 实时售价本币 * 15%
          rowData.push({ f: `=${columns['实时售价本币']}${row}*0.15`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === '头程成本') {
          // 头程成本 = 头程单价 / 当前汇率 * 头程重量
          rowData.push({ f: `=${columns['头程单价']}${row}/${columns['当前汇率']}${row}*${columns['头程重量']}${row}`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === '头程重量') {
          // 头程重量 = 包装重量_lb * 0.454
          rowData.push({ f: `=${columns['包装重量_lb']}${row}*0.454`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === '站内广告') {
          // 站内广告 = 实时售价本币 * 20%
          rowData.push({ f: `=${columns['实时售价本币']}${row}*0.20`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === '退款费') {
          // 退款费 = 实时售价本币 * 5%
          rowData.push({ f: `=${columns['实时售价本币']}${row}*0.05`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === '含广利润') {
          // 含广利润 = 实时售价本币 - 产品成本 - AMZ佣金 - VAT - 头程成本 - FBA费 - FBA仓储费 - 站内广告 - 退款费 - 其他
          rowData.push({
            f: `=${columns['实时售价本币']}${row}-${columns['产品成本']}${row}-${columns['AMZ佣金']}${row}-${columns['VAT']}${row}-${columns['头程成本']}${row}-${columns['FBA费']}${row}-${columns['FBA仓储费']}${row}-${columns['站内广告']}${row}-${columns['退款费']}${row}-${columns['其他']}${row}`,
            z: '0.00',
            s: { font: { ...baseFontStyle, color: { rgb: fontColor } } }
          });
        } else if (col === '含广利润率') {
          // 含广利润率 = 含广利润 / 实时售价本币 * 100%
          rowData.push({ f: `=${columns['含广利润']}${row}/${columns['实时售价本币']}${row}*100`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col === '不含广利润') {
          // 不含广告利润 = 实时售价本币 - 产品成本 - AMZ佣金 - VAT - 头程成本 - FBA费 - FBA仓储费 - 退款费 - 其他
          rowData.push({
            f: `=${columns['实时售价本币']}${row}-${columns['产品成本']}${row}-${columns['AMZ佣金']}${row}-${columns['VAT']}${row}-${columns['头程成本']}${row}-${columns['FBA费']}${row}-${columns['FBA仓储费']}${row}-${columns['退款费']}${row}-${columns['其他']}${row}`,
            z: '0.00',
            s: { font: { ...baseFontStyle, color: { rgb: fontColor } } }
          });
        } else if (col === '不含广利润率') {
          // 不含广告利润率 = 不含广告利润 / 实时售价本币 * 100%
          rowData.push({ f: `=${columns['不含广利润']}${row}/${columns['实时售价本币']}${row}*100`, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (col.includes('利润率')) {
          // 其他利润率列
          rowData.push({ v: (value as number).toFixed(2), z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else if (typeof value === 'number') {
          rowData.push({ v: value, z: '0.00', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        } else {
          rowData.push({ v: value || '', s: { font: { ...baseFontStyle, color: { rgb: fontColor } } } });
        }
      });

      aoa.push(rowData);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // 根据内容自动调整列宽
    const colWidths: { wch: number }[] = [];

    columnOrder.forEach((col, colIndex) => {
      // 计算表头长度
      let maxLength = String(col).length;

      // 计算该列所有数据的最大长度
      data.forEach((item) => {
        const value = item[col as keyof ProductData];
        let valueLength = 0;

        if (col === '亚马逊主图') {
          // 图片列设置固定宽度
          valueLength = 20;
        } else if (col === '产品链接') {
          // 链接列设置固定宽度
          valueLength = 25;
        } else if (typeof value === 'string') {
          valueLength = value.length;
        } else if (typeof value === 'number') {
          // 数字转换为字符串并计算长度（包括小数点和两位小数）
          valueLength = String(value.toFixed(2)).length;
        }

        if (valueLength > maxLength) {
          maxLength = valueLength;
        }
      });

      // 设置合理的列宽范围（最小8，最大50）
      const minWidth = 8;
      const maxWidth = 50;
      let finalWidth = maxLength + 2; // 加上一些padding

      if (finalWidth < minWidth) {
        finalWidth = minWidth;
      } else if (finalWidth > maxWidth) {
        finalWidth = maxWidth;
      }

      colWidths.push({ wch: finalWidth });
    });

    // 设置表头样式
    columnOrder.forEach((col, index) => {
      const cellAddress = `${getColumnLetter(index)}1`;
      worksheet[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: "87CEEB" }  // 天蓝色背景
        },
        font: {
          name: "Arial",
          bold: true,
          color: { rgb: "000000" }  // 黑色字体
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };
    });

    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '利润表');
    XLSX.writeFile(workbook, `利润表_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-[95vw] mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">亚马逊利润计算器</CardTitle>
            <CardDescription>
              上传Excel表格，自动计算各项成本和利润指标
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" />
                上传Excel文件
              </Button>
              {fileName && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {fileName}
                </span>
              )}
              {data.length > 0 && (
                <Button onClick={exportToExcel} className="gap-2" variant="outline">
                  <Download className="w-4 h-4" />
                  导出Excel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>利润表</CardTitle>
              <CardDescription>
                共 {data.length} 条数据，可编辑白色单元格后自动计算
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[70vh] overflow-auto border border-slate-200 dark:border-slate-700 rounded">
                <table className="w-full border-collapse sticky top-0">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                      {columnOrder.map((col) => (
                        <th
                          key={col}
                          className="px-2 py-3 text-xs font-semibold text-left border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {columnOrder.map((col) => {
                          const value = row[col as keyof ProductData];
                          const isEditable = [
                            '当前汇率',
                            '产品成本RMB',
                            'VAT',
                            '头程单价',
                            'FBA仓储费',
                            '其他',
                          ].includes(col);

                          const isImage = col === '亚马逊主图';
                          const isLink = col === '产品链接';
                          const isPercentage = col.includes('利润率');
                          const isMissing = row.数据缺失 === '是';

                          return (
                            <td
                              key={col}
                              className={`px-2 py-2 text-xs border border-slate-200 dark:border-slate-700 ${
                                isMissing ? 'bg-red-50 dark:bg-red-900/20' : ''
                              }`}
                            >
                              {isImage ? (
                                <div className="w-20 h-20">
                                  {value ? (
                                    <img
                                      src={value}
                                      alt="产品图片"
                                      className="w-full h-full object-cover rounded border border-slate-200 dark:border-slate-700"
                                      onError={(e) => {
                                        // 图片加载失败时显示占位文本
                                        e.currentTarget.style.display = 'none';
                                        const placeholder = e.currentTarget.parentElement?.querySelector('.placeholder');
                                        if (placeholder) {
                                          (placeholder as HTMLElement).style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className="placeholder w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 rounded">
                                    {value ? '图片加载失败' : '无图片'}
                                  </div>
                                </div>
                              ) : isLink ? (
                                value ? (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate block max-w-[200px]"
                                  >
                                    链接
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )
                              ) : isEditable ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={typeof value === 'number' ? value.toFixed(2) : 0}
                                  onChange={(e) => updateCell(row.id, col as keyof ProductData, e.target.value)}
                                  className="h-8 text-xs min-w-[80px]"
                                />
                              ) : isPercentage ? (
                                <span className={isMissing ? 'text-red-500' : ''}>
                                  {(value as number).toFixed(2)}%
                                </span>
                              ) : typeof value === 'number' ? (
                                <span className={isMissing ? 'text-red-500' : ''}>
                                  {value.toFixed(2)}
                                </span>
                              ) : (
                                <span>{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
