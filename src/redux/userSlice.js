import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: null,
  userName: '',
  fullName: '',
  email: '',
  roleDetails: null,
  branchDetails: null,
  accessToken: '',
  moduleList: [],
  isAuthenticated: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const {
        id,
        userName,
        fullName,
        email,
        roleDetails,
        branchDetails,
        moduleList,
        accessToken,
        isAuthenticated,
      } = action.payload
      return {
        ...state,
        id,
        userName,
        fullName,
        email,
        roleDetails,
        branchDetails,
        moduleList,
        accessToken,
        isAuthenticated,
      }
    },
    resetUser: () => {
      return { ...initialState }
    },
  },
})

// Action creators are generated for each case reducer function
export const { setUser, resetUser } = userSlice.actions

const userReducer = userSlice.reducer
export { userReducer }
