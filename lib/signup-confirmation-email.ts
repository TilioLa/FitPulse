import nodemailer from 'nodemailer'

type SignupConfirmationInput = {
  to: string
  name?: string | null
  appUrl: string
}

export async function sendSignupConfirmationEmail(input: SignupConfirmationInput) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const emailFrom =
    process.env.EMAIL_FROM_SIGNUP ||
    process.env.EMAIL_FROM ||
    'FitPulse <fitpulset@gmail.com>'

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { sent: false as const, reason: 'smtp_not_configured' }
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const safeName = (input.name || '').trim() || 'athlete'
  const safeAppUrl = input.appUrl.replace(/\/$/, '')

  const subject = 'Bienvenue sur FitPulse, compte cree avec succes'
  const text = [
    `Bonjour ${safeName},`,
    '',
    'Ton compte FitPulse vient d etre cree avec succes.',
    'Tu peux maintenant te connecter et commencer ton programme.',
    '',
    `Connexion: ${safeAppUrl}/connexion`,
    '',
    'A tres vite,',
    'Equipe FitPulse',
  ].join('\n')
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">Bienvenue sur FitPulse</h2>
      <p>Bonjour <strong>${escapeHtml(safeName)}</strong>,</p>
      <p>Ton compte FitPulse vient d etre cree avec succes.</p>
      <p>Tu peux maintenant te connecter et commencer ton programme.</p>
      <p style="margin: 18px 0;">
        <a href="${escapeHtml(`${safeAppUrl}/connexion`)}" style="background: #2563eb; color: white; text-decoration: none; padding: 10px 14px; border-radius: 8px; display: inline-block;">
          Se connecter
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280;">Email automatique FitPulse</p>
    </div>
  `

  await transporter.sendMail({
    from: emailFrom,
    to: input.to,
    subject,
    text,
    html,
  })

  return { sent: true as const }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
