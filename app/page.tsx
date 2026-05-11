import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
import dynamic from 'next/dynamic'
import Footer from '@/components/Footer'

const Benefits = dynamic(() => import('@/components/home/Benefits'))
const ProgramsPreview = dynamic(() => import('@/components/home/ProgramsPreview'))
const Onboarding = dynamic(() => import('@/components/home/Onboarding'))
const Testimonials = dynamic(() => import('@/components/home/Testimonials'))
const FAQ = dynamic(() => import('@/components/home/FAQ'))

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Hero />
        <section className="content-auto">
          <Benefits />
          <ProgramsPreview />
          <Onboarding />
          <Testimonials />
          <FAQ />
        </section>
      </main>
      <Footer />
    </div>
  )
}
