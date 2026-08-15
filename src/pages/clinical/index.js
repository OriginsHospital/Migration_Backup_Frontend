import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function ClinicalIndex() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first sub-route (OT Scheduler)
    router.replace('/clinical/otscheduler')
  }, [router])

  // Show loading state while redirecting
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#fff',
      }}
    >
      <p>Redirecting...</p>
    </div>
  )
}
