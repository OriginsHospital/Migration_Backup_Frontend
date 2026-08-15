import CustomToolbar from '@/components/CustomToolbar'
import Modal from '@/components/Modal'
import PersonAutocomplete from '@/components/PersonAutoComplete'
import {
  addNewOT,
  getOTDropdowns,
  getOtList,
  saveOTChanges,
} from '@/constants/apis'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  FormControl,
  gridClasses,
  IconButton,
  InputLabel,
  LinearProgress,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TimePicker, DatePicker } from '@mui/x-date-pickers'
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'
import DataDisplay from '@/components/DataDisplay'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { Close } from '@mui/icons-material'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import OTSchedulerChart from '@/components/charts/OTSchedulerChart'
import OTSchedulerBarChart from '@/components/charts/OTSchedulerBarChart'
import { useRouter } from 'next/router'

function OutPatient() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState(dayjs(new Date()).subtract(7, 'day'))
  const [toDate, setToDate] = useState(null)
  const user = useSelector((store) => store.user)
  const normalizeValue = (value) => (value || '').toLowerCase().trim()
  const normalizeNameStrict = (name) =>
    (name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()
  const currentUserEmail = normalizeValue(
    user?.email || user?.userDetails?.email,
  )
  const OT_DEFAULTS_BY_USER_EMAIL = {
    'jhansi@gmail.com': {
      surgeon: [
        'DR. K. JHANSI RANI',
        'DR.Jhansi Rani',
        'Dr. Jhansi',
        'Dr. K. Jhansi Rani',
      ],
      anesthetist: ['DR.Athyun', 'DR. Athyun', 'Dr. Athyun'],
      embryologist: ['Nithya Srinivasan', 'DR.Nithya', 'DR. Nithya'],
      otStaff: ['Ramakrishna', 'Rama Krishna'],
    },
    'domalateja@gmail.com': {
      surgeon: ['DR.Teja D', 'DR. Teja D', 'DR.Teja', 'DR. Teja', 'Dr. Teja D'],
      anesthetist: ['DR.Karthik', 'DR. Karthik', 'Dr. Karthik'],
      embryologist: ['Sridhar'],
      otStaff: ['Shyam'],
    },
    'sambiswetha@gmail.com': {
      surgeon: ['DR.Swetha', 'DR. Swetha', 'Dr. Swetha', 'Dr. S. Swetha'],
      anesthetist: ['DR.Vijay', 'DR. Vijay', 'Dr. Vijay'],
      embryologist: ['Ravi Teja'],
      otStaff: [],
    },
    'navyakonjeti2811@gmail.com': {
      surgeon: [
        'DR.Navya K',
        'DR. Navya K',
        'DR.Navya',
        'DR. Navya',
        'Dr. Navya K',
      ],
      anesthetist: [],
      embryologist: [],
      otStaff: [],
    },
  }
  const createEmptyFormData = () => ({
    branchId: '',
    // consultantId: '',
    patientName: '',
    procedureName: '',
    procedureDate: dayjs(new Date()).format('YYYY-MM-DD'),
    time: '',
    surgeonId: '',
    anesthetistId: '',
    otStaff: '',
    // surgeons:'',
    embryologistId: '',
  })
  const dispatch = useDispatch()
  const [modal, setModal] = useState('add')
  const [formData, setFormData] = useState(createEmptyFormData)
  const OTcolumns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 50,
    },
    {
      field: 'branchName',
      headerName: 'Branch',
      width: 80,
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      width: 300,
    },

    {
      field: 'procedureName',
      headerName: 'Procedure',
      width: 140,
    },
    {
      field: 'procedureDate',
      headerName: 'Date',
      width: 100,
    },
    {
      field: 'time',
      headerName: 'Time',
      width: 70,
      // renderCell: (params) => (
      //     <Chip label={params.row.time} />)
    },
    {
      field: 'surgeonList',
      headerName: 'Surgeon',
      width: 150,
      renderCell: (params) => (
        <div className="flex  gap-2 ">
          {params.row.surgeonList?.map((staff, index) => (
            // <Chip label={staff.staffName} key={index} />
            <p key={staff.staffName} className="">
              {staff.staffName}
              {index != params.row.staffList.length - 1 && ','}
            </p>
          ))}
        </div>
      ),
    },
    {
      field: 'anesthetistName',
      headerName: 'Anesthetist',
      width: 150,
    },
    // embryologistId
    {
      field: 'staffList',
      headerName: 'Staff List',
      width: 200,
      renderCell: (params) => (
        <div className="flex flex-wrap gap-2 ">
          {params.row.staffList.map((staff, index) => (
            <p key={staff.staffName} className="">
              {staff.staffName}
              {index != params.row.staffList.length - 1 && ','}
            </p>
          ))}
        </div>
      ),
    },
    {
      //edit button
      field: 'edit',
      headerName: 'Edit',
      width: 100,
      renderCell: (params) => (
        <Button
          onClick={() => {
            dispatch(openModal('addOTModal'))
            setFormData(params.row)
            setModal('edit')
          }}
        >
          Edit
        </Button>
      ),
    },
  ]
  const { data: otDropdowns, isLoading: otDropdownsLoading } = useQuery({
    queryKey: ['otDropdownsData'],
    queryFn: () => getOTDropdowns(user?.accessToken),
    enabled: true,
  })
  const queryClient = useQueryClient()
  const { data: getOTList, isLoading: getOTListLoading } = useQuery({
    queryKey: ['getOTList', user, fromDate, toDate],
    queryFn: () =>
      getOtList(
        user?.accessToken,
        dayjs(fromDate).format('YYYY-MM-DD'),
        toDate && dayjs(toDate).format('YYYY-MM-DD'),
      ),
    enabled: !!fromDate,
  })
  const dropdowns = useSelector((store) => store.dropdowns)
  const [filteredData, setFilteredData] = useState(null)

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

  // useEffect(() => {
  //   console.log(otDropdowns)
  // }, [getOTList])

  const handleCreateOT = () => {
    console.log('create clicked')
    setModal('add')
    setFormData(getAddModalInitialValues())
    dispatch(openModal('addOTModal'))
  }
  const handleOTFormChange = (e) => {
    console.log('update clicked', e.target.name, e.target.value)
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  const addNewOTMutation = useMutation({
    mutationKey: ['addOT', user?.accessToken],
    mutationFn: async (data) => {
      const res = await addNewOT(user?.accessToken, data)
      console.log(res)
      if (res.status == 200) {
        dispatch(closeModal('addOTModal'))
        setFormData(createEmptyFormData())
        queryClient.invalidateQueries('getOTList')
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
  const saveChangesOTMutation = useMutation({
    mutationKey: ['saveOtChanges', user?.accessToken],
    mutationFn: async (data) => {
      const res = await saveOTChanges(user?.accessToken, data)
      console.log(res)
      if (res.status == 200) {
        dispatch(closeModal('addOTModal'))
        queryClient.invalidateQueries('getOTList')
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

  const handleAddOT = () => {
    console.log('OT ADD', formData)
    addNewOTMutation.mutate(formData)
  }
  const handleSaveChanges = () => {
    const {
      branchName,
      consultantName,
      surgeonName,
      anesthetistName,
      embryologistName,
      staffList,
      surgeonList,
      ...payload
    } = formData
    console.log('Save Changes Clicked', payload)
    saveChangesOTMutation.mutate(payload)
    setModal('')
  }
  const filterPersonListByDesignationId = (designationId) => {
    const designation = otDropdowns?.data.find(
      (designation) => designation.mappingId === designationId,
    )
    return designation?.personList || []
  }
  const getPersonIdByDesignationAndNames = (
    designationId,
    personNames = [],
  ) => {
    if (!personNames?.length) return ''
    const people = filterPersonListByDesignationId(designationId) || []
    const normalizedCandidates = personNames
      .filter(Boolean)
      .map((name) => normalizeNameStrict(name))
    const selectedPerson = people.find((person) =>
      normalizedCandidates.includes(normalizeNameStrict(person?.personName)),
    )
    return selectedPerson?.id ? String(selectedPerson.id) : ''
  }
  const getAddModalInitialValues = () => {
    const baseFormData = createEmptyFormData()
    const defaultConfig = OT_DEFAULTS_BY_USER_EMAIL[currentUserEmail]
    if (!defaultConfig) return baseFormData

    const surgeonId = getPersonIdByDesignationAndNames(1, defaultConfig.surgeon)
    const anesthetistId = getPersonIdByDesignationAndNames(
      2,
      defaultConfig.anesthetist,
    )
    const embryologistId = getPersonIdByDesignationAndNames(
      4,
      defaultConfig.embryologist,
    )
    const otStaffId = getPersonIdByDesignationAndNames(3, defaultConfig.otStaff)

    return {
      ...baseFormData,
      surgeonId,
      anesthetistId,
      embryologistId,
      otStaff: otStaffId,
    }
  }
  const handleChangeMulti = (event) => {
    const {
      target: { value },
    } = event
    const selectedIds = value.map((item) => item.id).join(',')
    setFormData({
      ...formData,
      // On autofill we get a stringified value.
      [event.target.name]: selectedIds,
    })
  }

  const permissionedAddOT = function () {
    const AddOTButton = () => (
      <Button
        variant="outlined"
        className="h-12 capitalize"
        onClick={handleCreateOT}
      >
        Add OT Record
      </Button>
    )
    const PermissionedButton = withPermission(
      AddOTButton,
      false,
      'otScheduler',
      [ACCESS_TYPES.WRITE],
    )
    return <PermissionedButton />
  }
  // const PermissionedToolbar = withPermission(
  //   CustomToolbar,
  //   false,
  //   'otScheduler',
  //   [ACCESS_TYPES.WRITE],
  // )
  const customFilters = [
    {
      field: 'branchName',
      label: 'Branch',
      type: 'select',
    },
    {
      field: 'procedureName',
      label: 'Procedure',
      type: 'select',
    },
  ]
  const filterData = (data, filters) => {
    if (!data) return []
    const filtered = data.filter((row) => {
      return Object.entries(filters).every(([field, filter]) => {
        if (!filter || !filter.value) return true

        // Handle different field types
        switch (field) {
          case 'branchName':
            const branchName = row.branchName
            if (!branchName) return false

            if (filter.prefix === 'IN') {
              return filter.value.includes(branchName)
            }
            return filter.prefix === 'NOT IN'
              ? !filter.value.includes(branchName)
              : true

          case 'procedureName':
            const procedureName = row.procedureName
            if (!procedureName) return false

            if (filter.prefix === 'IN') {
              return filter.value.includes(procedureName)
            }
            return filter.prefix === 'NOT IN'
              ? !filter.value.includes(procedureName)
              : true
          default:
            return true
        }
      })
    })

    // Update the filteredData state when filters change
    setFilteredData(filtered)
    return filtered
  }
  const getUniqueValues = (field) => {
    if (!getOTList?.data) return []
    const values = new Set(
      getOTList?.data.map((row) => {
        if (field === 'branchName') {
          return row.branchName.trim()
        }
        if (field === 'procedureName') {
          return row.procedureName.trim()
        }
        return row[field]
      }),
    )
    return Array.from(values).filter(Boolean)
  }
  return (
    <div className="m-5">
      <Modal
        uniqueKey={'addOTModal'}
        // maxWidth="md"
        closeOnOutsideClick={false}
        // title={modal == 'add' ? `ADD NEW RECORD` : 'Edit Record'}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            {modal == 'add' ? `ADD NEW RECORD` : 'Edit Record'}
          </Typography>
          <IconButton
            onClick={() => {
              dispatch(closeModal())
              setFormData(createEmptyFormData())
            }}
          >
            <Close />
          </IconButton>
        </div>
        <div className="grid grid-cols-1 p-3 gap-3 max-h-[500px] overflow-y-auto">
          <FormControl>
            {/* <InputLabel id="demo-simple-select-label">Branch</InputLabel> */}
            <Autocomplete
              options={dropdowns?.branches || []}
              getOptionLabel={(option) => option.name}
              value={
                dropdowns?.branches?.find(
                  (branch) => branch.id === formData?.branchId,
                ) || null
              }
              onChange={(event, newValue) => {
                setFormData({ ...formData, branchId: newValue?.id || '' })
              }}
              renderInput={(params) => <TextField {...params} label="Branch" />}
            />
          </FormControl>

          <TextField
            name="patientName"
            label="Patient Name"
            value={formData?.patientName}
            onChange={handleOTFormChange}
          />

          <TextField
            name="procedureName"
            label="Procedure Name"
            value={formData?.procedureName}
            onChange={handleOTFormChange}
          />
          <div className="flex gap-2">
            <DatePicker
              className="bg-white"
              // value={formData?.procedureDate}
              format="DD/MM/YYYY"
              // onChange={handleOTFormChange}
              name="procedureDate"
              value={
                formData?.procedureDate
                  ? dayjs(formData?.procedureDate)
                  : dayjs()
              }
              onChange={(date) =>
                setFormData({
                  ...formData,
                  procedureDate: date.format('YYYY-MM-DD'),
                })
              }
            />
            <TimePicker
              // value={formData?.time}
              viewRenderers={
                {
                  // hours: renderTimeViewClock,
                  // minutes: renderTimeViewClock,
                  // seconds: renderTimeViewClock,
                }
              }
              name="time"
              // value={dayjs(formData?.procedureDate + 'T' + formData?.time)}
              // value={dayjs(formData?.time)}
              value={dayjs(
                `${formData?.procedureDate}T${formData?.time?.substring(0, 5)}`,
              )}
              // value={
              //     dayjs(formData?.time).isValid() ? dayjs(formData?.time) : dayjs()
              // }
              onChange={(date) => {
                setFormData({ ...formData, time: date.format('hh:ss A') })
                console.log(date)
              }}
            />
          </div>
          <FormControl>
            {/* <InputLabel id="demo-simple-select-label">Surgeon</InputLabel> */}
            <Autocomplete
              multiple
              options={filterPersonListByDesignationId(1) || []}
              getOptionLabel={(option) => option.personName}
              value={
                formData?.surgeonId
                  ? formData.surgeonId
                      .split(',')
                      .map((id) =>
                        filterPersonListByDesignationId(1)?.find(
                          (person) => person.id === parseInt(id),
                        ),
                      )
                      .filter(Boolean)
                  : []
              }
              onChange={(event, newValue) => {
                const selectedIds = newValue.map((item) => item.id).join(',')
                setFormData({ ...formData, surgeonId: selectedIds })
              }}
              renderInput={(params) => (
                <TextField {...params} label="Surgeon" />
              )}
            />
          </FormControl>
          {/* //anesthetistId */}
          <FormControl>
            {/* <InputLabel id="demo-simple-select-label">Anesthetist</InputLabel> */}
            <Autocomplete
              options={filterPersonListByDesignationId(2) || []}
              getOptionLabel={(option) => option.personName}
              value={
                filterPersonListByDesignationId(2)?.find(
                  (person) => person.id === parseInt(formData?.anesthetistId),
                ) || null
              }
              onChange={(event, newValue) => {
                setFormData({ ...formData, anesthetistId: newValue?.id || '' })
              }}
              renderInput={(params) => (
                <TextField {...params} label="Anesthetist" />
              )}
            />
          </FormControl>

          <FormControl>
            {/* <InputLabel id="demo-simple-select-label">Embryologist</InputLabel> */}
            <Autocomplete
              options={filterPersonListByDesignationId(4) || []}
              getOptionLabel={(option) => option.personName}
              value={
                filterPersonListByDesignationId(4)?.find(
                  (person) => person.id === parseInt(formData?.embryologistId),
                ) || null
              }
              onChange={(event, newValue) => {
                setFormData({ ...formData, embryologistId: newValue?.id || '' })
              }}
              renderInput={(params) => (
                <TextField {...params} label="Embryologist" />
              )}
            />
          </FormControl>
          <FormControl>
            {/* <InputLabel id="demo-simple-select-label">OT Staff</InputLabel> */}
            <Autocomplete
              multiple
              options={filterPersonListByDesignationId(3) || []}
              getOptionLabel={(option) => option.personName}
              value={
                formData?.otStaff
                  ? formData.otStaff
                      .split(',')
                      .map((id) =>
                        filterPersonListByDesignationId(3)?.find(
                          (person) => person.id === parseInt(id),
                        ),
                      )
                      .filter(Boolean)
                  : []
              }
              onChange={(event, newValue) => {
                const selectedIds = newValue.map((item) => item.id).join(',')
                setFormData({ ...formData, otStaff: selectedIds })
              }}
              renderInput={(params) => (
                <TextField {...params} label="OT Staff" />
              )}
            />
          </FormControl>
          <div className="flex justify-end gap-3 mt-3">
            {/* <Button
              color="error"
              variant="outlined"
              onClick={() => {
                dispatch(closeModal('addOTModal'))
                setFormData({})
              }}
            >
              Close
            </Button> */}
            {modal == 'add' ? (
              <Button variant="outlined" onClick={handleAddOT}>
                Add
              </Button>
            ) : (
              <Button variant="outlined" onClick={handleSaveChanges}>
                Save Changes
              </Button>
            )}
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
        {permissionedAddOT()}
      </div>
      <div className="flex flex-col gap-4">
        {/* Charts Section - Now using filteredData or original data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <OTSchedulerChart data={filteredData || getOTList?.data} />
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <OTSchedulerBarChart data={filteredData || getOTList?.data} />
          </div>
        </div>

        {/* Data Grid Section */}
        <div className="bg-white rounded-lg shadow">
          <FilteredDataGrid
            rows={getOTList?.data || []}
            columnVisibilityModel={{
              id: false,
            }}
            loading={getOTListLoading}
            columns={OTcolumns}
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

export default withPermission(OutPatient, true, 'otScheduler', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
