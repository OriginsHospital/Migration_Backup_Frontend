import React, { useState } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getInboxItems } from '@/constants/apis'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

function Inbox() {
  const user = useSelector((store) => store.user)
  const [activeTab, setActiveTab] = useState(0) // 0: Take Action, 1: Notifications, 2: Archive
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

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let items = alerts

    // Apply search filter
    if (searchTerm) {
      items = items.filter((item) =>
        item.alertMessage?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    items = [...items].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0)
      const dateB = new Date(b.created_at || b.createdAt || 0)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return items
  }, [searchTerm, sortOrder, alerts])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setSelectedItem(null)
    setSearchTerm('')
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
          <Tab label={`TAKE ACTION (${alerts.length})`} />
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
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: '#f3e5f5',
                color: '#7b1fa2',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>
                Alerts ({alerts.length})
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
                ALERTS
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
              filteredItems.map((item, index) => (
                <Box
                  key={item.id || index}
                  onClick={() => setSelectedItem(item)}
                  sx={{
                    p: 2,
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    bgcolor:
                      selectedItem?.id === item.id ? '#f3e5f5' : 'transparent',
                    '&:hover': {
                      bgcolor:
                        selectedItem?.id === item.id ? '#f3e5f5' : '#fafafa',
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
                    <Avatar sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}>
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
              ))
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
