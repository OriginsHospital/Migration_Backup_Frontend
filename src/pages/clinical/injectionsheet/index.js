import CustomToolbar from '@/components/CustomToolbar'
import Modal from '@/components/Modal'
import { withPermission } from '@/components/withPermission'
import {
  addNewInjection,
  getInjectionSheetList,
  getOTDropdowns,
  saveInjectionChanges,
  getInjectionSuggestionList,
  getAllPatients,
} from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  Button,
  Chip,
  FormControl,
  gridClasses,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Autocomplete,
  Typography,
  IconButton,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

dayjs.extend(customParseFormat)

function parseInjectionDateTime(administeredDate, administeredTime) {
  if (!administeredDate) return null
  const time = administeredTime || '00:00'
  const iso = dayjs(`${administeredDate}T${time}`)
  if (iso.isValid()) return iso
  const withAmPm = dayjs(
    `${administeredDate} ${time}`,
    'YYYY-MM-DD hh:mm A',
    true,
  )
  if (withAmPm.isValid()) return withAmPm
  const dOnly = dayjs(administeredDate)
  return dOnly.isValid() ? dOnly.hour(0).minute(0).second(0) : null
}
import { LinearProgress } from '@mui/material'
import { debounce } from 'lodash'
import { Close } from '@mui/icons-material'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { useRouter } from 'next/router'
import InjectionMedicationChart from '@/components/charts/InjectionMedicationChart'

