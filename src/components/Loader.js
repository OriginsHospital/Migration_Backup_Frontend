import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import theme from '@/styles/theme'
import { useEffect, useState } from 'react'

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('react-lottie'), { ssr: false })

function Loader({
  children,
  size = 300,
  overlay = true,
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
}) {
  const loader = useSelector((store) => store.loader)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const lottieOptions = {
    animationData: require('../lottie-files/DNA_Loader.json'),
    loop: true,
    autoplay: true,
  }

  return (
    <>
      {loader.isLoading &&
        isMounted &&
        typeof window !== 'undefined' &&
        document.body &&
        createPortal(
          <div
            className={`
              fixed inset-0 z-100 
              flex justify-center items-center
            `}
            style={{
              zIndex: theme.zIndex.modal + 1,
            }}
          >
            <div className="relative">
              <Lottie
                style={{ width: `${size}px`, height: `${size}px` }}
                options={lottieOptions}
                isClickToPauseDisabled={true}
              />
            </div>
          </div>,
          document.body,
        )}
      {children}
    </>
  )
}

export { Loader }
