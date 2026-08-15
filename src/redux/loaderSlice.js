import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoading: false,
}

export const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    showLoader: () => {
      return {
        isLoading: true,
      }
    },
    hideLoader: () => {
      return { isLoading: false }
    },
  },
})

// Action creators are generated for each case reducer function
export const { showLoader, hideLoader } = loaderSlice.actions

const loaderReducer = loaderSlice.reducer
export { loaderReducer }
