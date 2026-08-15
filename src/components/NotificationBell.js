import React, { useRef, useState, useEffect } from 'react'
import {
  DoneAll,
  DoubleArrowOutlined,
  NotificationsOutlined,
  ReadMore,
  VisibilityOutlined,
} from '@mui/icons-material'
import { Box, Button, IconButton, Popover, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/constants/apis'

export default function NotificationBell() {
  const notificationAnchorEl = useRef()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const router = useRouter()
  const userDetails = useSelector((store) => store.user)
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useQuery({
      queryKey: ['notifications', userDetails?.accessToken],
      queryFn: async () => {
        if (!userDetails?.accessToken) return []
        try {
          const res = await getNotifications(userDetails.accessToken)
          if (res.status === 200 && res.data) {
            return res.data || []
          }
          return []
        } catch (error) {
          // Handle 404 or other errors gracefully
          console.warn('Failed to fetch notifications:', error)
          return []
        }
      },
      enabled: !!userDetails?.accessToken,
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: false, // Don't retry on 404
    })

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadNotificationsCount', userDetails?.accessToken],
    queryFn: async () => {
      if (!userDetails?.accessToken) return { count: 0 }
      try {
        const res = await getUnreadNotificationsCount(userDetails.accessToken)
        if (res.status === 200 && res.data) {
          return res.data || { count: 0 }
        }
        return { count: 0 }
      } catch (error) {
        // Handle 404 or other errors gracefully
        console.warn('Failed to fetch unread notifications count:', error)
        return { count: 0 }
      }
    },
    enabled: !!userDetails?.accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false, // Don't retry on 404
  })

  const notifications = notificationsData || []
  const unreadCount = unreadCountData?.count || 0

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      return await markNotificationAsRead(
        userDetails?.accessToken,
        notificationId,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['unreadNotificationsCount'])
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await markAllNotificationsAsRead(userDetails?.accessToken)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['unreadNotificationsCount'])
    },
  })
  const handleNotificationOpen = () => {
    setNotificationOpen(true)
  }

  const handleNotificationClose = () => {
    setNotificationOpen(false)
  }

  const handleNotificationClick = (notification) => {
    if (notification.route) {
      router.push(notification.route)
    }
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }
    handleNotificationClose()
  }

  const handleMarkAsRead = (event, notificationId) => {
    event.stopPropagation() // Prevent triggering the notification click
    markAsReadMutation.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  return (
    <div className="relative">
      <NotificationsOutlined
        className="cursor-pointer"
        onClick={handleNotificationOpen}
        ref={notificationAnchorEl}
      />
      {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length > 0 && notifications.filter(n => !n.isRead).length}
            </span> */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <Popover
        anchorEl={notificationAnchorEl.current}
        open={notificationOpen}
        onClose={handleNotificationClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              width: '320px',
              marginTop: '10px',
              maxHeight: '400px',
              overflow: 'auto',
            },
          },
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isLoading}
                className="text-xs capitalize"
              >
                Mark all as read
              </Button>
            )}
          </div>
          {isLoadingNotifications ? (
            <Typography variant="body2" className="text-center py-4">
              Loading notifications...
            </Typography>
          ) : notifications.length === 0 ? (
            <Typography
              variant="body2"
              className="text-center py-4 text-gray-500"
            >
              No notifications
            </Typography>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  p: 1,
                  mb: 0.5,
                  backgroundColor: notification.isRead
                    ? 'transparent'
                    : '#f0f9ff',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  border: '1px solid #e0e0e0',
                }}
              >
                <div className="flex justify-between">
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="cursor-pointer"
                    color="text.secondary"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.message}
                  </Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Typography>
                  {!notification.isRead ? (
                    <Button
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                      className="text-xs capitalize"
                    >
                      Mark as Read
                    </Button>
                  ) : (
                    <DoneAll fontSize="1rem" color="success" />
                  )}
                </div>
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </div>
  )
}
