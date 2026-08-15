import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material'
import {
  Phone,
  Videocam,
  Search,
  MoreVert,
  CallMade,
  CallReceived,
  CallMissed,
  CallEnd,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getCallHistory } from '@/constants/teamsApis'
import dayjs from 'dayjs'

function CallHistoryView() {
  const userDetails = useSelector((store) => store.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, answered, missed, rejected, ended
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCall, setSelectedCall] = useState(null)

  // Fetch call history
  const { data: callHistory, isLoading } = useQuery({
    queryKey: ['callHistory', userDetails?.accessToken],
    queryFn: async () => {
      const res = await getCallHistory(userDetails?.accessToken, 100, 0)
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled: !!userDetails?.accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Filter calls
  const filteredCalls = callHistory?.filter((call) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const callerName = call.caller?.fullName?.toLowerCase() || ''
      const receiverName = call.receiver?.fullName?.toLowerCase() || ''
      if (!callerName.includes(query) && !receiverName.includes(query)) {
        return false
      }
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'answered' && call.callStatus !== 'answered') {
        return false
      }
      if (filterStatus === 'missed' && call.callStatus !== 'missed') {
        return false
      }
      if (filterStatus === 'rejected' && call.callStatus !== 'rejected') {
        return false
      }
      if (filterStatus === 'ended' && call.callStatus !== 'ended') {
        return false
      }
    }

    return true
  })

  const getCallIcon = (call) => {
    if (call.callType === 'video') {
      return <Videocam />
    }
    return <Phone />
  }

  const getCallStatusIcon = (call) => {
    const isOutgoing = call.callerId === userDetails?.id
    const status = call.callStatus

    if (status === 'answered' || status === 'ended') {
      return isOutgoing ? (
        <CallMade className="text-green-500" />
      ) : (
        <CallReceived className="text-green-500" />
      )
    }
    if (status === 'missed' || status === 'rejected') {
      return <CallMissed className="text-red-500" />
    }
    return <CallEnd className="text-gray-500" />
  }

  const getCallStatusColor = (status) => {
    switch (status) {
      case 'answered':
      case 'ended':
        return 'success'
      case 'missed':
      case 'rejected':
        return 'error'
      case 'ringing':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getCallStatusLabel = (status) => {
    switch (status) {
      case 'answered':
        return 'Answered'
      case 'missed':
        return 'Missed'
      case 'rejected':
        return 'Rejected'
      case 'ended':
        return 'Ended'
      case 'ringing':
        return 'Ringing'
      case 'initiated':
        return 'Initiated'
      default:
        return status
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getOtherUser = (call) => {
    if (call.callerId === userDetails?.id) {
      return call.receiver
    }
    return call.caller
  }

  const isOutgoingCall = (call) => {
    return call.callerId === userDetails?.id
  }

  const handleMenuOpen = (event, call) => {
    setAnchorEl(event.currentTarget)
    setSelectedCall(call)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCall(null)
  }

  return (
    <Box>
      {/* Header with Search and Filters */}
      <Paper elevation={2} className="p-4 mb-4">
        <Box className="flex items-center gap-4 mb-4">
          <Typography variant="h6" className="flex-1 font-semibold">
            Call History
          </Typography>
          <Box className="flex gap-2">
            <Chip
              label="All"
              onClick={() => setFilterStatus('all')}
              color={filterStatus === 'all' ? 'primary' : 'default'}
              size="small"
            />
            <Chip
              label="Answered"
              onClick={() => setFilterStatus('answered')}
              color={filterStatus === 'answered' ? 'primary' : 'default'}
              size="small"
            />
            <Chip
              label="Missed"
              onClick={() => setFilterStatus('missed')}
              color={filterStatus === 'missed' ? 'primary' : 'default'}
              size="small"
            />
            <Chip
              label="Rejected"
              onClick={() => setFilterStatus('rejected')}
              color={filterStatus === 'rejected' ? 'primary' : 'default'}
              size="small"
            />
          </Box>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Search calls by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Call History List */}
      <Paper elevation={2}>
        {isLoading ? (
          <Box className="flex justify-center items-center py-12">
            <CircularProgress />
          </Box>
        ) : filteredCalls?.length === 0 ? (
          <Box className="text-center py-12">
            <Typography variant="body1" className="text-gray-500">
              {searchQuery || filterStatus !== 'all'
                ? 'No calls found matching your filters'
                : 'No call history yet'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredCalls.map((call, index) => {
              const otherUser = getOtherUser(call)
              const isOutgoing = isOutgoingCall(call)

              return (
                <React.Fragment key={call.id}>
                  <ListItem
                    className="hover:bg-gray-50 cursor-pointer"
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuOpen(e, call)}
                      >
                        <MoreVert />
                      </IconButton>
                    }
                  >
                    <Box className="flex items-center gap-3 w-full">
                      {/* Call Type Icon */}
                      <Avatar
                        className={`${
                          call.callStatus === 'answered' ||
                          call.callStatus === 'ended'
                            ? 'bg-green-500'
                            : call.callStatus === 'missed' ||
                                call.callStatus === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        }`}
                      >
                        {getCallIcon(call)}
                      </Avatar>

                      {/* Call Info */}
                      <Box className="flex-1 min-w-0">
                        <Box className="flex items-center gap-2 mb-1">
                          <Typography
                            variant="subtitle2"
                            className="font-semibold truncate"
                          >
                            {otherUser?.fullName || 'Unknown User'}
                          </Typography>
                          {getCallStatusIcon(call)}
                          <Chip
                            label={getCallStatusLabel(call.callStatus)}
                            color={getCallStatusColor(call.callStatus)}
                            size="small"
                          />
                        </Box>
                        <Box className="flex items-center gap-2">
                          <Typography
                            variant="caption"
                            className="text-gray-500"
                          >
                            {isOutgoing ? 'Outgoing' : 'Incoming'} •{' '}
                            {call.callType === 'voice' ? 'Voice' : 'Video'} Call
                          </Typography>
                          {call.duration && (
                            <>
                              <Typography
                                variant="caption"
                                className="text-gray-400"
                              >
                                •
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500"
                              >
                                {formatDuration(call.duration)}
                              </Typography>
                            </>
                          )}
                        </Box>
                        <Typography variant="caption" className="text-gray-400">
                          {dayjs(call.startTime || call.createdAt).format(
                            'MMM DD, YYYY • HH:mm',
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < filteredCalls.length - 1 && <Divider />}
                </React.Fragment>
              )
            })}
          </List>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedCall && (
          <>
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2">View Details</Typography>
            </MenuItem>
            {selectedCall.receiverId && (
              <MenuItem onClick={handleMenuClose}>
                <Typography variant="body2">Call Again</Typography>
              </MenuItem>
            )}
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2">Delete</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  )
}

export default CallHistoryView
