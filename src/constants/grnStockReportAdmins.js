const GRN_STOCK_REPORT_ADMIN_EMAILS = [
  'nikhilsuvva77@gmail.com',
  'ajaysivaramburri@gmail.com',
]

export function isGrnStockReportAdmin(email) {
  if (!email || typeof email !== 'string') return false
  const normalized = email.trim().toLowerCase()
  return GRN_STOCK_REPORT_ADMIN_EMAILS.some(
    (e) => e.toLowerCase() === normalized,
  )
}
