export default function AppLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-10 w-56 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
        <div className="space-y-3">
          <div className="skeleton-line w-full" />
          <div className="skeleton-line w-11/12" />
          <div className="skeleton-line w-9/12" />
        </div>
      </div>
    </div>
  )
}
