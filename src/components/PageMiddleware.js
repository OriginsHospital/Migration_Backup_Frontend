import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { resetUser, setUser } from '@/redux/userSlice'
import { setDropdown } from '@/redux/dropdownSlice'
import {
  getCoupons,
  getDropdowns,
  getLoggedUserInfo,
  getNewAccessToken,
  getProfileDetails,
} from '@/constants/apis'
import Link from 'next/link'
import { SideNav } from './SideNav'
import { requestInterceptor } from '@/utils/requestInterceptor'
import { setCoupon } from '@/redux/couponSlice'
import TabBar from './TabBar'
import TabManager from './TabManager'
import FutureCycleModalGlobal from './FutureCycleModal'

/** Prefer profile fullName / userName for header when they differ from users table (getUserInfo). */
async function mergeUserWithProfileDetails(token, userObject) {
  try {
    const res = await getProfileDetails(token)
    const pd = res?.data?.profileDetails
    if (!pd) return userObject
    const nextFull = pd.fullName
    const nextUser = pd.userName
    return {
      ...userObject,
      fullName:
        nextFull != null && nextFull !== '' ? nextFull : userObject.fullName,
      userName:
        nextUser != null && nextUser !== '' ? nextUser : userObject.userName,
    }
  } catch {
    return userObject
  }
}

export default function PageMiddleware(props) {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const router = useRouter()

  const dropdowns = useQuery({
    queryKey: ['dropdowns'],
    queryFn: async () => {
      let token = localStorage.getItem('token')
      const responsejson = await getDropdowns(token)
      if (responsejson.status === 200) {
        const dropdownData = responsejson.data
        dispatch(setDropdown(responsejson.data))
        return dropdownData
      } else {
        throw new Error('Error occurred')
      }
    },
    refetchOnWindowFocus: true,
  })
  const coupon = useQuery({
    queryKey: ['coupon'],
    queryFn: async () => {
      let token = localStorage.getItem('token')
      const responsejson = await getCoupons(token)
      if (responsejson.status === 200) {
        const couponData = responsejson.data
        dispatch(setCoupon(responsejson.data))
        return couponData
      } else {
        throw new Error('Error occurred')
      }
    },
  })

  const { data: userInfo, mutate } = useMutation({
    mutationKey: ['loggedUserInfo'],
    mutationFn: async (token) => {
      const responsejson = await getLoggedUserInfo(token)
      if (responsejson.status == 200) {
        const {
          id,
          userName,
          fullName,
          email,
          roleDetails,
          branchDetails,
          moduleList,
        } = responsejson.data
        const userObject = {
          id,
          userName,
          fullName,
          email,
          roleDetails,
          branchDetails,
          moduleList,
          accessToken: token,
          isAuthenticated: true,
        }
        const merged = await mergeUserWithProfileDetails(token, userObject)
        dispatch(setUser(merged))
        return merged
      } else if (responsejson.status == 401) {
        // api call for refresh token
        const refreshTokenResponseJson = await getNewAccessToken(token)
        if (refreshTokenResponseJson.status == 200 && user.isAuthenticated) {
          // already user details are there but only accessToken is expired then accesstoken is replaced with new accessToken
          dispatch(
            setUser({
              ...user,
              accessToken: refreshTokenResponseJson.data.accessToken,
            }),
          )
          return {
            ...user,
            accessToken: refreshTokenResponseJson.data.accessToken,
          }
        }
        if (refreshTokenResponseJson.status == 200 && !user.isAuthenticated) {
          // all user details are gone then get all user details with new accessToken and store them in user slice
          const userInfoJson = await getLoggedUserInfo(
            refreshTokenResponseJson.data.accessToken,
          )
          if (userInfoJson.status == 200) {
            const {
              id,
              userName,
              fullName,
              email,
              roleDetails,
              branchDetails,
              moduleList,
            } = userInfoJson.data
            const userObject = {
              id,
              userName,
              fullName,
              email,
              roleDetails,
              branchDetails,
              moduleList,
              accessToken: refreshTokenResponseJson.data.accessToken,
              isAuthenticated: true,
            }
            localStorage.setItem(
              'token',
              refreshTokenResponseJson.data.accessToken,
            )
            const merged = await mergeUserWithProfileDetails(
              refreshTokenResponseJson.data.accessToken,
              userObject,
            )
            dispatch(setUser(merged))
            return merged
          }
          throw new Error('failed to fetch user details with new access token')
        }
        throw new Error('failed to fetch new access token')
      }
      throw new Error(
        'fetching user details failed with current access token, neither 200 nor 401',
      )
    },
    onSuccess: () => {
      requestInterceptor()
    },
    onError: (error) => {
      console.log(error)
      localStorage.clear()
      router.push('/login')
    },
  })

  useEffect(() => {
    // Wait for router to be ready before checking auth
    if (!router.isReady) return

    const token = localStorage.getItem('token')
    if (!user.isAuthenticated && !token) {
      // Store current path before redirecting
      const currentPath =
        router.asPath || window.location.pathname + window.location.search
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectPath', currentPath)
      }
      router.replace('/login')
    } else if (!user.isAuthenticated && token) {
      mutate(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, user.isAuthenticated])

  // Don't render until router is ready
  if (!router.isReady) {
    return null
  }

  // Only render children if authenticated, otherwise show nothing (redirect will happen)
  if (!user.isAuthenticated) {
    return null
  }

  return (
    <TabManager>
      <FutureCycleModalGlobal />
      <div className="flex flex-row ">
        <SideNav />
        <div className="pt-[60px] self-stretch h-screen overflow-hidden grow relative flex flex-col">
          <TabBar />
          <div className="flex-1 overflow-auto">
            <div className="">{props.children}</div>
          </div>
        </div>
      </div>
    </TabManager>
  )
}
