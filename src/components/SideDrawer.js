import { openSideDrawer, closeSideDrawer } from '@/redux/sideDrawerSlice'
import Drawer from '@mui/material/Drawer'
import { useSelector, useDispatch } from 'react-redux'
function SideDrawer({
  children,
  closeOnOutsideClick,
  onOutsideClick,
  uniqueKey,
}) {
  const sideDrawer = useSelector(store => store.sideDrawer)
  const dispatch = useDispatch()
  if (sideDrawer.key != uniqueKey) return null
  return (
    <Drawer
      anchor={'right'}
      open={sideDrawer.key === uniqueKey ? true : false}
      // open={sideDrawer.open}
      onClose={() => {
        if (closeOnOutsideClick) {
          dispatch(closeSideDrawer())
        }
        onOutsideClick?.()
      }}
    >
      <div className="p-3 h-screen min-w-48 md:min-w-96 bg-white">
        {children}
      </div>
    </Drawer>
  )
}

export { SideDrawer }
