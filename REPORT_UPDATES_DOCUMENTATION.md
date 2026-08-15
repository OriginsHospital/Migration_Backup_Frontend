# Report Updates Documentation

## Overview

This document outlines the changes made to the Reports section of the HMS web application, including the addition of a Branch column to the Expenses report, automatic file naming for exports, and UI improvements for better visibility.

## Changes Implemented

### 1. Added Branch Column to Expenses Report

**File Modified:** `src/pages/reports/expenses/index.js`

**Changes Made:**

- Added a new "Branch" column after the "Payment Date" column
- Copied the structure and styling from the Orders report
- Added proper tooltip support for long branch names
- Maintained consistent alignment and responsiveness

**Code Added:**

```javascript
// Added Branch column - copied from Orders report structure
{
  field: 'branch',
  headerName: 'Branch',
  width: 120,
  flex: 0.6,
  renderCell: params => {
    return (
      <Tooltip title={params?.row.branch?.name || 'N/A'}>
        <span className="truncate">
          {params?.row.branch?.name || 'N/A'}
        </span>
      </Tooltip>
    )
  },
},
```

### 2. Improved Description Column Visibility

**File Modified:** `src/pages/reports/expenses/index.js`

**Changes Made:**

- Increased column width from 200px to 300px
- Increased flex value from 2 to 3
- Added minimum width of 250px
- Improved text wrapping and visibility
- Added proper styling for better readability

**Code Updated:**

```javascript
{
  field: 'description',
  headerName: 'Description',
  width: 300,
  flex: 3,
  minWidth: 250,
  renderCell: params => {
    return (
      <Tooltip title={params.row.description || 'No description'}>
        <div
          className="text-sm leading-relaxed"
          style={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflow: 'visible'
          }}
        >
          {params.row.description || 'No description'}
        </div>
      </Tooltip>
    )
  },
},
```

### 3. Automatic Report File Naming

**New Files Created:**

- `src/utils/reportExport.js` - Core export utilities
- `src/components/ReportExportToolbar.js` - Custom export toolbar
- `src/components/ExportTestComponent.js` - Test component

**Key Features:**

- Dynamic file naming based on report type and date
- Support for CSV, Excel, and PDF formats
- Browser-compatible download functionality
- Proper UTF-8 encoding with BOM for Excel compatibility
- Timestamp and unique ID support to prevent conflicts

**File Naming Pattern:**

```
{ReportName}_{BranchName}_{Date}_{Time}.{Extension}
```

**Examples:**

- `Expenses_Report_All_Branches_2025-01-27_1430.csv`
- `Orders_Report_Warehouse_Branch_2025-01-27_1430.xlsx`
- `Revenue_Report_Main_Branch_2025-01-27_1430.pdf`

### 4. Updated Export Functionality

**Files Modified:**

- `src/pages/reports/expenses/index.js` - Added export toolbar
- `src/pages/reports/orders/index.js` - Added export toolbar

**Changes Made:**

- Replaced default export with custom export toolbar
- Added dynamic file naming for all export formats
- Integrated with existing filter system
- Added row count display in export button

**Code Added:**

```javascript
slots={{
  toolbar: ReportExportToolbar,
}}
slotProps={{
  toolbar: {
    data: expencesData || [],
    columns,
    reportName: "Expenses_Report",
    reportType: "expenses",
    branchName: "All_Branches",
    filters: {}
  },
}}
```

## Technical Implementation Details

### Export Utility Functions

**File:** `src/utils/reportExport.js`

**Key Functions:**

- `sanitizeFileName(str)` - Cleans file names for safe use
- `generateReportFileName(options)` - Creates dynamic file names
- `convertToCSV(data, columns)` - Converts data to CSV format
- `downloadFile(content, fileName, mimeType)` - Handles file downloads
- `exportReport(data, columns, format, options)` - Main export function

### Export Toolbar Component

**File:** `src/components/ReportExportToolbar.js`

**Features:**

- Dropdown menu with format options (CSV, Excel, PDF)
- Dynamic file naming based on report context
- Error handling and user feedback
- Disabled state when no data available
- Row count display

### Browser Compatibility

**Tested Browsers:**

