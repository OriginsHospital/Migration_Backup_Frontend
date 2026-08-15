import { useRouter } from 'next/router'
import { useEffect } from 'react'

export function Redirect({ redirectURL }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(redirectURL)
  })
  return null
}
