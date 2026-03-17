import nodemailer from 'nodemailer'

type SupportEmailInput = {
  id: string
  title: string
  description: string
  category: string
  priority: string
  createdAt: string
  updatedAt: string
  userEmail?: string | null
  appUrl: string
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export async function sendSupportEmail(input: SupportEmailInput) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const emailFrom = process.env.EMAIL_FROM || 'FitPulse <no-reply@fitpulse.app>'
  const toEmail = process.env.SUPPORT_EMAIL || 'fitpulset@gmail.com'

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

  const safeDesc = escapeHtml(input.description)
  const safeTitle = escapeHtml(input.title)
  const safeCategory = escapeHtml(input.category)
  const safePriority = escapeHtml(input.priority)
  const safeUser = escapeHtml(input.userEmail || 'Utilisateur non identifié')

  const subject = `[Ticket FitPulse] ${safePriority.toUpperCase()} - ${safeTitle}`
  const text = `
Ticket ${input.id}
Catégorie: ${safeCategory}
Priorité: ${safePriority}
Créé par: ${safeUser}
Lien: ${input.appUrl}/tickets

${input.description}
  `
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Nouvelle demande de support</h2>
      <p><strong>ID :</strong> ${input.id}</p>
      <p><strong>Catégorie :</strong> ${safeCategory}</p>
      <p><strong>Priorité :</strong> ${safePriority}</p>
      <p><strong>Créé par :</strong> ${safeUser}</p>
      <p><strong>Lien :</strong> <a href="${input.appUrl}/tickets">${input.appUrl}/tickets</a></p>
      <h3>${safeTitle}</h3>
      <p>${safeDesc.replace(/\n/g, '<br />')}</p>
      <p style="font-size: 12px; color: #6b7280;">Créé le ${new Date(input.createdAt).toLocaleString('fr-FR')}</p>
    </div>
  `

  await transporter.sendMail({
    from: emailFrom,
    to: toEmail,
    subject,
    text,
    html,
    headers: {
      'X-Entity-Ref-ID': `fitpulse-support-${input.id}`,
    },
  })

  return { sent: true as const }
}
