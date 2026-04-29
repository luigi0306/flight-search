import { NextResponse } from 'next/server';
import { verifyPassword } from '@/app/auth';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Chave requerida' }, { status: 400 });
    }

    const isValid = await verifyPassword(key);

    if (isValid) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Chave incorreta' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}