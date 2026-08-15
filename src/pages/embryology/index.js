import Breadcrumb from '@/components/Breadcrumb'
// import EmbryologyModalContent from '@/components/EmbryologyModalContent'
import EmbryologyModalContentNew from '@/components/EmbryologyModalContentNew'
import Modal from '@/components/Modal'
import { withPermission } from '@/components/withPermission'
import {
  editEmbryologyConsultation,
  editEmbryologyTreatment,
  getEmbryologyDataByConsultation,
  getEmbryologyDataByTreatment,
  getEmbryologyDataByTreatmentCycleId,
  getEmbryologyTemplateById,
  getPatientsListEmbryology,
  getTemplateBasedOnTreatmentId,
  getTreatmentsData,
  SaveEmbryologyConsultation,
  SaveEmbryologyTreatment,
} from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Autocomplete, Button, IconButton, TextField } from '@mui/material'
// import { DataGrid } from '@mui/x-data-grid'
// import { DatePicker } from '@mui/x-date-pickers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
// import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { Close } from '@mui/icons-material'

import { Visibility } from '@mui/icons-material'
import { toastconfig } from '@/utils/toastconfig'

function Embryology() {
  // const [date, setDate] = useState(dayjs(new Date()).format('YYYY-MM-DD'))
  const user = useSelector(store => store.user)
  const [selectedRow, setSelectedRow] = useState([])
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [newData, setNewData] = useState()
  const [editData, setEditData] = useState()
  const [activeEmbryologyType, setActiveEmbryologyType] = useState()
  const [activeDayTab, setActiveDayTab] = useState(0)
  const [embryologyTypes, setEmbryologyTypes] = useState([])
  const branches = user?.branchDetails
  const [branchId, setBranchId] = useState(branches[0]?.id || null)

  const { data: embryology, isLoading: embryologyLoading } = useQuery({
    queryKey: ['embryologyPatientsList', branchId],
    queryFn: async () => {
      const res = await getPatientsListEmbryology(user.accessToken, branchId)
      // setEmbryologyData(res.data)
      return res.data
    },
  })

  const { data: getEmbryologyData } = useQuery({
    queryKey: ['embryologyData', selectedRow?.id, selectedRow?.type],
    queryFn: async () => {
      if (selectedRow?.type === 'Consultation') {
        const response = await getEmbryologyDataByConsultation(
          user.accessToken,
          selectedRow?.id,
        )
        return response?.data
      } else {
        const response = await getEmbryologyDataByTreatment(
          user.accessToken,
          selectedRow?.id,
        )
        return response?.data
      }
    },
    enabled: !!selectedRow?.id && !!selectedRow?.type,
  })
  const { data: getEmbryologyTemplateData } = useQuery({
    queryKey: [
      'getEmbryologyTemplateById',
      newData?.embryologyType,
      selectedRow?.id,
      selectedRow?.type,
    ],
    queryFn: async () => {
      const res = await getEmbryologyTemplateById(
        user.accessToken,
        activeEmbryologyType,
        selectedRow?.id,
        selectedRow?.type,
      )
      console.log('res', selectedRow)
      setNewData(prev => ({ ...prev, template: res.data.embryologyTemplate }))
      return res.data
    },
    enabled: !!(activeEmbryologyType && selectedRow?.id && selectedRow?.type),
  })
  // useEffect(() => {
  //   console.log('getEmbryologyTemplateData', getEmbryologyTemplateData)
  // }, [activeEmbryologyType, activeDayTab])

  useEffect(() => {
    // console.log(getEmbryologyData?.[0]?.embryologyType)
    console.log('getEmbryologyData', getEmbryologyData, newData)
    // const { template } = newData
    if (getEmbryologyData?.[0]) {
      setNewData({
        template: newData?.template || '',
        categoryType: ``,
        embryologyType: getEmbryologyData?.[0]?.embryologyType,
        embryologyImage: '',
      })
      setSelectedRow({
        ...selectedRow,
        categoryType:
          getEmbryologyData?.[0]?.embryologyDetails?.[0]?.categoryType,
      })
      setActiveEmbryologyType(getEmbryologyData?.[0]?.embryologyType)
      // setActiveDayTab(0)
    }

    // queryClient.invalidateQueries('getEmbryologyTemplateById')
  }, [getEmbryologyData])

  const embryologyColumns = [
    // { field: 'patientId', headerName: '', width: 100 },
    { field: 'patientId', headerName: 'Id', width: 100, flex: 0.7 },
    {
      field: 'patientName',
      headerName: 'Patient',
      width: 300,
      renderCell: params => (
        <span>
          {params.row?.patientName
            ?.split(' ')
            .map(
              word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' ')}
        </span>
      ),
      // flex: 1,
    },
    {
      field: 'doctorName',
      headerName: 'Doctor',
      width: 20,
      flex: 1,
    },
    {
      field: 'appointmentDate',
      headerName: 'Appointment Date',
      width: 150,
      renderCell: params => (
        <span>{dayjs(params.row?.appointmentDate).format('DD-MM-YYYY')}</span>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      flex: 1,
    },
    //view action

    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      flex: 1,
      renderCell: params => (
        <IconButton
          variant="outlined"
          onClick={() => handleViewEmbryoDetails(params)}
        >
          <Visibility />
        </IconButton>
      ),
    },
  ]
  // api call base on selectedRow

  // const saveEmbryologyTreatmentMutation = useMutation({
  //   mutationFn: async payload => {
  //     const res = await SaveEmbryologyTreatment(
  //       user.accessToken,
  //       payload,

  //     )
  //     if (res.status !== 200) {
  //       throw new Error('Failed to save embryology treatment')
  //     }
  //     return res.data
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['embryologyPatientsList'])
  //     setNewData(null)
  //   },
  //   onError: error => {
  //     console.error('Error saving treatment:', error)
  //   },
  // })

  // const saveEmbryologyConsultationMutation = useMutation({
  //   mutationFn: async payload => {
  //     const res = await SaveEmbryologyConsultation(
  //       user.accessToken,
  //       payload,
  //     )
  //     if (res.status !== 200) {
  //       throw new Error('Failed to save embryology consultation')
  //     }
  //     return res.data
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['embryologyPatientsList'])
  //     setNewData(null)
  //   },
  //   onError: error => {
  //     console.error('Error saving consultation:', error)
  //   },
  // })
  const editEmbryologyMutation = useMutation({
    mutationFn: async data => {
      const { id, type, ...payload } = data
      let res
      console.log('payload', payload, type, id)
      if (type === 'Consultation') {
        res = await editEmbryologyConsultation(user.accessToken, payload, id)
      } else {
        res = await editEmbryologyTreatment(user.accessToken, payload, id)
      }
      if (res.status !== 200) {
        throw new Error('Failed to edit embryology')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['embryologyData'])
      setEditData(null)
      toast.success('Embryology edited successfully', toastconfig)
    },
    onError: error => {
      toast.error('Failed to edit embryology', toastconfig)
      console.error('Error editing embryology:', error)
    },
  })
  // const editEmbryologyTreatmentMutation = useMutation({
  //   mutationFn: async data => {
  //     const { id, ...payload } = data
  //     console.log(payload, id)
  //     const res = await editEmbryologyTreatment(
  //       user?.accessToken,
  //       payload,
  //       id,
  //     )
  //     if (res.status == 200) {
  //       setEditData(null)
  //       // queryClient.invalidateQueries('treatmentsData')
  //       queryClient.invalidateQueries('embryologyPatientsList')
  //     }

  //     return res.data
  //   },
  //   onSuccess: response => {
  //     console.log(response)
  //   },
  //   onError: error => {
  //     console.error('Error:', error)
  //   },
  // })
  // const editEmbryologyConsultationMutation = useMutation({
  //   mutationFn: async data => {
  //     const { id, ...payload } = data
  //     console.log(payload, id)
  //     const res = await editEmbryologyConsultation(
  //       user?.accessToken,
  //       payload,
  //       id,
  //     )
  //     if (res.status == 200) {
  //       setEditData(null)
  //       queryClient.invalidateQueries('embryologyPatientsList')
  //     }
  //     return res.data
  //   },
  //   onSuccess: response => {
  //     console.log(response)
  //   },
  // })
  const handleViewEmbryoDetails = params => {
    console.log('params', params.row)
    setSelectedRow(params.row)
    // router.push({ query: { id: params.row.id, type: params.row.type } })
    dispatch(openModal('EmbrologyModal' + params.row.id + params.row.type))
  }
  // const handleNewData = (payload, type) => {
  //   try {
  //     saveEmbryologyMutation.mutate(payload, type)
  //   } catch (error) {
  //     console.error('Error handling new data:', error)
  //   }
  // }

  useEffect(() => {
    setEmbryologyTypes(selectedRow?.embryologyDetails || [])
  }, [selectedRow])

  const customFilters = [
    {
      field: 'patientName',
      label: 'Patient Name',
      type: 'text',
    },
    {
      field: 'doctorName',
      label: 'Doctor Name',
      type: 'select',
      options: embryology
        ? [...new Set(embryology.map(row => row.doctorName))]
        : [],
    },
    {
      field: 'type',
      label: 'Type',
      type: 'select',
      options: embryology ? [...new Set(embryology.map(row => row.type))] : [],
    },
    {
      field: 'appointmentDate',
      label: 'Appointment Date',
      type: 'date',
    },
  ]

  const filterData = (data, filters) => {
    if (!data) return []

    return data.filter(row => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === null) return true

        const { prefix, value } = filterValue

        if (!value || (Array.isArray(value) && value.length === 0)) return true

        switch (field) {
          case 'patientId': {
            if (prefix === 'LIKE') {
              return row.patientId
                .toString()
                .toLowerCase()
                .includes(value.toLowerCase())
            } else if (prefix === 'NOT LIKE') {
              return !row.patientId
                .toString()
                .toLowerCase()
                .includes(value.toLowerCase())
            }
            return true
          }
          case 'patientName': {
            if (prefix === 'LIKE') {
              return row.patientName.toLowerCase().includes(value.toLowerCase())
            } else if (prefix === 'NOT LIKE') {
              return !row.patientName
                .toLowerCase()
                .includes(value.toLowerCase())
            }
            return true
          }
          case 'doctorName': {
            if (prefix === 'IN') {
              return value.includes(row.doctorName)
            } else if (prefix === 'NOT IN') {
              return !value.includes(row.doctorName)
            }
            return true
          }
          case 'type': {
            if (prefix === 'IN') {
              return value.includes(row.type)
            } else if (prefix === 'NOT IN') {
              return !value.includes(row.type)
            }
            return true
          }
          case 'appointmentDate': {
            const rowDate = dayjs(row.appointmentDate)
            if (value.start && value.end) {
              return rowDate.isAfter(value.start) && rowDate.isBefore(value.end)
            } else if (value.start) {
              return rowDate.isAfter(value.start)
            } else if (value.end) {
              return rowDate.isBefore(value.end)
            }
            return true
          }
          default:
            return true
        }
      })
    })
  }

  const getUniqueValues = field => {
    if (!embryology) return []

    switch (field) {
      case 'doctorName':
        return [...new Set(embryology.map(row => row.doctorName))]
      case 'type':
        return [...new Set(embryology.map(row => row.type))]
      default:
        return []
    }
  }

  return (
    <div className="p-5">
      <div className="mb-5 flex justify-between items-center">
        <Breadcrumb />
        <div>
          <Autocomplete
            className="w-[120px]"
            options={branches || []}
            getOptionLabel={option => option?.branchCode || option?.name}
            value={branches?.find(branch => branch.id === branchId) || null}
            onChange={(_, value) => setBranchId(value?.id || null)}
            renderInput={params => <TextField {...params} fullWidth />}
            clearIcon={null}
          />
        </div>
      </div>
      {/* <div className="flex justify-end">
        <DatePicker
          value={dayjs(date)}
          format="DD/MM/YYYY"
          onChange={newValue => setDate(dayjs(newValue).format('YYYY-MM-DD'))}
        // label=""
        />
      </div> */}
      <div className="py-3">
        <FilteredDataGrid
          rows={embryology || []}
          columns={embryologyColumns}
          sx={{
            height: 'calc(100vh - 250px)',
          }}
          loading={embryologyLoading}
          // loadingText="Loading..."
          getRowId={row => row.id + row.type + row.patientId}
          customFilters={customFilters}
          filterData={filterData}
          getUniqueValues={getUniqueValues}
        />
      </div>
      <Modal
        uniqueKey={'EmbrologyModal' + selectedRow?.id + selectedRow?.type}
        title={
          <div className="flex justify-between">
            <span className="">Embryology</span>
            <IconButton
              onClick={() => {
                dispatch(closeModal())
                setSelectedRow(null)
                setNewData(null)
                setEditData(null)
                // router.push({ query: {} })
              }}
            >
              <Close />
            </IconButton>
          </div>
        }
        maxWidth={'lg'}
        closeOnOutsideClick={false}
      >
        {
          // selectedRow &&
          //  (
          // <EmbryologyModalContent
          //   selectedRow={selectedRow}
          //   embryologyData={getEmbryologyData}
          //   onAddNewData={handleNewData}
          //   setImagePreview={setImagePreview}
          //   imagePreview={imagePreview}
          //   getEmbryologyDefaultTemplateData={getEmbryologyDefaultTemplateData}
          //   editEmbryologyTreatmentMutation={editEmbryologyTreatmentMutation}
          //   newData={newData}
          //   setNewData={setNewData}
          //   editData={editData}
          //   setEditData={setEditData}
          // />
          <EmbryologyModalContentNew
            // key={selectedRow?.id + selectedRow?.type}
            selectedRow={selectedRow}
            embryologyData={getEmbryologyData}
            newData={newData}
            setNewData={setNewData}
            editData={editData}
            setEditData={setEditData}
            getEmbryologyTemplateData={getEmbryologyTemplateData}
            editEmbryologyMutation={editEmbryologyMutation}
            // saveEmbryologyMutation={saveEmbryologyMutation}
            activeEmbryologyType={activeEmbryologyType}
            setActiveEmbryologyType={setActiveEmbryologyType}
            activeDayTab={activeDayTab}
            setActiveDayTab={setActiveDayTab}
            embryologyTypes={embryologyTypes}
            setEmbryologyTypes={setEmbryologyTypes}
          />
          // )
        }
      </Modal>
    </div>
  )
}

export default withPermission(Embryology, true, 'embryology', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
