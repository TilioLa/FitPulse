import nodemailer from 'nodemailer'

export type LifecycleEmailEvent = 'day1' | 'day7' | 'trial_ending'

type LifecycleEmailInput = {
  to: string
  name?: string | null
  event: LifecycleEmailEvent
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

function getTemplate({ name, event, appUrl }: Omit<LifecycleEmailInput, 'to'>) {
  const safeName = escapeHtml((name || 'athlète').trim())

  if (event === 'day1') {
    return {
      subject: 'FitPulse - Ton plan est prêt',
      text: `Salut ${safeName}, ton plan FitPulse est prêt. Reprends ici: ${appUrl}/dashboard`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Ton plan est prêt</h2>
          <p>Salut ${safeName},</p>
          <p>Tu peux reprendre directement ta prochaine séance.</p>
          <p><a href="${appUrl}/dashboard">Ouvrir mon dashboard</a></p>
        </div>
      `,
    }
  }

  if (event === 'day7') {
    return {
      subject: 'FitPulse - Fais le point sur ta première semaine',
      text: `Salut ${safeName}, fais le point sur ta semaine et ajuste ton plan: ${appUrl}/dashboard?view=history`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Premier bilan hebdo</h2>
          <p>Salut ${safeName},</p>
          <p>Regarde ton historique et ajuste ton rythme pour la semaine suivante.</p>
          <p><a href="${appUrl}/dashboard?view=history">Voir mon bilan</a></p>
        </div>
      `,
    }
  }

  return {
    subject: 'FitPulse - Ton essai premium se termine bientôt',
    text: `Salut ${safeName}, ton essai premium se termine bientôt. Voir les plans: ${appUrl}/pricing`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2>Essai premium bientôt terminé</h2>
        <p>Salut ${safeName},</p>
        <p>Tu peux conserver les fonctions avancées en passant Pro.</p>
        <p><a href="${appUrl}/pricing">Voir les plans FitPulse</a></p>
      </div>
    `,
  }
}

export async function sendLifecycleEmail(input: LifecycleEmailInput) {
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

  const template = getTemplate({
    name: input.name,
    event: input.event,
    appUrl: input.appUrl,
  })

  await transporter.sendMail({
    from: emailFrom,
    to: input.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
    headers: {
      'X-Entity-Ref-ID': `fitpulse-${input.event}`,
    },
  })

  return { sent: true as const }
}
