import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  tabs: [],
  activeTabId: null,
  maxTabs: 10, // Maximum number of tabs allowed
}

// Load initial state from sessionStorage if available
const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('appTabs')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...initialState,
          tabs: parsed.tabs || [],
          activeTabId: parsed.activeTabId || null,
        }
      }
    } catch (e) {
      console.warn('Failed to load tabs from sessionStorage:', e)
    }
  }
  return initialState
}

// Helper to persist tabs to sessionStorage
const persistTabs = (tabs, activeTabId) => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        'appTabs',
        JSON.stringify({
          tabs,
          activeTabId,
        }),
      )
    } catch (e) {
      console.warn('Failed to save tabs to sessionStorage:', e)
    }
  }
}

const tabsSlice = createSlice({
  name: 'tabs',
  initialState: loadInitialState(),
  reducers: {
    addTab: (state, action) => {
      const { id, path, title, component, forceNew } = action.payload

      // If forceNew is true, always create a new tab (for "+" button)
      // Otherwise, check if tab already exists and activate it
      if (!forceNew) {
        const existingTabIndex = state.tabs.findIndex(
          (tab) => tab.path === path,
        )

        if (existingTabIndex !== -1) {
          // Tab exists, just make it active
          state.activeTabId = state.tabs[existingTabIndex].id
          persistTabs(state.tabs, state.activeTabId)
          return
        }
      }

      // Check max tabs limit
      if (state.tabs.length >= state.maxTabs) {
        // Remove the oldest inactive tab
        const inactiveTabs = state.tabs.filter(
          (tab) => tab.id !== state.activeTabId,
        )
        if (inactiveTabs.length > 0) {
          const oldestTab = inactiveTabs[0]
          state.tabs = state.tabs.filter((tab) => tab.id !== oldestTab.id)
        }
      }

      // Add new tab
      const newTab = {
        id:
          id || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        path,
        title: title || path.split('/').pop() || 'New Tab',
        component,
        createdAt: Date.now(),
      }

      state.tabs.push(newTab)
      state.activeTabId = newTab.id
      persistTabs(state.tabs, state.activeTabId)
    },

    removeTab: (state, action) => {
      const tabId = action.payload
      const tabIndex = state.tabs.findIndex((tab) => tab.id === tabId)

      if (tabIndex === -1) return

      const wasActive = state.tabs[tabIndex].id === state.activeTabId
      state.tabs = state.tabs.filter((tab) => tab.id !== tabId)

      // If we removed the active tab, activate another one
      if (wasActive && state.tabs.length > 0) {
        // Try to activate the tab to the right, or the last tab
        const newActiveIndex = Math.min(tabIndex, state.tabs.length - 1)
        state.activeTabId = state.tabs[newActiveIndex].id
      } else if (state.tabs.length === 0) {
        state.activeTabId = null
      }

      persistTabs(state.tabs, state.activeTabId)
    },

    setActiveTab: (state, action) => {
      const tabId = action.payload
      const tabExists = state.tabs.some((tab) => tab.id === tabId)
      if (tabExists) {
        state.activeTabId = tabId
        persistTabs(state.tabs, state.activeTabId)
      }
    },

    updateTab: (state, action) => {
      const { id, updates } = action.payload
      const tabIndex = state.tabs.findIndex((tab) => tab.id === id)
      if (tabIndex !== -1) {
        state.tabs[tabIndex] = {
          ...state.tabs[tabIndex],
          ...updates,
        }
        persistTabs(state.tabs, state.activeTabId)
      }
    },

    closeAllTabs: (state) => {
      state.tabs = []
      state.activeTabId = null
      persistTabs(state.tabs, state.activeTabId)
    },

    closeOtherTabs: (state, action) => {
      const keepTabId = action.payload
      state.tabs = state.tabs.filter((tab) => tab.id === keepTabId)
      state.activeTabId = keepTabId
      persistTabs(state.tabs, state.activeTabId)
    },

    setMaxTabs: (state, action) => {
      state.maxTabs = action.payload
    },
  },
})

export const {
  addTab,
  removeTab,
  setActiveTab,
  updateTab,
  closeAllTabs,
  closeOtherTabs,
  setMaxTabs,
} = tabsSlice.actions

export default tabsSlice.reducer
