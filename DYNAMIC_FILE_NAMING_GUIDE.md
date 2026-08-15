# Dynamic File Naming Implementation Guide

## Overview

This implementation provides a comprehensive solution for dynamic file naming in your HMS (Hospital Management System) reports. The system automatically generates meaningful, timestamped file names for all downloadable reports, replacing generic "untitled" downloads.

## Features

✅ **Automatic File Naming**: Reports are saved with descriptive names based on report type and context  
✅ **Timestamp Integration**: Files include date and time to prevent conflicts  
✅ **Browser Compatibility**: Works across Chrome, Edge, Firefox, and Safari  
✅ **Special Character Handling**: Safely handles spaces and special characters in file names  
✅ **Multiple Format Support**: Works with CSV, Excel, PDF, and other export formats  
✅ **Context Detection**: Automatically detects report type from page routes  
✅ **Branch Integration**: Includes branch information in file names when applicable

## File Structure

```
src/
├── utils/
│   ├── fileNamingUtils.js          # Core utility functions
│   ├── exportHandler.js            # Export handling logic
│   └── fileNamingTest.js           # Test functions
├── components/
│   ├── EnhancedCustomToolbar.js   # Updated toolbar with dynamic naming
│   ├── FilteredDataGrid.js        # Updated data grid component
│   ├── DynamicExportToolbar.js     # Alternative export toolbar
│   └── ReportWithDynamicExport.js  # Example implementation
└── pages/reports/
    ├── revenue/index.js            # Updated revenue report
    ├── expenses/index.js           # Updated expenses report
    └── orders/index.js             # Updated orders report
```

## Implementation Details

### 1. Core Utility Functions (`fileNamingUtils.js`)

#### Key Functions:

- **`sanitizeFileName(str)`**: Cleans file names by removing/replacing special characters
- **`generateTimestamp(date)`**: Creates timestamp strings (YYYY-MM-DD_HHMM)
- **`getFileExtension(format)`**: Maps format types to file extensions
- **`generateReportFileName(options)`**: Basic file name generation
- **`generateEnhancedReportFileName(options)`**: Advanced file naming with filters
- **`detectReportContext(pathname, props)`**: Auto-detects report context from routes

#### Example Usage:

```javascript
import { generateEnhancedReportFileName } from '@/utils/fileNamingUtils'

const fileName = generateEnhancedReportFileName({
  reportName: 'Revenue_Report',
  reportType: 'revenue',
  format: 'csv',
  date: new Date(),
  branchName: 'Main_Branch',
  filters: {
    fromDate: '2025-01-01',
    toDate: '2025-01-31',
  },
  includeTimestamp: true,
  includeUniqueId: false,
})
// Result: "Revenue_Report_Main_Branch_2025-01-01_to_2025-01-31_1430.csv"
```

### 2. Updated Components

#### EnhancedCustomToolbar.js

- Added dynamic file naming to export functionality
- Integrated with existing filter system
- Supports multiple export formats (CSV, Excel, PDF)

#### FilteredDataGrid.js

- Passes report context to toolbar
- Maintains backward compatibility
- Supports custom report names and types

### 3. Report Page Updates

All report pages now include:

- `reportName`: Descriptive name for the report
- `reportType`: Type identifier for context detection
- `branchName`: Branch information for file naming
- `filters`: Current filter state for enhanced naming

## File Naming Patterns

### Basic Pattern

```
{ReportName}_{BranchName}_{Date}_{Time}.{Extension}
```

### Enhanced Pattern (with filters)

```
{ReportName}_{BranchName}_{FilterInfo}_{Date}_{Time}.{Extension}
```

### Examples

| Report Type            | Generated File Name                                         |
| ---------------------- | ----------------------------------------------------------- |
| Revenue Report         | `Revenue_Report_Main_Branch_2025-01-27_1430.csv`            |
| Expenses with Category | `Expenses_Report_Office_Supplies_2025-01-27_1430.xlsx`      |
| Orders with Date Range | `Orders_Report_Warehouse_2025-01-01_to_2025-01-31_1430.pdf` |

## Usage in Components

### 1. Basic Implementation

```javascript
import FilteredDataGrid from '@/components/FilteredDataGrid'

const MyReport = () => {
  return (
    <FilteredDataGrid
      rows={data}
      columns={columns}
      reportName="My_Custom_Report"
      reportType="custom"
      branchName="Current_Branch"
      filters={{ category: 'sales' }}
    />
  )
}
```

