import MuscleMap from '@/components/exercises/MuscleMap'
import { inferVideoUrl } from '@/lib/videos'

export default function ExerciseMedia({
  name,
  videoUrl,
}: {
  name: string
  videoUrl?: string
}) {
  const resolvedVideoUrl = videoUrl || inferVideoUrl(name)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Video explicative</h4>
        {resolvedVideoUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/10">
            <iframe
              src={resolvedVideoUrl}
              title={`Video ${name}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-44 rounded-lg bg-gray-100 text-sm text-gray-500">
            Vidéo à ajouter pour cet exercice
          </div>
        )}
      </div>
      <MuscleMap name={name} />
    </div>
  )
}
