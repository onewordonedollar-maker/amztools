import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 }, // 缓存1小时
    });
    const data = await res.json();
    return NextResponse.json({ rate: data.rates.CNY });
  } catch (error) {
    return NextResponse.json({ rate: 0, error: '获取汇率失败' }, { status: 500 });
  }
}
