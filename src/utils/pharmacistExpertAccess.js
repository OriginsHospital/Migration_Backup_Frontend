export const PHARMACIST_EXPERT_EMAILS = ['krishnaveni@gmail.com']
export const PHARMACIST_ROLE_ID = 3

export const PHARMACIST_FEATURE_MODULES = [
  'pharmacy',
  'grnModule',
  'grnStockExpiryDate',
  'indent',
  'prescribedReport',
  'grnStock',
  'patientRefund',
  'gstGrnSalesReport',
  'itemsReports',
  'grnVendorPaymentReport',
  'orders',
]

export function hasPharmacistExpertAccess(userOrEmail) {
  const email = (
    typeof userOrEmail === 'string'
      ? userOrEmail
      : userOrEmail?.email || userOrEmail?.userDetails?.email || ''
  )
    .toString()
    .trim()
    .toLowerCase()

  return PHARMACIST_EXPERT_EMAILS.includes(email)
}

export function hasPharmacistFeatureAccess(user, moduleName) {
  if (!moduleName || !hasPharmacistExpertAccess(user)) return false
  return PHARMACIST_FEATURE_MODULES.includes(moduleName)
}

export function isPharmacistLike(user) {
  if (!user) return false
  if (hasPharmacistExpertAccess(user)) return true

  const roleDetails = user.roleDetails || user
  const roleName = (
    roleDetails?.roleName ||
    roleDetails?.name ||
    roleDetails?.role ||
    ''
  )
    .toString()
    .toLowerCase()

  return (
    Number(roleDetails?.id) === PHARMACIST_ROLE_ID ||
    roleName.includes('pharmacist')
  )
}
