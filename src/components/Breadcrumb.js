import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ChevronRight } from '@mui/icons-material'
// import { ChevronRight } from 'lucide-react';

const Breadcrumb = props => {
  const router = useRouter()
  const pathSegments = router.asPath.split('/').filter(segment => segment)

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-secondary"
          >
            Home
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`
          const isLast = index === pathSegments.length - 1

          return (
            <li key={segment}>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link
                  href={href}
                  className={`ml-1 text-sm font-medium md:ml-2 ${
                    isLast
                      ? 'text-gray-500 cursor-default'
                      : 'text-gray-700 hover:text-secondary'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {segment
                    .split('?')[0]
                    .charAt(0)
                    .toUpperCase() + segment.split('?')[0].slice(1)}
                </Link>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
