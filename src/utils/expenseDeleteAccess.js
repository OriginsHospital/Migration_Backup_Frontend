const EXPENSE_DELETE_ALLOWED_EMAILS = [
  'nikhilsuvva77@gmail.com',
  'ajaysivaramburri@gmail.com',
  'soujanyaadmin4@gmail.com',
]

export function hasExpenseDeleteAccess(user) {
  const email = (user?.email || user?.userDetails?.email || '')
    .trim()
    .toLowerCase()
  if (!email) return false
  return EXPENSE_DELETE_ALLOWED_EMAILS.includes(email)
}
