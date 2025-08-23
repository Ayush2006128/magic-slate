import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(req: NextRequest) {
  try {
    const { name, data } = await req.json();
    if (!name || !data) {
      return NextResponse.json({ error: 'Missing event name or data' }, { status: 400 });
    }
    await inngest.send({ name, data });
    return NextResponse.json({ status: 'event sent' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 