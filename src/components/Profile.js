// src/Profile?.tsx
import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  IconButton,
  TextField,
} from '@mui/material'
import {
  Edit,
  Email,
  LocationCity,
  Person,
  Phone,
  Save,
} from '@mui/icons-material'
import { FaUser } from 'react-icons/fa'

// interface ProfileProps {
//     user: {
//         userId: number;
//         userName: string;
//         fullName: string;
//         email: string;
//         phoneNo: string | null;
//         addressLine1: string | null;
//         addressLine2: string | null;
//         state: string | null;
//         country: string | null;
//         profileCompletePercent: number;
//     };
// }

const Profile = ({ profile, setProfile, updateProfileHandler }) => {
  const [isEditing, setIsEditing] = useState(false)
  // const [profile, setProfile] = useState();

  const handleChange = e => {
    const { name, value } = e?.target
    setProfile(prevProfile => ({
      ...prevProfile,
      // set value inside profileDetails object
      profileDetails: { ...prevProfile.profileDetails, [name]: e.target.value },
      // [name]: value,
      // profiledetails[name] : value,
      // [name]: value,
    }))
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }
  return (
    <Card sx={{ margin: 'auto' }} className="border p-10">
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {profile?.profileDetails?.profileCompletePercent}% of Profile
          Completed
        </Typography>
        <LinearProgress
          variant="determinate"
          value={profile?.profileDetails?.profileCompletePercent}
          className="h-2 rounded-full"
        />
      </Box>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {/* <FaUser size={40} /> */}
          <span className="bg-secondary text-white px-9 py-7 mt-4 rounded-full font-bold text-2xl">
            {profile?.profileDetails?.fullName.substring(0, 1).toUpperCase()}
          </span>
          <Box ml={2} className="flex flex-col gap-2">
            {isEditing ? (
              <TextField
                label="Full Name"
                name="fullName"
                value={profile?.profileDetails?.fullName}
                onChange={handleChange}
                variant="standard"
                size="small"
                fullWidth
              />
            ) : (
              <Typography variant="h5" component="div">
                {profile?.profileDetails?.fullName}
              </Typography>
            )}
            {isEditing ? (
              <TextField
                label="User Name"
                name="userName"
                value={profile?.profileDetails?.userName}
                onChange={handleChange}
                variant="standard"
                size="small"
                // fullWidth
              />
            ) : (
              <Typography className="text-secondary">
                @{profile?.profileDetails?.userName}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleEditToggle} sx={{ ml: 'auto' }}>
            {isEditing ? (
              <Save
                onClick={() => updateProfileHandler(profile?.profileDetails)}
              />
            ) : (
              <Edit />
            )}
          </IconButton>
        </Box>
        <Box display="flex" alignItems="center" mb={2} className="gap-5 ">
          <Email className="text-secondary" />
          {/* {isEditing ? (
                        <TextField
                            label="Email"
                            name="email"
                            value={profile?.profileDetails?.email}
                            onChange={handleChange}
                            variant="standard"
                            size="small"
                            fullWidth
                        />
                    ) : ( */}
          <Typography variant="body2">
            {profile?.profileDetails?.email}
          </Typography>
          {/* )} */}
        </Box>
        <Box display="flex" alignItems="center" mb={2} className="gap-5 ">
          <Phone className="text-secondary" />
          {isEditing ? (
            <TextField
              label="Phone Number"
              name="phoneNo"
              value={profile?.profileDetails?.phoneNo || ''}
              onChange={handleChange}
              variant="standard"
              size="small"
              fullWidth
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {profile?.profileDetails?.phoneNo
                ? profile?.profileDetails?.phoneNo
                : 'N/A'}
            </Typography>
          )}
        </Box>

        <div className="flex  gap-5 items-center text-secondary">
          <LocationCity />
          {isEditing ? (
            <TextField
              label="Address "
              name="addressLine1"
              value={profile?.profileDetails?.addressLine1 || ''}
              onChange={handleChange}
              variant="standard"
              size="small"
              fullWidth
              mb={2}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profile?.profileDetails?.addressLine1
                ? profile?.profileDetails?.addressLine1
                : 'N/A'}
              {/* , {profile?.addressLine2 ? profile?.addressLine2 : 'N/A'}, {profile?.state ? profile?.state : 'N/A'}, {profile?.country ? profile?.country : 'N/A'} */}
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Profile
