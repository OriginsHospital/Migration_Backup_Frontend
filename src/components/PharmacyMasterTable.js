import React, { useState } from 'react'
import { Close, Edit, EditNote } from '@mui/icons-material'
import {
  Autocomplete,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TableHead,
  TextField,
  Typography,
} from '@mui/material'
import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import FilteredDataGrid from './FilteredDataGrid'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
function PharmacyMasterTable({
  rows,
  fields,
  createFields,
  editRowHandler,
  handleRowEdit,
  selectedRow,
  setSelectedRow,
  getDynamicOptions,
  // getEachFieldBasedOnType,
}) {
  // const [page, setPage] = React.useState(0)
  // const [rowsPerPage, setRowsPerPage] = React.useState(5)
  // const [newCategory, setNewCategory] = React.useState({
  //     categoryName: '',
  //     taxPercent: 0
  // });
  const dispatch = useDispatch()
  const dropdowns = useSelector((store) => store.dropdowns)

  // // Avoid a layout jump when reaching the last page with empty rows.
  // const emptyRows =
  //   page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0

  // const handleChangePage = (event, newPage) => {
  //   setPage(newPage)
  // }
  // // editPharmacyMasterData

  // const handleChangeRowsPerPage = event => {
  //   setRowsPerPage(parseInt(event.target.value, 10))
  //   setPage(0)
  // }

  // Custom filters configuration
  const customFilters =
    fields?.map((field) => ({
      field: field.field,
      label: field.headerName,
      type:
        field.type === 'boolean'
          ? 'select'
          : field.type === 'email'
            ? 'text'
            : field.type,
      options:
        field.type === 'boolean'
          ? [
              { value: '1', label: 'Yes' },
              { value: '0', label: 'No' },
            ]
          : undefined,
    })) || []

  // Filter logic function
  const filterData = (data, filters) => {
    return data.filter((row) => {
      return Object.entries(filters).every(([field, filterConfig]) => {
        if (!filterConfig || !filterConfig.value) return true

        const cellValue = row[field]
        const { prefix, value } = filterConfig

        if (!cellValue && value !== '') return false

        switch (prefix) {
          case 'LIKE':
            return cellValue
              ?.toString()
              .toLowerCase()
              .includes(value.toLowerCase())
          case 'NOT LIKE':
            return !cellValue
              ?.toString()
              .toLowerCase()
              .includes(value.toLowerCase())
          case 'IN':
            return Array.isArray(value) && value.length > 0
              ? value.includes(cellValue?.toString())
              : true
          case 'NOT IN':
            return Array.isArray(value) && value.length > 0
              ? !value.includes(cellValue?.toString())
              : true
          case 'LESS_THAN':
            return parseFloat(cellValue) < parseFloat(value)
          case 'GREATER_THAN':
            return parseFloat(cellValue) > parseFloat(value)
          default:
            return true
        }
      })
    })
  }

  // Get unique values for select filters
  const getUniqueValues = (field) => {
    const uniqueValues = [
      ...new Set(rows?.map((row) => row[field])?.filter(Boolean)),
    ]
    return uniqueValues.map((value) => ({
      value: value.toString(),
      label: value.toString(),
    }))
  }

  const handleEditChange = (event) => {
    console.log('handleEditChange', event.target, selectedRow)
    // if (event.target.name === 'incidentDate') {
    //   setSelectedRow(prevSelectedRow => ({
    //     ...prevSelectedRow,
    //     [event.target.name]: dayjs(event.target.value),
    //   }))
    // } else {
    setSelectedRow((prevSelectedRow) => ({
      ...prevSelectedRow,
      [event.target.name]: event.target.value,
    }))

    // }
  }
  const handleEditSave = async () => {
    // Create a proper payload with keys from createFields
    const payload = {}
    let selectedClone = { ...selectedRow }
    if (selectedClone?.personsList) {
      selectedClone.personId = selectedClone.personsList
        .map((each) => each.value)
        .join(',')
    }
    console.log('selectedClone', selectedClone)
    // Add each field from createFields to the payload
    createFields.forEach((field) => {
      payload[field.name || field.id] = selectedClone?.[field.name || field.id]
    })

    // Add the id to the payload
    payload.id = selectedRow?.id

    console.log('edit Payload', payload)
    editRowHandler.mutate(payload)
    setSelectedRow(null)

    // close the modal
    dispatch(closeModal())
  }
  // const getDynamicOptions = field => {
  //   switch (field.id) {
  //     case 'visit_type':
  //       return dropdowns?.visitTypes?.map(each => (
  //         <MenuItem key={each.id} value={each.id}>
  //           {each.name}
  //         </MenuItem>
  //       ))
  //     case 'designationId':
  //       return dropdowns?.otPersonDesignation?.map(each => (
  //         <MenuItem key={each.id} value={each.id}>
  //           {each.name}
  //         </MenuItem>
  //       ))
  //     case 'labTestGroupId':
  //       return dropdowns?.labTestGroupList?.map(each => (
  //         <MenuItem key={each.id} value={each.id}>
  //           {each.name}
  //         </MenuItem>
  //       ))
  //     case 'sampleTypeId':
  //       return dropdowns?.labTestSampleTypeList?.map(each => (
  //         <MenuItem key={each.id} value={each.id}>
  //           {each.name}
  //         </MenuItem>
  //       ))
  //     default:
  //       return []
  //   }
  // }
  const getEachFieldBasedOnType = (eachField, index) => {
    if (!eachField?.required) return null
    let options = []
    console.log('get each field based on type', selectedRow, eachField)
    switch (eachField.type) {
      case 'text':
        return (
          <TextField
            name={eachField.name}
            label={eachField.label}
            value={selectedRow?.[eachField.name]}
            onChange={handleEditChange}
            key={eachField + index}
            type="text"
          />
        )
      case 'number':
        return (
          <TextField
            name={eachField.name}
            label={eachField.label}
            value={selectedRow?.[eachField.name]}
            onChange={handleEditChange}
            key={eachField + index}
            type="number"
          />
        )
      case 'select':
        // console.log('eachField',
        //   selectedRow)
        options = getDynamicOptions(eachField)
        console.log('options', selectedRow?.[eachField.id])
        const selectedValue =
          options?.find(
            (option) => option.value === selectedRow?.[eachField.id],
          ) || null
        console.log('selectedValue', selectedValue)
        return (
          <Autocomplete
            value={selectedValue}
            options={options}
            getOptionLabel={(option) => option.label || ''}
            onChange={(event, newValue) => {
              handleEditChange({
                target: {
                  name: eachField.id,
                  value: newValue ? newValue.value : '',
                },
              })
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={eachField.label}
                variant="outlined"
              />
            )}
          />
        )
      case 'trueOrFalse':
        return (
          <FormControl>
            <InputLabel id={eachField.id}>{eachField.label}</InputLabel>
            <Select
              value={selectedRow?.[eachField.id]}
              label={eachField.label}
              name={eachField.id}
              labelId={eachField.id}
              onChange={handleEditChange}
              key={eachField.id + index}
            >
              <MenuItem key={'True'} value={1}>
                True
              </MenuItem>
              <MenuItem key={'False'} value={0}>
                False
              </MenuItem>
            </Select>
          </FormControl>
        )
      case 'email':
        return (
          <TextField
            name={eachField.name}
            label={eachField.label}
            value={selectedRow?.[eachField.name]}
            onChange={handleEditChange}
            key={eachField + index}
            type="email"
          />
        )
      case 'date':
        return (
          <DatePicker
            value={
              selectedRow?.[eachField.name]
                ? dayjs(selectedRow[eachField.name])
                : null
            }
            onChange={() => {
              handleEditChange({
                target: {
                  name: eachField.name,
                  value: dayjs(event.target.value),
                },
              })
            }}
            key={eachField + index}
            label={eachField.label}
            name={eachField.name}
            format="DD-MM-YYYY"
          />
        )
      case 'multiSelect':
        options = getDynamicOptions(eachField)
        console.log('eachField', eachField, selectedRow, options)
        let selectedIds = selectedRow?.[eachField?.id]?.map(
          (each) => each.id || each.value,
        )
        console.log('selectedIds', selectedIds)
        const selectedValues =
          options?.filter((option) => selectedIds?.includes(option.value)) || []
        console.log('selectedValues', selectedValues)
        return (
          <FormControl>
            {/* <InputLabel id={eachField.id}>{eachField.label}</InputLabel> */}
            <Autocomplete
              multiple
              value={selectedValues}
              getOptionLabel={(option) => {
                // console.log('option', option, selectedValues)
                return option.label || ''
              }}
              onChange={(event, newValue) => {
                handleEditChange({
                  target: { name: eachField.id, value: newValue },
                })
              }}
              options={options}
              labelId={eachField.id}
              label={eachField.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={eachField.label}
                  variant="outlined"
                />
              )}
            />
            {/* {options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select> */}
          </FormControl>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full max-w-[calc(100vw-550px)] overflow-y-auto ">
      <FilteredDataGrid
        columns={
          fields && [
            ...fields,
            {
              field: 'actionField',
              headerName: 'Action',
              width: 100,
              renderCell: (params) => {
                return (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<EditNote />}
                    onClick={(e) => handleRowEdit(e, params.row)}
                  >
                    Edit
                  </Button>
                )
              },
            },
          ]
        }
        rows={rows || []}
        customFilters={customFilters}
        filterData={filterData}
        getUniqueValues={getUniqueValues}
        getRowId={(row) => row.id}
        pageSizeOptions={[5, 7, 10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { page: 1, pageSize: 100 } },
          filter: {
            filterModel: {
              items: [],
              quickFilterExcludeHiddenColumns: true,
            },
          },
        }}
        sx={{
          '& .MuiDataGrid-main': { height: '60vh' },
          '& .MuiDataGrid-virtualScroller': {
            overflow: 'auto',
          },
          '& .MuiDataGrid-virtualScrollerContent': {
            maxWidth: 'fit-content',
          },
        }}
        columnVisibilityModel={{
          id: false,
        }}
      />
      <Modal
        uniqueKey="editModalInPharmacyMasterData"
        closeOnOutsideClick={false}
        maxWidth={'xs'}
      >
        <div className="flex justify-between items-center">
          <Typography variant="h6">Edit </Typography>
          <IconButton
            onClick={() => {
              dispatch(closeModal())
              setSelectedRow(null)
            }}
          >
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col gap-5 p-3">
          {
            // selectedRow
            createFields?.map((eachField, index) => {
              return getEachFieldBasedOnType(eachField, index)
            })
          }
          <Button className="" onClick={handleEditSave}>
            Save{' '}
          </Button>
        </div>
      </Modal>
    </div>
    // </TableContainer>
  )
}
export default PharmacyMasterTable
