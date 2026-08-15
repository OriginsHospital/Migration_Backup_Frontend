import React from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

const BlinkingDot = () => {
  const controls = useAnimation()

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        await controls.start({ opacity: 1 })
        await controls.start({ opacity: 0 })
      }
    }
    sequence()
  }, [controls])

  return (
    <motion.div
      animate={controls}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop' }}
      style={{
        width: '20px',
        height: '20px',
        backgroundColor: 'red',
        borderRadius: '50%',
        opacity: 0,
      }}
    ></motion.div>
    // <div className='relative'>
    //         </div>
  )
}

export default BlinkingDot