### 2. Advanced Implementation

```javascript
import { generateEnhancedReportFileName } from '@/utils/fileNamingUtils'

const handleExport = (format) => {
  const fileName = generateEnhancedReportFileName({
    reportName: 'Custom_Report',
    reportType: 'custom',
    format,
    date: new Date(),
    branchName: 'Main_Branch',
    filters: currentFilters,
    includeTimestamp: true,
    includeUniqueId: false,
  })

  // Implement your export logic here
  exportData(data, fileName)
}
```

## Browser Compatibility

The implementation uses standard web APIs that are supported across all modern browsers:

- **Chrome**: ✅ Full support
- **Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support

## Testing

Run the test suite to verify functionality:

```javascript
import { runAllTests } from '@/utils/fileNamingTest'

// Run all tests
runAllTests()
```

## Configuration Options

### File Naming Options

```javascript
const options = {
  reportName: 'Custom_Report', // Override default report name
  reportType: 'custom', // Report type identifier
  format: 'csv', // Export format
  date: new Date(), // Report date
  branchName: 'Branch_Name', // Branch information
  filters: {}, // Current filters
  includeTimestamp: true, // Include timestamp in filename
  includeUniqueId: false, // Include unique ID for multiple downloads
}
```

### Context Detection

The system automatically detects report context from routes:

```javascript
const contextMap = {
  '/reports/revenue': {
    reportName: 'Revenue_Report',
    reportType: 'revenue',
    defaultFormat: 'csv',
  },
  '/reports/expenses': {
    reportName: 'Expenses_Report',
    reportType: 'expenses',
    defaultFormat: 'csv',
  },
  // ... more mappings
}
```

## Migration Guide

### For Existing Reports

1. **Update FilteredDataGrid usage**:

   ```javascript
   // Before
   <FilteredDataGrid
     rows={data}
     columns={columns}
   />

   // After
   <FilteredDataGrid
     rows={data}
     columns={columns}
     reportName="Your_Report_Name"
     reportType="your_type"
     branchName="Branch_Name"
     filters={currentFilters}
   />
   ```

2. **Update component props**:
   ```javascript
   // Add these props to your report components
   const MyReport = ({ reportName, reportType, branchName, filters }) => {
     // Component logic
   }
   ```

### For New Reports

1. Use the `ReportWithDynamicExport` component as a template
2. Implement the `useFileNamingInComponent` hook for custom logic
3. Follow the naming conventions for consistency

## Troubleshooting

### Common Issues

1. **File names with special characters**: The `sanitizeFileName` function handles this automatically
2. **Multiple downloads on same day**: Use `includeUniqueId: true` to prevent conflicts
3. **Browser compatibility**: Ensure you're using modern browser APIs

### Debug Mode

Enable debug logging:

```javascript
import { generateEnhancedReportFileName } from '@/utils/fileNamingUtils'

// Enable debug mode
const fileName = generateEnhancedReportFileName({
  // ... options
  debug: true, // This will log the generation process
})
```

## Performance Considerations

- File name generation is lightweight and fast
- Context detection uses efficient route matching
- Sanitization is optimized for common use cases
- No impact on report rendering performance

## Future Enhancements

Potential improvements for future versions:

1. **User Preferences**: Allow users to customize file naming patterns
2. **Template System**: Support for custom file name templates
3. **Batch Exports**: Enhanced naming for multiple file exports
4. **Cloud Integration**: Direct cloud storage with dynamic naming
5. **Audit Trail**: Track file naming patterns for compliance

## Support

For issues or questions:

1. Check the test suite: `src/utils/fileNamingTest.js`
2. Review the example implementation: `src/components/ReportWithDynamicExport.js`
3. Verify browser compatibility with the provided test cases

## Conclusion

This implementation provides a robust, scalable solution for dynamic file naming in your HMS reports. The system is designed to be:

- **Easy to use**: Minimal code changes required
- **Flexible**: Supports various naming patterns and formats
- **Maintainable**: Well-documented and tested
- **Extensible**: Easy to add new features and formats

The dynamic file naming system will significantly improve the user experience by providing meaningful, organized file names for all report downloads.
