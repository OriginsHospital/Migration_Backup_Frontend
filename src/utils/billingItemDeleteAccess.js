const BILLING_ITEM_DELETE_ALLOWED_EMAILS = [
  'ajaysivaramburri@gmail.com',
  'mokkagayathri09@gmail.com',
]

export function hasBillingItemDeleteAccess(user) {
  const email = (user?.email || user?.userDetails?.email || '')
    .trim()
    .toLowerCase()
  if (!email) return false
  return BILLING_ITEM_DELETE_ALLOWED_EMAILS.includes(email)
}
