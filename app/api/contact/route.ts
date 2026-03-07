import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

type Payload = {
  name?: string
  email?: string
  subject?: string
  message?: string
  source?: 'contact_form' | 'feedback_widget' | string
  website?: string
}

const RATE_LIMIT_WINDOW_MS = 30_000
const RATE_LIMIT_MAX_REQUESTS = 3
const requestLog = new Map<string, number[]>()

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function ticketId() {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FP-${date}-${rand}`
}

function readIp(request: Request) {
  const xff = request.headers.get('x-forwarded-for') || ''
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(ip: string) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const existing = (requestLog.get(ip) || []).filter((ts) => ts >= windowStart)
  existing.push(now)
  requestLog.set(ip, existing)
  return existing.length > RATE_LIMIT_MAX_REQUESTS
}

export async function POST(request: Request) {
  try {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = Number(process.env.SMTP_PORT || 587)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const emailFrom = process.env.EMAIL_FROM || 'FitPulse <no-reply@fitpulse.app>'
    const ticketTo = process.env.SUPPORT_TICKETS_TO || 'fitpulset@gmail.com'

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ ok: false, error: 'missing_smtp_env' }, { status: 503 })
    }

    const body = (await request.json().catch(() => ({}))) as Payload
    const ip = readIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
    }

    if (body.website && String(body.website).trim().length > 0) {
      return NextResponse.json({ ok: true, accepted: true })
    }

    const name = sanitizeLine(body.name || '')
    const email = sanitizeLine((body.email || '').toLowerCase())
    const subject = sanitizeLine(body.subject || '')
    const message = String(body.message || '').trim()
    const source = sanitizeLine(body.source || 'contact_form')

    if (!subject || !message) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
    }
    if (subject.length > 180 || message.length > 5000 || name.length > 120 || email.length > 200) {
      return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 400 })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
    }

    const safeName = escapeHtml(name || 'Non renseigne')
    const safeEmail = escapeHtml(email || 'Non renseigne')
    const safeSubject = escapeHtml(subject)
    const safeMessage = escapeHtml(message).replaceAll('\n', '<br/>')
    const safeSource = escapeHtml(source)
    const id = ticketId()

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: emailFrom,
      to: ticketTo,
      replyTo: email || undefined,
      subject: `[${id}] [Ticket FitPulse] ${subject}`,
      text:
        `Ticket: ${id}\n` +
        `Source: ${source}\n` +
        `Nom: ${name || 'Non renseigne'}\n` +
        `Email: ${email || 'Non renseigne'}\n\n` +
        `${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Nouveau ticket FitPulse</h2>
          <p><strong>Ticket:</strong> ${id}</p>
          <p><strong>Source:</strong> ${safeSource}</p>
          <p><strong>Nom:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Sujet:</strong> ${safeSubject}</p>
          <p><strong>Message:</strong><br/>${safeMessage}</p>
        </div>
      `,
      headers: {
        'X-Entity-Ref-ID': 'fitpulse-contact-ticket',
      },
    })

    return NextResponse.json({ ok: true, ticketId: id })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'send_failed',
      },
      { status: 500 }
    )
  }
}
