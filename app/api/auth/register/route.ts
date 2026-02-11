import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const name = body?.name ? String(body.name).trim() : email.split('@')[0]
    const password = String(body?.password || '')
    const phone = body?.phone ? String(body.phone).trim() : null

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
      return NextResponse.json({ error: "Merci d'utiliser une adresse Gmail" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        phone,
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    console.error('Register error:', message)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : message },
      { status: 500 }
    )
  }
}
