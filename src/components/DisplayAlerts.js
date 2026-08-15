import { getAllAlerts } from '@/constants/apis'
import { Divider } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import Marquee from 'react-fast-marquee'
import { useSelector } from 'react-redux'

function DisplayAlerts() {
  const userDetails = useSelector(state => state.user)
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts', userDetails.accessToken],
    queryFn: async () => await getAllAlerts(userDetails.accessToken),
    enabled: !!userDetails.accessToken,
    refetchInterval: 1000 * 60,
  })
  if (isLoading) return <div>Loading...</div>
  return (
    <Marquee speed={50} pauseOnHover={true}>
      <div className="flex items-center gap-4">
        {alertsData?.data?.map(alert => (
          <div key={alert.id} className="flex items-center gap-4">
            <span>{alert.alertMessage}</span>
            <Divider
              orientation="vertical"
              flexItem
              className="text-secondary"
            />
          </div>
        ))}
      </div>
    </Marquee>
  )
}

export default DisplayAlerts
