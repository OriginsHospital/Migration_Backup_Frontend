import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { addTab, setActiveTab, updateTab } from '@/redux/tabsSlice'

// Load tabs from sessionStorage on mount
if (typeof window !== 'undefined') {
  const savedTabs = sessionStorage.getItem('appTabs')
  if (savedTabs) {
    try {
      const parsed = JSON.parse(savedTabs)
      // Tabs will be restored by TabManager
    } catch (e) {
      console.warn('Failed to parse saved tabs:', e)
    }
  }
}

// Route to title mapping
const routeTitleMap = {
  '/home': 'Dashboard',
  '/teams': 'Teams',
  '/inbox': 'Inbox',
  '/appointments': 'Appointments',
  '/ticketing': 'Ticketing',
  '/patient': 'Patient',
  '/doctor': 'Doctor',
  '/pharmacy': 'Pharmacy',
  '/lab': 'Lab',
  '/embryology': 'Embryology',
  '/embryology/embryology-upt': 'Embryology & UPT',
  '/scan': 'Scan',
  '/scan/prescription': 'Scan - Prescription',
  '/scan/opu-sheet': 'Scan - OPU Sheet',
  '/scan/hystero-lap': 'Scan - Hystero/Lap',
  '/scan/upt': 'Scan - UPT Results',
  '/scan/discharge-card': 'Scan - Discharge Card',
  '/reports': 'Reports',
  '/dailyreport': 'Daily Report',
  '/ipmodule': 'IP Module',
  '/book-option': 'Book Option',
  '/admin/layouts': 'Master Layouts',
  '/ipmodule/layouts': 'Master Layouts',
}

export default function TabManager({ children }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { tabs, activeTabId } = useSelector((state) => state.tabs)

  useEffect(() => {
    if (
      !router.isReady ||
      router.pathname.startsWith('/login') ||
      router.pathname === '/register' ||
      router.pathname.startsWith('/resetpassword')
    ) {
      return
    }

    const path = router.asPath.split('?')[0] // Remove query params for tab ID

    // Get the title for the current route
    const getTitleForPath = (routePath) => {
      // Check exact match first
      if (routeTitleMap[routePath]) {
        return routeTitleMap[routePath]
      }

      // Check for sub-routes (e.g., /reports/revenue)
      const pathParts = routePath.split('/').filter(Boolean)
      if (pathParts.length > 1) {
        // For sub-routes, try to get a meaningful title
        const basePath = `/${pathParts[0]}`
        const subPath = pathParts.slice(1).join('/')

        // Capitalize and format the sub-path
        const formattedSubPath = subPath
          .split('/')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')

        const baseTitle =
          routeTitleMap[basePath] || basePath.split('/').pop() || 'Page'
        return `${baseTitle} - ${formattedSubPath}`
      }

      // Fallback: capitalize the last path segment
      const lastSegment = routePath.split('/').pop() || 'Dashboard'
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }

    const newTitle = getTitleForPath(path)

    // If there's an active tab, update its title and path to match the current route
    // This ensures the tab name updates as the user navigates
    if (activeTabId) {
      const activeTab = tabs.find((tab) => tab.id === activeTabId)
      if (activeTab) {
        // Only update if the path or title has changed
        if (activeTab.path !== path || activeTab.title !== newTitle) {
          dispatch(
            updateTab({
              id: activeTabId,
              updates: {
                path: path,
                title: newTitle,
              },
            }),
          )
        }
      }
    }

    // IMPORTANT: Do NOT automatically switch tabs based on path
    // Tabs should only be activated when explicitly clicked by the user
    // This prevents tabs from moving/reordering when navigating

    // If no tabs exist and we're on a valid route, create an initial tab
    // This handles the case when user first loads the app
    if (tabs.length === 0 && path !== '/login' && path !== '/register') {
      dispatch(
        addTab({
          path: path || '/home',
          title: newTitle || 'Dashboard',
        }),
      )
    }
  }, [
    router.isReady,
    router.asPath,
    router.pathname,
    dispatch,
    tabs,
    activeTabId,
  ])

  return <>{children}</>
}