function InjectionSheet() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState(dayjs(new Date()).subtract(7, 'day'))
  const [toDate, setToDate] = useState(null)
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const [InjectForm, setInjectionForm] = useState({
    patientId: '',
    medicationId: '',
    patientName: '',
    administeredDate: dayjs().format('YYYY-MM-DD'),
    administeredTime: dayjs().format('HH:mm'),
    medicationName: '',
    dosage: '',
    administeredNurseId: '',
  })
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isLoadingMedications, setIsLoadingMedications] = useState(false)
  const queryClient = useQueryClient()
  const [modal, setModal] = useState('add')
  const [medicationSuggestions, setMedicationSuggestions] = useState([])
  const [patientSuggestions, setPatientSuggestions] = useState([])
  const [filteredData, setFilteredData] = useState(null)

  // Add custom filters configuration
  const customFilters = [
    {
      field: 'medicationName',
      label: 'Medication',
      type: 'select',
    },
    {
      field: 'administeredNurseName',
      label: 'Nurse',
      type: 'select',
    },
  ]

  // Add filter data function
  const filterData = (data, filters) => {
    if (!data) return []

    const filtered = data.filter((row) => {
      return Object.entries(filters).every(([field, filter]) => {
        if (!filter || !filter.value) return true

        switch (field) {
          case 'medicationName':
            const medicationName = row.medicationName
            if (!medicationName) return false

            if (filter.prefix === 'IN') {
              return filter.value.includes(medicationName)
            }
            return filter.prefix === 'NOT IN'
              ? !filter.value.includes(medicationName)
              : true

          case 'administeredNurseName':
            const nurseName = row.administeredNurseName
            if (!nurseName) return false

            if (filter.prefix === 'IN') {
              return filter.value.includes(nurseName)
            }
            return filter.prefix === 'NOT IN'
              ? !filter.value.includes(nurseName)
              : true

          default:
            return true
        }
      })
    })

    setFilteredData(filtered)
    return filtered
  }

  // Add function to get unique values for filters
  const getUniqueValues = (field) => {
    if (!getInjectionList?.data) return []

    const values = new Set(
      getInjectionList?.data.map((row) => {
        if (field === 'medicationName') {
          return row.medicationName?.trim()
        }
        if (field === 'administeredNurseName') {
          return row.administeredNurseName?.trim()
        }
        return row[field]
      }),
    )
    return Array.from(values).filter(Boolean)
  }

  // Debounced function to fetch medication suggestions
  const debouncedGetSuggestions = debounce(async (searchText) => {
    try {
      setIsLoadingMedications(true)
      const response = await getInjectionSuggestionList(
        user?.accessToken,
        searchText,
      )
      setMedicationSuggestions(response.data || [])
    } catch (error) {
      console.error('Error fetching medication suggestions:', error)
    } finally {
      setIsLoadingMedications(false)
    }
  }, 300) // 300ms delay

  // Debounced function to fetch patient suggestions
  const debouncedGetPatientSuggestions = debounce(async (searchText) => {
    try {
      setIsLoadingPatients(true)
      const response = await getAllPatients(user?.accessToken, searchText)
      setPatientSuggestions(response.data || [])
    } catch (error) {
      console.error('Error fetching patient suggestions:', error)
    } finally {
      setIsLoadingPatients(false)
    }
  }, 300)

  const { data: getInjectionList, isLoading: getInjectionListLoading } =
    useQuery({
      queryKey: ['getInjectionSheetList', user, fromDate, toDate],
      queryFn: async () => {
        const res = await getInjectionSheetList(
          user?.accessToken,
          dayjs(fromDate).format('YYYY-MM-DD'),
          toDate && dayjs(toDate).format('YYYY-MM-DD'),
        )
        setFilteredData(res.data)
        return res
      },

      enabled: !!fromDate,
    })
  const { data: otDropdowns, isLoading: otDropdownsLoading } = useQuery({
    queryKey: ['otDropdownsData'],
    queryFn: () => getOTDropdowns(user?.accessToken),
    enabled: true,
  })
  // const dropdowns = useSelector(store => store.dropdowns)
  const addNewOTMutation = useMutation({
    mutationKey: ['addInjection', user?.accessToken],
    mutationFn: async (data) => {
      const res = await addNewInjection(user?.accessToken, data)
      console.log(res)
      if (res.status == 200) {
        dispatch(closeModal('injectionModal'))
        queryClient.invalidateQueries('getInjectionSheetList')
        setInjectionForm({
          patientId: '',
          medicationId: '',
          patientName: '',
          administeredDate: dayjs().format('YYYY-MM-DD'),
          administeredTime: dayjs().format('HH:mm'),
          medicationName: '',
          dosage: '',
          administeredNurseId: '',
        })
      } else {
        console.error('Error adding OT', res.message)
      }
    },
    onSuccess: () => {
      console.log('OT added successfully')
    },
    onError: (error) => {
      console.error('Error adding OT', error)
    },
  })
  const saveChangesInjectionMutation = useMutation({
    mutationKey: ['saveInjectionChanges', user?.accessToken],
    mutationFn: async (data) => {
      const { administeredNurseName, ...payload } = InjectForm
      const res = await saveInjectionChanges(user?.accessToken, payload)
      console.log(res)
      if (res.status == 200) {
        dispatch(closeModal('injectionModal'))
        queryClient.invalidateQueries('getInjectionSheetList')
        setInjectionForm({
          patientId: '',
          medicationId: '',
          patientName: '',
          administeredDate: dayjs().format('YYYY-MM-DD'),
          administeredTime: dayjs().format('HH:mm'),
          medicationName: '',
          dosage: '',
          administeredNurseId: '',
        })
      } else {
        console.error('Error saving changes in Injection', res.message)
      }
    },
    onSuccess: () => {
      console.log('OT added successfully')
    },
    onError: (error) => {
      console.error('Error adding OT', error)
    },
  })
  const handleSaveChanges = () => {
    const { administeredNurseName, ...payload } = InjectForm
    console.log('Save Changes Clicked', payload)
    saveChangesInjectionMutation.mutate(payload)
    setModal('')
  }

  // useEffect(() => {
  //   console.log(getInjectionList)
  // }, [getInjectionList])

  const handleCreateOT = () => {
    console.log('create clicked')
    setModal('add')
    setInjectionForm({
      patientId: '',
      medicationId: '',
      patientName: '',
      administeredDate: dayjs().format('YYYY-MM-DD'),
      administeredTime: dayjs().format('HH:mm'),
      medicationName: '',
      dosage: '',
      administeredNurseId: '',
    })
    dispatch(openModal('injectionModalNew'))
  }
  const handleInjectionFormChange = (e) => {
    setInjectionForm({ ...InjectForm, [e.target.name]: e.target.value })
  }
  const filterPersonListByDesignationId = (designationId) => {
    const designation = otDropdowns?.data.find(
      (designation) => designation.mappingId === designationId,
    )
    return designation?.personList || []
  }
  const handleInjectionFormSubmit = () => {
    addNewOTMutation.mutate(InjectForm)
  }
  const InjectionColumns = [
    {
      field: 'originsId',
      headerName: 'Patient Id',
      minWidth: 100,
      flex: 0.5,
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      minWidth: 175,
      flex: 1.2,
    },
    {
      field: 'administeredDate',
      headerName: 'Administered Date',
      minWidth: 150,
      flex: 0.7,
      renderCell: (params) => (
        <span>{dayjs(params.row.administeredDate).format('DD-MM-YYYY')}</span>
      ),
    },
    {
      field: 'administeredTime',
      headerName: 'Time',
      minWidth: 120,
      flex: 0.7,
    },
    {
      field: 'medicationName',
      headerName: 'Medication',
      minWidth: 200,
      flex: 2,
    },
    {
      field: 'dosage',
      headerName: 'Dosage',
      flex: 0.5,
      minWidth: 100,
      // renderCell: (params) => (
      //     <Chip label={params.row.time} />)
    },
    {
      field: 'administeredNurseName',
      headerName: 'Nurse ',
      flex: 1,
      minWidth: 150,
      // renderCell: (params) => (
      //     <Chip label={params.row.time} />)
    },
    //edit action
    {
      field: 'action',
      headerName: 'Action',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const isAdminorManagerAccess =
          user.roleDetails?.id === 1 || user.roleDetails?.id === 7
        const isToday = dayjs(params.row.administeredDate).isSame(
          dayjs(),
          'day',
        )
        return (
          <Button
            disabled={isAdminorManagerAccess ? false : !isToday}
            onClick={() => {
              dispatch(openModal('injectionModal' + params.row.id))
              const row = params.row
              const parsedDate = dayjs(row.administeredDate)
              setInjectionForm({
                ...row,
                administeredDate: parsedDate.isValid()
                  ? parsedDate.format('YYYY-MM-DD')
                  : row.administeredDate,
                administeredTime:
                  row.administeredTime || dayjs().format('HH:mm'),
              })
              setModal('edit')
            }}
          >
            Edit
          </Button>
        )
      },
    },
  ]

  const permissionedAddInjection = function () {
    const AddInjectionButton = () => (
      <Button
        variant="outlined"
        className="h-12 capitalize"
        onClick={handleCreateOT}
      >
        Add Injection
      </Button>
    )
    const PermissionedButton = withPermission(
      AddInjectionButton,
      false,
      'injectionSheet',
      [ACCESS_TYPES.WRITE],
    )
    return <PermissionedButton />
  }

  const PermissionedToolbar = withPermission(
    CustomToolbar,
    false,
    'injectionSheet',
    [ACCESS_TYPES.WRITE],
  )

  // Update URL when dates change
  useEffect(() => {
    const query = {
      ...router.query,
      fromDate: fromDate ? fromDate.format('YYYY-MM-DD') : '',
      toDate: toDate ? toDate.format('YYYY-MM-DD') : '',
    }

    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true },
    )
  }, [fromDate, toDate])

  // Initialize dates from URL on component mount
  useEffect(() => {
    const { fromDate: urlFromDate, toDate: urlToDate } = router.query

    if (urlFromDate) {
      setFromDate(dayjs(urlFromDate))
    }

    if (urlToDate) {
      setToDate(dayjs(urlToDate))
    }
  }, [])

  // Handle date changes
  const handleFromDateChange = (newValue) => {
    setFromDate(newValue)
  }

  const handleToDateChange = (newValue) => {
    setToDate(newValue)
  }

  return (
    <div className="m-5">
      <Modal
        // maxWidth={'md'}
        uniqueKey={'injectionModal' + (InjectForm?.id || 'New')}
        closeOnOutsideClick={false}
        // title={modal === 'add' ? 'Add New Injection' : 'Edit Record'}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            {modal === 'add' ? 'Add New Injection' : 'Edit Record'}
          </Typography>
          <IconButton
            onClick={() => {
              dispatch(closeModal())
              setModal('')
              setInjectionForm({
                patientId: null,
                patientName: '',
                administeredDate: dayjs().format('YYYY-MM-DD'),
                administeredTime: dayjs().format('HH:mm'),
                medicationName: '',
                dosage: '',
                administeredNurseId: '',
              })
            }}
          >
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col m-3 gap-3">
          <Autocomplete
            freeSolo
            loading={isLoadingPatients}
            options={patientSuggestions}
            getOptionLabel={(option) => {
              return typeof option === 'string' ? option : option?.Name || ''
            }}
            value={InjectForm.patientName || null}
            onChange={(event, newValue) => {
              console.log(newValue)
              setInjectionForm({
                ...InjectForm,
                patientName:
                  typeof newValue === 'string'
                    ? newValue
                    : newValue?.Name || '',
                patientId:
                  typeof newValue === 'string' ? '' : newValue?.id || '',
              })
            }}
            onInputChange={(event, newInputValue) => {
              if (newInputValue) {
                debouncedGetPatientSuggestions(newInputValue)
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Patient"
                name="patientName"
                value={InjectForm.patientName}
              />
            )}
          />
          <div className="flex gap-3">
            <DatePicker
              name="administeredDate"
              label="Date"
              value={
                InjectForm?.administeredDate &&
                dayjs(InjectForm.administeredDate).isValid()
                  ? dayjs(InjectForm.administeredDate)
                  : null
              }
              onChange={(newValue) =>
                setInjectionForm({
                  ...InjectForm,
                  administeredDate: newValue?.format('YYYY-MM-DD') ?? '',
                })
              }
              format="DD/MM/YYYY"
            />
            <TimePicker
              name="administeredTime"
              label="Time"
              value={parseInjectionDateTime(
                InjectForm?.administeredDate,
                InjectForm?.administeredTime,
              )}
              ampm={false}
              onChange={(date) => {
                setInjectionForm({
                  ...InjectForm,
                  administeredTime: date?.format('HH:mm') ?? '',
                })
              }}
            />
          </div>
          <FormControl>
            <InputLabel id="demo-simple-select-label">
              Administered Nurse
            </InputLabel>
            <Select
              label="Administered Nurse"
              value={InjectForm?.administeredNurseId}
              onChange={handleInjectionFormChange}
              name="administeredNurseId"
            >
              {filterPersonListByDesignationId(5)?.map((eachBranch) => {
                return (
                  <MenuItem key={eachBranch.id} value={eachBranch.id}>
                    {eachBranch.personName}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <Autocomplete
            freeSolo
            loading={isLoadingMedications}
            options={medicationSuggestions}
            getOptionLabel={(option) => {
              return typeof option === 'string'
                ? option
                : option?.itemName || ''
            }}
            value={InjectForm.medicationName || null}
            onChange={(event, newValue) => {
              setInjectionForm({
                ...InjectForm,
                medicationName:
                  typeof newValue === 'string'
                    ? newValue
                    : newValue?.itemName || '',
                medicationId:
                  typeof newValue === 'string' ? '' : newValue?.id || '',
              })
            }}
            onInputChange={(event, newInputValue) => {
              if (newInputValue) {
                debouncedGetSuggestions(newInputValue)
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Medication"
                name="medicationName"
                value={InjectForm.medicationName}
              />
            )}
          />
          <TextField
            label="Dosage"
            name="dosage"
            value={InjectForm?.dosage}
            onChange={handleInjectionFormChange}
          />

          <div className="flex justify-end gap-3 mt-3">
            {/* <Button
              color="error"
              variant="outlined"
              onClick={() => {
                dispatch(closeModal('injectionModal'))
                setModal('')
                setInjectionForm({
                  patientName: '',
                  administeredDate: dayjs(new Date()).format('YYYY-MM-DD'),
                  administeredTime: dayjs(new Date()).format('HH:mm'),
                  medicationName: '',
                  dosage: '',
                  administeredNurseId: '',
                })
              }}
            >
              Close
            </Button> */}
            <Button
              variant="outlined"
              className="capitalize"
              onClick={
                modal === 'add' ? handleInjectionFormSubmit : handleSaveChanges
              }
            >
              {modal === 'add' ? 'Add' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex justify-between mb-3">
        <div className="flex gap-3">
          <DatePicker
            label="From Date"
            value={fromDate}
            format="DD/MM/YYYY"
            onChange={handleFromDateChange}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            format="DD/MM/YYYY"
            onChange={handleToDateChange}
          />
        </div>
        {permissionedAddInjection()}
      </div>

      <div className="flex flex-col gap-4">
        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 h-[400px] shadow">
            {/* Add your Injection Chart component here */}
            <InjectionMedicationChart
              data={filteredData || getInjectionList?.data}
            />
          </div>
          <div className="p-4">{/* Add your Bar Chart component here */}</div>
        </div>

        {/* Data Grid Section */}
        <div className="bg-white rounded-lg shadow">
          <FilteredDataGrid
            rows={getInjectionList?.data || []}
            columnVisibilityModel={{
              id: false,
            }}
            loading={getInjectionListLoading}
            columns={InjectionColumns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-loadingOverlay': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              },
            }}
            className="h-[60vh]"
            customFilters={customFilters}
            filterData={filterData}
            getUniqueValues={getUniqueValues}
          />
        </div>
      </div>
    </div>
  )
}

export default withPermission(InjectionSheet, true, 'injectionSheet', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