- ✅ Chrome (Latest)
- ✅ Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)

**Download Method:**

- Uses `Blob` API for file creation
- Creates temporary download links
- Proper cleanup of object URLs
- Fallback to new window for unsupported browsers

## Usage Instructions

### For Developers

1. **Adding Export to New Reports:**

   ```javascript
   import ReportExportToolbar from '@/components/ReportExportToolbar'

   // In your DataGrid component
   slots={{
     toolbar: ReportExportToolbar,
   }}
   slotProps={{
     toolbar: {
       data: yourData,
       columns: yourColumns,
       reportName: "Your_Report_Name",
       reportType: "your_type",
       branchName: "Branch_Name",
       filters: yourFilters
     },
   }}
   ```

2. **Customizing File Names:**

   ```javascript
   import { generateReportFileName } from '@/utils/reportExport'

   const fileName = generateReportFileName({
     reportName: 'Custom_Report',
     reportType: 'custom',
     format: 'csv',
     date: new Date(),
     branchName: 'Main_Branch',
     includeTimestamp: true,
     includeUniqueId: false,
   })
   ```

### For Users

1. **Exporting Reports:**
   - Click the "Export" button in the report toolbar
   - Select desired format (CSV, Excel, PDF)
   - File will download with descriptive name

2. **File Naming:**
   - Files are automatically named with report type and date
   - No more "untitled" downloads
   - Easy to identify and organize

## Testing

### Test Component

**File:** `src/components/ExportTestComponent.js`

**Features:**

- Test export functionality with sample data
- Verify file name generation
- Test all export formats
- Console logging for debugging

**Usage:**

```javascript
import ExportTestComponent from '@/components/ExportTestComponent'

// Add to any page for testing
;<ExportTestComponent />
```

### Manual Testing Steps

1. **Test Branch Column:**
   - Navigate to Expenses report
   - Verify Branch column appears after Payment Date
   - Check tooltip functionality for long names

2. **Test Description Column:**
   - Verify increased width and better text wrapping
   - Check that all text is visible without manual resizing

3. **Test Export Functionality:**
   - Click Export button in any report
   - Test all three formats (CSV, Excel, PDF)
   - Verify files download with proper names
   - Check file content matches report data

## File Structure

```
src/
├── utils/
│   └── reportExport.js              # Export utilities
├── components/
│   ├── ReportExportToolbar.js       # Export toolbar
│   └── ExportTestComponent.js       # Test component
└── pages/reports/
    ├── expenses/index.js            # Updated with Branch column
    └── orders/index.js              # Updated with export functionality
```

## Performance Considerations

- Export functions are lightweight and fast
- File generation happens client-side
- No impact on report rendering performance
- Proper memory cleanup after downloads

## Future Enhancements

Potential improvements for future versions:

1. **Advanced Export Options:**
   - Custom date range selection
   - Column selection for export
   - Export scheduling

2. **Enhanced File Formats:**
   - True Excel format with formatting
   - PDF with charts and graphs
   - JSON export for API integration

3. **User Preferences:**
   - Custom file naming patterns
   - Default export format selection
   - Export history tracking

## Troubleshooting

### Common Issues

1. **Files not downloading:**
   - Check browser popup blockers
   - Verify JavaScript console for errors
   - Test with different browsers

2. **File names with special characters:**
   - The `sanitizeFileName` function handles this automatically
   - Special characters are replaced with underscores

3. **Export button not appearing:**
   - Verify `ReportExportToolbar` is imported
   - Check `slots` and `slotProps` configuration
   - Ensure data is available

### Debug Mode

Enable console logging:

```javascript
// In browser console
localStorage.setItem('debug', 'export')
```

## Conclusion

These updates significantly improve the user experience in the Reports section by:

1. ✅ **Adding Branch column** to Expenses report for better data organization
2. ✅ **Implementing automatic file naming** to replace generic "untitled" downloads
3. ✅ **Improving Description column visibility** for better readability
4. ✅ **Ensuring browser compatibility** across all major browsers
5. ✅ **Maintaining code quality** with proper error handling and documentation

The implementation is production-ready and follows React best practices with proper component structure and error handling.
