import { createSlice } from '@reduxjs/toolkit'

const initialState = []

export const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    setCoupon: (state, action) => {
      const coupon = action.payload
      return [...state, coupon]
    },
  },
})

// Action creators are generated for each case reducer function
export const { setCoupon } = couponSlice.actions

const couponReducer = couponSlice.reducer
export { couponReducer }
