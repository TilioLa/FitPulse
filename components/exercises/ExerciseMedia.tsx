import MuscleMap from '@/components/exercises/MuscleMap'

export default function ExerciseMedia({
  name,
}: {
  name: string
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Conseils rapides</h4>
        <div className="flex items-center justify-center h-44 rounded-lg bg-gray-50 text-sm text-gray-600 text-center px-6">
          Concentre-toi sur la qualité du mouvement, le contrôle et une amplitude complète.
        </div>
      </div>
      <MuscleMap name={name} />
    </div>
  )
}
