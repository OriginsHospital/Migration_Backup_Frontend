/**
 * Utility functions for mapping branch data in reports
 */

/**
 * Resolves branch code for revenue report rows (e.g. HYD, HNK — not full name).
 * @param {Object} row - Revenue report row
 * @param {Array} branchCatalog - Branches from getBranches ({ id, name, branchCode? })
 * @param {Array} dropdownBranches - Dropdown branches (name field holds branchCode)
 * @returns {string}
 */
export const getRevenueBranchDisplayCode = (
  row,
  branchCatalog = [],
  dropdownBranches = [],
) => {
  if (!row) return '—'

  const branchId =
    row.branchId ??
    row.reportBranchId ??
    row.branchDetails?.id ??
    row.branch?.id ??
    null

  if (row.branchCode) {
    return String(row.branchCode).trim()
  }

  if (branchId != null) {
    const catalogMatch = branchCatalog.find(
      (b) => String(b.id) === String(branchId),
    )
    const dropdownMatch = dropdownBranches.find(
      (b) => String(b.id) === String(branchId),
    )

    const code = String(
      catalogMatch?.branchCode ||
        dropdownMatch?.branchCode ||
        dropdownMatch?.name ||
        '',
    ).trim()
    if (code) return code
  }

  const apiBranch =
    typeof row.branch === 'string'
      ? row.branch.trim()
      : row.branch?.branchCode
        ? String(row.branch.branchCode).trim()
        : ''

  if (apiBranch) {
    const catalogByName = branchCatalog.find(
      (b) =>
        String(b.name).trim().toLowerCase() === apiBranch.toLowerCase() ||
        String(b.branchCode).trim().toUpperCase() === apiBranch.toUpperCase(),
    )
    const dropdownByName = dropdownBranches.find(
      (b) =>
        String(b.name).trim().toLowerCase() === apiBranch.toLowerCase() ||
        String(b.branchCode).trim().toUpperCase() === apiBranch.toUpperCase(),
    )
    return (
      catalogByName?.branchCode ||
      dropdownByName?.branchCode ||
      dropdownByName?.name ||
      apiBranch
    )
  }
  if (row.branchName) return String(row.branchName).trim()
  return '—'
}

export const getRevenueBranchFullName = (row, branchCatalog = []) => {
  if (!row) return ''

  const branchId =
    row.branchId ??
    row.reportBranchId ??
    row.branchDetails?.id ??
    row.branch?.id ??
    null

  if (branchId != null && branchCatalog.length > 0) {
    const match = branchCatalog.find((b) => String(b.id) === String(branchId))
    if (match?.name) return String(match.name).trim()
  }

  const apiBranch =
    typeof row.branch === 'string'
      ? row.branch.trim()
      : row.branch?.name
        ? String(row.branch.name).trim()
        : ''

  return apiBranch || ''
}

/** @deprecated Use getRevenueBranchDisplayCode */
export const getRevenueBranchDisplayName = getRevenueBranchDisplayCode

const ADMIN_ROLE_ID = 1

const normalizeBranchOption = (branch) => ({
  id: branch.id,
  name: branch.name,
  branchCode: branch.branchCode || branch.name,
})

/**
 * Branches the current user may select (appointments, filters, booking).
 * Admins see all active dropdown branches; others see only assigned branches.
 */
export const getSelectableBranches = (userDetails, dropdownBranches = []) => {
  const userBranches = (userDetails?.branchDetails || []).map(
    normalizeBranchOption,
  )
  const normalizedDropdown = (dropdownBranches || []).map(normalizeBranchOption)

  if (!normalizedDropdown.length) {
    return userBranches
  }

  const receivesAllBranches =
    Number(userDetails?.roleDetails?.id) === ADMIN_ROLE_ID

  if (receivesAllBranches) {
    return normalizedDropdown.length ? normalizedDropdown : userBranches
  }

  const allowedIds = new Set(userBranches.map((branch) => branch.id))
  const fromDropdown = normalizedDropdown.filter((branch) =>
    allowedIds.has(branch.id),
  )

  if (fromDropdown.length) {
    return fromDropdown
  }

  return userBranches
}

/**
 * Gets branch name from various possible data structures
 * @param {Object} row - Row data from the report
 * @param {Array} branches - Available branches from dropdowns
 * @returns {string} - Branch name or fallback
 */
export const getBranchName = (row, branches = []) => {
  if (!row) return 'N/A'

  // Try different possible branch field structures
  if (row.branch?.name) {
    return row.branch.name
  }

  if (row.branch?.branchName) {
    return row.branch.branchName
  }

  if (row.branchName) {
    return row.branchName
  }

  if (typeof row.branch === 'string') {
    return row.branch
  }

  if (row.branchId) {
    // Try to find branch name from dropdowns
    const branch = branches.find((b) => b.id === row.branchId)
    if (branch?.name) {
      return branch.name
    }
    return `Branch ID: ${row.branchId}`
  }

  // If no branch data found, return N/A
  return 'N/A'
}

/**
 * Gets branch name with debug information
 * @param {Object} row - Row data from the report
 * @param {Array} branches - Available branches from dropdowns
 * @returns {Object} - Object with branchName and debug info
 */
export const getBranchNameWithDebug = (row, branches = []) => {
  const branchName = getBranchName(row, branches)

  return {
    branchName,
    debug: {
      hasBranch: !!row.branch,
      hasBranchId: !!row.branchId,
      hasBranchName: !!row.branchName,
      branchType: typeof row.branch,
      availableBranches: branches.length,
      rowKeys: Object.keys(row || {}),
    },
  }
}

/**
 * Maps branch data for a list of rows
 * @param {Array} rows - Array of row data
 * @param {Array} branches - Available branches from dropdowns
 * @returns {Array} - Array with mapped branch names
 */
export const mapBranchData = (rows, branches = []) => {
  return rows.map((row) => ({
    ...row,
    branchName: getBranchName(row, branches),
  }))
}

export default {
  getBranchName,
  getBranchNameWithDebug,
  getRevenueBranchDisplayCode,
  getRevenueBranchFullName,
  getRevenueBranchDisplayName,
  getSelectableBranches,
  mapBranchData,
}
