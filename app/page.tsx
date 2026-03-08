import Navbar from '@/components/Navbar'
<<<<<<< HEAD
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
=======
import Hero from '@/components/home/Hero'
import Benefits from '@/components/home/Benefits'
import ProgramsPreview from '@/components/home/ProgramsPreview'
import Onboarding from '@/components/home/Onboarding'
import Testimonials from '@/components/home/Testimonials'
import FAQ from '@/components/home/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Hero />
        <Benefits />
        <ProgramsPreview />
        <Onboarding />
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
