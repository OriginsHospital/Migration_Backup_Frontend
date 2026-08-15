# Branch Data Fix Guide

## Problem

The Branch column in the Expenses report is showing "N/A" instead of actual branch names from the database.

## Root Cause Analysis

The issue occurs because the backend API might not be returning branch data in the expected format, or the frontend is not properly mapping the branch information.

## Solutions Implemented

### 1. Enhanced Branch Column Mapping

**File:** `src/pages/reports/expenses/index.js`

**Changes Made:**

- Added comprehensive branch data handling
- Created utility function for branch mapping
- Added data transformation in API call
- Added debug logging to identify data structure

**Code Added:**

```javascript
// Enhanced branch column with multiple fallback options
{
  field: 'branch',
  headerName: 'Branch',
  width: 120,
  flex: 0.6,
  renderCell: params => {
    const branchName = getBranchName(params.row, dropdowns?.branches || [])
    return (
      <Tooltip title={branchName}>
        <span className="truncate">
          {branchName}
        </span>
      </Tooltip>
    )
  },
}
```

### 2. Data Transformation in API Call

**File:** `src/pages/reports/expenses/index.js`

**Changes Made:**

- Added data transformation to ensure branch data is properly structured
- Maps branchId to branch name using dropdowns data
- Creates fallback branch object if not present

**Code Added:**

```javascript
const { data: expencesData } = useQuery({
  queryKey: ['expenses'],
  queryFn: async () => {
    const res = await getExpenses(user?.accessToken)
    if (res.status === 200) {
      // Transform data to ensure branch information is properly mapped
      const transformedData = res.data?.map((expense) => ({
        ...expense,
        // Ensure branch data is properly structured
        branch: expense.branch || {
          id: expense.branchId,
          name:
            dropdowns?.branches?.find((b) => b.id === expense.branchId)?.name ||
            'Unknown Branch',
        },
      }))
      return transformedData
    } else {
      throw new Error('Error fetching expenses')
    }
  },
})
```

### 3. Branch Mapping Utility

**File:** `src/utils/branchMapping.js`

**Features:**

- Handles multiple possible branch data structures
- Maps branchId to branch name using dropdowns
- Provides debug information
- Fallback handling for missing data

**Key Functions:**

- `getBranchName(row, branches)` - Gets branch name from various data structures
- `getBranchNameWithDebug(row, branches)` - Gets branch name with debug info
- `mapBranchData(rows, branches)` - Maps branch data for multiple rows

### 4. Debug Components

**File:** `src/components/BranchDataTest.js`

**Features:**

- Tests branch data mapping
- Provides console logging for debugging
- Shows available branches and data structure
- Helps identify data format issues

## Debugging Steps

### Step 1: Check Console Logs

1. Open the Expenses report page
2. Open browser console (F12)
3. Look for these logs:
   - `expenses data structure:` - Shows the raw data from API
   - `branches dropdown:` - Shows available branches
   - `first expense item:` - Shows structure of first expense
   - `Row data for branch:` - Shows data for each row

### Step 2: Identify Data Structure

The logs will show you the actual data structure. Look for:

```javascript
// Possible structures:
{
  branch: { id: 1, name: "Main Branch" },  // ✅ Ideal structure
  branchId: 1,                             // ✅ Has branchId
  branchName: "Main Branch",               // ✅ Has branchName
  branch: "Main Branch",                   // ✅ String branch
  // No branch data                        // ❌ Missing branch data
}
```

### Step 3: Fix Based on Data Structure

#### If branch data is missing entirely:

```javascript
// Backend needs to include branch data in API response
// Or frontend needs to fetch branch data separately
```

#### If branchId exists but no branch name:

```javascript
// The mapping should work automatically
// Check if dropdowns.branches has the correct data
```

#### If branch data exists but in different format:

```javascript
// Update the getBranchName function to handle the specific format
```

## Backend Fixes (If Needed)

### Option 1: Update API Response

If the backend is not returning branch data, update the API to include it:

```javascript
// In the backend controller
const expenses = await Expense.findAll({
  include: [
    {
      model: Branch,
      as: 'branch',
      attributes: ['id', 'name'],
    },
  ],
})
```

### Option 2: Frontend Data Fetching

If backend can't be changed, fetch branch data separately:

```javascript
// Fetch branches and map them to expenses
const { data: branches } = useQuery({
  queryKey: ['branches'],
  queryFn: () => getBranches(user?.accessToken),
})

// Map branch data to expenses
const expensesWithBranches = useMemo(() => {
  return expencesData?.map((expense) => ({
    ...expense,
    branch: branches?.find((b) => b.id === expense.branchId),
  }))
}, [expencesData, branches])
```

## Testing the Fix

### 1. Manual Testing

1. Navigate to Expenses report
2. Check if Branch column shows actual branch names
3. Hover over branch names to see tooltips
4. Check console for any errors

### 2. Debug Testing

1. Use the BranchDataTest component
2. Click "Test Branch Mapping" button
3. Check console for detailed mapping results
4. Verify branch names are correctly resolved

### 3. Data Verification

1. Check if `dropdowns.branches` has data
2. Verify expense data includes branch information
3. Confirm mapping logic works correctly

## Common Issues and Solutions

### Issue 1: "N/A" still showing

**Cause:** Branch data not available in API response
**Solution:**

- Check if `dropdowns.branches` has data
- Verify API response includes branch information
- Update backend to include branch data

### Issue 2: Branch names not matching

**Cause:** BranchId doesn't match between expenses and branches
**Solution:**

- Check if branchId values are consistent
- Verify branch data is up to date
- Check for data type mismatches (string vs number)

### Issue 3: Performance issues

**Cause:** Too many console logs or inefficient mapping
**Solution:**

- Remove debug logs in production
- Optimize branch mapping logic
- Use memoization for expensive operations

## Production Checklist

Before deploying to production:

- [ ] Remove debug console logs
- [ ] Remove BranchDataTest component
- [ ] Test with real data
- [ ] Verify branch names are correct
- [ ] Check performance with large datasets
- [ ] Test in different browsers
- [ ] Verify export functionality works

## Files Modified

1. `src/pages/reports/expenses/index.js` - Main expenses report
2. `src/utils/branchMapping.js` - Branch mapping utilities
3. `src/components/BranchDataTest.js` - Debug component
4. `src/components/ReportExportToolbar.js` - Export functionality

## Next Steps

1. **Test the current implementation** with your data
2. **Check console logs** to see the actual data structure
3. **Update the mapping logic** based on your specific data format
4. **Remove debug components** once the issue is resolved
5. **Deploy to production** with proper branch data

## Support

If the issue persists:

1. Check the console logs for the actual data structure
2. Verify that `dropdowns.branches` has the correct data
3. Ensure the backend API returns branch information
4. Update the mapping logic based on your specific data format

The implementation is designed to handle multiple data structures, but you may need to adjust it based on your specific backend response format.
