import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
import Footer from '@/components/Footer'
import HomeDeferredSections from '@/components/home/HomeDeferredSections'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Hero />
        <HomeDeferredSections />
      </main>
      <Footer />
    </div>
  )
}
