import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  //   data: {},
}

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setData: (state, action) => {
      const data = action.payload
      return { ...state, data }
    },
    clearData: () => {
      return null
    },
  },
})

// Action creators are generated for each case reducer function
export const { setData, clearData } = searchSlice.actions

const searchReducer = searchSlice.reducer
export { searchReducer }
