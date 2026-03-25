import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
import QuickStartExpress from '@/components/home/QuickStartExpress'
import Benefits from '@/components/home/Benefits'
import VideoPresentation from '@/components/home/VideoPresentation'
import ProgramsPreview from '@/components/home/ProgramsPreview'
import Onboarding from '@/components/home/Onboarding'
import JourneyStarter from '@/components/home/JourneyStarter'
import SuccessWall from '@/components/home/SuccessWall'
import Testimonials from '@/components/home/Testimonials'
import FAQ from '@/components/home/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Hero />
        <section className="py-6 bg-gray-50 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <QuickStartExpress />
          </div>
        </section>
        <VideoPresentation />
        <Benefits />
        <ProgramsPreview />
        <Onboarding />
        <JourneyStarter />
        <SuccessWall />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
