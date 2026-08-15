import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  key: null,
}

export const sideDrawerSlice = createSlice({
  name: 'sideDrawer',
  initialState,
  reducers: {
    openSideDrawer: (state, action) => {
      return { key: action.payload }
    },
    closeSideDrawer: () => {
      return { key: null }
    },
  },
})

// Action creators are generated for each case reducer function
export const { openSideDrawer, closeSideDrawer } = sideDrawerSlice.actions

const sideDrawerReducer = sideDrawerSlice.reducer
export { sideDrawerReducer }
