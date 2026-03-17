import { NextResponse } from 'next/server'
import { sendSupportEmail } from '@/lib/support-email'

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}))
    const {
      id,
      title,
      description,
      category,
      priority,
      createdAt,
      updatedAt,
      userEmail,
      appUrl,
      attachment,
    } = payload as {
      id?: string
      title?: string
      description?: string
      category?: string
      priority?: string
      createdAt?: string
      updatedAt?: string
      userEmail?: string | null
      appUrl?: string
      attachment?: {
        name?: string
        mimeType?: string
        dataUrl?: string
      } | null
    }

    if (!id || !title || !description || !createdAt || !updatedAt || !appUrl) {
      return NextResponse.json({ success: false, error: 'missing_fields' }, { status: 400 })
    }

    const result = await sendSupportEmail({
      id,
      title,
      description,
      category: category || 'Général',
      priority: priority || 'normal',
      createdAt,
      updatedAt,
      userEmail: userEmail || null,
      appUrl,
      attachment:
        attachment?.name && attachment?.dataUrl
          ? {
              name: attachment.name,
              mimeType: attachment.mimeType || 'application/octet-stream',
              dataUrl: attachment.dataUrl,
            }
          : null,
    })

    if (!result.sent) {
      return NextResponse.json({ success: false, error: result.reason ?? 'send_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'unknown_error' },
      { status: 500 }
    )
  }
}
