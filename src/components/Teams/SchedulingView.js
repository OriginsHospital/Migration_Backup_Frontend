import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
} from '@mui/material'
import {
  Add,
  Schedule,
  Person,
  Business,
  Delete,
  Edit,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '@/constants/teamsApis'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

function SchedulingView() {
  const userDetails = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [filterType, setFilterType] = useState('all') // all, shift, task, rotation
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduleType: 'shift',
    startTime: dayjs(),
    endTime: dayjs().add(8, 'hour'),
    assignedTo: null,
    departmentId: null,
    priority: 'medium',
  })

  // Fetch schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['schedules', filterType, userDetails?.accessToken],
    queryFn: async () => {
      const res = await getSchedules(
        userDetails?.accessToken,
        dayjs().format('YYYY-MM-DD'),
        dayjs().add(30, 'day').format('YYYY-MM-DD'),
        filterType !== 'all' ? filterType : undefined,
      )
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled: !!userDetails?.accessToken,
  })

  const createScheduleMutation = useMutation({
    mutationFn: async (payload) => {
      return await createSchedule(userDetails?.accessToken, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules'])
      setOpenCreateDialog(false)
      toast.success('Schedule created successfully')
    },
  })

  const handleCreateSchedule = () => {
    createScheduleMutation.mutate({
      title: formData.title,
      description: formData.description,
      scheduleType: formData.scheduleType,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      assignedTo: formData.assignedTo,
      departmentId: formData.departmentId,
      priority: formData.priority,
    })
  }

  const scheduleTypeOptions = [
    { value: 'shift', label: 'Shift' },
    { value: 'task', label: 'Task' },
    { value: 'rotation', label: 'Rotation' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ]

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <Box className="flex items-center gap-4">
          <Typography variant="h6">Scheduling</Typography>
          <Box className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'shift' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilterType('shift')}
            >
              Shifts
            </Button>
            <Button
              variant={filterType === 'task' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilterType('task')}
            >
              Tasks
            </Button>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreateDialog(true)}
        >
          New Schedule
        </Button>
      </Box>

      {isLoading ? (
        <Typography className="text-center py-8 text-gray-500">
          Loading schedules...
        </Typography>
      ) : schedulesData?.length === 0 ? (
        <Paper className="p-8 text-center">
          <Typography variant="h6" className="mb-2 text-gray-600">
            No schedules found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mb-4">
            Create a new schedule to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Schedule
          </Button>
        </Paper>
      ) : (
        <List>
          {schedulesData?.map((schedule) => (
            <Paper key={schedule.id} className="mb-3" elevation={2}>
              <ListItem>
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-2">
                    <Typography variant="h6">{schedule.title}</Typography>
                    <Chip
                      label={schedule.scheduleType}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={schedule.priority}
                      size="small"
                      color={
                        schedule.priority === 'urgent'
                          ? 'error'
                          : schedule.priority === 'high'
                            ? 'warning'
                            : 'default'
                      }
                    />
                    <Chip
                      label={schedule.status}
                      size="small"
                      color={
                        schedule.status === 'completed'
                          ? 'success'
                          : schedule.status === 'in-progress'
                            ? 'info'
                            : 'default'
                      }
                    />
                  </Box>
                  <Typography variant="body2" className="text-gray-600 mb-2">
                    {schedule.description}
                  </Typography>
                  <Box className="flex items-center gap-4 text-sm text-gray-500">
                    <Box className="flex items-center gap-1">
                      <Schedule fontSize="small" />
                      <span>
                        {dayjs(schedule.startTime).format('MMM DD, YYYY HH:mm')}{' '}
                        - {dayjs(schedule.endTime).format('HH:mm')}
                      </span>
                    </Box>
                    {schedule.assignedUser && (
                      <Box className="flex items-center gap-1">
                        <Person fontSize="small" />
                        <span>{schedule.assignedUser.fullName}</span>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
                  </IconButton>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      {/* Create Schedule Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Schedule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
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
                label="Schedule Type"
                value={formData.scheduleType}
                onChange={(e) =>
                  setFormData({ ...formData, scheduleType: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                {scheduleTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateSchedule}
            disabled={!formData.title || createScheduleMutation.isLoading}
          >
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SchedulingView
