'use client'

import { useEffect } from 'react'

function looksLikeCookieBanner(el: Element) {
  const text = (el.textContent || '').toLowerCase()
  if (!text) return false
  const hasCookieText = text.includes('cookies') || text.includes('cookie')
  const hasConsentAction =
    text.includes('accepter') ||
    text.includes('refuser') ||
    text.includes('accept') ||
    text.includes('reject')
  return hasCookieText && hasConsentAction
}

function removeCookieBanners() {
  const nodes = Array.from(document.querySelectorAll('body *'))
  for (const node of nodes) {
    if (!looksLikeCookieBanner(node)) continue
    const target =
      node.closest('[id*="cookie" i], [class*="cookie" i], [aria-label*="cookie" i]') ||
      node.closest('[style*="position: fixed"], [class*="fixed"]') ||
      node
    if (target && target.parentElement) {
      target.parentElement.removeChild(target)
    }
  }
}

export default function RemoveCookieBanner() {
  useEffect(() => {
    removeCookieBanners()
    const observer = new MutationObserver(() => removeCookieBanners())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
