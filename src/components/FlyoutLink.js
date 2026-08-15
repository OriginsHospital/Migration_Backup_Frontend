import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import dummyProfile from '../../public/dummyProfile.jpg'

// const Example = () => {
//   return (
//     <div className="flex h-[500px] justify-center bg-neutral-900 px-3 py-12">
//       <FlyoutLink href="#" FlyoutContent={PricingContent}>
//         Pricing
//       </FlyoutLink>
//     </div>
//   );
// };

const FlyoutLink = ({ children, href, patientDetails }) => {
  const [open, setOpen] = useState(false)

  const showFlyout = patientDetails && open

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative w-full h-fit"
    >
      <a href={href} className="relative ">
        {children}
        <span
          style={{
            transform: showFlyout ? 'scaleX(1)' : 'scaleX(0)',
          }}
          className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left scale-x-0 rounded-full bg-indigo-300 transition-transform duration-300 ease-out"
        />
        {/* <span
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                >View Full</span> */}
      </a>
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0, z: 15 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ translateX: '-50%', zIndex: 10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute left-1/2 top-12 bg-white text-black shadow"
          >
            <CardHoverContent patientDetails={patientDetails} />
            <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const CardHoverContent = ({ patientDetails }) => {
  return (
    <div className="w-64 bg-white p-6 shadow-xl">
      {/* <div className="mb-3 space-y-3">
                <h3 className="font-semibold">{patientDetails.patientName}</h3>

            </div> */}
      <div className="flex flex-col gap-2 items-center">
        <Image
          src={patientDetails?.photoPath || dummyProfile}
          alt="profilePic"
          width={100}
          height={100}
          className="rounded-full aspect-square	"
        />
        <div className="flex items-center gap-2 ">
          <span className="flex flex-col items-center">
            <span className="font-semibold text-xl">
              {patientDetails?.patientName}
            </span>
            <span className="text-xs bg-slate-100 p-1 font-thin">
              {patientDetails?.patientId}
            </span>
            <span className="text-sm">{patientDetails?.type} </span>
          </span>
        </div>
        <div className="flex justify-between p-1 bg-primary text-secondary rounded w-full">
          <span className="font-bold">{patientDetails?.doctorName}</span>
          <div>
            <span>{patientDetails?.timeStart}</span>-
            <span>{patientDetails?.timeEnd}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlyoutLink
