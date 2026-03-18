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
  attachment?: {
    name: string
    mimeType: string
    dataUrl: string
  } | null
}

type SupportEmailEnv = {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  emailFrom: string
  senderEmail: string
  toEmailList: string[]
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export async function sendSupportEmail(input: SupportEmailInput) {
  const env = getSupportEmailEnv()
  if (!env) {
    return { sent: false, reason: 'missing_smtp_env' as const }
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, toEmailList } = env

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

  let attachments: Array<{ filename: string; content: Buffer; contentType: string }> = []
  if (input.attachment?.dataUrl && input.attachment.name) {
    const match = input.attachment.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      const [, mimeType, base64] = match
      const content = Buffer.from(base64, 'base64')
      if (content.length <= 2_000_000) {
        attachments = [
          {
            filename: input.attachment.name,
            content,
            contentType: mimeType || input.attachment.mimeType || 'application/octet-stream',
          },
        ]
      }
    }
  }

  const createTransport = (port: number) =>
    nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })

  const sendWithPort = async (port: number) => {
    const transporter = createTransport(port)
    return transporter.sendMail({
      from: emailFrom,
      sender: smtpUser,
      to: toEmailList.join(', '),
      replyTo: input.userEmail || undefined,
      envelope: {
        from: env.senderEmail,
        to: toEmailList,
      },
      subject,
      text,
      html,
      headers: {
        'X-Entity-Ref-ID': `fitpulse-support-${input.id}`,
      },
      attachments,
    })
  }

  try {
    await sendWithPort(smtpPort)
    return { sent: true as const }
  } catch (error) {
    const errorCode = (error as { code?: string }).code || ''
    const shouldRetryOn465 =
      smtpPort !== 465 && ['ESOCKET', 'ECONNECTION', 'ETIMEDOUT', 'ECONNREFUSED'].includes(errorCode)
    if (shouldRetryOn465) {
      try {
        await sendWithPort(465)
        return { sent: true as const }
      } catch (retryError) {
        const retryCode = (retryError as { code?: string }).code || ''
        if (retryCode === 'EAUTH') return { sent: false as const, reason: 'smtp_auth_failed' as const }
        if (retryCode === 'ETIMEDOUT') return { sent: false as const, reason: 'smtp_timeout' as const }
        return { sent: false as const, reason: 'smtp_connection_failed' as const }
      }
    }

    const code = (error as { code?: string }).code || ''
    if (code === 'EAUTH') return { sent: false as const, reason: 'smtp_auth_failed' as const }
    if (code === 'ESOCKET') return { sent: false as const, reason: 'smtp_connection_failed' as const }
    if (code === 'ETIMEDOUT') return { sent: false as const, reason: 'smtp_timeout' as const }
    return { sent: false as const, reason: 'send_failed' as const }
  }
}

export async function verifySupportEmailTransport() {
  const env = getSupportEmailEnv()
  if (!env) {
    return { ok: false as const, reason: 'missing_smtp_env' as const }
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass } = env
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort !== 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
    await transporter.verify()
    return { ok: true as const, port: smtpPort }
  } catch (error) {
    const code = (error as { code?: string }).code || 'verify_failed'
    return { ok: false as const, reason: code }
  }
}

function getSupportEmailEnv(): SupportEmailEnv | null {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')
  const rawEmailFrom = process.env.EMAIL_FROM || ''
  const smtpUserEmail = (smtpUser || '').trim().toLowerCase()
  const fromEmail = extractEmailAddress(rawEmailFrom)?.toLowerCase() || ''
  const sameDomain = fromEmail && smtpUserEmail && fromEmail.split('@')[1] === smtpUserEmail.split('@')[1]
  const emailFrom = sameDomain ? rawEmailFrom : smtpUserEmail
  const supportEmail = (process.env.SUPPORT_EMAIL || '').trim().toLowerCase()
  const toEmailList = Array.from(new Set([supportEmail, smtpUserEmail].filter(Boolean)))

  if (!smtpHost || !smtpUser || !smtpPass || toEmailList.length === 0) {
    return null
  }

  return {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailFrom,
    senderEmail: smtpUserEmail,
    toEmailList,
  }
}

function extractEmailAddress(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/<([^>]+)>/)
  if (match) return match[1].trim()
  return trimmed.includes('@') ? trimmed : ''
}
