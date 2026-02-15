import nodemailer from 'nodemailer'

type ReminderEmailInput = {
  to: string
  name?: string | null
  appUrl: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendWorkoutReminderEmail(input: ReminderEmailInput) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const emailFrom = process.env.EMAIL_FROM || 'FitPulse <no-reply@fitpulse.app>'

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { sent: false, reason: 'missing_smtp_env' as const }
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

  const safeName = escapeHtml((input.name || 'athlète').trim())
  const subject = 'FitPulse - Ta séance du jour t’attend'
  const text = `Salut ${safeName}, ta séance planifiée est prête. Ouvre ton dashboard: ${input.appUrl}/dashboard`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2>Ta séance du jour t’attend</h2>
      <p>Salut ${safeName},</p>
      <p>Tu as une séance prévue aujourd’hui. Lance-la pour maintenir ta streak.</p>
      <p><a href="${input.appUrl}/dashboard?view=session">Démarrer ma séance</a></p>
    </div>
  `

  await transporter.sendMail({
    from: emailFrom,
    to: input.to,
    subject,
    text,
    html,
    headers: {
      'X-Entity-Ref-ID': 'fitpulse-workout-reminder',
    },
  })

  return { sent: true as const }
}
