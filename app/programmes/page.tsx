import Footer from '@/components/Footer'
import ProgramsList from '@/components/programmes/ProgramsList'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ProgrammesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="programs">
        <main className="flex-grow py-12">
          <div className="page-wrap">
            <div className="mb-12">
              <h1 className="section-title mb-3">
                Tous nos programmes
              </h1>
              <p className="section-subtitle max-w-3xl">
                Choisissez le programme qui correspond à votre niveau, vos objectifs et le matériel dont vous disposez
              </p>
            </div>
            <ProgramsList />
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
