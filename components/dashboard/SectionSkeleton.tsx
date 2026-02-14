'use client'

export default function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
      </div>
      <div className="h-40 rounded-xl bg-gray-200" />
      <div className="h-32 rounded-xl bg-gray-200" />
      <div className="h-32 rounded-xl bg-gray-200" />
    </div>
  )
}
