import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
import Benefits from '@/components/home/Benefits'
import ProgramsPreview from '@/components/home/ProgramsPreview'
import Testimonials from '@/components/home/Testimonials'
import Footer from '@/components/Footer'

const Onboarding = dynamic(() => import('@/components/home/Onboarding'), {
  loading: () => <section className="py-14 sm:py-20 bg-gray-50" aria-hidden="true" />,
})

const JourneyStarter = dynamic(() => import('@/components/home/JourneyStarter'), {
  loading: () => <section className="py-14 sm:py-20 bg-white" aria-hidden="true" />,
})

const SuccessWall = dynamic(() => import('@/components/home/SuccessWall'), {
  loading: () => <section className="py-16 bg-white" aria-hidden="true" />,
})

const FAQ = dynamic(() => import('@/components/home/FAQ'), {
  loading: () => <section className="py-14 sm:py-20 bg-gray-50" aria-hidden="true" />,
})

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Hero />
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
      </main>
      <Footer />
    </div>
  )
}
