'use client'

import Link from 'next/link'
import { Film, Rocket } from 'lucide-react'
import { useRef } from 'react'
import { trackEvent } from '@/lib/analytics-client'

function toYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim()
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

export default function VideoPresentation() {
  const configured = process.env.NEXT_PUBLIC_PRESENTATION_VIDEO_URL?.trim() || ''
  const youtubeEmbed = configured ? toYoutubeEmbed(configured) : null
  const localMp4 = '/videos/fitpulse-presentation-complete.mp4'
  const localWebm = '/videos/fitpulse-presentation-complete.webm'
  const videoSrc = configured && !youtubeEmbed ? configured : localMp4
  const trackedMilestones = useRef(new Set<number>())

  const trackVideoProgress = (current: number, duration: number) => {
    if (!duration || !Number.isFinite(duration)) return
    const ratio = current / duration
    const milestones = [0.25, 0.5, 0.75, 1]
    milestones.forEach((threshold) => {
      if (ratio >= threshold && !trackedMilestones.current.has(threshold)) {
        trackedMilestones.current.add(threshold)
        trackEvent('video_progress', { threshold: Math.round(threshold * 100) })
      }
    })
  }

  return (
    <section className="py-14 sm:py-20 bg-white border-y border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-primary-700">
          <Film className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Présentation vidéo</span>
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
          Découvre FitPulse en 60 secondes
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
          Tour rapide de l&apos;interface, des programmes et du suivi de progression.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-900 p-2 shadow-sm">
          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9' }}>
            {youtubeEmbed ? (
              <iframe
                src={youtubeEmbed}
                title="Présentation FitPulse"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <video
                className="h-full w-full bg-black"
                controls
                preload="metadata"
                onPlay={() => trackEvent('video_play', { location: 'home_presentation' })}
                onEnded={() => trackEvent('video_end', { location: 'home_presentation' })}
                onTimeUpdate={(event) => {
                  const target = event.currentTarget
                  trackVideoProgress(target.currentTime, target.duration)
                }}
              >
                <source src={videoSrc} type="video/mp4" />
                <source src={localWebm} type="video/webm" />
              </video>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Link
            href="/inscription"
            onClick={() => trackEvent('video_cta_signup_click', { location: 'home_presentation' })}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Rocket className="h-4 w-4" />
            Commencer gratuitement
          </Link>
          <Link
            href="/programmes"
            onClick={() => trackEvent('video_cta_programs_click', { location: 'home_presentation' })}
            className="btn-secondary inline-flex items-center justify-center"
          >
            Voir les programmes
          </Link>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Fichier local attendu: <code>/public/videos/fitpulse-presentation-complete.mp4</code> (ou `.webm`).
        </p>
      </div>
    </section>
  )
}
