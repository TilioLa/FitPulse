import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

type Payload = {
  name?: string
  email?: string
  subject?: string
  message?: string
  source?: 'contact_form' | 'feedback_widget' | string
}

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
      subject: `[Ticket FitPulse] ${subject}`,
      text:
        `Source: ${source}\n` +
        `Nom: ${name || 'Non renseigne'}\n` +
        `Email: ${email || 'Non renseigne'}\n\n` +
        `${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Nouveau ticket FitPulse</h2>
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

    return NextResponse.json({ ok: true })
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
