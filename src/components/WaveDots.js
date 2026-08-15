import React from 'react'
import { motion } from 'framer-motion'
import { Tooltip } from '@mui/material'

const waveVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const WaveDots = () => {
  return (
    <div className="absolute flex justify-center items-center cursor-context-menu mr-1 -mt-4">
      <Tooltip
        title="Patient is waiting in the same stage since 30mins"
        placement="top"
      >
        {[...Array(2)].map((_, index) => (
          <motion.span
            key={index}
            className="absolute left-[50%] top-[50%] z-0 h-5 w-5 rounded-full border-[1px] border-red-500 bg-gradient-to-br from-red-500/50 to-red-800/20 shadow-xl shadow-red-500/40"
            style={{ transform: 'translate(-50%, -50%)' }}
            initial="initial"
            animate="animate"
            variants={waveVariants}
            transition={{ delay: index * 0.5 }}
          />
        ))}
      </Tooltip>
    </div>
  )
}

export default WaveDots
