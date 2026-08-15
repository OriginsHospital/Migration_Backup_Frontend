import Link from 'next/link'
import React from 'react'

const DashboardCard = ({ title, subtitle, Icon, href }) => {
  return (
    <Link
      href={href}
      className="w-full p-4 rounded  relative overflow-hidden group bg-white shadow border"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />

      <Icon className="absolute z-10 -top-12 -right-12 text-9xl text-slate-100 group-hover:text-secondary group-hover:rotate-12 transition-transform duration-300" />
      <Icon className="mb-2 text-2xl text-secondary group-hover:text-white transition-colors relative z-10 duration-300" />
      <h3 className="font-medium text-lg text-secondary group-hover:text-white relative z-10 duration-300">
        {title}
      </h3>
      <p className="text-slate-400 group-hover:text-violet-200 relative z-10 duration-300">
        {subtitle}
      </p>
    </Link>
  )
}

export default DashboardCard
