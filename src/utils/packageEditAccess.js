const PACKAGE_EDIT_ALLOWED_EMAIL = 'nikhilsuvva77@gmail.com'
const PACKAGE_EDIT_ADMIN_ROLE_IDS = [1, 7]

/**
 * Users who may create/edit patient packages (UI + must match backend).
 * - Designated package expert email
 * - Admin / Center Manager roles (ids 1 and 7)
 */
export function hasPackageEditAccess(user) {
  if (!user) {
    return false
  }

  const email = user.email?.trim()?.toLowerCase()
  if (email === PACKAGE_EDIT_ALLOWED_EMAIL) {
    return true
  }

  const roleId = user.roleDetails?.id
  if (PACKAGE_EDIT_ADMIN_ROLE_IDS.includes(roleId)) {
    return true
  }

  const roleName = user.roleDetails?.name?.trim()?.toLowerCase()
  if (roleName === 'admin') {
    return true
  }

  return false
}
