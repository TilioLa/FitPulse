import Link from 'next/link'
import Footer from '@/components/Footer'
import { programs, programsById, programsBySlug } from '@/data/programs'
import { slugify } from '@/lib/slug'
import { labelize } from '@/lib/labels'
import EquipmentBadge from '@/components/exercises/EquipmentBadge'
import { Dumbbell, Timer, CalendarCheck, BarChart3, CheckCircle2 } from 'lucide-react'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import ProgramSessionsList from '@/components/programmes/ProgramSessionsList'
import ProgramSchedulePicker from '@/components/programmes/ProgramSchedulePicker'
import ProgramAccessGate from '@/components/programmes/ProgramAccessGate'
import WithSidebar from '@/components/layouts/WithSidebar'

export default async function ProgramDetailPage({ params }: { params: { id?: string } | Promise<{ id?: string }> }) {
  const resolvedParams = typeof (params as Promise<unknown>)?.then === 'function' ? await (params as Promise<{ id?: string }>) : (params as { id?: string })
  const rawId = decodeURIComponent(resolvedParams?.id || '').trim()
  const normalizedId = rawId.toLowerCase().split('?')[0].split('#')[0].replace(/\/+$/, '')
  const slugCandidate = slugify(rawId)
  const program =
    programsBySlug[normalizedId] ||
    programsBySlug[slugCandidate] ||
    programsById[rawId] ||
    programsById[normalizedId] ||
    programs.find(
      (item) =>
        item.slug === normalizedId ||
        item.slug === slugCandidate ||
        slugify(item.name) === slugCandidate ||
        item.id === rawId ||
        item.id === normalizedId
    ) ||
    programs.find((item) => normalizedId.includes(item.slug) || item.slug.includes(normalizedId))

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <WithSidebar active="programs">
          <main className="flex-grow py-6 lg:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="card">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Programme introuvable</h1>
                <p className="text-gray-600 mb-4">
                  Le programme demandé n&apos;existe pas. Choisissez un programme valide ci-dessous.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {programs.map((item) => (
                    <Link key={item.id} href={`/programmes/${item.slug}`} className="btn-secondary">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </WithSidebar>
        <Footer />
      </div>
    )
  }

  const baseWeeks = Number(program.duration.match(/\d+/)?.[0] || program.sessionsPerWeek || 4)
  const weeklyMinutes = program.sessions.reduce((sum, session) => sum + session.duration, 0)
  const difficultyMeter =
    program.level === 'Débutant' ? 1 : program.level === 'Intermédiaire' ? 2 : 3
  const fitReasons = [
    `Tu veux ${program.goals[0]?.toLowerCase() || 'progresser'} avec un cadre clair.`,
    `Tu disposes de ${program.equipment.toLowerCase()} pour suivre les séances sans friction.`,
    `${program.sessionsPerWeek} séance(s) par semaine pour garder un rythme réaliste.`,
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="programs">
        <main className="flex-grow py-6 lg:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <Link href="/programmes" className="text-sm text-primary-600 hover:text-primary-700">
                ← Retour aux programmes
              </Link>
            </div>

            <ProgramAccessGate programId={program.id}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="card">
                  <div className={`h-2 bg-gradient-to-r ${program.color} rounded-t-xl -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-6`}></div>
                  <h1 className="section-title mb-3">{program.name}</h1>
                  <p className="text-gray-600 mb-6">{program.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ProgramSchedulePicker
                        programId={program.id}
                        baseWeeks={baseWeeks}
                        baseSessionsPerWeek={program.sessionsPerWeek}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Matériel
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold text-gray-900">{labelize(program.equipment)}</div>
                        <EquipmentBadge equipment={program.equipment} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <CalendarCheck className="h-4 w-4 mr-2" />
                        Rythme initial
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{program.sessionsPerWeek} / semaine</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Timer className="h-4 w-4 mr-2" />
                        Temps hebdo estimé
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{weeklyMinutes} min</div>
                    </div>
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <BarChart3 className="h-4 w-4 text-primary-600" />
                        Difficulté
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-2 flex-1 rounded-full ${step <= difficultyMeter ? 'bg-primary-600' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">{program.level}</div>
                    </div>
                    <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
                      <div className="text-sm font-semibold text-gray-900">Pourquoi ce programme est pour toi</div>
                      <div className="mt-3 space-y-2">
                        {fitReasons.map((reason) => (
                          <div key={reason} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3">Objectifs</h2>
                    <div className="flex flex-wrap gap-2">
                      {program.goals.map((goal) => (
                        <span key={goal} className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ProgramSessionsList program={program} />
                </div>
              </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Ce programme est pour toi si…</h3>
                <div className="space-y-2 text-gray-600">
                  <div>✔️ Tu veux un plan structuré et progressif</div>
                  <div>✔️ Tu cherches des séances claires avec une charge de travail prévisible</div>
                  <div>✔️ Tu veux suivre tes progrès séance après séance</div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-primary-50 to-accent-50">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Prêt à commencer ?</h3>
                <p className="text-gray-600 mb-4">
                  Lance ce programme et démarre ta première séance.
                </p>
                <StartProgramButton program={program} />
              </div>
            </div>
          </div>
          </ProgramAccessGate>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
