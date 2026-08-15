// import Image from "next/image";
// import { Inter } from "next/font/google";
// import Link from "next/link";
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.push('/login')
  })
  return null
}
