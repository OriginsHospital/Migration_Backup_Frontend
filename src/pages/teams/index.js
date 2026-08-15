import React from 'react'
import TeamsDashboard from '@/components/Teams/TeamsDashboard'
import Breadcrumb from '@/components/Breadcrumb'

export default function TeamsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Breadcrumb />
      <TeamsDashboard />
    </div>
  )
}
