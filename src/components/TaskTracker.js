import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Stack,
  Avatar,
  Menu,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import debounce from 'lodash/debounce'
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getActiveStaff,
  createTaskComment,
  getTaskDetails,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers'
import AddTaskModal from './AddTaskModal'
import TaskDetailsModal from './TaskDetailsModal'

// CSV Export Utility Function
const exportToCSV = (data, filename, headers, getRowData) => {
  // Create CSV content
  const csvHeaders = headers.join(',')
  const csvRows = data.map((item) => {
    const row = getRowData(item)
    return row
      .map((cell) => {
        // Escape commas and quotes in cell values
        if (cell === null || cell === undefined) return ''
        const cellStr = String(cell)
        if (
          cellStr.includes(',') ||
          cellStr.includes('"') ||
          cellStr.includes('\n')
        ) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      })
      .join(',')
  })

  const csvContent = [csvHeaders, ...csvRows].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

// Priority badge colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' }
    case 'MEDIUM':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'LOW':
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

// Status badge colors
const getStatusColor = (status) => {
  switch (status) {
    case 'OPEN':
    case 'Pending':
      return { bg: '#ffffff', text: '#374151', border: '#d1d5db' }
    case 'IN_PROGRESS':
    case 'In Progress':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'COMPLETED':
    case 'Completed':
      return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' }
    case 'Cancelled':
      return { bg: '#ffebee', text: '#c62828', border: '#f44336' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

function TaskTracker() {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  })
  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [exportDateModalOpen, setExportDateModalOpen] = useState(false)
  const [exportFromDate, setExportFromDate] = useState(null)
  const [exportToDate, setExportToDate] = useState(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null)
  const [selectedActionTask, setSelectedActionTask] = useState(null)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionComment, setActionComment] = useState('')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState('')
  const [selectedNewPriority, setSelectedNewPriority] = useState('')
  const limit = 50

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setFilters((prev) => ({ ...prev, search: value }))
        setPage(1)
      }, 500),
    [],
  )

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  // Fetch tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', user?.accessToken, filters, page],
    queryFn: async () => {
      try {
        const response = await getTasks(user?.accessToken, {
          ...filters,
          page,
          limit,
        })
        console.log('Tasks API Response:', response)
        if (response.status !== 200) {
          throw new Error(response.message || 'Failed to fetch tasks')
        }
        return response
      } catch (err) {
        console.error('Error fetching tasks:', err)
        throw err
      }
    },
    enabled: !!user?.accessToken,
    retry: 1,
  })

  // Handle different response structures
  let tasks = data?.data?.tasks || data?.tasks || []
  const pagination = data?.data?.pagination ||
    data?.pagination || { total: 0, totalPages: 1 }

  // Client-side priority filtering (if API doesn't support it)
  if (filters.priority && tasks.length > 0) {
    tasks = tasks.filter((task) => {
      const taskPriority = task.priority || 'MEDIUM'
      return taskPriority.toUpperCase() === filters.priority.toUpperCase()
    })
  }

  // Debug logging
  if (data) {
    console.log('Full response data:', data)
    console.log('Tasks array:', tasks)
    console.log('Tasks count:', tasks.length)
    console.log('Pagination:', pagination)
  }

  if (error) {
    console.error('Tasks query error:', error)
  }

  // Fetch active staff for assignment
  const { data: staffData } = useQuery({
    queryKey: ['activeStaff'],
    queryFn: async () => {
      const response = await getActiveStaff(user?.accessToken)
      return response
    },
    enabled: !!user?.accessToken,
  })

  const staffList = staffData?.data || []

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await createTask(user?.accessToken, payload)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setCreateModalOpen(false)
      toast.success('Task created successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create task')
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await updateTask(user?.accessToken, payload)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditTask(null)
      toast.success('Task updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update task')
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await updateTaskStatus(user?.accessToken, taskId, status)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setAnchorEl(null)
      toast.success('Task status updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update status')
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await deleteTask(user?.accessToken, taskId)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setAnchorEl(null)
      toast.success('Task deleted successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete task')
    },
  })

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ status: '', priority: '', search: '' })
    setPage(1)
  }

  // Open export date modal
  const handleOpenExportModal = () => {
    setExportFromDate(null)
    setExportToDate(null)
    setExportDateModalOpen(true)
  }

  // Export tasks to CSV with date range
  const handleExportTasks = async () => {
    try {
      // Close modal
      setExportDateModalOpen(false)

      // Use currently loaded tasks first
      let allTasks = tasks || []

      // Build export filters with date range
      const exportFilters = { ...filters }
      if (exportFromDate) {
        exportFilters.fromDate = dayjs(exportFromDate).format('YYYY-MM-DD')
      }
      if (exportToDate) {
        exportFilters.toDate = dayjs(exportToDate).format('YYYY-MM-DD')
      }

      // If we have tasks, try to fetch all with same filters for complete export
      if (
        pagination?.total > allTasks.length ||
        exportFromDate ||
        exportToDate
      ) {
        toast.info('Fetching tasks for export...')
        try {
          const exportData = await getTasks(user?.accessToken, {
            ...exportFilters,
            page: 1,
            limit: 10000, // High limit to get all records
          })

          // Try different response structures
          const fetchedTasks =
            exportData?.data?.tasks ||
            exportData?.tasks ||
            exportData?.data ||
            []

          if (fetchedTasks.length > 0) {
            allTasks = fetchedTasks
          }
        } catch (apiError) {
          console.warn(
            'Could not fetch all tasks, using current page:',
            apiError,
          )
          // Continue with currently loaded tasks
        }
      }

      // Filter by date range if dates are selected and we have tasks
      if ((exportFromDate || exportToDate) && allTasks.length > 0) {
        allTasks = allTasks.filter((task) => {
          const taskDate = task.createdAt || task.created_at
          if (!taskDate) return false

          const createdDate = dayjs(taskDate)
          const fromDate = exportFromDate
            ? dayjs(exportFromDate).startOf('day')
            : null
          const toDate = exportToDate ? dayjs(exportToDate).endOf('day') : null

          if (fromDate && createdDate.isBefore(fromDate)) return false
          if (toDate && createdDate.isAfter(toDate)) return false
          return true
        })
      }

      if (allTasks.length === 0) {
        toast.warning('No tasks found for the selected date range')
        return
      }

      toast.info('Preparing export...')

      const headers = [
        'Task Name',
        'Description',
        'Remarks',
        'Status',
        'Start Date',
        'End Date',
        'Assigned To',
        'Assigned To Email',
        'Created By',
        'Created By Email',
        'Created At',
        'Updated At',
        'Alert Enabled',
        'Alert Date',
      ]

      const getRowData = (task) => {
        // Handle multiple assignees
        let assignedToArray = []
        if (task.assignedToDetails) {
          try {
            const parsed =
              typeof task.assignedToDetails === 'string'
                ? JSON.parse(task.assignedToDetails)
                : task.assignedToDetails
            assignedToArray = Array.isArray(parsed)
              ? parsed
              : [parsed].filter(Boolean)
          } catch (e) {
            assignedToArray = []
          }
        }
        const assigneeNames =
          assignedToArray.length > 0
            ? assignedToArray.map((a) => a.fullName).join('; ')
            : 'Unassigned'
        const assigneeEmails =
          assignedToArray.length > 0
            ? assignedToArray.map((a) => a.email).join('; ')
            : ''

        const createdBy = task.createdByDetails
          ? typeof task.createdByDetails === 'string'
            ? JSON.parse(task.createdByDetails)
            : task.createdByDetails
          : {}

        return [
          task.taskName || task.task_name || '',
          task.description || '',
          task.remarks || '',
          task.status || '',
          task.startDate || task.start_date
            ? dayjs(task.startDate || task.start_date).format('YYYY-MM-DD')
            : '',
          task.endDate || task.end_date
            ? dayjs(task.endDate || task.end_date).format('YYYY-MM-DD')
            : '',
          assigneeNames,
          assigneeEmails,
          createdBy.fullName || 'Unknown',
          createdBy.email || '',
          task.createdAt || task.created_at
            ? dayjs(task.createdAt || task.created_at).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
          task.updatedAt || task.updated_at
            ? dayjs(task.updatedAt || task.updated_at).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
          task.alertEnabled || task.alert_enabled ? 'Yes' : 'No',
          task.alertDate || task.alert_date
            ? dayjs(task.alertDate || task.alert_date).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
        ]
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
      exportToCSV(
        allTasks,
        `tasks_report_${timestamp}.csv`,
        headers,
        getRowData,
      )
      toast.success(`Exported ${allTasks.length} tasks successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export tasks. Please try again.')
    }
  }

  const handleStatusChange = (taskId, newStatus) => {
    updateStatusMutation.mutate({ taskId, status: newStatus })
  }

  const handleDelete = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  // Update status with comment mutation
  const updateStatusWithCommentMutation = useMutation({
    mutationFn: ({ taskId, status, comment }) => {
      // First create comment if provided
      if (comment && comment.trim()) {
        return createTaskComment(user?.accessToken, {
          taskId,
          commentText: comment,
        }).then(() => updateTaskStatus(user?.accessToken, taskId, status))
      }
      return updateTaskStatus(user?.accessToken, taskId, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['taskDetails'] })
      toast.success('Task status updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task status')
    },
  })

  // Update task mutation (for priority and other fields)
  const updateTaskWithCommentMutation = useMutation({
    mutationFn: ({ taskId, payload, comment }) => {
      // First create comment if provided
      if (comment && comment.trim()) {
        return createTaskComment(user?.accessToken, {
          taskId,
          commentText: comment,
        }).then(() => updateTask(user?.accessToken, payload))
      }
      return updateTask(user?.accessToken, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['taskDetails'] })
      toast.success('Task updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task')
    },
  })

  // Delete task with comment mutation
  const deleteTaskWithCommentMutation = useMutation({
    mutationFn: ({ taskId, comment }) => {
      // First create comment if provided
      if (comment && comment.trim()) {
        return createTaskComment(user?.accessToken, {
          taskId,
          commentText: comment,
        }).then(() => deleteTask(user?.accessToken, taskId))
      }
      return deleteTask(user?.accessToken, taskId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['taskDetails'] })
      toast.success('Task deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete task')
    },
  })

  // Action menu handlers
  const handleMenuOpen = (event, task) => {
    setActionMenuAnchor(event.currentTarget)
    setSelectedActionTask(task)
  }

  const handleMenuClose = () => {
    setActionMenuAnchor(null)
    // Don't clear selectedActionTask here - it's needed for the comment dialog
  }

  const handleActionClick = (action) => {
    // Store the task before closing menu
    const task = selectedActionTask
    setActionMenuAnchor(null) // Close menu but keep task data

    if (action === 'view') {
      if (task?.id) {
        setSelectedTaskId(task.id)
        setViewModalOpen(true)
      }
      setSelectedActionTask(null) // Clear after use
      return
    }

    // For other actions, show comment dialog
    // Keep selectedActionTask set so comment dialog can use it
    setPendingAction(action)
    setCommentDialogOpen(true)
  }

  const handleCommentSubmit = async () => {
    const task = selectedActionTask
    const comment = actionComment.trim()

    // Validate that we have a task
    if (!task || !task.id) {
      toast.error('Task information is missing. Please try again.')
      setCommentDialogOpen(false)
      setActionComment('')
      setPendingAction(null)
      return
    }

    switch (pendingAction) {
      case 'edit':
        // Save comment if provided
        if (comment && comment.trim()) {
          try {
            await createTaskComment(user?.accessToken, {
              taskId: task.id,
              commentText: comment,
            })
          } catch (error) {
            console.error('Error saving comment:', error)
            // Continue even if comment fails
          }
        }
        // Use the task data we already have from the table
        // Try to fetch full details, but fallback to table data if fetch fails
        try {
          const taskDetails = await getTaskDetails(user?.accessToken, task.id)
          console.log('Task details response:', taskDetails)
          // Handle different response structures
          const taskData = taskDetails?.data || taskDetails
          if (taskData) {
            setEditTask(taskData)
            setCommentDialogOpen(false)
            setActionComment('')
            setCreateModalOpen(true)
          } else {
            // Fallback to using table task data
            setEditTask(task)
            setCommentDialogOpen(false)
            setActionComment('')
            setCreateModalOpen(true)
          }
        } catch (error) {
          console.error('Error fetching task details:', error)
          // Fallback to using table task data
          setEditTask(task)
          setCommentDialogOpen(false)
          setActionComment('')
          setCreateModalOpen(true)
        }
        break

      case 'updateStatus':
        setCommentDialogOpen(false)
        setStatusDialogOpen(true)
        // Don't clear selectedActionTask yet - needed for status confirmation
        break

      case 'updatePriority':
        setCommentDialogOpen(false)
        setPriorityDialogOpen(true)
        // Don't clear selectedActionTask yet - needed for priority confirmation
        break

      case 'delete':
        deleteTaskWithCommentMutation.mutate({ taskId: task.id, comment })
        setCommentDialogOpen(false)
        setActionComment('')
        setSelectedActionTask(null) // Clear after use
        break

      case 'reopen':
        // Require comment for reopening
        if (!comment || !comment.trim()) {
          toast.error('Please enter a comment to reopen the task')
          return // Don't close dialog, let user enter comment
        }
        updateStatusWithCommentMutation.mutate({
          taskId: task.id,
          status: 'Pending',
          comment,
        })
        setCommentDialogOpen(false)
        setActionComment('')
        setSelectedActionTask(null) // Clear after use
        break

      default:
        setCommentDialogOpen(false)
        setActionComment('')
        setSelectedActionTask(null) // Clear after use
    }
  }

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false)
    setActionComment('')
    setPendingAction(null)
    setSelectedActionTask(null) // Clear when dialog is closed
  }

  const handleStatusConfirm = () => {
    if (!selectedNewStatus) {
      toast.error('Please select a status')
      return
    }
    const task = selectedActionTask
    const comment = actionComment.trim()
    updateStatusWithCommentMutation.mutate({
      taskId: task.id,
      status: selectedNewStatus,
      comment,
    })
    setStatusDialogOpen(false)
    setSelectedNewStatus('')
    setActionComment('')
  }

  const handlePriorityConfirm = () => {
    if (!selectedNewPriority) {
      toast.error('Please select a priority')
      return
    }
    const task = selectedActionTask
    const comment = actionComment.trim()
    updateTaskWithCommentMutation.mutate({
      taskId: task.id,
      payload: { taskId: task.id, priority: selectedNewPriority },
      comment,
    })
    setPriorityDialogOpen(false)
    setSelectedNewPriority('')
    setActionComment('')
  }

  const isAdmin = user?.roleDetails?.name?.toLowerCase() === 'admin'

  return (
    <Box>
      {/* Filters and Search */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by task or ticket code..."
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                onChange={handleSearchChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) =>
                    handleFilterChange('priority', e.target.value)
                  }
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setEditTask(null)
                  setCreateModalOpen(true)
                }}
                size="small"
                sx={{
                  bgcolor: '#06aee9',
                  '&:hover': { bgcolor: '#0599d1' },
                }}
              >
                CREATE
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              All Tasks
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleOpenExportModal}
              disabled={isLoading}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Download Report
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">
                Failed to load tasks. Please try again.
              </Typography>
            </Box>
          ) : tasks.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No tasks found
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setEditTask(null)
                  setCreateModalOpen(true)
                }}
              >
                Create Your First Task
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => {
                    // Handle multiple assignees - assignedToDetails is now an array
                    let assignedToArray = []
                    if (task.assignedToDetails) {
                      try {
                        const parsed =
                          typeof task.assignedToDetails === 'string'
                            ? JSON.parse(task.assignedToDetails)
                            : task.assignedToDetails
                        assignedToArray = Array.isArray(parsed)
                          ? parsed
                          : [parsed].filter(Boolean)
                      } catch (e) {
                        assignedToArray = []
                      }
                    }
                    const createdBy = task.createdByDetails
                      ? typeof task.createdByDetails === 'string'
                        ? JSON.parse(task.createdByDetails)
                        : task.createdByDetails
                      : {}
                    const priorityColor = getPriorityColor(
                      task.priority || 'MEDIUM',
                    )
                    const statusColor = getStatusColor(task.status)

                    return (
                      <TableRow
                        key={task.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: '#f9fafb' },
                          cursor: 'pointer',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {task.createdAt || task.created_at
                              ? dayjs(task.createdAt || task.created_at).format(
                                  'DD MMM YYYY',
                                )
                              : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.createdAt || task.created_at
                              ? dayjs(task.createdAt || task.created_at).format(
                                  'hh:mm A',
                                )
                              : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {assignedToArray.length > 0 ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                              }}
                            >
                              {assignedToArray
                                .slice(0, 2)
                                .map((assignee, idx) => (
                                  <Box
                                    key={`${assignee?.id || 'unassigned'}-${idx}`}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: '#06aee9',
                                      }}
                                    >
                                      {assignee?.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'U'}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {assignee?.fullName || 'Unassigned'}
                                    </Typography>
                                  </Box>
                                ))}
                              {assignedToArray.length > 2 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 5 }}
                                >
                                  +{assignedToArray.length - 2} more
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: '#06aee9',
                                }}
                              >
                                U
                              </Avatar>
                              <Typography variant="body2">
                                Unassigned
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={
                              task.taskName ||
                              task.task_name ||
                              task.description ||
                              ''
                            }
                          >
                            {task.taskName ||
                              task.task_name ||
                              task.description ||
                              '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {task.category ? (
                            <Chip
                              label={task.category}
                              size="small"
                              sx={{
                                bgcolor: '#f3e5f5',
                                color: '#7b1fa2',
                                fontWeight: 500,
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority || 'Medium'}
                            size="small"
                            sx={{
                              bgcolor: priorityColor.bg,
                              color: priorityColor.text,
                              border: `1px solid ${priorityColor.border}`,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.status || 'Pending'}
                            size="small"
                            sx={{
                              bgcolor: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: '#10b981',
                              }}
                            >
                              {createdBy.fullName?.charAt(0)?.toUpperCase() ||
                                'U'}
                            </Avatar>
                            <Typography variant="body2">
                              {createdBy.fullName || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, task)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 3,
                pt: 2,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of {pagination.total}{' '}
                tasks
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setEditTask(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }}
        task={editTask}
        staffList={staffList}
        createMutation={createTaskMutation}
        updateMutation={updateTaskMutation}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedTaskId(null)
        }}
        taskId={selectedTaskId}
        onEdit={(task) => {
          setEditTask(task)
          setCreateModalOpen(true)
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Export Date Range Modal */}
      <Dialog
        open={exportDateModalOpen}
        onClose={() => setExportDateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Export Tasks Report
            </Typography>
            <IconButton
              onClick={() => setExportDateModalOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                sx={{ mb: 0.5, display: 'block' }}
              >
                From Date
              </Typography>
              <DatePicker
                value={exportFromDate}
                onChange={(newValue) => setExportFromDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select from date',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                sx={{ mb: 0.5, display: 'block' }}
              >
                To Date
              </Typography>
              <DatePicker
                value={exportToDate}
                onChange={(newValue) => setExportToDate(newValue)}
                minDate={exportFromDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select to date',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.75rem"
              >
                Leave dates empty to export all tasks. Select date range to
                filter by creation date.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setExportDateModalOpen(false)}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportTasks}
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#06aee9',
              '&:hover': { bgcolor: '#0599d1' },
              textTransform: 'none',
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleActionClick('view')}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('edit')}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {selectedActionTask?.status === 'Completed' ||
        selectedActionTask?.status === 'Cancelled' ? (
          <MenuItem onClick={() => handleActionClick('reopen')}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
            Re-open Task
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleActionClick('updateStatus')}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
            Update Status
          </MenuItem>
        )}
        <MenuItem onClick={() => handleActionClick('updatePriority')}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Update Priority
        </MenuItem>
        {isAdmin && (
          <MenuItem
            onClick={() => handleActionClick('delete')}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {pendingAction === 'edit' && 'Add Comment for Edit'}
          {pendingAction === 'updateStatus' && 'Add Comment for Status Update'}
          {pendingAction === 'updatePriority' &&
            'Add Comment for Priority Update'}
          {pendingAction === 'delete' && 'Add Comment for Delete'}
          {pendingAction === 'reopen' &&
            'Add Comment to Re-open Task (Required)'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={
              pendingAction === 'reopen' ? 'Comment (Required)' : 'Comment'
            }
            fullWidth
            multiline
            rows={4}
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            placeholder={
              pendingAction === 'reopen'
                ? 'Enter a comment to reopen the task (required)...'
                : 'Enter a comment for this action...'
            }
            required={pendingAction === 'reopen'}
            error={pendingAction === 'reopen' && !actionComment.trim()}
            helperText={
              pendingAction === 'reopen' && !actionComment.trim()
                ? 'Comment is required to reopen the task'
                : ''
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCommentDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCommentSubmit}
            disabled={pendingAction === 'reopen' && !actionComment.trim()}
            sx={{ bgcolor: '#06aee9', '&:hover': { bgcolor: '#0599d1' } }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Selection Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false)
          setSelectedNewStatus('')
          setActionComment('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select New Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedNewStatus}
              onChange={(e) => setSelectedNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setStatusDialogOpen(false)
              setSelectedNewStatus('')
              setActionComment('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusConfirm}
            sx={{ bgcolor: '#06aee9', '&:hover': { bgcolor: '#0599d1' } }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Priority Selection Dialog */}
      <Dialog
        open={priorityDialogOpen}
        onClose={() => {
          setPriorityDialogOpen(false)
          setSelectedNewPriority('')
          setActionComment('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select New Priority</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={selectedNewPriority}
              onChange={(e) => setSelectedNewPriority(e.target.value)}
              label="Priority"
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPriorityDialogOpen(false)
              setSelectedNewPriority('')
              setActionComment('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePriorityConfirm}
            sx={{ bgcolor: '#06aee9', '&:hover': { bgcolor: '#0599d1' } }}
          >
            Update Priority
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TaskTracker
