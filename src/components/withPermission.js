import { useSelector } from 'react-redux'
import { Redirect } from './Redirect'
import { hasPharmacistFeatureAccess } from '@/utils/pharmacistExpertAccess'

export function withPermission(
  Component,
  isPage,
  relatedModuleName,
  requiredPermissions,
) {
  function Wrapper(props) {
    // For some modules permissions are not required, they should be visible for all roles
    // console.log(relatedModuleName, requiredPermissions);
    const user = useSelector((store) => store.user)
    if (hasPharmacistFeatureAccess(user, relatedModuleName)) {
      return <Component {...props} />
    }
    const userModule = user.moduleList?.find(
      (eachModuleObj) => eachModuleObj.enum == relatedModuleName,
    )
    const userPermission = userModule?.accessType
    // console.log(userModule)
    if (!userPermission) {
      return <Component {...props} />
    }
    if (requiredPermissions.includes(userPermission)) {
      return <Component {...props} />
    } else {
      if (isPage) return <Redirect redirectURL="/home" />
      return null
    }
  }
  return Wrapper
}

export const usePermissionCheck = (moduleName, requiredPermissions) => {
  const user = useSelector((store) => store.user)
  if (hasPharmacistFeatureAccess(user, moduleName)) {
    return true
  }
  const userModule = user.moduleList?.find(
    (eachModuleObj) => eachModuleObj.enum === moduleName,
  )
  const userPermission = userModule?.accessType

  return !userPermission || requiredPermissions.includes(userPermission)
}
