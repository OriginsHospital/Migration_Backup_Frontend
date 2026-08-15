export const VENDOR_MANUFACTURER_REPORT_ALLOWED_EMAILS = [
  // Add authorized users here (lowercase)
  'nikhilsuvva77@gmail.com',
]

export const hasVendorManufacturerReportAccess = (userEmail) => {
  if (!userEmail) return false
  return VENDOR_MANUFACTURER_REPORT_ALLOWED_EMAILS.includes(
    userEmail.toLowerCase(),
  )
}
