import { useState, useMemo, useRef, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { ToastContainer, toast } from 'react-toastify'
import { Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import Popover from '@mui/material/Popover'
import PregnantWomanOutlinedIcon from '@mui/icons-material/PregnantWomanOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined'
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import { logout, getTickets, getTasks } from '@/constants/apis'
import { resetUser } from '@/redux/userSlice'
import { withPermission } from './withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { HomeOutlined, ScannerOutlined } from '@mui/icons-material'

import { FaUserDoctor } from 'react-icons/fa6'
import { GiMedicines } from 'react-icons/gi'
import {
  TbBuildingCommunity,
  TbChecklist,
  TbCheckupList,
  TbFileAnalytics,
} from 'react-icons/tb'
import { LuCalendarDays } from 'react-icons/lu'
import { FiUser, FiUsers } from 'react-icons/fi'
import { LuLayoutDashboard, LuBedDouble } from 'react-icons/lu'
import { HiUsers } from 'react-icons/hi2'
import { TbTicket, TbInbox } from 'react-icons/tb'

import Image from 'next/image'
import originslogo from '../../public/origins-new-logo.png'
import { GrSchedule } from 'react-icons/gr'
// Helper function to check if user has access to New Patient Tracker
const hasNewPatientTrackerAccess = (userEmail) => {
  if (!userEmail) return false
  return userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
}

function NavItem({
  expanded,
  clickedNavItem,
  setClickedNavItem,
  path,
  name,
  icon,
  Iconn,
  subRoutes,
  badgeCount,
}) {
  const router = useRouter()
  const buttonRef = useRef('')
  const user = useSelector((store) => store.user)
  const userEmail = user?.email || user?.userDetails?.email || ''

  // Filter subRoutes to hide New Patient Tracker and Patient Management if user doesn't have access
  const filteredSubRoutes =
    subRoutes?.filter((route) => {
      if (route.path === '/reports/newPatientTracker') {
        return hasNewPatientTrackerAccess(userEmail)
      }
      if (route.path === '/patient/management') {
        return hasNewPatientTrackerAccess(userEmail)
      }
      return true
    }) || []

  const [anchorEl, setAnchorEl] = useState(null)
  function handleClick() {
    setClickedNavItem(name)
    // Set anchorEl when button is clicked
    if (buttonRef.current) {
      setAnchorEl(buttonRef.current)
    }
  }

  function handleClose() {
    setClickedNavItem('')
    setAnchorEl(null)
  }

  useEffect(() => {
    // Set anchorEl when component mounts and buttonRef is available
    if (buttonRef.current) {
      setAnchorEl(buttonRef.current)
    }
  }, [])

  return (
    <>
      {filteredSubRoutes?.length > 0 ? (
        <>
          <div className="relative flex items-center">
            {path ? (
              <Link
                href={path}
                className={`p-2 flex justify-center text-nowrap relative flex-1 before:absolute before:bottom-0 before:left-0 before:h-0 hover:before:h-full before:w-full before:transition-all before:duration-300 before:bg-primary/50 before:-z-10
                ${router.pathname === path ? 'shadow bg-primary/50' : ''}`}
              >
                <div className="w-full flex justify-start items-center gap-2">
                  <Iconn className="text-2xl text-secondary group-hover:text-white transition-colors relative z-10 duration-300" />
                  <span
                    className={`font-sans text-sm font-semibold text-secondary`}
                  >
                    {name}
                  </span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div
                className={`p-2 flex justify-center text-nowrap relative flex-1 before:absolute before:bottom-0 before:left-0 before:h-0 hover:before:h-full before:w-full before:transition-all before:duration-300 before:bg-primary/50 before:-z-10
                ${router.pathname === path ? 'shadow bg-primary/50' : ''}`}
              >
                <div className="w-full flex justify-start items-center gap-2">
                  <Iconn className="text-2xl text-secondary group-hover:text-white transition-colors relative z-10 duration-300" />
                  <span
                    className={`font-sans text-sm font-semibold text-secondary`}
                  >
                    {name}
                  </span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
              </div>
            )}
            <button
              ref={buttonRef}
              id={name}
              className="p-1 flex items-center justify-center hover:bg-primary/30 rounded transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClick()
              }}
            >
              <svg
                className={`w-4 h-4 text-secondary transition-transform ${
                  Boolean(anchorEl) && name == clickedNavItem ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <Popover
            open={Boolean(anchorEl) && name == clickedNavItem}
            onClose={handleClose}
            anchorEl={anchorEl}
            elevation={4}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            {filteredSubRoutes.map((eachSubRouteObj, i) => {
              // const userModule = user?.moduleList?.find(
              //   eachModuleObj => eachModuleObj.enum == eachSubRouteObj.relatedModule,
              // )
              // console.log('module list', user.moduleList, userModule)
              const NavOption = withPermission(
                SubNavItem,
                false,
                eachSubRouteObj.relatedModule,
                [ACCESS_TYPES.READ, ACCESS_TYPES.WRITE],
              )
              return (
                <NavOption
                  key={i + eachSubRouteObj.relatedModule}
                  eachSubRouteObj={eachSubRouteObj}
                  i={i}
                  // <NavItem
                  // key={eachSubRouteObj.name + i}
                  // expanded={expanded}
                  // clickedNavItem={clickedNavItem}
                  // setClickedNavItem={setClickedNavItem}
                  // icon={eachSubRouteObj.icon}
                  // Iconn={eachSubRouteObj.Iconn}
                  // name={eachSubRouteObj.name}
                  // path={eachSubRouteObj.path}
                  // subRoutes={eachSubRouteObj.subRoutes}
                />
              )
            })}
          </Popover>
        </>
      ) : (
        <Link
          href={path}
          className={`p-2 flex justify-center text-nowrap relative before:absolute before:bottom-0 before:left-0 before:h-0 hover:before:h-full before:w-full before:transition-all before:duration-300 before:bg-primary/50 before:-z-10
          ${router.pathname.startsWith(path) ? 'shadow bg-primary/50' : ''}`}
        >
          <div
            // className={`${expanded ? 'w-full' : 'w-full'} transition-[width] duration-[0.5s]`}
            className="w-full flex justify-start items-center gap-2"
          >
            {/* <div className="w-6 h-6 flex justify-center items-center">
              {icon}

            </div> */}
            <Iconn className="text-2xl text-secondary group-hover:text-white transition-colors relative z-10 duration-300" />
            <span className={`font-sans text-sm font-semibold text-secondary`}>
              {name}
            </span>
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
        </Link>
      )}
    </>
  )
}

function LogoutNavButton({
  expanded,
  clickedNavItem,
  setClickedNavItem,
  name,
  icon,
  // subRoutes,
}) {
  const dispatch = useDispatch()
  const QueryClient = useQueryClient()
  const router = useRouter()
  // const buttonRef = useRef(null)

  const toastconfig = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Bounce,
  }

  const { mutate } = useMutation({
    mutationFn: (token) => logout(token),
    onSuccess: () => {
      //remove userdetails in store
      localStorage.clear()
      dispatch(resetUser())
      toast.success('Logged-out successfully', toastconfig)
      router.push('/login')
    },
    onError: (error) => {
      console.log(error)
      toast.error('Failed to logout', toastconfig)
    },
  })

  // function handleClick() {
  //   setClickedNavItem(name)
  // }

  // function handleClose() {
  //   setClickedNavItem('')
  // }

  function logoutHandler() {
    mutate()
  }

  return (
    <>
      <button
        // ref={buttonRef}
        className={`py-1 pl-2.5 pr-4 flex justify-center rounded text-nowrap `}
        onClick={logoutHandler}
      >
        <div className=" relative w-full flex flex-col items-center">
          <div className="w-6 h-6 flex justify-center items-center">{icon}</div>
          <span className={` text-[#06aee9] font-semibold`}>{name}</span>
          {/* <ChevronRightIcon
            className={`absolute -right-5 ${expanded ? 'opacity-100' : 'opacity-0'} transition-[opacity] duration-[0.5s]`}
          /> */}
        </div>
      </button>
      {/* {subRoutes?.length > 0 && (
        <Popover
          open={name == clickedNavItem}
          onClose={handleClose}
          anchorEl={buttonRef.current}
          elevation={4}
          anchorOrigin={{
            vertical: 'up',
            horizontal: 'right',
          }}
        >
          {subRoutes.map((eachSubRouteObj, i) => (
            <Link
              key={eachSubRouteObj.name + i}
              className={`py-1 pl-2.5 pr-4 flex rounded text-nowrap bg-white`}
              href={eachSubRouteObj.path}
            >
              {eachSubRouteObj.name}
            </Link>
          ))}
        </Popover>
      )} */}
      <div>{/* <ToastContainer /> */}</div>
    </>
  )
}
const SubNavItem = ({ eachSubRouteObj, i }) => {
  return (
    <Link
      key={eachSubRouteObj.name + i}
      className={`py-2 pl-2.5 pr-4  flex gap-2 text-nowrap  hover:shadow`}
      href={eachSubRouteObj.path}
    >
      <span className="text-secondary font-semibold ">
        {eachSubRouteObj.name}
      </span>
    </Link>
  )
}
function SideNav(props) {
  const user = useSelector((store) => store.user)
  const [expanded, setExpanded] = useState(false)
  const [clickedNavItem, setClickedNavItem] = useState('')
  const router = useRouter()

  // Get user email for access control
  const userEmail = user?.email || user?.userDetails?.email || ''
  const hasTeamsAccess = userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
  const hasInboxAccess = userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
  // const iconsColor = '#06aee9'

  // Fetch ticket count (assigned to user)
  const { data: ticketsData } = useQuery({
    queryKey: ['ticketsCount', user?.accessToken],
    queryFn: async () => {
      if (!user?.accessToken) return { total: 0 }
      try {
        const response = await getTickets(user.accessToken, {
          page: 1,
          limit: 1,
        })
        return response?.data?.pagination || { total: 0 }
      } catch (error) {
        console.warn('Failed to fetch tickets count:', error)
        return { total: 0 }
      }
    },
    enabled: !!user?.accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
  })

  // Fetch task count (assigned to user)
  const { data: tasksData } = useQuery({
    queryKey: ['tasksCount', user?.accessToken],
    queryFn: async () => {
      if (!user?.accessToken) return { total: 0 }
      try {
        const response = await getTasks(user.accessToken, {
          page: 1,
          limit: 1,
        })
        return response?.data?.pagination || { total: 0 }
      } catch (error) {
        console.warn('Failed to fetch tasks count:', error)
        return { total: 0 }
      }
    },
    enabled: !!user?.accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
  })

  const ticketsCount = ticketsData?.total || 0
  const tasksCount = tasksData?.total || 0
  const totalCount = ticketsCount + tasksCount
  const routes = useMemo(() => {
    const allRoutes = [
      {
        path: '/home',
        name: 'Dashboard',
        relatedModule: 'dashboard',
        // icon: <HomeOutlined className="text-secondary" />,
        Iconn: LuLayoutDashboard,
        subRoutes: [
          {
            path: '/home/payments',
            name: 'Payments',
            relatedModule: 'dashboard',
          },
        ],
      },
      {
        path: '/teams',
        name: 'Teams',
        relatedModule: 'teams',
        Iconn: HiUsers,
      },
      {
        path: '/inbox',
        name: 'Inbox',
        relatedModule: 'inbox',
        Iconn: TbInbox,
      },
      {
        path: '/appointments',
        name: 'Appointments',
        relatedModule: 'appointment',
        // icon: <HomeOutlined className="text-secondary" />,
        Iconn: GrSchedule,
      },
      {
        path: '/ticketing',
        name: 'Ticketing',
        relatedModule: 'ticketing',
        Iconn: TbTicket,
      },
      {
        path: '/patient',
        name: 'Patient',
        relatedModule: 'patients',
        icon: <PregnantWomanOutlinedIcon className="text-secondary" />,
        Iconn: FiUser,
        subRoutes: [
          {
            path: '/patient/register',
            name: 'Register Patient',
            relatedModule: 'appointmentCreation',
          },
          {
            path: '/patient',
            name: 'Patients',
            relatedModule: 'Patients',
          },
          {
            path: '/patient/management',
            name: 'Patient Management',
            relatedModule: 'allPatients',
          },
          {
            path: '/patient/donor',
            name: 'Donor',
            relatedModule: 'donorModule',
          },
          {
            path: '/patient/treatmentcycles',
            name: 'Treatment Cycles',
            relatedModule: 'donorModule',
          },
          {
            path: '/patient/futurecycles',
            name: 'Future Cycles',
            relatedModule: 'Patients',
          },
          {
            path: '/patient/referringdoctors',
            name: 'Referring Doctors',
            relatedModule: 'Patients',
          },
          {
            path: '/reports/newPatientTracker',
            name: 'New Patient Tracker',
            relatedModule: 'reportsModule',
          },
        ],
      },
      {
        path: '/doctor',
        name: 'Doctor',
        relatedModule: 'manageDoctors',
        icon: <LocalHospitalOutlinedIcon className="text-secondary" />,
        Iconn: FaUserDoctor,
        subRoutes: [
          {
            path: '/doctor',
            name: 'Manage Doctors',
            relatedModule: 'manageDoctors',
          },
          {
            path: '/doctor/appointments',
            name: 'Appointments ',
            relatedModule: 'appointments',
          },
          // {
          //   path: "/patient/all",
          //   name: "All Patients",
          // },
        ],
      },
      {
        path: '/pharmacy/medicinestages',
        name: 'Pharmacy',
        relatedModule: 'pharmacy',
        Iconn: GiMedicines,
        icon: <LocalPharmacyOutlinedIcon className="text-secondary" />,
        subRoutes: [
          {
            path: '/pharmacy/medicinestages',
            name: 'Pharmacy',
            relatedModule: 'pharmacy',
            // icon: <FaMoneyBill size={30} />,
          },
          {
            path: '/GRN',
            name: 'GRN',
            relatedModule: 'grnModule',
          },
          {
            path: '/pharmacy/dashboard',
            relatedModule: 'grnStockExpiryDate',
            name: 'Stock Expiry',
          },
          {
            path: '/pharmacy/pendingsales',
            relatedModule: 'pharmacy',
            name: 'Pending Sales',
          },
          {
            path: '/pharmacy/refund',
            relatedModule: 'pharmacy',
            name: 'Refund',
          },
        ],
      },

      // {
      //   path: "/messages",
      //   name: "Messages",
      //   icon: <MdMessage size={30} />,
      // },
      {
        path: '/laboratory',
        name: 'Lab',
        Iconn: TbCheckupList,
        relatedModule: 'labModule',
        icon: <VaccinesOutlinedIcon className="text-secondary" />,
        subRoutes: [
          {
            path: '/laboratory',
            name: 'Lab',
            relatedModule: 'labModule',
          },
          {
            path: '/laboratory/labslist',
            name: 'Labs List',
            relatedModule: 'labModule',
          },
          {
            path: '/laboratory/outsourcing',
            name: 'Outsourcing',
            relatedModule: 'outsourcing',
          },
        ],
      },
      {
        path: '/embryology',
        name: 'Embryology',
        relatedModule: 'embryology',
        Iconn: TbCheckupList,
        subRoutes: [
          {
            path: '/embryology',
            name: 'Embryology',
            relatedModule: 'embryology',
          },
          {
            path: '/embryology/embryology-upt',
            name: 'Embryology & UPT',
            relatedModule: 'embryology',
          },
        ],
      },
      {
        path: '/scan',
        name: 'Scan',
        Iconn: TbChecklist,
        relatedModule: null,
        icon: <ScannerOutlined className="text-secondary" />,
        subRoutes: [
          {
            path: '/scan',
            name: 'Scan List',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/prescription',
            name: 'Prescription',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/opu-sheet',
            name: 'OPU Sheet',
            relatedModule: null,
          },
          {
            path: '/scan/hystero-lap',
            name: 'Hystero/Lap',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/upt',
            name: 'UPT Results',
            relatedModule: 'scanModule',
          },
          {
            path: '/scan/discharge-card',
            name: 'Discharge Card',
            relatedModule: 'scanModule',
          },
        ],
      },

      {
        path: '/clinical',
        name: 'Clinical',
        Iconn: TbChecklist,
        relatedModule: 'otScheduler',
        icon: <ScannerOutlined className="text-secondary" />,
        subRoutes: [
          {
            path: '/clinical/otscheduler',
            name: 'OT Scheduler',
            relatedModule: 'otScheduler',
            // icon: <BiAnalyse size={30} />,
          },
          {
            path: '/clinical/injectionsheet',
            name: 'Injection Sheet',
            relatedModule: 'injectionSheet',
            // icon: <FaMoneyBill size={30} />,
          },
        ],
      },
      // Hidden Layouts menu item - accessible via IP Module > Layouts button
      // {
      //   path: '/layouts',
      //   name: 'Layouts',
      //   relatedModule: 'layouts',
      //   Iconn: LuBedDouble,
      //   subRoutes: [],
      // },
      {
        path: '/indent',
        name: 'IP Indent',
        relatedModule: 'indent',
        Iconn: TbFileAnalytics,
        icon: <TbFileAnalytics className="text-secondary" />,
        subRoutes: [],
      },
      {
        path: '/admin',
        name: 'Admin',
        Iconn: FiUsers,
        relatedModule: 'manageUsers',
        icon: <PersonOutlineOutlinedIcon className="text-secondary" />,
        subRoutes: [
          {
            path: '/admin/manageusers',
            name: 'Manage Users',
            relatedModule: 'manageUsers',
            // icon: <BiAnalyse size={30} />,
          },
          {
            path: '/admin/managefields',
            name: 'Master Data',
            relatedModule: 'masterData',
            // icon: <BiAnalyse size={30} />,
          },
          {
            path: '/admin/layouts',
            name: 'Master Layouts',
            relatedModule: 'masterData',
          },
          // {
          //   path: '/admin/reports',
          //   name: 'Reports',
          //   // icon: <FaMoneyBill size={30} />,
          // },
        ],
      },
      {
        path: '/reports',
        name: 'Reports',
        relatedModule: 'reportsModule',
        Iconn: TbFileAnalytics,
        subRoutes: [],
      },
      {
        path: '/dailyreport',
        name: 'Daily Report',
        relatedModule: 'reportsModule',
        Iconn: LuCalendarDays,
        subRoutes: [],
      },
      // {
      //   path: '/formF',
      //   name: 'Form F',
      //   relatedModule: 'formF',
      //   Iconn: TbChecklist,
      //   subRoutes: [],
      // },
      {
        path: '/ipmodule',
        name: 'IP Module',
        relatedModule: 'ipmodule',
        Iconn: TbBuildingCommunity,
        subRoutes: [
          {
            path: '/ipmodule',
            name: 'IP List',
            relatedModule: 'ipmodule',
          },
          {
            path: '/book-option',
            name: 'Book Option',
            relatedModule: 'ipmodule',
          },
        ],
      },
    ]

    // Filter out Teams and Inbox routes if user doesn't have access
    let filteredRoutes = allRoutes
    if (!hasTeamsAccess) {
      filteredRoutes = filteredRoutes.filter((route) => route.path !== '/teams')
    }
    if (!hasInboxAccess) {
      filteredRoutes = filteredRoutes.filter((route) => route.path !== '/inbox')
    }
    return filteredRoutes
  }, [hasTeamsAccess, hasInboxAccess])

  useEffect(() => {
    setClickedNavItem('')
    setExpanded(false)
  }, [router.pathname])

  return (
    <div
      className={`h-screen z-20 left-0 top-0 flex flex-col gap-3 min-w-[12%] duration-[0.5s] overflow-x-hidden border-r-2 w-12`}
    >
      {/* <button
        className={`${expanded ? 'w-[50px]' : 'w-full'} self-end transition-[width] duration-[0.5s]`}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ArrowBackOutlinedIcon sx={{ color: '#D7E2F4' }} />
        ) : (
          <MenuOutlinedIcon sx={{ color: '#D7E2F4' }} />
        )}
      </button> */}
      <div className="flex flex-col items-center justify-center gap-3 ">
        <img src={originslogo.src} className="  w-36 h-36" />
        {/* <span className='text-2xl font-extrabold text-[#06aee9]'>HMS</span> */}
      </div>
      <div className="flex flex-col gap-3">
        {routes.map((eachRouteObj, i) => {
          // const userModule = user.moduleList?.find(
          //   eachModuleObj => eachModuleObj.enum == eachRouteObj.relatedModule,
          // )
          // console.log('module list', user.moduleList, userModule)
          const NavOption = withPermission(
            NavItem,
            false,
            eachRouteObj.relatedModule,
            [ACCESS_TYPES.READ, ACCESS_TYPES.WRITE],
          )
          return (
            <NavOption
              key={eachRouteObj.name + i}
              expanded={expanded}
              clickedNavItem={clickedNavItem}
              setClickedNavItem={setClickedNavItem}
              icon={eachRouteObj.icon}
              Iconn={eachRouteObj.Iconn}
              name={eachRouteObj.name}
              path={eachRouteObj.path}
              subRoutes={eachRouteObj.subRoutes}
              badgeCount={
                eachRouteObj.path === '/ticketing' ? totalCount : undefined
              }
            />
          )
        })}
      </div>
      {/* <div className="flex flex-col-reverse gap-3 grow ">
        <LogoutNavButton
          key={'logout'}
          expanded={expanded}
          clickedNavItem={clickedNavItem}
          setClickedNavItem={setClickedNavItem}
          icon={<LogoutOutlinedIcon className="text-secondary" />}
          name={'Logout'}
        // subRoutes={eachRouteObj.subRoutes}
        />
      </div> */}
    </div>
  )
}

export { SideNav }
