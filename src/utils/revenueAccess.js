/**
 * List of allowed emails for Revenue New page
 * Only these email IDs are authorized to access Revenue New page
 */
const ALLOWED_REVENUE_NEW_EMAILS = [
  'nikhilsuvva77@gmail.com',
  'originsivf@gmail.com',
  'jhansi@gmail.com',
]

/**
 * Checks if a user email has access to Revenue page
 * Revenue page is HIDDEN from all users
 * @param {string} userEmail - The user's email address
 * @returns {boolean} - Always returns false (Revenue page is hidden from all)
 */
export function hasRevenueAccess(userEmail) {
  // Revenue page is hidden from all users
  return false
}

/**
 * Checks if a user email has access to Revenue New page
 * @param {string} userEmail - The user's email address
 * @returns {boolean} - True if the user has access, false otherwise
 */
export function hasRevenueNewAccess(userEmail) {
  if (!userEmail) {
    return false
  }
  return ALLOWED_REVENUE_NEW_EMAILS.includes(userEmail.toLowerCase().trim())
}

/**
 * Gets the list of allowed emails for Revenue New (for reference/debugging)
 * @returns {string[]} - Array of allowed email addresses
 */
export function getAllowedRevenueNewEmails() {
  return [...ALLOWED_REVENUE_NEW_EMAILS]
}

/** Edit/delete row actions on Revenue New report (restricted user only). */
const REVENUE_NEW_ROW_ACTIONS_EMAIL = 'nikhilsuvva77@gmail.com'

export function hasRevenueNewRowActionsAccess(userEmail) {
  if (!userEmail) {
    return false
  }
  return userEmail.toLowerCase().trim() === REVENUE_NEW_ROW_ACTIONS_EMAIL
}
