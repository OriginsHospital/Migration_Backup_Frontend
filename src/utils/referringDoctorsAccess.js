/**
 * Users allowed to view the Referring Doctors Log tab
 */
const REFERRING_DOCTORS_LOG_ALLOWED_EMAILS = [
  'nikhilsuvva77@gmail.com',
  'ajaysivaramburri@gmail.com',
  'originsivf@gmail.com',
  'originsivf@outlook.com',
  'jhansi@gmail.com',
  'karun@gmail.com',
  'priyankaadmin@gmail.com',
]

export function resolveReferringDoctorsUserEmail(user) {
  return (user?.email || user?.userDetails?.email || '').trim().toLowerCase()
}

export function hasReferringDoctorsLogAccess(user) {
  const email = resolveReferringDoctorsUserEmail(user)
  if (!email) return false
  return REFERRING_DOCTORS_LOG_ALLOWED_EMAILS.includes(email)
}
