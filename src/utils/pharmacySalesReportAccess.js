export const PHARMACY_SALES_REPORT_ALLOWED_EMAILS = ['nikhilsuvva77@gmail.com']

export const hasPharmacySalesReportAccess = (userEmail) => {
  if (!userEmail) return false
  return PHARMACY_SALES_REPORT_ALLOWED_EMAILS.includes(userEmail.toLowerCase())
}
