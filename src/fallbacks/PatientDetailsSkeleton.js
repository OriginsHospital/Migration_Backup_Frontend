import { Skeleton, Avatar } from '@mui/material'

export default function PatientDetailsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full w-full">
      {/* Header with avatar and basic info */}
      <div className="flex items-center mb-6">
        <Skeleton
          animation="wave"
          variant="circular"
          width={80}
          height={80}
          className="mr-10"
        />
        <div>
          <Skeleton animation="wave" variant="text" width={200} height={32} />{' '}
          {/* Name */}
          <Skeleton
            animation="wave"
            variant="text"
            width={150}
            height={20}
          />{' '}
          {/* Phone */}
        </div>
      </div>

      {/* Grid of patient information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Generate 9 info items to match the original component */}
        {[...Array(9)].map((_, index) => (
          <div key={index}>
            <Skeleton animation="wave" variant="text" width={80} height={20} />{' '}
            {/* Label */}
            <Skeleton
              animation="wave"
              variant="text"
              width={120}
              height={24}
            />{' '}
            {/* Value */}
          </div>
        ))}
      </div>
    </div>
  )
}
