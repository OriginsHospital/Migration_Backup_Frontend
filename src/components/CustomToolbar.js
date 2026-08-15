import React, { useState, useEffect } from 'react'
import {
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid'
import {
  Button,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Box,
  Divider,
} from '@mui/material'
import { FilterList } from '@mui/icons-material'

function CustomToolbar({ customFilters = [], applyFilters }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [filterValues, setFilterValues] = useState({})
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Initialize filter values
  // useEffect(() => {
  //   const initialFilters = {}
  //   customFilters.forEach(filter => {
  //     initialFilters[filter.field] = ''
  //   })
  //   setFilterValues(initialFilters)
  // }, [customFilters])

  // Update active filter count whenever filterValues change
  useEffect(() => {
    const count = Object.values(filterValues).filter(value => value !== '')
      .length
    setActiveFilterCount(count)
  }, [filterValues])

  const handleFilterClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleFilterChange = (field, value) => {
    setFilterValues(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleApplyFilters = () => {
    applyFilters(filterValues)
    handleClose()
  }

  const handleClearFilters = () => {
    const clearedFilters = {}
    customFilters.forEach(filter => {
      clearedFilters[filter.field] = ''
    })
    setFilterValues(clearedFilters)
    applyFilters(clearedFilters)
    handleClose()
  }

  return (
    <div>
      <GridToolbarContainer>
        <Button
          startIcon={<FilterList />}
          onClick={handleFilterClick}
          size="small"
          color={activeFilterCount > 0 ? 'primary' : 'inherit'}
        >
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        <GridToolbarExport />
      </GridToolbarContainer>

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
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          {customFilters.map((filter, index) => (
            <Box key={filter.field} sx={{ mb: 2 }}>
              {filter.type === 'text' && (
                <TextField
                  fullWidth
                  size="small"
                  label={filter.label}
                  value={filterValues[filter.field] || ''}
                  onChange={e =>
                    handleFilterChange(filter.field, e.target.value)
                  }
                />
              )}
              {filter.type === 'select' && (
                <FormControl fullWidth size="small">
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filterValues[filter.field] || ''}
                    label={filter.label}
                    onChange={e =>
                      handleFilterChange(filter.field, e.target.value)
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    {filter.options?.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
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
    </div>
  )
}

export default CustomToolbar
