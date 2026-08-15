import React, { useState, useEffect, useMemo } from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Autocomplete } from '@mui/material'
import dayjs from 'dayjs'
import { FilterList, Clear } from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { getSubCategoryListByCategoryId } from '@/constants/apis'

const ExpensesFilter = ({ onFilterChange, onClearFilters, filters = {} }) => {
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches, expenseCategories } = dropdowns

  // Filter out specific branches from dropdown
  const filteredBranches = useMemo(() => {
    const excludedBranchNames = ['OBH', '02', 'kmm03', 'HYD-KKT']
    return (branches || []).filter(
      (branch) => !excludedBranchNames.includes(branch.name),
    )
  }, [branches])

  const paymentMode = [
    { id: 'CASH', name: 'CASH' },
    { id: 'ONLINE', name: 'ONLINE' },
  ]

  const [localFilters, setLocalFilters] = useState({
    categoryId: filters.categoryId || '',
    subCategoryId: filters.subCategoryId || '',
    branchId: filters.branchId || '',
    paymentMode: filters.paymentMode || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  })

  const [subCategories, setSubCategories] = useState([])
  const [loadingSubCategories, setLoadingSubCategories] = useState(false)

  // Sync local filters with parent filters
  useEffect(() => {
    setLocalFilters({
      categoryId: filters.categoryId || '',
      subCategoryId: filters.subCategoryId || '',
      branchId: filters.branchId || '',
      paymentMode: filters.paymentMode || '',
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
    })
  }, [filters])

  // Fetch subcategories when category changes
  useEffect(() => {
    if (localFilters.categoryId) {
      setLoadingSubCategories(true)
      getSubCategoryListByCategoryId(user?.accessToken, localFilters.categoryId)
        .then((res) => {
          if (res.status === 200) {
            setSubCategories(res.data || [])
          }
        })
        .catch((err) => {
          console.error('Error fetching subcategories:', err)
          setSubCategories([])
        })
        .finally(() => {
          setLoadingSubCategories(false)
        })
    } else {
      setSubCategories([])
      setLocalFilters((prev) => ({ ...prev, subCategoryId: '' }))
    }
  }, [localFilters.categoryId, user?.accessToken])

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value,
    }

    // Clear subcategory if category changes
    if (field === 'categoryId') {
      newFilters.subCategoryId = ''
    }

    setLocalFilters(newFilters)
  }

  const handleApplyFilters = () => {
    // Convert date objects to strings for API
    const apiFilters = { ...localFilters }

    if (apiFilters.startDate) {
      apiFilters.startDate = dayjs(apiFilters.startDate).format('DD-MM-YYYY')
    }
    if (apiFilters.endDate) {
      apiFilters.endDate = dayjs(apiFilters.endDate).format('DD-MM-YYYY')
    }

    // Map frontend filter names to backend parameter names
    const backendFilters = {
      categoryId: apiFilters.categoryId,
      subCategoryId: apiFilters.subCategoryId,
      branchId: apiFilters.branchId,
      paymentMode: apiFilters.paymentMode,
      startDate: apiFilters.startDate,
      endDate: apiFilters.endDate,
    }

    console.log('ExpensesFilter: Applying filters:', apiFilters)
    console.log('ExpensesFilter: Backend filters:', backendFilters)
    onFilterChange(backendFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      categoryId: '',
      subCategoryId: '',
      branchId: '',
      paymentMode: '',
      startDate: '',
      endDate: '',
    }
    console.log('ExpensesFilter: Clearing filters')
    setLocalFilters(clearedFilters)
    onClearFilters()
  }

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(
      (value) => value !== null && value !== undefined && value !== '',
    ).length
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">
          Filter Expenses
        </Typography>
        {getActiveFilterCount() > 0 && (
          <Chip
            label={`${getActiveFilterCount()} active`}
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 2,
        }}
      >
        {/* Category Filter */}
        <FormControl fullWidth size="small">
          <Autocomplete
            options={expenseCategories || []}
            getOptionLabel={(option) => option.name}
            value={
              expenseCategories?.find(
                (cat) => cat.id === localFilters.categoryId,
              ) || null
            }
            onChange={(_, value) =>
              handleFilterChange('categoryId', value?.id || '')
            }
            renderInput={(params) => <TextField {...params} label="Category" />}
          />
        </FormControl>

        {/* Sub Category Filter */}
        <FormControl fullWidth size="small">
          <Autocomplete
            options={subCategories || []}
            getOptionLabel={(option) => option.ledgerName}
            value={
              subCategories?.find(
                (sub) => sub.id === localFilters.subCategoryId,
              ) || null
            }
            onChange={(_, value) =>
              handleFilterChange('subCategoryId', value?.id || '')
            }
            disabled={!localFilters.categoryId || loadingSubCategories}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sub Category"
                placeholder={
                  loadingSubCategories ? 'Loading...' : 'Select sub category'
                }
              />
            )}
          />
        </FormControl>

        {/* Branch Filter */}
        <FormControl fullWidth size="small">
          <Autocomplete
            options={filteredBranches}
            getOptionLabel={(option) => option.name}
            value={
              filteredBranches?.find(
                (branch) => branch.id === localFilters.branchId,
              ) || null
            }
            onChange={(_, value) =>
              handleFilterChange('branchId', value?.id || '')
            }
            renderInput={(params) => <TextField {...params} label="Branch" />}
          />
        </FormControl>

        {/* Payment Method Filter */}
        <FormControl fullWidth size="small">
          <Autocomplete
            options={paymentMode || []}
            getOptionLabel={(option) => option.name}
            value={
              paymentMode?.find(
                (mode) => mode.id === localFilters.paymentMode,
              ) || null
            }
            onChange={(_, value) =>
              handleFilterChange('paymentMode', value?.id || '')
            }
            renderInput={(params) => (
              <TextField {...params} label="Payment Method" />
            )}
          />
        </FormControl>

        {/* Date Range Filters */}
        <DatePicker
          label="Start Date"
          value={localFilters.startDate ? dayjs(localFilters.startDate) : null}
          onChange={(value) => handleFilterChange('startDate', value)}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
            },
          }}
        />

        <DatePicker
          label="End Date"
          value={localFilters.endDate ? dayjs(localFilters.endDate) : null}
          onChange={(value) => handleFilterChange('endDate', value)}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          onClick={handleClearFilters}
          startIcon={<Clear />}
          variant="outlined"
          size="small"
        >
          Clear Filters
        </Button>
        <Button onClick={handleApplyFilters} variant="contained" size="small">
          Apply Filters
        </Button>
      </Box>
    </Paper>
  )
}

export default ExpensesFilter
