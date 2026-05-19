import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
import dynamic from 'next/dynamic'
import Footer from '@/components/Footer'

const SectionSkeleton = () => <div className="h-48 rounded-2xl bg-white/70 animate-pulse mb-6" />
const Benefits = dynamic(() => import('@/components/home/Benefits'), { loading: SectionSkeleton })
const ProgramsPreview = dynamic(() => import('@/components/home/ProgramsPreview'), { loading: SectionSkeleton })
const Onboarding = dynamic(() => import('@/components/home/Onboarding'), { loading: SectionSkeleton })
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), { loading: SectionSkeleton })
const FAQ = dynamic(() => import('@/components/home/FAQ'), { loading: SectionSkeleton })

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
