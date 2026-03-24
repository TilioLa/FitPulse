import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
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
