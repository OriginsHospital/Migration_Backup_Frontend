import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Stack,
  Divider,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  Paper,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Comment as CommentIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { getInboxItems } from '@/constants/apis'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

function Inbox() {
  const user = useSelector((store) => store.user)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0) // 0: Take Action, 1: Notifications, 2: Archive
  const [selectedCategory, setSelectedCategory] = useState('alerts') // 'alerts', 'ticketComments', 'ticketAssignments'
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  // Fetch inbox items
  const { data, isLoading, error } = useQuery({
    queryKey: ['inboxItems', user?.accessToken, activeTab],
    queryFn: async () => {
      const response = await getInboxItems(user?.accessToken, {
        type: 'all',
        page: 1,
        limit: 100,
      })
      return response
    },
    enabled: !!user?.accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const inboxData = data?.data || {}
  const alerts = inboxData.alerts || []
  const ticketComments = inboxData.ticketComments || []
  const ticketAssignments = inboxData.ticketAssignments || []

  // Filter items based on selected category
  const getItemsForCategory = () => {
    if (selectedCategory === 'alerts') {
      return alerts
    } else if (selectedCategory === 'ticketComments') {
      return ticketComments
    } else if (selectedCategory === 'ticketAssignments') {
      return ticketAssignments
    }
    return []
  }

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let items = getItemsForCategory()

    // Apply search filter
    if (searchTerm) {
      items = items.filter((item) => {
        if (selectedCategory === 'alerts') {
          return item.alertMessage
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        } else if (selectedCategory === 'ticketComments') {
          const commenter = item.commenterDetails
            ? typeof item.commenterDetails === 'string'
              ? JSON.parse(item.commenterDetails)
              : item.commenterDetails
            : {}
          return (
            commenter.fullName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.comment_text
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        } else if (selectedCategory === 'ticketAssignments') {
          const creator = item.creatorDetails
            ? typeof item.creatorDetails === 'string'
              ? JSON.parse(item.creatorDetails)
              : item.creatorDetails
            : {}
          return (
            creator.fullName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        return true
      })
    }

    // Apply sorting
    items = [...items].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0)
      const dateB = new Date(b.created_at || b.createdAt || 0)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return items
  }, [
    selectedCategory,
    searchTerm,
    sortOrder,
    alerts,
    ticketComments,
    ticketAssignments,
  ])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setSelectedItem(null)
    setSearchTerm('')
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedItem(null)
    setSearchTerm('')
  }

  const handleViewTicket = (ticketId) => {
    router.push(`/ticketing?ticketId=${ticketId}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return { bg: '#fff3e0', text: '#e65100' }
      case 'IN_PROGRESS':
        return { bg: '#e3f2fd', text: '#1565c0' }
      case 'COMPLETED':
        return { bg: '#e8f5e9', text: '#2e7d32' }
      default:
        return { bg: '#f5f5f5', text: '#757575' }
    }
  }

  const getTimeAgo = (date) => {
    if (!date) return ''
    const now = dayjs()
    const then = dayjs(date)
    const days = now.diff(then, 'day')
    const months = now.diff(then, 'month')

    if (months > 0) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    } else {
      const hours = now.diff(then, 'hour')
      if (hours > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
      } else {
        const minutes = now.diff(then, 'minute')
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
      }
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f7fa',
      }}
    >
      {/* Top Tabs */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48,
              fontSize: '0.9375rem',
              px: 3,
            },
            '& .Mui-selected': {
              color: '#7b1fa2',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#7b1fa2',
            },
          }}
        >
          <Tab
            label={`TAKE ACTION (${alerts.length + ticketComments.length + ticketAssignments.length})`}
          />
          <Tab label="NOTIFICATIONS" />
          <Tab label="ARCHIVE" />
        </Tabs>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Categories */}
        <Box
          sx={{
            width: 280,
            bgcolor: 'white',
            borderRight: '1px solid #e0e0e0',
            p: 2,
            overflowY: 'auto',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              mb: 2,
              display: 'block',
            }}
          >
            {activeTab === 2 ? 'ARCHIVE - LAST 3 MONTHS' : 'PENDING TASKS'}
          </Typography>
          <Stack spacing={0.5}>
            <Box
              onClick={() => handleCategoryChange('alerts')}
              sx={{
                p: 1.5,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor:
                  selectedCategory === 'alerts' ? '#f3e5f5' : 'transparent',
                color: selectedCategory === 'alerts' ? '#7b1fa2' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                '&:hover': {
                  bgcolor:
                    selectedCategory === 'alerts' ? '#f3e5f5' : '#f5f5f5',
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20 }} />
              <Typography
                variant="body2"
                fontWeight={selectedCategory === 'alerts' ? 600 : 400}
              >
                Alerts ({alerts.length})
              </Typography>
            </Box>
            <Box
              onClick={() => handleCategoryChange('ticketComments')}
              sx={{
                p: 1.5,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor:
                  selectedCategory === 'ticketComments'
                    ? '#f3e5f5'
                    : 'transparent',
                color:
                  selectedCategory === 'ticketComments' ? '#7b1fa2' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                '&:hover': {
                  bgcolor:
                    selectedCategory === 'ticketComments'
                      ? '#f3e5f5'
                      : '#f5f5f5',
                },
              }}
            >
              <CommentIcon sx={{ fontSize: 20 }} />
              <Typography
                variant="body2"
                fontWeight={selectedCategory === 'ticketComments' ? 600 : 400}
              >
                Ticket Comments ({ticketComments.length})
              </Typography>
            </Box>
            <Box
              onClick={() => handleCategoryChange('ticketAssignments')}
              sx={{
                p: 1.5,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor:
                  selectedCategory === 'ticketAssignments'
                    ? '#f3e5f5'
                    : 'transparent',
                color:
                  selectedCategory === 'ticketAssignments'
                    ? '#7b1fa2'
                    : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                '&:hover': {
                  bgcolor:
                    selectedCategory === 'ticketAssignments'
                      ? '#f3e5f5'
                      : '#f5f5f5',
                },
              }}
            >
              <AssignmentIcon sx={{ fontSize: 20 }} />
              <Typography
                variant="body2"
                fontWeight={
                  selectedCategory === 'ticketAssignments' ? 600 : 400
                }
              >
                Ticket Assignments ({ticketAssignments.length})
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Middle Panel - List */}
        <Box
          sx={{
            width: 400,
            bgcolor: 'white',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* List Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Checkbox size="small" />
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ flex: 1, textTransform: 'uppercase' }}
              >
                {selectedCategory === 'alerts'
                  ? 'ALERTS'
                  : selectedCategory === 'ticketComments'
                    ? 'TICKET COMMENTS'
                    : 'TICKET ASSIGNMENTS'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <MenuItem value="newest">NEWEST</MenuItem>
                  <MenuItem value="oldest">OLDEST</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* List Items */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="error">
                  Failed to load items
                </Typography>
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No items found
                </Typography>
              </Box>
            ) : (
              filteredItems.map((item, index) => {
                if (selectedCategory === 'alerts') {
                  return (
                    <Box
                      key={item.id || index}
                      onClick={() => setSelectedItem(item)}
                      sx={{
                        p: 2,
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        bgcolor:
                          selectedItem?.id === item.id
                            ? '#f3e5f5'
                            : 'transparent',
                        '&:hover': {
                          bgcolor:
                            selectedItem?.id === item.id
                              ? '#f3e5f5'
                              : '#fafafa',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Checkbox size="small" sx={{ mt: 0.5 }} />
                        <Avatar
                          sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}
                        >
                          <NotificationsIcon />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {item.alertMessage}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {getTimeAgo(item.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )
                } else if (selectedCategory === 'ticketComments') {
                  const commenter = item.commenterDetails
                    ? typeof item.commenterDetails === 'string'
                      ? JSON.parse(item.commenterDetails)
                      : item.commenterDetails
                    : {}
                  const initials =
                    commenter.fullName
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'

                  return (
                    <Box
                      key={item.id || index}
                      onClick={() => setSelectedItem(item)}
                      sx={{
                        p: 2,
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        bgcolor:
                          selectedItem?.id === item.id
                            ? '#f3e5f5'
                            : 'transparent',
                        '&:hover': {
                          bgcolor:
                            selectedItem?.id === item.id
                              ? '#f3e5f5'
                              : '#fafafa',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Checkbox size="small" sx={{ mt: 0.5 }} />
                        <Avatar
                          sx={{
                            bgcolor: '#06aee9',
                            width: 40,
                            height: 40,
                            fontSize: '0.875rem',
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {commenter.fullName || 'Unknown User'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                            noWrap
                          >
                            {item.comment_text ||
                              item.commentText ||
                              'No comment text'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {getTimeAgo(item.created_at || item.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )
                } else if (selectedCategory === 'ticketAssignments') {
                  const creator = item.creatorDetails
                    ? typeof item.creatorDetails === 'string'
                      ? JSON.parse(item.creatorDetails)
                      : item.creatorDetails
                    : {}
                  const initials =
                    creator.fullName
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'

                  return (
                    <Box
                      key={item.id || index}
                      onClick={() => setSelectedItem(item)}
                      sx={{
                        p: 2,
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        bgcolor:
                          selectedItem?.id === item.id
                            ? '#f3e5f5'
                            : 'transparent',
                        '&:hover': {
                          bgcolor:
                            selectedItem?.id === item.id
                              ? '#f3e5f5'
                              : '#fafafa',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Checkbox size="small" sx={{ mt: 0.5 }} />
                        <Avatar
                          sx={{
                            bgcolor: '#9c27b0',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {item.message || 'New ticket assigned'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {item.ticket_code} • {getTimeAgo(item.created_at)}
                          </Typography>
                        </Box>
                        {!item.is_read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#7b1fa2',
                              mt: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )
                }
                return null
              })
            )}
          </Box>
        </Box>

        {/* Right Panel - Details */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {selectedItem ? (
            <>
              {selectedCategory === 'alerts' ? (
                <Box sx={{ p: 3, overflowY: 'auto' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#ff9800', width: 48, height: 48 }}>
                      <NotificationsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Alert
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created{' '}
                        {dayjs(selectedItem.created_at).format(
                          'DD MMM YYYY hh:mm A',
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedItem.alertMessage}
                  </Typography>
                  {selectedItem.created_at && (
                    <Typography variant="caption" color="text.secondary">
                      {getTimeAgo(selectedItem.created_at)}
                    </Typography>
                  )}
                </Box>
              ) : selectedCategory === 'ticketComments' ? (
                <Box sx={{ p: 3, overflowY: 'auto' }}>
                  {(() => {
                    const commenter = selectedItem.commenterDetails
                      ? typeof selectedItem.commenterDetails === 'string'
                        ? JSON.parse(selectedItem.commenterDetails)
                        : selectedItem.commenterDetails
                      : {}
                    const assignedTo = selectedItem.assignedToDetails
                      ? typeof selectedItem.assignedToDetails === 'string'
                        ? JSON.parse(selectedItem.assignedToDetails)
                        : selectedItem.assignedToDetails
                      : {}
                    const initials =
                      commenter.fullName
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'U'
                    const statusColor = getStatusColor(
                      selectedItem.ticket_status,
                    )

                    return (
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 3,
                          }}
                        >
                          <Avatar
                            sx={{ bgcolor: '#06aee9', width: 48, height: 48 }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {commenter.fullName || 'Unknown User'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Requested by{' '}
                              {commenter.fullName || 'Unknown User'} on{' '}
                              {dayjs(
                                selectedItem.created_at ||
                                  selectedItem.createdAt,
                              ).format('DD MMM YYYY hh:mm A')}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {/* Ticket Info Card */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 3,
                            bgcolor: '#f5f5f5',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography variant="h4" fontWeight={700}>
                              {selectedItem.ticket_code ||
                                `#${selectedItem.ticket_id}`}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Ticket Code
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ mb: 0.5 }}
                            >
                              {selectedItem.task_description ||
                                'No description'}
                            </Typography>
                            {selectedItem.ticket_status && (
                              <Chip
                                label={selectedItem.ticket_status}
                                size="small"
                                sx={{
                                  bgcolor: statusColor.bg,
                                  color: statusColor.text,
                                  height: 24,
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                          </Box>
                        </Paper>

                        {/* Comment */}
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <Avatar
                              sx={{ bgcolor: '#06aee9', width: 32, height: 32 }}
                            >
                              {initials}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {commenter.fullName || 'Unknown User'}{' '}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {dayjs(
                                    selectedItem.created_at ||
                                      selectedItem.createdAt,
                                  ).format('DD MMM YYYY hh:mm A')}
                                </Typography>
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ mt: 1, color: 'text.secondary' }}
                              >
                                {selectedItem.comment_text ||
                                  selectedItem.commentText ||
                                  'No comment text'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            mt: 'auto',
                            pt: 2,
                            borderTop: '1px solid #e0e0e0',
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() =>
                              handleViewTicket(selectedItem.ticket_id)
                            }
                            sx={{
                              bgcolor: '#4caf50',
                              '&:hover': { bgcolor: '#45a049' },
                            }}
                            startIcon={<ArrowForwardIcon />}
                          >
                            View Ticket
                          </Button>
                        </Box>
                      </>
                    )
                  })()}
                </Box>
              ) : selectedCategory === 'ticketAssignments' ? (
                <Box sx={{ p: 3, overflowY: 'auto' }}>
                  {(() => {
                    const creator = selectedItem.creatorDetails
                      ? typeof selectedItem.creatorDetails === 'string'
                        ? JSON.parse(selectedItem.creatorDetails)
                        : selectedItem.creatorDetails
                      : {}
                    const initials =
                      creator.fullName
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'U'
                    const statusColor = getStatusColor(
                      selectedItem.ticket_status,
                    )

                    return (
                      <>
                        {/* Header */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 3,
                          }}
                        >
                          <Avatar
                            sx={{ bgcolor: '#9c27b0', width: 48, height: 48 }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Ticket Assignment
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {dayjs(selectedItem.created_at).format(
                                'DD MMM YYYY hh:mm A',
                              )}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {/* Message */}
                        <Typography variant="body1" sx={{ mb: 3 }}>
                          {selectedItem.message ||
                            'You have been assigned a new ticket'}
                        </Typography>

                        {/* Ticket Details */}
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: '#f9fafb',
                            borderRadius: 1,
                            mb: 3,
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ mb: 0.5 }}
                              >
                                {selectedItem.ticket_code ||
                                  `#${selectedItem.ticket_id}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Ticket Code
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ mb: 0.5 }}
                              >
                                {selectedItem.task_description ||
                                  'No description'}
                              </Typography>
                              {selectedItem.ticket_status && (
                                <Chip
                                  label={selectedItem.ticket_status}
                                  size="small"
                                  sx={{
                                    bgcolor: statusColor.bg,
                                    color: statusColor.text,
                                    height: 24,
                                    fontSize: '0.75rem',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Paper>

                        {/* Action Button */}
                        <Button
                          variant="contained"
                          onClick={() =>
                            handleViewTicket(selectedItem.ticket_id)
                          }
                          sx={{
                            bgcolor: '#06aee9',
                            '&:hover': { bgcolor: '#0599d1' },
                          }}
                        >
                          View Ticket
                        </Button>
                      </>
                    )
                  })()}
                </Box>
              ) : null}
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body1">
                Select an item to view details
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Inbox
