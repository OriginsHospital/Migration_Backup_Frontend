import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  removeTab,
  setActiveTab,
  closeOtherTabs,
  closeAllTabs,
  addTab,
} from '@/redux/tabsSlice'
import { useRouter } from 'next/router'
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material'
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material'

export default function TabBar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { tabs, activeTabId } = useSelector((state) => state.tabs)
  const tabsContainerRef = useRef(null)
  const activeTabRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [contextMenuTab, setContextMenuTab] = useState(null)

  // Define handleNewTab first so it can be used in useEffect
  const handleNewTab = React.useCallback(
    (e) => {
      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }

      // Default route for new tabs
      const defaultPath = '/home'
      const defaultTitle = 'Dashboard'

      // Always create a new tab, even if one with the same path exists
      // This allows multiple tabs of the same page
      const currentTabs = tabs
      const tabCount = currentTabs.filter(
        (tab) => tab.path === defaultPath,
      ).length
      const uniqueTitle =
        tabCount > 0 ? `${defaultTitle} (${tabCount + 1})` : defaultTitle

      // Create new tab with unique ID
      const newTabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Dispatch with forceNew flag to bypass duplicate check
      dispatch(
        addTab({
          id: newTabId,
          path: defaultPath,
          title: uniqueTitle,
          forceNew: true, // Flag to bypass duplicate check
        }),
      )

      // Use setTimeout to ensure Redux state updates before navigation
      setTimeout(() => {
        router.push(defaultPath).catch((err) => {
          console.error('Failed to navigate to new tab:', err)
        })
      }, 10)
    },
    [dispatch, router, tabs],
  )

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeTabId])

  // Keyboard shortcut: Ctrl+T or Cmd+T to create new tab
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        handleNewTab(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleNewTab])

  const handleTabClick = (tabId, path) => {
    dispatch(setActiveTab(tabId))
    router.push(path)
  }

  const handleCloseTab = (e, tabId, path) => {
    e.stopPropagation()
    dispatch(removeTab(tabId))

    // If closing active tab, navigate to another tab
    if (tabId === activeTabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId)
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[remainingTabs.length - 1]
        router.push(nextTab.path)
      } else {
        router.push('/home')
      }
    }
  }

  const handleCloseOtherTabs = (e, tabId) => {
    e.stopPropagation()
    dispatch(closeOtherTabs(tabId))
    setContextMenu(null)
  }

  const handleCloseAllTabs = () => {
    dispatch(closeAllTabs())
    router.push('/home')
    setContextMenu(null)
  }

  const handleContextMenu = (e, tab) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuTab(tab)
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
    })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
    setContextMenuTab(null)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#ccc',
          borderRadius: '2px',
        },
      }}
      ref={tabsContainerRef}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId
        return (
          <Box
            key={tab.id}
            ref={isActive ? activeTabRef : null}
            onClick={() => handleTabClick(tab.id, tab.path)}
            onContextMenu={(e) => handleContextMenu(e, tab)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 2,
              py: 1,
              minWidth: 120,
              maxWidth: 240,
              bgcolor: isActive ? '#ffffff' : '#e8e8e8',
              borderRight: '1px solid #d0d0d0',
              borderTop: isActive
                ? '2px solid #06aee9'
                : '2px solid transparent',
              cursor: 'pointer',
              position: 'relative',
              userSelect: 'none',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: isActive ? '#ffffff' : '#f0f0f0',
              },
              '&:first-of-type': {
                borderLeft: 'none',
              },
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#06aee9' : '#666',
              }}
              title={tab.title}
            >
              {tab.title}
            </Box>
            <IconButton
              size="small"
              onClick={(e) => handleCloseTab(e, tab.id, tab.path)}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{
                width: 18,
                height: 18,
                opacity: 0.6,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )
      })}

      {/* New Tab Button - Always visible */}
      <Tooltip title="New Tab (Ctrl+T)" arrow placement="top">
        <Box
          onClick={handleNewTab}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 40,
            height: 40,
            bgcolor: '#f5f5f5',
            borderRight: '1px solid #d0d0d0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            '&:hover': {
              bgcolor: '#e8e8e8',
            },
            '&:active': {
              bgcolor: '#d0d0d0',
            },
          }}
        >
          <AddIcon
            sx={{
              fontSize: 20,
              color: '#666',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: '#06aee9',
              },
            }}
          />
        </Box>
      </Tooltip>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenuTab && (
          <>
            <MenuItem
              onClick={() => {
                handleCloseTab(
                  { stopPropagation: () => {} },
                  contextMenuTab.id,
                  contextMenuTab.path,
                )
                handleCloseContextMenu()
              }}
            >
              Close Tab
            </MenuItem>
            <MenuItem
              onClick={(e) => handleCloseOtherTabs(e, contextMenuTab.id)}
            >
              Close Other Tabs
            </MenuItem>
            <MenuItem onClick={handleCloseAllTabs}>Close All Tabs</MenuItem>
          </>
        )}
      </Menu>
    </Box>
  )
}
