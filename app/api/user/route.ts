import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true },
  })

  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const phone = body?.phone ? String(body.phone).trim() : null

    if (!email) {
      return NextResponse.json({ error: "L'email est requis" }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email, phone },
      select: { id: true, name: true, email: true, phone: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
}
