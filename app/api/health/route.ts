import { NextResponse } from 'next/server'

export async function GET() {
  const smtp = {
    host: Boolean(process.env.SMTP_HOST),
    port: Boolean(process.env.SMTP_PORT),
    user: Boolean(process.env.SMTP_USER),
    pass: Boolean(process.env.SMTP_PASS),
    from: Boolean(process.env.EMAIL_FROM),
    to: Boolean(process.env.SUPPORT_EMAIL || process.env.SMTP_USER),
  }
  return NextResponse.json({ status: 'ok', smtp })
}
