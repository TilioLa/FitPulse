import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const PRICE_MAP: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  proplus: process.env.STRIPE_PRICE_ID_PROPLUS,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const planId = String(body?.planId || '')

    const priceId = PRICE_MAP[planId]
    if (!priceId) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = process.env.STRIPE_SUCCESS_URL || `${baseUrl}/dashboard?checkout=success`
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${baseUrl}/pricing?checkout=cancel`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
