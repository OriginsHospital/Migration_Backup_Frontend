import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Grid,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Add,
  VideoCall,
  CalendarToday,
  AccessTime,
  People,
  MoreVert,
  Delete,
  Edit,
  Stop,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  getUserMeetings,
  createMeeting,
  updateMeeting,
  joinMeeting,
  deleteMeeting,
} from '@/constants/teamsApis'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

function MeetingsView() {
  const userDetails = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuMeeting, setMenuMeeting] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: dayjs(),
    endTime: dayjs().add(1, 'hour'),
    agenda: '',
    location: '',
    participantIds: [],
  })

  // Fetch meetings
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['userMeetings', userDetails?.accessToken],
    queryFn: async () => {
      const res = await getUserMeetings(
        userDetails?.accessToken,
        dayjs().format('YYYY-MM-DD'),
        dayjs().add(30, 'day').format('YYYY-MM-DD'),
      )
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled: !!userDetails?.accessToken,
  })

  const createMeetingMutation = useMutation({
    mutationFn: async (payload) => {
      return await createMeeting(userDetails?.accessToken, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userMeetings'])
      setOpenCreateDialog(false)
      resetFormData()
      toast.success('Meeting created successfully')
    },
    onError: () => {
      toast.error('Failed to create meeting')
    },
  })

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ meetingId, payload }) => {
      return await updateMeeting(userDetails?.accessToken, meetingId, payload)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['userMeetings'])
      setOpenEditDialog(false)
      resetFormData()

      // Show different messages based on what was updated
      if (variables.payload.status === 'completed') {
        toast.success('Meeting ended successfully')
      } else {
        toast.success('Meeting updated successfully')
      }
    },
    onError: () => {
      toast.error('Failed to update meeting')
    },
  })

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId) => {
      return await deleteMeeting(userDetails?.accessToken, meetingId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userMeetings'])
      toast.success('Meeting deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete meeting')
    },
  })

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      startTime: dayjs(),
      endTime: dayjs().add(1, 'hour'),
      agenda: '',
      location: '',
      participantIds: [],
    })
    setSelectedMeeting(null)
  }

  const handleCreateMeeting = () => {
    createMeetingMutation.mutate({
      title: formData.title,
      description: formData.description,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      agenda: formData.agenda,
      location: formData.location,
      meetingType: 'scheduled',
      participantIds: formData.participantIds,
    })
  }

  const handleUpdateMeeting = () => {
    if (!selectedMeeting) return
    updateMeetingMutation.mutate({
      meetingId: selectedMeeting.id,
      payload: {
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        agenda: formData.agenda,
        location: formData.location,
        participantIds: formData.participantIds,
      },
    })
  }

  const handleJoinMeeting = async (meeting) => {
    try {
      const res = await joinMeeting(userDetails?.accessToken, meeting.id)
      if (res.status === 200) {
        window.open(res.data.meetingLink, '_blank')
      }
    } catch (error) {
      toast.error('Failed to join meeting')
    }
  }

  const handleMenuOpen = (event, meeting) => {
    setAnchorEl(event.currentTarget)
    setMenuMeeting(meeting)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuMeeting(null)
  }

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting)
    setFormData({
      title: meeting.title || '',
      description: meeting.description || '',
      startTime: meeting.startTime ? dayjs(meeting.startTime) : dayjs(),
      endTime: meeting.endTime
        ? dayjs(meeting.endTime)
        : dayjs().add(1, 'hour'),
      agenda: meeting.agenda || '',
      location: meeting.location || '',
      participantIds: meeting.participantIds || [],
    })
    setOpenEditDialog(true)
    handleMenuClose()
  }

  const handleDeleteMeeting = (meeting) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      deleteMeetingMutation.mutate(meeting.id)
      handleMenuClose()
    }
  }

  const handleEndMeeting = (meeting) => {
    if (window.confirm('Are you sure you want to end this meeting?')) {
      updateMeetingMutation.mutate({
        meetingId: meeting.id,
        payload: {
          status: 'completed',
          endTime: new Date().toISOString(),
        },
      })
      handleMenuClose()
    }
  }

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h6">Meetings</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreateDialog(true)}
        >
          New Meeting
        </Button>
      </Box>

      {isLoading ? (
        <Typography className="text-center py-8 text-gray-500">
          Loading meetings...
        </Typography>
      ) : meetingsData?.length === 0 ? (
        <Paper className="p-8 text-center">
          <Typography variant="h6" className="mb-2 text-gray-600">
            No meetings scheduled
          </Typography>
          <Typography variant="body2" className="text-gray-500 mb-4">
            Create a new meeting to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Meeting
          </Button>
        </Paper>
      ) : (
        <List>
          {meetingsData?.map((meeting) => (
            <Paper key={meeting.id} className="mb-3" elevation={2}>
              <ListItem>
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-2">
                    <Typography variant="h6">{meeting.title}</Typography>
                    <Chip
                      label={meeting.status}
                      size="small"
                      color={
                        meeting.status === 'scheduled'
                          ? 'primary'
                          : meeting.status === 'ongoing'
                            ? 'success'
                            : 'default'
                      }
                    />
                  </Box>
                  <Typography variant="body2" className="text-gray-600 mb-2">
                    {meeting.description}
                  </Typography>
                  <Box className="flex items-center gap-4 text-sm text-gray-500">
                    <Box className="flex items-center gap-1">
                      <CalendarToday fontSize="small" />
                      <span>
                        {dayjs(meeting.startTime).format('MMM DD, YYYY')}
                      </span>
                    </Box>
                    <Box className="flex items-center gap-1">
                      <AccessTime fontSize="small" />
                      <span>
                        {dayjs(meeting.startTime).format('HH:mm')} -{' '}
                        {meeting.endTime
                          ? dayjs(meeting.endTime).format('HH:mm')
                          : 'TBD'}
                      </span>
                    </Box>
                    {meeting.location && (
                      <Typography variant="caption">
                        {meeting.location}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box className="flex items-center gap-2">
                  {meeting.status === 'scheduled' && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<VideoCall />}
                      onClick={() => handleJoinMeeting(meeting)}
                    >
                      Join
                    </Button>
                  )}
                  {meeting.status === 'ongoing' && (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Stop />}
                      onClick={() => handleEndMeeting(meeting)}
                    >
                      End Meeting
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, meeting)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      {/* Three Dots Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuMeeting && (
          <>
            {menuMeeting.status === 'ongoing' && (
              <MenuItem onClick={() => handleEndMeeting(menuMeeting)}>
                <Stop fontSize="small" className="mr-2" />
                <Typography variant="body2">End Meeting</Typography>
              </MenuItem>
            )}
            <MenuItem
              onClick={() => handleEditMeeting(menuMeeting)}
              disabled={
                menuMeeting.status === 'ongoing' ||
                menuMeeting.status === 'completed'
              }
            >
              <Edit fontSize="small" className="mr-2" />
              <Typography variant="body2">Edit</Typography>
            </MenuItem>
            <MenuItem
              onClick={() => handleDeleteMeeting(menuMeeting)}
              disabled={menuMeeting.status === 'ongoing'}
            >
              <Delete fontSize="small" className="mr-2" />
              <Typography variant="body2">Delete</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Meeting Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => {
          setOpenCreateDialog(false)
          resetFormData()
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Meeting Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(newValue) =>
                  setFormData({ ...formData, startTime: newValue })
                }
                className="w-full"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(newValue) =>
                  setFormData({ ...formData, endTime: newValue })
                }
                className="w-full"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agenda"
                value={formData.agenda}
                onChange={(e) =>
                  setFormData({ ...formData, agenda: e.target.value })
                }
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCreateDialog(false)
              resetFormData()
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateMeeting}
            disabled={!formData.title || createMeetingMutation.isLoading}
          >
            Create Meeting
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false)
          resetFormData()
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Meeting Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(newValue) =>
                  setFormData({ ...formData, startTime: newValue })
                }
                className="w-full"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(newValue) =>
                  setFormData({ ...formData, endTime: newValue })
                }
                className="w-full"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agenda"
                value={formData.agenda}
                onChange={(e) =>
                  setFormData({ ...formData, agenda: e.target.value })
                }
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEditDialog(false)
              resetFormData()
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateMeeting}
            disabled={!formData.title || updateMeetingMutation.isLoading}
          >
            Update Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MeetingsView
