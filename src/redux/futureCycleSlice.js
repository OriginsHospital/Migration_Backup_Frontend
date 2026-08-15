import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  open: false,
  patientMasterId: null,
  patientDisplayName: '',
}

export const futureCycleSlice = createSlice({
  name: 'futureCycle',
  initialState,
  reducers: {
    openFutureCycleModal: (state, action) => {
      state.open = true
      state.patientMasterId = action.payload?.patientMasterId ?? null
      state.patientDisplayName = action.payload?.patientDisplayName ?? ''
    },
    closeFutureCycleModal: (state) => {
      state.open = false
      state.patientMasterId = null
      state.patientDisplayName = ''
    },
  },
})

export const { openFutureCycleModal, closeFutureCycleModal } =
  futureCycleSlice.actions

export const futureCycleReducer = futureCycleSlice.reducer
