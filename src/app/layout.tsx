import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '选品利润快算',
    template: '%s | 选品利润快算',
  },
  description:
    '选品利润快算 - 上传Excel表格，自动计算亚马逊产品各项成本和利润指标，支持导出利润表。',
  keywords: [
    '选品利润快算',
    '亚马逊利润计算',
    '产品利润计算',
    '成本计算',
    '利润分析',
    'Excel利润表',
  ],
  authors: [{ name: '选品利润快算' }],
  generator: '选品利润快算',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '选品利润快算',
    description:
      '上传Excel表格，自动计算亚马逊产品各项成本和利润指标，支持导出利润表。',
    url: 'https://code.coze.cn',
    siteName: '选品利润快算',
    locale: 'zh_CN',
    type: 'website',
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
