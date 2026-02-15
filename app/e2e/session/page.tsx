import { redirect } from 'next/navigation'
import MySessions from '@/components/dashboard/MySessions'

export default function E2ESessionPage() {
  if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH !== 'true') {
    redirect('/dashboard?view=session')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MySessions />
    </div>
  )
}
