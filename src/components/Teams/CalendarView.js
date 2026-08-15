import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
} from '@mui/material'
import {
  Add,
  Today,
  ViewWeek,
  CalendarMonth,
  Edit,
  Delete,
  Close,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/constants/teamsApis'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

function CalendarView() {
  const userDetails = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [view, setView] = useState('month') // month, week, day
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'meeting',
    startTime: dayjs(),
    endTime: dayjs().add(1, 'hour'),
    location: '',
    priority: 'medium',
    color: '#1976d2',
  })

  // Get date range for current view
  const getDateRange = () => {
    if (view === 'month') {
      return {
        startDate: selectedDate.startOf('month').format('YYYY-MM-DD'),
        endDate: selectedDate.endOf('month').format('YYYY-MM-DD'),
      }
    } else if (view === 'week') {
      return {
        startDate: selectedDate.startOf('week').format('YYYY-MM-DD'),
        endDate: selectedDate.endOf('week').format('YYYY-MM-DD'),
      }
    } else {
      return {
        startDate: selectedDate.format('YYYY-MM-DD'),
        endDate: selectedDate.format('YYYY-MM-DD'),
      }
    }
  }

  const { startDate, endDate } = getDateRange()

  // Fetch calendar events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendarEvents', startDate, endDate, userDetails?.accessToken],
    queryFn: async () => {
      const res = await getCalendarEvents(
        userDetails?.accessToken,
        startDate,
        endDate,
      )
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled: !!userDetails?.accessToken,
  })

  const createEventMutation = useMutation({
    mutationFn: async (payload) => {
      return await createCalendarEvent(userDetails?.accessToken, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents'])
      setOpenCreateDialog(false)
      toast.success('Event created successfully')
      resetFormData()
    },
    onError: (error) => {
      toast.error('Failed to create event')
      console.error('Error creating event:', error)
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, payload }) => {
      return await updateCalendarEvent(
        userDetails?.accessToken,
        eventId,
        payload,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents'])
      setOpenEditDialog(false)
      setSelectedEvent(null)
      resetFormData()
      toast.success('Event updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update event')
      console.error('Error updating event:', error)
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      return await deleteCalendarEvent(userDetails?.accessToken, eventId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents'])
      setOpenEditDialog(false)
      setSelectedEvent(null)
      toast.success('Event deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete event')
      console.error('Error deleting event:', error)
    },
  })

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'meeting',
      startTime: dayjs(),
      endTime: dayjs().add(1, 'hour'),
      location: '',
      priority: 'medium',
      color: '#1976d2',
    })
  }

  const handleCreateEvent = () => {
    createEventMutation.mutate({
      title: formData.title,
      description: formData.description,
      eventType: formData.eventType,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      location: formData.location,
      priority: formData.priority,
      color: formData.color,
    })
  }

  const handleEditEvent = (event) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'meeting',
      startTime: event.startTime ? dayjs(event.startTime) : dayjs(),
      endTime: event.endTime ? dayjs(event.endTime) : dayjs().add(1, 'hour'),
      location: event.location || '',
      priority: event.priority || 'medium',
      color: event.color || '#1976d2',
    })
    setOpenEditDialog(true)
  }

  const handleUpdateEvent = () => {
    if (!selectedEvent) return
    updateEventMutation.mutate({
      eventId: selectedEvent.id,
      payload: {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        location: formData.location,
        priority: formData.priority,
        color: formData.color,
      },
    })
  }

  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(selectedEvent.id)
    }
  }

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false)
    setSelectedEvent(null)
    resetFormData()
  }

  // Group events by date
  const eventsByDate = eventsData?.reduce((acc, event) => {
    const dateKey = dayjs(event.startTime).format('YYYY-MM-DD')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {})

  const eventTypeOptions = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'task', label: 'Task' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'shift', label: 'Shift' },
    { value: 'appointment', label: 'Appointment' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#4caf50' },
    { value: 'medium', label: 'Medium', color: '#ff9800' },
    { value: 'high', label: 'High', color: '#f44336' },
    { value: 'urgent', label: 'Urgent', color: '#d32f2f' },
  ]

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <Box className="flex items-center gap-4">
          <Typography variant="h6">Calendar</Typography>
          <Box className="flex gap-2">
            <Button
              variant={view === 'day' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setView('day')}
              startIcon={<Today />}
            >
              Day
            </Button>
            <Button
              variant={view === 'week' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setView('week')}
              startIcon={<ViewWeek />}
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setView('month')}
              startIcon={<CalendarMonth />}
            >
              Month
            </Button>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreateDialog(true)}
        >
          New Event
        </Button>
      </Box>

      {/* Calendar View */}
      <Paper elevation={2} className="p-4 min-h-[600px]">
        {view === 'month' && (
          <Box>
            <Typography variant="h6" className="mb-4 text-center">
              {selectedDate.format('MMMM YYYY')}
            </Typography>
            {/* Simple month grid - can be enhanced with react-big-calendar */}
            <Box className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Typography
                  key={day}
                  variant="subtitle2"
                  className="text-center font-semibold p-2"
                >
                  {day}
                </Typography>
              ))}
              {Array.from({ length: 35 }).map((_, index) => {
                const date = selectedDate
                  .startOf('month')
                  .startOf('week')
                  .add(index, 'day')
                const dateKey = date.format('YYYY-MM-DD')
                const dayEvents = eventsByDate?.[dateKey] || []
                const isCurrentMonth = date.month() === selectedDate.month()

                return (
                  <Paper
                    key={index}
                    elevation={0}
                    className={`p-2 min-h-[100px] border ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? 'border-blue-500 border-2' : ''}`}
                  >
                    <Typography
                      variant="caption"
                      className={`${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}
                    >
                      {date.format('D')}
                    </Typography>
                    <Box className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Chip
                          key={event.id}
                          label={event.title}
                          size="small"
                          className="w-full text-xs cursor-pointer hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditEvent(event)
                          }}
                          style={{
                            backgroundColor: event.color || '#1976d2',
                            color: 'white',
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Typography variant="caption" className="text-gray-500">
                          +{dayEvents.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          </Box>
        )}

        {view === 'day' && (
          <Box>
            <Typography variant="h6" className="mb-4">
              {selectedDate.format('MMMM DD, YYYY')}
            </Typography>
            {eventsByDate?.[selectedDate.format('YYYY-MM-DD')]?.map((event) => (
              <Paper
                key={event.id}
                className="p-3 mb-2 cursor-pointer hover:bg-gray-50"
                elevation={1}
                onClick={() => handleEditEvent(event)}
              >
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography variant="subtitle1">{event.title}</Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {dayjs(event.startTime).format('HH:mm')} -{' '}
                      {event.endTime
                        ? dayjs(event.endTime).format('HH:mm')
                        : 'TBD'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditEvent(event)
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Create Event Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => {
          setOpenCreateDialog(false)
          resetFormData()
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Calendar Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
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
                select
                label="Event Type"
                value={formData.eventType}
                onChange={(e) =>
                  setFormData({ ...formData, eventType: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
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
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={3}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
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
            onClick={handleCreateEvent}
            disabled={!formData.title || createEventMutation.isLoading}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="h6">Edit Calendar Event</Typography>
          <Box className="flex items-center gap-2">
            <IconButton
              size="small"
              color="error"
              onClick={handleDeleteEvent}
              disabled={deleteEventMutation.isLoading}
              title="Delete Event"
            >
              <Delete />
            </IconButton>
            <IconButton size="small" onClick={handleCloseEditDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
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
                select
                label="Event Type"
                value={formData.eventType}
                onChange={(e) =>
                  setFormData({ ...formData, eventType: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
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
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={3}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateEvent}
            disabled={!formData.title || updateEventMutation.isLoading}
          >
            {updateEventMutation.isLoading ? 'Updating...' : 'Update Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CalendarView
