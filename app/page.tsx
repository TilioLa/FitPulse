import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Hero from '@/components/home/Hero'
import Benefits from '@/components/home/Benefits'
import Testimonials from '@/components/home/Testimonials'
import ProgramsPreview from '@/components/home/ProgramsPreview'
import FAQ from '@/components/home/FAQ'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Benefits />
        <ProgramsPreview />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
