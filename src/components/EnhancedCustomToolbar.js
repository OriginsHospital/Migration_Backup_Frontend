import React, { useState, useEffect } from 'react'
import { GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid'
import {
  Button,
  Menu,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Input,
} from '@mui/material'
import { FilterList } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import {
  generateReportFileName,
  detectReportContext,
  generateEnhancedReportFileName,
} from '@/utils/fileNamingUtils'
import { createExportHandler } from '@/utils/exportHandler'

const getDefaultPrefixOptions = (type) => {
  switch (type) {
    case 'text':
      return [
        { label: 'Like', value: 'LIKE' },
        { label: 'Not Like', value: 'NOT LIKE' },
      ]
    case 'select':
      return [
        { label: 'In', value: 'IN' },
        { label: 'Not In', value: 'NOT IN' },
      ]
    case 'number':
      return [
        { label: 'Less Than', value: 'LESS_THAN' },
        { label: 'Greater Than', value: 'GREATER_THAN' },
      ]
    default:
      return []
  }
}

// const SelectFilter = ({ config, onChange }) => {
//   const [selectedPrefix, setSelectedPrefix] = useState(
//     config.prefixOptions?.[0]?.value || getDefaultPrefixOptions(config.type)[0].value
//   );
//   const [selectedValues, setSelectedValues] = useState([]);

//   const prefixOptions = config.prefixOptions || getDefaultPrefixOptions(config.type);

//   const handleChange = (values) => {
//     setSelectedValues(values);
//     onChange({
//       prefix: selectedPrefix,
//       value: values
//     });
//   };

//   const handlePrefixChange = (prefix) => {
//     setSelectedPrefix(prefix);
//     onChange({
//       prefix,
//       value: selectedValues
//     });
//   };

//   return (
//     <div className="filter-container">
//       <Select
//         value={selectedPrefix}
//         onChange={handlePrefixChange}
//         options={prefixOptions}
//         className="prefix-select"
//       />
//       {config.type === 'select' ? (
//         <Select
//           mode="multiple"
//           value={selectedValues}
//           onChange={handleChange}
//           options={config.options}
//           className="value-select"
//         />
//       ) : (
//         <Input
//           value={selectedValues[0] || ''}
//           onChange={(e) => handleChange([e.target.value])}
//           type={config.type === 'number' ? 'number' : 'text'}
//         />
//       )}
//     </div>
//   );
// };

const EnhancedCustomToolbar = ({
  customFilters = [],
  onFilterChange,
  getUniqueValues,
  reportName,
  reportType,
  branchName,
  filters = {},
  data = [],
  columns = [],
  hideExport = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [filterValues, setFilterValues] = useState({})
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const router = useRouter()
  const dropdowns = useSelector((store) => store.dropdowns)

  // Create export handler
  const exportHandler = createExportHandler({
    reportName,
    reportType,
    branchName,
    filters: { ...filters, ...filterValues },
  })

  useEffect(() => {
    const count = Object.values(filterValues).filter((value) => {
      if (value === null || value === '') return false
      if (typeof value === 'object' && 'start' in value && 'end' in value) {
        return !!(value.start || value.end)
      }
      return true
    }).length
    setActiveFilterCount(count)
  }, [filterValues])

  const handleFilterClick = (event) => {
    // console.log('handleFilterClick', event.currentTarget)
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleFilterChange = (field, value) => {
    setFilterValues((prev) => {
      const currentValue = prev[field]
      const newValue = {
        prefix: value.prefix,
        value: value.value,
      }

      // Only update if the value has actually changed
      if (JSON.stringify(currentValue) === JSON.stringify(newValue)) {
        return prev
      }

      return {
        ...prev,
        [field]: newValue,
      }
    })
  }

  const handleApplyFilters = () => {
    onFilterChange(filterValues)
    handleClose()
  }

  const handleClearFilters = () => {
    const clearedFilters = {}
    customFilters.forEach((filter) => {
      clearedFilters[filter.field] = null
      // clearedFilters[filter.field] = filter.type === 'select'
      //   ? { prefix: getDefaultPrefixOptions('select')[0].value, value: [] }
      //   : null
    })
    setFilterValues(clearedFilters)
    onFilterChange(clearedFilters)
    handleClose()
  }

  // Generate dynamic file name based on context
  const generateDynamicFileName = (format = 'csv') => {
    // Detect report context from router path
    const reportContext = detectReportContext(router.pathname, {
      branchId: branchName,
      branchName: branchName,
    })

    // Get branch name from dropdowns if not provided
    const currentBranchName =
      branchName ||
      dropdowns?.branches?.find((branch) => branch.id === branchName)?.name ||
      'All_Branches'

    // Use enhanced file naming with filters
    return generateEnhancedReportFileName({
      reportName: reportName || reportContext.reportName,
      reportType: reportType || reportContext.reportType,
      format,
      date: new Date(),
      branchName: currentBranchName,
      filters: { ...filters, ...filterValues },
      includeTimestamp: true,
      includeUniqueId: false, // Set to true if you want unique IDs for multiple downloads
    })
  }

  // Custom export handler with dynamic naming
  const handleExport = (format) => {
    const fileName = generateDynamicFileName(format)

    // Override the default export behavior
    const exportButton = document.querySelector(
      '[data-testid="GridToolbarExportButton"]',
    )
    if (exportButton) {
      // Store the filename for the export
      exportButton.setAttribute('data-filename', fileName)
    }
  }

  const renderFilterInput = (filter) => {
    switch (filter.type) {
      case 'text':
      case 'number':
        return (
          <div className="flex gap-1">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Condition</InputLabel>
              <Select
                value={
                  filterValues[filter.field]?.prefix ||
                  getDefaultPrefixOptions(filter.type)[0].value
                }
                label="Condition"
                onChange={(e) =>
                  handleFilterChange(filter.field, {
                    prefix: e.target.value,
                    value: filterValues[filter.field]?.value || '',
                  })
                }
              >
                {getDefaultPrefixOptions(filter.type).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              key={filter.field}
              fullWidth
              size="small"
              type={filter.type}
              label={filter.label}
              value={filterValues[filter.field]?.value || ''}
              onChange={(e) => {
                const newValue = e.target.value
                handleFilterChange(filter.field, {
                  prefix:
                    filterValues[filter.field]?.prefix ||
                    getDefaultPrefixOptions(filter.type)[0].value,
                  value: newValue,
                })
              }}
              onKeyDown={(e) => {
                // Prevent the menu from closing on key press
                e.stopPropagation()
              }}
              autoComplete="off"
            />
          </div>
        )

      case 'select':
        return (
          <div className="flex gap-1">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Condition</InputLabel>
              <Select
                value={
                  filterValues[filter.field]?.prefix ||
                  getDefaultPrefixOptions('select')[0].value
                }
                label="Condition"
                onChange={(e) => {
                  handleFilterChange(filter.field, {
                    prefix: e.target.value,
                    value: filterValues[filter.field]?.value || [],
                  })
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {getDefaultPrefixOptions('select').map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{filter.label}</InputLabel>
              <Select
                multiple
                value={
                  Array.isArray(filterValues[filter.field]?.value)
                    ? filterValues[filter.field].value
                    : []
                }
                label={filter.label}
                onChange={(e) => {
                  handleFilterChange(filter.field, {
                    prefix:
                      filterValues[filter.field]?.prefix ||
                      getDefaultPrefixOptions('select')[0].value,
                    value: Array.isArray(e.target.value)
                      ? e.target.value
                      : [e.target.value],
                  })
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      // Get the display label for the value
                      const options =
                        filter.options ||
                        (getUniqueValues ? getUniqueValues(filter.field) : [])
                      const option = options.find(
                        (opt) => opt.value === value || opt === value,
                      )
                      const displayLabel = option?.label || option || value
                      return <Chip key={value} label={displayLabel} />
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {(
                  filter.options ||
                  (getUniqueValues ? getUniqueValues(filter.field) : [])
                ).map((option) => (
                  <MenuItem
                    key={option.value || option}
                    value={option.value || option}
                  >
                    {option.label || option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        )

      case 'dateRange':
        const dateRange = filterValues[filter.field] || {
          start: null,
          end: null,
        }
        return (
          <div className="flex gap-1">
            <DatePicker
              label="Start Date"
              value={dateRange.start ? dayjs(dateRange.start) : null}
              onChange={(value) =>
                handleFilterChange(filter.field, {
                  ...dateRange,
                  start: value ? value.format('YYYY-MM-DD') : null,
                })
              }
            />
            <DatePicker
              label="End Date"
              value={dateRange.end ? dayjs(dateRange.end) : null}
              onChange={(value) =>
                handleFilterChange(filter.field, {
                  ...dateRange,
                  end: value ? value.format('YYYY-MM-DD') : null,
                })
              }
            />
          </div>
        )

      default:
        return null
    }
  }

  // Custom Export Component with Dynamic Naming
  const CustomExportButton = () => {
    const [exportMenuAnchor, setExportMenuAnchor] = useState(null)

    const handleExportClick = (event) => {
      setExportMenuAnchor(event.currentTarget)
    }

    const handleExportClose = () => {
      setExportMenuAnchor(null)
    }

    const handleExportFormat = (format) => {
      try {
        // Update export handler with current data
        exportHandler.updateOptions({
          filters: { ...filters, ...filterValues },
        })

        // Export based on format
        switch (format) {
          case 'csv':
            exportHandler.exportCSV(data, columns, 'csv')
            break
          case 'xlsx':
            exportHandler.exportExcel(data, columns)
            break
          case 'pdf':
            exportHandler.exportPDF(data, columns)
            break
          default:
            exportHandler.exportCSV(data, columns, format)
        }

        console.log(`Exporting ${format} with ${data.length} rows`)
      } catch (error) {
        console.error('Export failed:', error)
        alert('Export failed. Please try again.')
      }

      handleExportClose()
    }

    return (
      <>
        <Button onClick={handleExportClick} size="small" variant="outlined">
          Export
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExportFormat('csv')}>
            Download as CSV
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('xlsx')}>
            Download as Excel
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('pdf')}>
            Download as PDF
          </MenuItem>
        </Menu>
      </>
    )
  }

  return (
    <GridToolbarContainer>
      <Button
        startIcon={<FilterList />}
        onClick={handleFilterClick}
        size="small"
        color={activeFilterCount > 0 ? 'primary' : 'inherit'}
      >
        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
      </Button>
      {!hideExport && <CustomExportButton />}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onKeyDown={(e) => {
          // Prevent menu from closing on key press
          e.stopPropagation()
        }}
      >
        <Box sx={{ p: 2, maxWidth: 500, minWidth: 300 }}>
          <div className="flex flex-col gap-2 p-2">
            {customFilters.map((filter) => (
              <div key={filter.field} className="mb-2">
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
          {/* <Divider sx={{ my: 2 }} /> */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleClearFilters} size="small">
              Clear
            </Button>
            <Button
              onClick={handleApplyFilters}
              variant="contained"
              size="small"
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>
    </GridToolbarContainer>
  )
}

export default EnhancedCustomToolbar
