import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from './userSlice'
import { dropdownReducer } from './dropdownSlice'
import { loaderReducer } from './loaderSlice'
import { sideDrawerReducer } from './sideDrawerSlice'
import { ModalReducer } from './modalSlice'
import { searchReducer } from './searchSlice'
import { couponReducer } from './couponSlice'
import tabsReducer from './tabsSlice'
import { futureCycleReducer } from './futureCycleSlice'
export const store = configureStore({
  reducer: {
    user: userReducer,
    dropdowns: dropdownReducer,
    loader: loaderReducer,
    sideDrawer: sideDrawerReducer,
    modal: ModalReducer,
    search: searchReducer,
    coupon: couponReducer,
    tabs: tabsReducer,
    futureCycle: futureCycleReducer,
  },
})
