import React, { useState } from 'react'
import { Box, Tabs, Tab, Paper, Typography, Container } from '@mui/material'
import ChatsView from './ChatsView'
import MeetingsView from './MeetingsView'
import CalendarView from './CalendarView'
import SchedulingView from './SchedulingView'
import CallHistoryView from './CallHistoryView'

function TeamsDashboard() {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  return (
    <Container maxWidth="xl" className="py-6">
      <Paper elevation={3} className="p-6">
        <Typography variant="h4" className="mb-6 font-bold text-gray-800">
          Teams
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Teams module tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Chats" />
            <Tab label="Meetings" />
            <Tab label="Calendar" />
            <Tab label="Scheduling" />
            <Tab label="Call History" />
          </Tabs>
        </Box>

        <Box>
          {activeTab === 0 && <ChatsView />}
          {activeTab === 1 && <MeetingsView />}
          {activeTab === 2 && <CalendarView />}
          {activeTab === 3 && <SchedulingView />}
          {activeTab === 4 && <CallHistoryView />}
        </Box>
      </Paper>
    </Container>
  )
}

export default TeamsDashboard
