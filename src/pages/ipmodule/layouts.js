import { useEffect } from 'react'
import { useRouter } from 'next/router'

/** Legacy route — Master Layouts now lives under Admin / Master Data. */
export default function LegacyLayoutsRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    router.replace({
      pathname: '/admin/layouts',
      query: router.query,
    })
  }, [router.isReady, router.query, router])

  return null
}
