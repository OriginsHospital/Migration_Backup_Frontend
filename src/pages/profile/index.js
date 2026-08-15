import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProfileComp from '@/components/Profile'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { getProfileDetails, updateUserProfile } from '@/constants/apis'
import { toast, ToastContainer } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { setUser } from '@/redux/userSlice'
import { store } from '@/redux/store'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import ShiftChange from '@/components/ShiftChange'

function Profile() {
  const userDetails = useSelector((state) => state.user)
  const [currentPass, setCurrentPass] = useState()
  const [newPass, setNewPass] = useState()
  // usequery for get profile
  const dispatch = useDispatch()
  const { data: userprofile } = useQuery({
    queryKey: ['userprofile', userDetails?.accessToken],
    queryFn: () => getProfileDetails(userDetails?.accessToken),
    enabled: !!userDetails?.accessToken,
  })
  const queryClient = useQueryClient()
  const { mutateAsync: updateProfile } = useMutation({
    mutationKey: 'updateProfile',
    mutationFn: async (profile) => {
      dispatch(showLoader())
      await updateUserProfile(userDetails?.accessToken, profile)
      queryClient.invalidateQueries(['userprofile', userDetails?.accessToken])
      return profile
    },
    onSuccess: (data) => {
      dispatch(hideLoader())
      const current = store.getState().user
      dispatch(
        setUser({
          ...current,
          fullName:
            data?.fullName != null && data.fullName !== ''
              ? data.fullName
              : current.fullName,
          userName:
            data?.userName != null && data.userName !== ''
              ? data.userName
              : current.userName,
        }),
      )
      toast.success('Profile Updated ', toastconfig)
    },
    onError: (error) => {
      dispatch(hideLoader())
      toast.error('Error updating profile', toastconfig)
      console.error('Error updating profile:', error)
    },
  })
  const [selectedTab, setSelectedTab] = useState('profile')
  const [profile, setProfile] = useState()
  useEffect(() => {
    setProfile(userprofile?.data)
  }, [userprofile?.data])

  // Keep header / Redux display name in sync with profile API (can differ from logged-user info)
  useEffect(() => {
    const pd = userprofile?.data?.profileDetails
    if (!pd) return
    const nextFull = pd.fullName
    const nextUser = pd.userName
    if (
      (nextFull == null || nextFull === '') &&
      (nextUser == null || nextUser === '')
    ) {
      return
    }
    const u = store.getState().user
    if (
      (nextFull == null || nextFull === '' || nextFull === u.fullName) &&
      (nextUser == null || nextUser === '' || nextUser === u.userName)
    ) {
      return
    }
    dispatch(
      setUser({
        ...u,
        fullName: nextFull != null && nextFull !== '' ? nextFull : u.fullName,
        userName: nextUser != null && nextUser !== '' ? nextUser : u.userName,
      }),
    )
  }, [
    userprofile?.data?.profileDetails?.fullName,
    userprofile?.data?.profileDetails?.userName,
    dispatch,
  ])

  const updateProfileHandler = (profile) => {
    console.log('Updating profile', profile)
    // create a object with email, addresline1,phoneNo, fullName and userName
    const updatedProfile = {
      email: profile.email,
      addressLine1: profile.addressLine1,
      phoneNo: profile.phoneNo,
      fullName: profile.fullName,
      userName: profile.userName,
    }

    updateProfile(updatedProfile)
  }
  const hanldeUpdatePass = () => {
    console.log(currentPass, newPass)
    if (currentPass == newPass) {
      console.log('matching')
    } else {
      console.log('not matching')
    }
  }
  return (
    <div className="w-full h-full p-5 flex gap-5">
      {/* <Stack spacing={3}>

                <Grid container spacing={3}>
                    <Grid lg={4} md={6} xs={12}>
                        <Card className='rounded-3xl border'>
                            <CardContent>
                                <Stack spacing={4} sx={{ alignItems: 'center' }} className='p-5'>
                                    <div>
                                        <span className='bg-secondary text-white py-3 px-5  mt-4 rounded-full font-bold text-2xl'>{user?.fullName.substring(0, 1).toUpperCase()}</span>
                                    </div>
                                    <Stack spacing={1} sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5">{user?.fullName}</Typography>
                                        <Typography color="text.secondary" variant="body2">
                                            {user?.email}
                                        </Typography>
                                        <Typography color="text.secondary" variant="body2">
                                            {user?.roleDetails?.name}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </CardContent>

                        </Card>        </Grid>

                </Grid>
            </Stack> */}
      <TabContext value={selectedTab}>
        <div className="min-w-80  h-full flex flex-col gap-3 shadow rounded bg-white overflow-y-auto">
          <div className="flex items-center border p-3">
            <span className="bg-primary text-white px-7 py-5 mt-4 rounded-full font-bold text-2xl ">
              {userprofile?.data?.profileDetails?.fullName
                .substring(0, 1)
                .toUpperCase()}
            </span>
            <Box ml={2} className="flex flex-col">
              <Typography variant="h5" component="div">
                {userprofile?.data?.profileDetails?.fullName}
              </Typography>

              <Typography className="text-secondary">
                @{userprofile?.data?.profileDetails?.userName}
              </Typography>
            </Box>
          </div>

          <TabList
            onChange={(event, newValue) => {
              setSelectedTab(newValue)
            }}
            orientation="vertical"
          >
            <Tab label="Profile" value="profile" />
            <Tab label="request Shift change " value="shift" />
            <Tab label="request Branch change " value="branch" />
            <Tab label="Change Password " value="changepassword" />
          </TabList>
        </div>
        <div className="grow h-full rounded bg-white overflow-y-auto">
          <TabPanel value="profile">
            <ProfileComp
              profile={profile}
              setProfile={setProfile}
              updateProfileHandler={updateProfileHandler}
            />
          </TabPanel>
          <TabPanel value="shift">
            {/* <span>SHift Change</span> */}
            <ShiftChange shiftDetails={userprofile?.data?.shiftDetails} />
          </TabPanel>
          <TabPanel value="branch">
            <span className="text-3xl mb-5 font-semibold text-gray-600">
              Branch change
            </span>
          </TabPanel>
          <TabPanel value="changepassword">
            <div className="flex flex-col gap-3 w-[50%]">
              <span className="text-3xl mb-5 font-semibold text-gray-600">
                {' '}
                Change Password
              </span>
              {/* create 2 text fields 1 for current password and other for new password */}
              <TextField
                label="Current Password"
                type="text"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />

              <TextField
                label="New Password"
                type="text"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />

              <Button onClick={hanldeUpdatePass}>Update Password</Button>

              {/* create a submit button */}
              {/* handle the submit button click and validate the current password and new password */}
              {/* if validation passes then call the update password API */}
              {/* if API call is successful then show a success message */}
              {/* if API call fails then show an error message */}
              {/* add a loader while waiting for API response */}
              {/* write code here */}
              {/* <ToastContainer /> */}
            </div>
          </TabPanel>
        </div>
      </TabContext>
    </div>
  )
}

export default Profile
