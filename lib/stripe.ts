import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const normalizedStripeKey = stripeSecretKey?.trim()
const hasStripePrefix =
  normalizedStripeKey?.startsWith('sk_test_') || normalizedStripeKey?.startsWith('sk_live_')
const isPlaceholderKey = normalizedStripeKey === 'sk_test_...' || normalizedStripeKey === 'sk_live_...'

export const stripeBillingEnabled = Boolean(hasStripePrefix && !isPlaceholderKey)

export const stripe = stripeBillingEnabled && normalizedStripeKey
  ? (() => {
      try {
        return new Stripe(normalizedStripeKey, {
          apiVersion: '2023-10-16',
        })
      } catch {
        return null
      }
    })()
  : null
