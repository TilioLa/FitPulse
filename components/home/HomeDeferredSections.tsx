'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const Benefits = dynamic(() => import('@/components/home/Benefits'))
const ProgramsPreview = dynamic(() => import('@/components/home/ProgramsPreview'))
const Onboarding = dynamic(() => import('@/components/home/Onboarding'))
const JourneyStarter = dynamic(() => import('@/components/home/JourneyStarter'))
const SuccessWall = dynamic(() => import('@/components/home/SuccessWall'))
const Testimonials = dynamic(() => import('@/components/home/Testimonials'))
const FAQ = dynamic(() => import('@/components/home/FAQ'))

export default function HomeDeferredSections() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const enable = () => setReady(true)
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(enable, { timeout: 2000 })
    } else {
      globalThis.setTimeout(enable, 1200)
    }
  }, [])

  if (!ready) return null

  return (
    <>
      <div className="defer-render">
        <Benefits />
      </div>
      <div className="defer-render">
        <ProgramsPreview />
      </div>
      <div className="defer-render">
        <Onboarding />
      </div>
      <div className="defer-render">
        <JourneyStarter />
      </div>
      <div className="defer-render">
        <SuccessWall />
      </div>
      <div className="defer-render">
        <Testimonials />
      </div>
      <div className="defer-render">
        <FAQ />
      </div>
    </>
  )
}
