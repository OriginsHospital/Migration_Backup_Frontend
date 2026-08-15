import { API_ROUTES } from './constants'

// ============ CHATS APIs ============

export const getUserChats = async (token, limit = 50, offset = 0) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_USER_CHATS}?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createChat = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_CHAT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  return {
    status: response.status,
    statusText: response.statusText,
    data: data.data || data,
    message: data.message,
    ok: response.ok,
  }
}

export const getChatMessages = async (
  token,
  chatId,
  limit = 50,
  offset = 0,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CHAT_MESSAGES}/${chatId}/messages?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendMessage = async (token, chatId, payload, file = null) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  let body
  let headers = myHeaders

  if (file) {
    // If file exists, use FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('message', payload.message || '')
    formData.append('messageType', payload.messageType || 'text')
    if (payload.fileName) formData.append('fileName', payload.fileName)
    if (payload.fileUrl) formData.append('fileUrl', payload.fileUrl)
    if (payload.fileSize) formData.append('fileSize', payload.fileSize)
    if (payload.replyToMessageId)
      formData.append('replyToMessageId', payload.replyToMessageId)
    if (payload.mentions)
      formData.append('mentions', JSON.stringify(payload.mentions))
    body = formData
    // Don't set Content-Type for FormData, browser will set it with boundary
  } else {
    // For text messages, send as JSON
    headers.append('Content-Type', 'application/json')
    body = JSON.stringify(payload)
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_MESSAGE}/${chatId}/messages`,
    {
      method: 'POST',
      headers: headers,
      body: body,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editMessage = async (token, chatId, messageId, message) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_MESSAGE}/${chatId}/messages/${messageId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify({ message }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteMessage = async (
  token,
  chatId,
  messageId,
  deleteForEveryone = false,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_MESSAGE}/${chatId}/messages/${messageId}?deleteForEveryone=${deleteForEveryone}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  return {
    status: response.status,
    statusText: response.statusText,
    data: data.data || data,
    message: data.message,
    ok: response.ok,
  }
}

export const addChatMembers = async (token, chatId, memberIds) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_CHAT_MEMBERS}/${chatId}/members`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ memberIds }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateChat = async (token, chatId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_CHAT}/${chatId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  return {
    status: response.status,
    statusText: response.statusText,
    data: data.data || data,
    message: data.message,
    ok: response.ok,
  }
}

export const removeChatMember = async (token, chatId, memberId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REMOVE_CHAT_MEMBER}/${chatId}/members/${memberId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ============ MEETINGS APIs ============

export const getUserMeetings = async (token, startDate, endDate, status) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_USER_MEETINGS}?`
  if (startDate) url += `startDate=${startDate}&`
  if (endDate) url += `endDate=${endDate}&`
  if (status) url += `status=${status}&`

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}

export const createMeeting = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_MEETING}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateMeeting = async (token, meetingId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_MEETING}/${meetingId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const joinMeeting = async (token, meetingId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.JOIN_MEETING}/${meetingId}/join`,
    {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteMeeting = async (token, meetingId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_MEETING}/${meetingId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ============ CALENDAR APIs ============

export const getCalendarEvents = async (
  token,
  startDate,
  endDate,
  eventType,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CALENDAR_EVENTS}?`
  if (startDate) url += `startDate=${startDate}&`
  if (endDate) url += `endDate=${endDate}&`
  if (eventType) url += `eventType=${eventType}&`

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}

export const createCalendarEvent = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_CALENDAR_EVENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateCalendarEvent = async (token, eventId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_CALENDAR_EVENT}/${eventId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteCalendarEvent = async (token, eventId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_CALENDAR_EVENT}/${eventId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ============ SCHEDULING APIs ============

export const getSchedules = async (
  token,
  startDate,
  endDate,
  scheduleType,
  assignedTo,
  departmentId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCHEDULES}?`
  if (startDate) url += `startDate=${startDate}&`
  if (endDate) url += `endDate=${endDate}&`
  if (scheduleType) url += `scheduleType=${scheduleType}&`
  if (assignedTo) url += `assignedTo=${assignedTo}&`
  if (departmentId) url += `departmentId=${departmentId}&`

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}

export const createSchedule = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_SCHEDULE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateSchedule = async (token, scheduleId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_SCHEDULE}/${scheduleId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteSchedule = async (token, scheduleId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_SCHEDULE}/${scheduleId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ============ CALLS APIs ============

export const initiateCall = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.INITIATE_CALL}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateCallStatus = async (token, callId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_CALL_STATUS}/${callId}/status`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getCallHistory = async (token, limit = 50, offset = 0) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CALL_HISTORY}?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
