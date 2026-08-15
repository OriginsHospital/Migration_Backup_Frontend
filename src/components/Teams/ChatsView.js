import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Badge,
  IconButton,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Send,
  AttachFile,
  Videocam,
  Phone,
  Search,
  Add,
  MoreVert,
  Close,
  PersonAdd,
  History,
  GroupAdd,
  Delete,
  Forward,
  CheckCircle,
  RadioButtonUnchecked,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  getUserChats,
  getChatMessages,
  sendMessage,
  createChat,
  initiateCall,
  updateCallStatus,
  deleteMessage,
  removeChatMember,
  addChatMembers,
  updateChat,
} from '@/constants/teamsApis'
import { getValidUsersList } from '@/constants/apis'
// Socket.io disabled - using REST API only
// import { io } from 'socket.io-client'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

function ChatsView() {
  const userDetails = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [selectedChat, setSelectedChat] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  // Socket.io disabled
  // const [socket, setSocket] = useState(null)
  const messagesEndRef = useRef(null)
  const [openNewChatDialog, setOpenNewChatDialog] = useState(false)
  const [openNewGroupDialog, setOpenNewGroupDialog] = useState(false)
  const [searchUserQuery, setSearchUserQuery] = useState('')
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    selectedUsers: [],
  })

  // Message selection state
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const longPressTimerRef = useRef(null)

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuChat, setMenuChat] = useState(null)

  // Dialog state
  const [openChatInfoDialog, setOpenChatInfoDialog] = useState(false)
  const [openGroupSettingsDialog, setOpenGroupSettingsDialog] = useState(false)
  const [openClearChatDialog, setOpenClearChatDialog] = useState(false)
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false)
  const [mutedChats, setMutedChats] = useState(new Set())
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([])
  const [searchMemberQuery, setSearchMemberQuery] = useState('')
  const [isEditingGroupName, setIsEditingGroupName] = useState(false)
  const [editingGroupName, setEditingGroupName] = useState('')

  // WebRTC refs
  const localAudioRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const pendingSignalsRef = useRef([])
  const handleCallSignalRef = useRef(null)

  // Fetch user's chats
  const { data: chatsData, isLoading: isLoadingChats } = useQuery({
    queryKey: ['userChats', userDetails?.accessToken],
    queryFn: async () => {
      const res = await getUserChats(userDetails?.accessToken)
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled: !!userDetails?.accessToken,
    refetchInterval: 10000,
  })

  // Fetch messages for selected chat
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chatMessages', selectedChat?.id, userDetails?.accessToken],
    queryFn: async () => {
      if (!selectedChat) return []
      const res = await getChatMessages(
        userDetails?.accessToken,
        selectedChat.id,
      )
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled: !!selectedChat && !!userDetails?.accessToken,
    refetchInterval: (query) => {
      // Only poll when chat is selected and not loading
      return query.state.data && selectedChat?.id ? 3000 : false
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is in background
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  })

  // Fetch all users for new chat
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['allUsers', userDetails?.accessToken],
    queryFn: async () => {
      const res = await getValidUsersList(userDetails?.accessToken)
      if (res.status === 200) {
        return res.data || []
      }
      return []
    },
    enabled:
      (openNewChatDialog || openNewGroupDialog || openAddMemberDialog) &&
      !!userDetails?.accessToken,
  })

  // Filter users for add member dialog (exclude existing members)
  const availableUsersForGroup = allUsers?.filter((user) => {
    if (!selectedChat || selectedChat.chatType !== 'group') return false
    // Exclude users who are already members
    const isMember = selectedChat.members?.some(
      (member) => member.user?.id === user.id,
    )
    return !isMember
  })

  // Filter available users based on search query for add member
  const filteredAvailableUsers = availableUsersForGroup?.filter((user) => {
    if (!searchMemberQuery.trim()) return true
    const query = searchMemberQuery.toLowerCase()
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  })

  // Filter users based on search query
  const filteredUsers = allUsers?.filter((user) => {
    if (!searchUserQuery.trim()) return true
    const query = searchUserQuery.toLowerCase()
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  })

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await createChat(userDetails?.accessToken, payload)
      // If response is not ok, throw an error
      if (!response.ok && response.status !== 201 && response.status !== 200) {
        throw new Error(response.message || 'Failed to create chat')
      }
      return response
    },
    onSuccess: async (res) => {
      // Check both HTTP status and response body status
      const isSuccess =
        res.ok || res.status === 201 || (res.status === 200 && res.data)

      if (isSuccess) {
        // Close all dialogs
        setOpenNewChatDialog(false)
        setOpenNewGroupDialog(false)
        setSearchUserQuery('')

        // Format the created chat to match the expected structure
        const createdChatData = res.data || res

        console.log('Chat created successfully:', createdChatData)

        // For direct chats, extract otherUser from members
        let formattedChat = { ...createdChatData }
        if (
          createdChatData.chatType === 'direct' &&
          createdChatData.members?.length > 0
        ) {
          // Find the other user (not the current user)
          const otherMember = createdChatData.members.find(
            (member) => member.user?.id !== userDetails?.id,
          )
          formattedChat.otherUser =
            otherMember?.user || createdChatData.members[0]?.user || null
          formattedChat.name = formattedChat.otherUser?.fullName || 'Unknown'
        } else if (createdChatData.chatType === 'group') {
          // For group chats, ensure name is set
          formattedChat.name = createdChatData.name || 'Group Chat'
        }
        formattedChat.unreadCount = 0

        // Reset group form data if it was a group chat
        if (createdChatData.chatType === 'group') {
          setGroupFormData({
            name: '',
            description: '',
            selectedUsers: [],
          })
        }

        // Set the chat as selected to open the interface
        setSelectedChat(formattedChat)

        // Invalidate and refetch chats list to update the sidebar
        queryClient.invalidateQueries(['userChats'])

        const successMessage =
          createdChatData.chatType === 'group'
            ? 'Group chat created successfully'
            : 'Chat opened successfully'
        toast.success(successMessage)
      } else {
        console.warn('Unexpected response status:', res.status, res)
        toast.error('Unexpected response from server')
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create chat. Please try again.'
      toast.error(errorMessage)
      console.error('Error creating chat:', error)
    },
  })

  // Socket.io call signal handler disabled
  // const handleCallSignal = async (data, socketInstance = socket) => {
  //   Socket.io WebRTC signaling code removed
  // }
  // handleCallSignalRef.current = handleCallSignal

  // Socket.io connection disabled - using REST API polling instead
  // useEffect(() => {
  //   Socket.io code removed
  // }, [userDetails?.accessToken])

  // Socket.io room joining disabled
  // useEffect(() => {
  //   if (socket && selectedChat) {
  //     socket.emit('join_chat', selectedChat.id)
  //     return () => {
  //       socket.emit('leave_chat', selectedChat.id)
  //     }
  //   }
  // }, [socket, selectedChat])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesData && messagesData.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messagesData])

  // Refetch messages when chat is selected
  useEffect(() => {
    if (selectedChat?.id) {
      // Refetch messages immediately when chat is selected
      refetchMessages()
    }
  }, [selectedChat?.id, refetchMessages])

  // Note: Polling is handled by refetchInterval in useQuery above
  // This ensures messages are automatically refreshed every 3 seconds

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || !selectedChat) return

    try {
      const payload = {
        message: messageText || '',
        messageType: selectedFile ? 'file' : 'text',
      }

      if (selectedFile) {
        payload.fileName = selectedFile.name
        payload.fileSize = selectedFile.size
      }

      const res = await sendMessage(
        userDetails?.accessToken,
        selectedChat.id,
        payload,
        selectedFile, // Pass file as 4th parameter
      )

      if (res.status === 201) {
        // Socket.io disabled - just refresh queries
        setMessageText('')
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        queryClient.invalidateQueries(['chatMessages', selectedChat])
        queryClient.invalidateQueries(['userChats'])
        toast.success('Message sent successfully')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (e.g., max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChatClick = (chat) => {
    setSelectedChat(chat)
    // Clear selection when switching chats
    setSelectedMessages(new Set())
    setIsSelectionMode(false)
  }

  // Long press handler for message selection
  const handleMessageLongPress = (messageId) => {
    console.log('Long press detected for message:', messageId)
    setIsSelectionMode(true)
    setSelectedMessages((prev) => {
      const newSet = new Set(prev)
      newSet.add(messageId) // Always add on long press
      console.log('Selected messages after long press:', Array.from(newSet))
      return newSet
    })
  }

  // Click handler for message selection
  const handleMessageClick = (messageId, e) => {
    if (!isSelectionMode) {
      return // Only handle clicks when in selection mode
    }

    e.preventDefault()
    e.stopPropagation()

    setSelectedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
        console.log('Deselected message:', messageId)
      } else {
        newSet.add(messageId)
        console.log('Selected message:', messageId)
      }
      console.log('Total selected messages:', Array.from(newSet))
      if (newSet.size === 0) {
        setIsSelectionMode(false)
        console.log('Selection mode disabled - no messages selected')
      }
      return newSet
    })
  }

  // Start long press timer
  const handleMessageMouseDown = (messageId, e) => {
    // Don't interfere if clicking on the checkbox
    if (e.target.closest('button') || e.target.closest('[role="button"]')) {
      return
    }

    if (isSelectionMode) {
      // In selection mode, don't start long press timer
      // The onClick handler will handle the selection
      return
    }

    longPressTimerRef.current = setTimeout(() => {
      handleMessageLongPress(messageId)
    }, 500) // 500ms for long press
  }

  // Cancel long press timer
  const handleMessageMouseUp = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Touch handlers for mobile
  const handleMessageTouchStart = (messageId, e) => {
    // Don't interfere if clicking on the checkbox
    if (e.target.closest('button') || e.target.closest('[role="button"]')) {
      return
    }

    if (isSelectionMode) {
      // In selection mode, don't start long press timer
      // The onClick handler will handle the selection
      return
    }

    longPressTimerRef.current = setTimeout(() => {
      handleMessageLongPress(messageId)
    }, 500)
  }

  const handleMessageTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedMessages(new Set())
    setIsSelectionMode(false)
  }

  // Delete messages
  const handleDeleteMessages = () => {
    console.log(
      'Delete button clicked. Selected messages:',
      Array.from(selectedMessages),
    )
    if (selectedMessages.size === 0) {
      toast.warning('No messages selected')
      return
    }
    setOpenDeleteDialog(true)
  }

  // Delete mutation
  const deleteMessagesMutation = useMutation({
    mutationFn: async ({ messageIds, deleteForEveryone }) => {
      const messageIdsArray = Array.from(messageIds)
      console.log(
        'Deleting messages:',
        messageIdsArray,
        'deleteForEveryone:',
        deleteForEveryone,
      )

      if (messageIdsArray.length === 0) {
        throw new Error('No messages selected')
      }

      const deletePromises = messageIdsArray.map(async (messageId) => {
        console.log('Deleting message:', messageId)
        const response = await deleteMessage(
          userDetails?.accessToken,
          selectedChat.id,
          messageId,
          deleteForEveryone,
        )
        // Check if response is successful
        if (!response.ok && response.status !== 200) {
          console.error('Failed to delete message:', messageId, response)
          throw new Error(response.message || 'Failed to delete message')
        }
        console.log('Message deleted successfully:', messageId)
        return response
      })
      const results = await Promise.all(deletePromises)
      console.log('All messages deleted:', results)
      return results
    },
    onSuccess: async () => {
      // Invalidate and refetch messages immediately
      queryClient.invalidateQueries(['chatMessages', selectedChat?.id])
      await refetchMessages()
      queryClient.invalidateQueries(['userChats'])
      await queryClient.refetchQueries(['userChats'])
      handleClearSelection()
      setOpenDeleteDialog(false)
      toast.success('Messages deleted successfully')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete messages')
      console.error('Error deleting messages:', error)
    },
  })

  // Forward messages (placeholder)
  const handleForwardMessages = () => {
    toast.info('Forward feature coming soon')
    // TODO: Implement forward functionality
  }

  const getChatDisplayName = (chat) => {
    if (chat.chatType === 'direct' && chat.otherUser) {
      return chat.otherUser.fullName || 'Unknown'
    }
    return chat.name || 'Group Chat'
  }

  const getChatAvatar = (chat) => {
    if (chat.chatType === 'direct' && chat.otherUser) {
      return chat.otherUser.fullName?.charAt(0) || '?'
    }
    return chat.name?.charAt(0) || '?'
  }

  const handleCreateDirectChat = (userId) => {
    createChatMutation.mutate({
      chatType: 'direct',
      memberIds: [userId],
    })
  }

  const handleOpenNewChat = () => {
    setOpenNewChatDialog(true)
    setSearchUserQuery('')
  }

  const handleOpenNewGroup = () => {
    setOpenNewGroupDialog(true)
    setGroupFormData({
      name: '',
      description: '',
      selectedUsers: [],
    })
  }

  const handleCreateGroupChat = () => {
    if (!groupFormData.name.trim()) {
      toast.error('Please enter a group name')
      return
    }
    if (groupFormData.selectedUsers.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    const memberIds = groupFormData.selectedUsers.map((user) => user.id)

    createChatMutation.mutate({
      chatType: 'group',
      name: groupFormData.name.trim(),
      description: groupFormData.description || null,
      memberIds: memberIds,
    })
  }

  // WebRTC helper functions
  const cleanupWebRTC = () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.destroy()
        peerConnectionRef.current = null
      }

      // Clear audio elements
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = null
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }
    } catch (error) {
      console.error('Error cleaning up WebRTC:', error)
    }
  }

  const initializeWebRTC = async (otherUserId, callId, isInitiator) => {
    try {
      // Get user media (audio only for voice calls)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      localStreamRef.current = stream

      // Set local audio stream
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
        localAudioRef.current.volume = 0 // Mute local audio to prevent feedback
      }

      // Create RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      }

      const PeerConnection =
        window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection

      if (!PeerConnection) {
        throw new Error('WebRTC is not supported in this browser')
      }

      const peerConnection = new PeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream:', event)
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates (Socket.io disabled)
      peerConnection.onicecandidate = (event) => {
        // Socket.io disabled - ICE candidates require socket.io
        console.log(
          'ICE candidate generated (socket.io disabled):',
          event.candidate,
        )
        /*
        if (event.candidate && socket) {
          socket.emit('call_signal', {
            toUserId: otherUserId,
            signal: {
              type: 'candidate',
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
            },
            callId: callId,
          })
        }
        */
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState)
        if (
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'disconnected'
        ) {
          toast.error('Call connection lost')
          cleanupWebRTC()
        }
      }

      if (isInitiator) {
        // Create offer
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        // Socket.io disabled - WebRTC signaling requires socket.io
        console.log('WebRTC offer created (socket.io disabled)')
        /*
        if (socket) {
          socket.emit('call_signal', {
            toUserId: otherUserId,
            signal: offer,
            callId: callId,
          })
        }
        */
      } else {
        // Receiver: Process any pending signals (like offer from caller)
        if (pendingSignalsRef.current.length > 0) {
          console.log(
            'Processing pending signals:',
            pendingSignalsRef.current.length,
          )
          const signals = [...pendingSignalsRef.current]
          pendingSignalsRef.current = []

          for (const signalData of signals) {
            await handleCallSignal(signalData)
          }
        }
      }
    } catch (error) {
      console.error('Error initializing WebRTC:', error)
      toast.error(
        'Failed to start call: ' +
          (error.message || 'Please allow microphone access'),
      )
      cleanupWebRTC()
    }
  }

  const handleInitiateVoiceCall = async () => {
    if (!selectedChat) {
      toast.error('Please select a chat first.')
      return
    }

    // Socket.io disabled - voice calls require WebRTC which needs socket.io
    toast.info(
      'Voice calls are currently disabled. Socket.io server is not configured.',
    )
    return

    // Original socket.io code below (disabled)
    /*
    if (!socket) {
      toast.error('Socket connection not available. Please refresh the page.')
      return
    }

    if (!socket.connected) {
      toast.error('Not connected to server. Please check your connection.')
      return
    }
    */

    try {
      // Get receiver ID for direct chat
      let receiverId = null
      if (selectedChat.chatType === 'direct' && selectedChat.otherUser) {
        receiverId = selectedChat.otherUser.id
      } else if (selectedChat.chatType === 'direct' && selectedChat.members) {
        // Fallback: extract from members if otherUser is not available
        const otherMember = selectedChat.members.find(
          (member) => member.user?.id !== userDetails?.id,
        )
        receiverId = otherMember?.user?.id || null
      }

      if (!receiverId) {
        toast.error(
          'Unable to determine recipient. Please select a direct chat.',
        )
        return
      }

      console.log('Initiating call:', {
        receiverId,
        chatId: selectedChat.id,
        callerId: userDetails?.id,
      })

      const res = await initiateCall(userDetails?.accessToken, {
        callType: 'voice',
        chatId: selectedChat.id,
        receiverId: receiverId,
      })

      if (res.status === 201) {
        const callData = res.data
        setActiveCall(callData)

        // Socket.io disabled - WebRTC calls require socket.io
        toast.info(
          'Call initiated. Note: Real-time call features require Socket.io server.',
        )

        // Original socket.io code below (disabled)
        /*
        // Initialize WebRTC as caller
        await initializeWebRTC(receiverId, callData.id, true)

        // Emit socket event to initiate call
        socket.emit('initiate_call', {
          receiverId: receiverId,
          callType: 'voice',
          chatId: selectedChat.id,
          callId: callData.id,
        })
        */
      } else {
        toast.error(res.message || 'Failed to initiate call')
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      toast.error(
        'Failed to initiate call: ' + (error.message || 'Unknown error'),
      )
      cleanupWebRTC()
    }
  }

  const handleAcceptCall = async () => {
    if (!incomingCall) return

    // Socket.io disabled - calls require socket.io for WebRTC
    toast.info(
      'Call acceptance requires Socket.io server. Please use REST API only.',
    )
    return

    // Original socket.io code below (disabled)
    /*
    try {
      await updateCallStatus(userDetails?.accessToken, incomingCall.callId, {
        callStatus: 'answered',
      })

      await initializeWebRTC(incomingCall.callerId, incomingCall.callId, false)

      socket.emit('accept_call', {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
      })

      setActiveCall(incomingCall)
      setIncomingCall(null)
      toast.success('Call accepted')
    } catch (error) {
      console.error('Error accepting call:', error)
      toast.error('Failed to accept call')
    }
    */
  }

  const handleRejectCall = async () => {
    if (!incomingCall) return

    // Update call status in backend (REST API only)
    try {
      await updateCallStatus(userDetails?.accessToken, incomingCall.callId, {
        callStatus: 'rejected',
      })
      setIncomingCall(null)
      toast.info('Call rejected')
    } catch (error) {
      console.error('Error updating call status:', error)
      toast.error('Failed to reject call')
    }

    // Socket.io emit removed
    // socket.emit('reject_call', { ... })
  }

  const handleEndCall = async () => {
    if (!activeCall) return

    // Clean up WebRTC
    cleanupWebRTC()

    // Update call status in backend (REST API only)
    try {
      const callId = activeCall.id || activeCall.callId
      if (callId) {
        await updateCallStatus(userDetails?.accessToken, callId, {
          callStatus: 'ended',
        })
      }
      setActiveCall(null)
      toast.info('Call ended')
    } catch (error) {
      console.error('Error updating call status:', error)
      toast.error('Failed to end call')
    }

    // Socket.io emit removed
    // socket.emit('end_call', { ... })
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
    setMenuChat(selectedChat)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuChat(null)
  }

  const handleViewChatInfo = () => {
    handleMenuClose()
    setOpenChatInfoDialog(true)
  }

  const handleGroupSettings = () => {
    handleMenuClose()
    setOpenGroupSettingsDialog(true)
  }

  const handleClearChat = () => {
    handleMenuClose()
    setOpenClearChatDialog(true)
  }

  const handleMuteNotifications = () => {
    if (!menuChat) return
    const chatId = menuChat.id
    const newMutedChats = new Set(mutedChats)
    if (newMutedChats.has(chatId)) {
      newMutedChats.delete(chatId)
      toast.success('Notifications unmuted')
    } else {
      newMutedChats.add(chatId)
      toast.success('Notifications muted')
    }
    setMutedChats(newMutedChats)
    handleMenuClose()
  }

  // Clear all messages in chat
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChat || !messagesData || messagesData.length === 0) {
        throw new Error('No messages to clear')
      }

      const messageIds = messagesData.map((msg) => msg.id)
      const deletePromises = messageIds.map(async (messageId) => {
        const response = await deleteMessage(
          userDetails?.accessToken,
          selectedChat.id,
          messageId,
          false, // Delete for me only
        )
        if (!response.ok && response.status !== 200) {
          throw new Error(response.message || 'Failed to delete message')
        }
        return response
      })
      await Promise.all(deletePromises)
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['chatMessages', selectedChat?.id])
      await refetchMessages()
      queryClient.invalidateQueries(['userChats'])
      await queryClient.refetchQueries(['userChats'])
      setOpenClearChatDialog(false)
      toast.success('Chat cleared successfully')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to clear chat')
      console.error('Error clearing chat:', error)
    },
  })

  // Add members to group mutation
  const addMembersMutation = useMutation({
    mutationFn: async (memberIds) => {
      if (!selectedChat || !memberIds || memberIds.length === 0) {
        throw new Error('No members selected')
      }
      const res = await addChatMembers(
        userDetails?.accessToken,
        selectedChat.id,
        memberIds,
      )
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(res.message || 'Failed to add members')
      }
      return res
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['userChats'])
      await queryClient.refetchQueries(['userChats'])
      setSelectedMembersToAdd([])
      setSearchMemberQuery('')
      setOpenAddMemberDialog(false)
      toast.success('Members added successfully')
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to add members')
      console.error('Error adding members:', error)
    },
  })

  const handleAddMembers = () => {
    if (selectedMembersToAdd.length === 0) {
      toast.error('Please select at least one member to add')
      return
    }
    const memberIds = selectedMembersToAdd.map((user) => user.id)
    addMembersMutation.mutate(memberIds)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC()
    }
  }, [])

  return (
    <Box className="flex h-[calc(100vh-200px)]">
      {/* Chat List Sidebar */}
      <Paper
        elevation={2}
        className="w-80 flex flex-col border-r border-gray-200"
      >
        <Box className="p-4 border-b border-gray-200">
          <Box className="flex items-center gap-2 mb-3">
            <Typography variant="h6" className="flex-1 font-semibold">
              Chats
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<GroupAdd />}
              onClick={handleOpenNewGroup}
              className="shrink-0"
            >
              New Group
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PersonAdd />}
              onClick={handleOpenNewChat}
              className="shrink-0"
            >
              New Chat
            </Button>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <List className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <Typography className="p-4 text-center text-gray-500">
              Loading chats...
            </Typography>
          ) : chatsData?.length === 0 ? (
            <Typography className="p-4 text-center text-gray-500">
              No chats found. Start a new conversation!
            </Typography>
          ) : (
            chatsData?.map((chat) => (
              <ListItem
                key={chat.id}
                button
                onClick={() => handleChatClick(chat)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === chat.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : ''
                }`}
              >
                <Badge
                  badgeContent={chat.unreadCount || 0}
                  color="error"
                  overlap="circular"
                  className="mr-3"
                  invisible={!chat.unreadCount || chat.unreadCount === 0}
                >
                  <Avatar className="bg-blue-500">{getChatAvatar(chat)}</Avatar>
                </Badge>
                <Box className="flex-1 min-w-0">
                  <Box className="flex items-center justify-between mb-1">
                    <Typography
                      variant="subtitle2"
                      className="font-semibold truncate"
                    >
                      {getChatDisplayName(chat)}
                    </Typography>
                    {chat.messages?.[0] && (
                      <Typography
                        variant="caption"
                        className="text-gray-400 text-xs ml-2 shrink-0"
                      >
                        {dayjs(chat.messages[0].createdAt).format('HH:mm')}
                      </Typography>
                    )}
                  </Box>
                  {chat.messages?.[0] ? (
                    <Typography
                      variant="caption"
                      className="text-gray-500 truncate block flex items-center gap-1"
                    >
                      {chat.messages[0].fileUrl && (
                        <AttachFile fontSize="inherit" />
                      )}
                      {chat.messages[0].fileUrl
                        ? chat.messages[0].fileName || 'File attachment'
                        : chat.messages[0].message}
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      className="text-gray-400 italic"
                    >
                      No messages yet
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Chat Window */}
      <Box className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <Paper
              elevation={1}
              className="p-4 flex items-center justify-between border-b border-gray-200"
            >
              {isSelectionMode ? (
                <Box className="flex items-center justify-between w-full">
                  <Box className="flex items-center gap-3">
                    <IconButton onClick={handleClearSelection} size="small">
                      <Close />
                    </IconButton>
                    <Typography variant="h6">
                      {selectedMessages.size} selected
                    </Typography>
                  </Box>
                  <Box className="flex items-center gap-2">
                    <IconButton
                      color="primary"
                      onClick={handleDeleteMessages}
                      disabled={selectedMessages.size === 0}
                      title="Delete"
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={handleForwardMessages}
                      disabled={selectedMessages.size === 0}
                      title="Forward"
                    >
                      <Forward />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box className="flex items-center gap-3">
                    <Avatar>{getChatAvatar(selectedChat)}</Avatar>
                    <Box>
                      <Typography variant="h6">
                        {getChatDisplayName(selectedChat)}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {selectedChat.chatType === 'direct'
                          ? 'Direct chat'
                          : selectedChat.chatType}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={handleInitiateVoiceCall}
                      disabled={activeCall !== null}
                      title="Voice Call"
                    >
                      <Phone />
                    </IconButton>
                    <IconButton size="small" color="primary" title="Video Call">
                      <Videocam />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleMenuOpen}
                      title="More options"
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </>
              )}
            </Paper>

            {/* Messages Area */}
            <Box className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {isLoadingMessages ? (
                <Typography className="text-center text-gray-500">
                  Loading messages...
                </Typography>
              ) : messagesData?.length === 0 ? (
                <Typography className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </Typography>
              ) : (
                messagesData?.map((message) => {
                  const isOwnMessage = message.senderId === userDetails?.id
                  const isSelected = selectedMessages.has(message.id)
                  return (
                    <Box
                      key={message.id}
                      className={`mb-3 flex ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      } ${isSelectionMode ? 'cursor-pointer' : ''} ${
                        isSelected ? 'ring-2 ring-blue-400 rounded-lg p-1' : ''
                      }`}
                      onClick={(e) => {
                        // Don't handle if clicking on checkbox or other interactive elements
                        if (
                          e.target.closest('button') ||
                          e.target.closest('[role="button"]')
                        ) {
                          return
                        }
                        if (isSelectionMode) {
                          e.preventDefault()
                          e.stopPropagation()
                          handleMessageClick(message.id, e)
                        }
                      }}
                      onMouseDown={(e) => handleMessageMouseDown(message.id, e)}
                      onMouseUp={handleMessageMouseUp}
                      onMouseLeave={handleMessageMouseUp}
                      onTouchStart={(e) =>
                        handleMessageTouchStart(message.id, e)
                      }
                      onTouchEnd={handleMessageTouchEnd}
                      style={{
                        userSelect: isSelectionMode ? 'none' : 'auto',
                        WebkitUserSelect: isSelectionMode ? 'none' : 'auto',
                      }}
                    >
                      <Box
                        className={`flex items-end gap-2 max-w-md ${isOwnMessage ? 'flex-row-reverse' : ''} ${
                          isSelected ? 'opacity-70' : ''
                        }`}
                      >
                        {isSelectionMode && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Toggle selection when checkbox is clicked
                              setSelectedMessages((prev) => {
                                const newSet = new Set(prev)
                                if (newSet.has(message.id)) {
                                  newSet.delete(message.id)
                                } else {
                                  newSet.add(message.id)
                                }
                                console.log(
                                  'Selected messages after checkbox click:',
                                  Array.from(newSet),
                                )
                                if (newSet.size === 0) {
                                  setIsSelectionMode(false)
                                }
                                return newSet
                              })
                            }}
                            className="self-center"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            {isSelected ? (
                              <CheckCircle color="primary" />
                            ) : (
                              <RadioButtonUnchecked />
                            )}
                          </IconButton>
                        )}
                        {!isOwnMessage && !isSelectionMode && (
                          <Avatar className="w-8 h-8 bg-gray-400 text-sm">
                            {message.sender?.fullName
                              ?.charAt(0)
                              ?.toUpperCase() || '?'}
                          </Avatar>
                        )}
                        <Box
                          className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                        >
                          {!isOwnMessage && !isSelectionMode && (
                            <Typography
                              variant="caption"
                              className="text-gray-600 mb-1 px-1"
                            >
                              {message.sender?.fullName || 'Unknown'}
                            </Typography>
                          )}
                          <Paper
                            elevation={isSelected ? 3 : 1}
                            className={`px-4 py-2 rounded-2xl transition-all ${
                              isSelected ? 'ring-2 ring-blue-500' : ''
                            } ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm'
                            }`}
                          >
                            {message.isDeleted ? (
                              <Typography
                                variant="body2"
                                className="italic text-gray-400"
                              >
                                This message was deleted
                              </Typography>
                            ) : (
                              <>
                                {message.fileUrl && (
                                  <Box className="mb-2">
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<AttachFile />}
                                      href={message.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`${
                                        isOwnMessage
                                          ? 'text-white border-white hover:bg-blue-600'
                                          : 'text-gray-800 border-gray-300 hover:bg-gray-100'
                                      }`}
                                    >
                                      {message.fileName || 'Download File'}
                                      {message.fileSize && (
                                        <Typography
                                          variant="caption"
                                          className="ml-2"
                                        >
                                          (
                                          {(message.fileSize / 1024).toFixed(1)}{' '}
                                          KB)
                                        </Typography>
                                      )}
                                    </Button>
                                  </Box>
                                )}
                                {message.message && (
                                  <Typography
                                    variant="body2"
                                    className="whitespace-pre-wrap break-words"
                                  >
                                    {message.message}
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  className={`block mt-1 ${
                                    isOwnMessage
                                      ? 'text-blue-100'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {dayjs(message.createdAt).format('HH:mm')}
                                  {message.isEdited && (
                                    <span className="ml-1">(edited)</span>
                                  )}
                                </Typography>
                              </>
                            )}
                          </Paper>
                        </Box>
                      </Box>
                    </Box>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper elevation={2} className="p-4 border-t border-gray-200">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="*/*"
              />

              {/* Selected file display */}
              {selectedFile && (
                <Box className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                  <Box className="flex items-center gap-2 flex-1 min-w-0">
                    <AttachFile className="text-blue-600" />
                    <Typography
                      variant="body2"
                      className="text-blue-800 truncate"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" className="text-blue-600">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={handleRemoveFile}
                    className="text-blue-600"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <Box className="flex items-center gap-2">
                <IconButton
                  size="small"
                  onClick={handleAttachmentClick}
                  color="primary"
                >
                  <AttachFile />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  multiline
                  maxRows={4}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && !selectedFile}
                  startIcon={<Send />}
                >
                  Send
                </Button>
              </Box>
            </Paper>
          </>
        ) : (
          <Box className="flex-1 flex items-center justify-center bg-gray-50">
            <Typography variant="h6" className="text-gray-400">
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* New Chat Dialog - Select User */}
      <Dialog
        open={openNewChatDialog}
        onClose={() => {
          setOpenNewChatDialog(false)
          setSearchUserQuery('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="h6">Start New Chat</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setOpenNewChatDialog(false)
              setSearchUserQuery('')
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users by name or email..."
            value={searchUserQuery}
            onChange={(e) => setSearchUserQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            className="mb-4"
          />
          <Box className="max-h-96 overflow-y-auto">
            {isLoadingUsers ? (
              <Box className="flex justify-center items-center py-8">
                <CircularProgress size={32} />
              </Box>
            ) : filteredUsers?.length === 0 ? (
              <Typography className="text-center text-gray-500 py-8">
                {searchUserQuery
                  ? 'No users found matching your search'
                  : 'No users available'}
              </Typography>
            ) : (
              <List>
                {filteredUsers
                  ?.filter((user) => user.id !== userDetails?.id)
                  .map((user) => (
                    <ListItem
                      key={user.id}
                      button
                      onClick={() => handleCreateDirectChat(user.id)}
                      className="hover:bg-gray-50 rounded-lg mb-1"
                      disabled={createChatMutation.isLoading}
                    >
                      <Avatar className="mr-3 bg-blue-500">
                        {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <Box className="flex-1 min-w-0">
                        <Typography
                          variant="subtitle2"
                          className="font-semibold truncate"
                        >
                          {user.fullName || 'Unknown User'}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-gray-500 truncate"
                        >
                          {user.email || 'No email'}
                        </Typography>
                      </Box>
                      {createChatMutation.isLoading && (
                        <CircularProgress size={20} className="ml-2" />
                      )}
                    </ListItem>
                  ))}
              </List>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* New Group Chat Dialog */}
      <Dialog
        open={openNewGroupDialog}
        onClose={() => {
          setOpenNewGroupDialog(false)
          setGroupFormData({
            name: '',
            description: '',
            selectedUsers: [],
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="h6">Create New Group</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setOpenNewGroupDialog(false)
              setGroupFormData({
                name: '',
                description: '',
                selectedUsers: [],
              })
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Group Name"
              placeholder="Enter group name"
              value={groupFormData.name}
              onChange={(e) =>
                setGroupFormData({ ...groupFormData, name: e.target.value })
              }
              required
              error={
                !groupFormData.name.trim() && groupFormData.name.length > 0
              }
              helperText={
                !groupFormData.name.trim() && groupFormData.name.length > 0
                  ? 'Group name is required'
                  : ''
              }
            />

            <TextField
              fullWidth
              label="Description (Optional)"
              placeholder="Enter group description"
              value={groupFormData.description}
              onChange={(e) =>
                setGroupFormData({
                  ...groupFormData,
                  description: e.target.value,
                })
              }
              multiline
              rows={2}
            />

            <Autocomplete
              multiple
              options={
                allUsers?.filter((user) => user.id !== userDetails?.id) || []
              }
              getOptionLabel={(option) =>
                option.fullName || option.email || 'Unknown'
              }
              value={groupFormData.selectedUsers}
              onChange={(event, newValue) => {
                setGroupFormData({ ...groupFormData, selectedUsers: newValue })
              }}
              loading={isLoadingUsers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Members"
                  placeholder="Search and select users"
                  required
                  error={
                    groupFormData.selectedUsers.length === 0 &&
                    groupFormData.selectedUsers.length >= 0
                  }
                  helperText={
                    groupFormData.selectedUsers.length === 0
                      ? 'Please select at least one member'
                      : `${groupFormData.selectedUsers.length} member(s) selected`
                  }
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.fullName || option.email}
                    avatar={
                      <Avatar className="bg-blue-500 text-white">
                        {(option.fullName || '?').charAt(0).toUpperCase()}
                      </Avatar>
                    }
                  />
                ))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Avatar className="mr-2 bg-blue-500">
                    {(option.fullName || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box className="flex-1 min-w-0">
                    <Typography
                      variant="subtitle2"
                      className="font-semibold truncate"
                    >
                      {option.fullName || 'Unknown User'}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-gray-500 truncate"
                    >
                      {option.email || 'No email'}
                    </Typography>
                  </Box>
                </Box>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(options, params) => {
                const filtered = options.filter((option) => {
                  const query = params.inputValue.toLowerCase()
                  return (
                    option.fullName?.toLowerCase().includes(query) ||
                    option.email?.toLowerCase().includes(query)
                  )
                })
                return filtered
              }}
              noOptionsText="No users found"
            />

            {groupFormData.selectedUsers.length > 0 && (
              <Box className="mt-2">
                <Typography variant="caption" className="text-gray-500">
                  Selected Members ({groupFormData.selectedUsers.length}):
                </Typography>
                <Box className="flex flex-wrap gap-1 mt-1">
                  {groupFormData.selectedUsers.map((user) => (
                    <Chip
                      key={user.id}
                      label={user.fullName || user.email}
                      size="small"
                      avatar={
                        <Avatar className="bg-blue-500 text-white text-xs">
                          {(user.fullName || '?').charAt(0).toUpperCase()}
                        </Avatar>
                      }
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={() => {
              setOpenNewGroupDialog(false)
              setGroupFormData({
                name: '',
                description: '',
                selectedUsers: [],
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGroupChat}
            disabled={
              !groupFormData.name.trim() ||
              groupFormData.selectedUsers.length === 0 ||
              createChatMutation.isLoading
            }
            startIcon={<GroupAdd />}
          >
            {createChatMutation.isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Messages Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Messages</DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-3">
            Delete {selectedMessages.size} message
            {selectedMessages.size > 1 ? 's' : ''}?
          </Typography>
          <Box className="flex flex-col gap-2">
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => {
                deleteMessagesMutation.mutate({
                  messageIds: selectedMessages,
                  deleteForEveryone: false,
                })
              }}
              disabled={deleteMessagesMutation.isLoading}
            >
              Delete for me
            </Button>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => {
                deleteMessagesMutation.mutate({
                  messageIds: selectedMessages,
                  deleteForEveryone: true,
                })
              }}
              disabled={deleteMessagesMutation.isLoading}
            >
              Delete for everyone
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Incoming Call Dialog */}
      {incomingCall && (
        <Dialog open={!!incomingCall} maxWidth="sm" fullWidth>
          <DialogContent className="text-center py-6">
            <Avatar className="w-24 h-24 mx-auto mb-4 bg-blue-500 text-4xl">
              {incomingCall.callerName?.charAt(0) || '?'}
            </Avatar>
            <Typography variant="h5" className="mb-2">
              {incomingCall.callerName || 'Unknown'}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-4">
              {incomingCall.callType === 'voice' ? 'Voice Call' : 'Video Call'}
            </Typography>
            <Box className="flex justify-center gap-3">
              <Button
                variant="contained"
                color="success"
                onClick={handleAcceptCall}
                startIcon={<Phone />}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRejectCall}
                startIcon={<Close />}
              >
                Reject
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Active Call Dialog */}
      {activeCall && (
        <Dialog open={!!activeCall} maxWidth="sm" fullWidth>
          <DialogContent className="text-center py-6">
            <Avatar className="w-24 h-24 mx-auto mb-4 bg-green-500 text-4xl">
              {selectedChat?.otherUser?.fullName?.charAt(0) ||
                activeCall.callerName?.charAt(0) ||
                '?'}
            </Avatar>
            <Typography variant="h5" className="mb-2">
              {selectedChat?.otherUser?.fullName ||
                activeCall.callerName ||
                'Unknown'}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-4">
              {activeCall.callType === 'voice' ? 'Voice Call' : 'Video Call'} -{' '}
              {peerConnectionRef.current?.connectionState === 'connected'
                ? 'Connected'
                : peerConnectionRef.current?.connectionState || 'Connecting...'}
            </Typography>

            {/* Hidden audio elements for WebRTC */}
            <audio
              ref={localAudioRef}
              autoPlay
              muted
              style={{ display: 'none' }}
            />
            <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

            <Box className="flex justify-center">
              <Button
                variant="contained"
                color="error"
                onClick={handleEndCall}
                startIcon={<Phone />}
                size="large"
              >
                End Call
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Three Dots Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuChat && (
          <>
            <MenuItem onClick={handleViewChatInfo}>
              <Typography variant="body2">View Chat Info</Typography>
            </MenuItem>
            {menuChat.chatType === 'group' && (
              <MenuItem onClick={handleGroupSettings}>
                <Typography variant="body2">Group Settings</Typography>
              </MenuItem>
            )}
            <MenuItem onClick={handleClearChat}>
              <Typography variant="body2">Clear Chat</Typography>
            </MenuItem>
            <MenuItem onClick={handleMuteNotifications}>
              <Typography variant="body2">
                {mutedChats.has(menuChat.id)
                  ? 'Unmute Notifications'
                  : 'Mute Notifications'}
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* View Chat Info Dialog */}
      <Dialog
        open={openChatInfoDialog}
        onClose={() => setOpenChatInfoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chat Information</DialogTitle>
        <DialogContent>
          {selectedChat && (
            <Box className="space-y-4">
              <Box className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-blue-500 text-2xl">
                  {getChatAvatar(selectedChat)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {getChatDisplayName(selectedChat)}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    {selectedChat.chatType === 'direct'
                      ? 'Direct chat'
                      : selectedChat.chatType}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" className="text-gray-500 mb-1">
                  Chat ID
                </Typography>
                <Typography variant="body2">{selectedChat.id}</Typography>
              </Box>
              {selectedChat.chatType === 'group' && selectedChat.name && (
                <Box>
                  <Typography variant="body2" className="text-gray-500 mb-1">
                    Group Name
                  </Typography>
                  <Typography variant="body2">{selectedChat.name}</Typography>
                </Box>
              )}
              {selectedChat.chatType === 'group' &&
                selectedChat.description && (
                  <Box>
                    <Typography variant="body2" className="text-gray-500 mb-1">
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {selectedChat.description}
                    </Typography>
                  </Box>
                )}
              {selectedChat.chatType === 'direct' && selectedChat.otherUser && (
                <>
                  <Box>
                    <Typography variant="body2" className="text-gray-500 mb-1">
                      User Email
                    </Typography>
                    <Typography variant="body2">
                      {selectedChat.otherUser.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" className="text-gray-500 mb-1">
                      User ID
                    </Typography>
                    <Typography variant="body2">
                      {selectedChat.otherUser.id || 'N/A'}
                    </Typography>
                  </Box>
                </>
              )}
              {selectedChat.chatType === 'group' && selectedChat.members && (
                <Box>
                  <Typography variant="body2" className="text-gray-500 mb-2">
                    Members ({selectedChat.members.length})
                  </Typography>
                  <Box className="flex flex-wrap gap-2">
                    {selectedChat.members.map((member, index) => (
                      <Chip
                        key={index}
                        label={member.user?.fullName || 'Unknown'}
                        size="small"
                        avatar={
                          <Avatar>
                            {member.user?.fullName?.charAt(0) || '?'}
                          </Avatar>
                        }
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <Box>
                <Typography variant="body2" className="text-gray-500 mb-1">
                  Total Messages
                </Typography>
                <Typography variant="body2">
                  {messagesData?.length || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-gray-500 mb-1">
                  Notifications
                </Typography>
                <Typography variant="body2">
                  {mutedChats.has(selectedChat.id) ? 'Muted' : 'Enabled'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChatInfoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Group Settings Dialog */}
      <Dialog
        open={openGroupSettingsDialog}
        onClose={() => setOpenGroupSettingsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Group Settings</DialogTitle>
        <DialogContent>
          {selectedChat && selectedChat.chatType === 'group' && (
            <Box className="space-y-4 mt-2">
              <Box>
                <Box className="flex justify-between items-center mb-2">
                  <Typography variant="body2" className="text-gray-500">
                    Group Name
                  </Typography>
                  {selectedChat.members?.find(
                    (member) =>
                      member.user?.id === userDetails?.id &&
                      member.role === 'admin',
                  ) && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (isEditingGroupName) {
                          // Cancel editing
                          setIsEditingGroupName(false)
                          setEditingGroupName('')
                        } else {
                          // Start editing
                          setIsEditingGroupName(true)
                          setEditingGroupName(selectedChat.name || '')
                        }
                      }}
                    >
                      {isEditingGroupName ? (
                        <Cancel fontSize="small" />
                      ) : (
                        <Edit fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  value={
                    isEditingGroupName
                      ? editingGroupName
                      : selectedChat.name || ''
                  }
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  disabled={!isEditingGroupName}
                  variant="outlined"
                />
              </Box>
              {selectedChat.description && (
                <Box>
                  <Typography variant="body2" className="text-gray-500 mb-2">
                    Description
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={selectedChat.description || ''}
                    disabled
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Box>
              )}
              <Box>
                <Box className="flex justify-between items-center mb-2">
                  <Typography variant="body2" className="text-gray-500">
                    Members ({selectedChat.members?.length || 0})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => {
                      setSelectedMembersToAdd([])
                      setSearchMemberQuery('')
                      setOpenAddMemberDialog(true)
                    }}
                  >
                    Add Member
                  </Button>
                </Box>
                {selectedChat.members && selectedChat.members.length > 0 ? (
                  <List>
                    {selectedChat.members.map((member, index) => (
                      <ListItem
                        key={index}
                        className="px-0"
                        secondaryAction={
                          member.user?.id !== userDetails?.id && (
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={async () => {
                                try {
                                  const res = await removeChatMember(
                                    userDetails?.accessToken,
                                    selectedChat.id,
                                    member.user?.id,
                                  )
                                  if (res.status === 200) {
                                    toast.success('Member removed successfully')
                                    queryClient.invalidateQueries(['userChats'])
                                    setOpenGroupSettingsDialog(false)
                                  } else {
                                    toast.error('Failed to remove member')
                                  }
                                } catch (error) {
                                  toast.error('Failed to remove member')
                                  console.error(error)
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )
                        }
                      >
                        <Avatar className="mr-2">
                          {member.user?.fullName?.charAt(0) || '?'}
                        </Avatar>
                        <Typography variant="body2">
                          {member.user?.fullName || 'Unknown'}
                        </Typography>
                        {member.user?.id === userDetails?.id && (
                          <Chip
                            label="You"
                            size="small"
                            className="ml-2"
                            color="primary"
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" className="text-gray-400">
                    No members found
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isEditingGroupName && (
            <Button
              onClick={async () => {
                try {
                  const res = await updateChat(
                    userDetails?.accessToken,
                    selectedChat.id,
                    { name: editingGroupName.trim() },
                  )
                  if (res.status === 200 || res.ok) {
                    toast.success('Group name updated successfully')
                    queryClient.invalidateQueries(['userChats'])
                    setIsEditingGroupName(false)
                    setEditingGroupName('')
                  } else {
                    toast.error(res.message || 'Failed to update group name')
                  }
                } catch (error) {
                  toast.error('Failed to update group name')
                  console.error(error)
                }
              }}
              variant="contained"
              color="primary"
              disabled={
                !editingGroupName.trim() ||
                editingGroupName.trim() === selectedChat.name
              }
            >
              Save
            </Button>
          )}
          <Button
            onClick={() => {
              setIsEditingGroupName(false)
              setEditingGroupName('')
              setOpenGroupSettingsDialog(false)
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Chat Confirmation Dialog */}
      <Dialog
        open={openClearChatDialog}
        onClose={() => setOpenClearChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear Chat</DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-2">
            Are you sure you want to clear all messages in this chat? This
            action cannot be undone.
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            This will delete all messages for you only. Other participants will
            still see the messages.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearChatDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => clearChatMutation.mutate()}
            disabled={clearChatMutation.isLoading}
          >
            {clearChatMutation.isLoading ? 'Clearing...' : 'Clear Chat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={openAddMemberDialog}
        onClose={() => {
          setOpenAddMemberDialog(false)
          setSelectedMembersToAdd([])
          setSearchMemberQuery('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Members to Group</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-2">
            <TextField
              fullWidth
              size="small"
              placeholder="Search users by name or email..."
              value={searchMemberQuery}
              onChange={(e) => setSearchMemberQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            {isLoadingUsers ? (
              <Box className="flex justify-center py-4">
                <CircularProgress size={24} />
              </Box>
            ) : filteredAvailableUsers && filteredAvailableUsers.length > 0 ? (
              <Box className="max-h-96 overflow-y-auto">
                <List>
                  {filteredAvailableUsers.map((user) => {
                    const isSelected = selectedMembersToAdd.some(
                      (u) => u.id === user.id,
                    )
                    return (
                      <ListItem
                        key={user.id}
                        className="px-0 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMembersToAdd(
                              selectedMembersToAdd.filter(
                                (u) => u.id !== user.id,
                              ),
                            )
                          } else {
                            setSelectedMembersToAdd([
                              ...selectedMembersToAdd,
                              user,
                            ])
                          }
                        }}
                      >
                        <Avatar className="mr-2">
                          {user.fullName?.charAt(0) || '?'}
                        </Avatar>
                        <Box className="flex-1">
                          <Typography variant="body2">
                            {user.fullName || 'Unknown'}
                          </Typography>
                          {user.email && (
                            <Typography
                              variant="caption"
                              className="text-gray-500"
                            >
                              {user.email}
                            </Typography>
                          )}
                        </Box>
                        {isSelected ? (
                          <CheckCircle color="primary" />
                        ) : (
                          <RadioButtonUnchecked />
                        )}
                      </ListItem>
                    )
                  })}
                </List>
              </Box>
            ) : (
              <Typography
                variant="body2"
                className="text-center text-gray-400 py-4"
              >
                {searchMemberQuery.trim()
                  ? 'No users found matching your search'
                  : 'No available users to add'}
              </Typography>
            )}
            {selectedMembersToAdd.length > 0 && (
              <Box>
                <Typography variant="body2" className="text-gray-500 mb-2">
                  Selected ({selectedMembersToAdd.length})
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {selectedMembersToAdd.map((user) => (
                    <Chip
                      key={user.id}
                      label={user.fullName || 'Unknown'}
                      onDelete={() => {
                        setSelectedMembersToAdd(
                          selectedMembersToAdd.filter((u) => u.id !== user.id),
                        )
                      }}
                      size="small"
                      avatar={
                        <Avatar>{user.fullName?.charAt(0) || '?'}</Avatar>
                      }
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAddMemberDialog(false)
              setSelectedMembersToAdd([])
              setSearchMemberQuery('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddMembers}
            disabled={
              selectedMembersToAdd.length === 0 || addMembersMutation.isLoading
            }
          >
            {addMembersMutation.isLoading
              ? 'Adding...'
              : `Add ${selectedMembersToAdd.length} Member${
                  selectedMembersToAdd.length !== 1 ? 's' : ''
                }`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ChatsView
