import { withPermission } from '@/components/withPermission'
import { createReferringDoctor, getReferringDoctorsLog } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import { hasReferringDoctorsLogAccess } from '@/utils/referringDoctorsAccess'
import { toastconfig } from '@/utils/toastconfig'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const EMPTY_FORM = {
  doctorName: '',
  specialization: '',
  branchId: '',
  areaVillage: '',
  contactNumber: '',
  hospitalName: '',
}

function ReferringDoctorsPage() {
  const queryClient = useQueryClient()
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches } = dropdowns || {}

  const canViewLog = hasReferringDoctorsLogAccess(userDetails)

  const [activeTab, setActiveTab] = useState('addDoctors')
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [showSuccess, setShowSuccess] = useState(false)

  const activeBranches = useMemo(
    () => branches?.filter((b) => b.isActive !== false) || [],
    [branches],
  )

  const {
    data: logData,
    isLoading: logLoading,
    isError: logError,
  } = useQuery({
    queryKey: ['referringDoctorsLog'],
    queryFn: () => getReferringDoctorsLog(userDetails?.accessToken),
    enabled: !!userDetails?.accessToken && canViewLog,
  })

  const logRows = useMemo(() => {
    return (logData?.data || []).map((row, index) => ({
      ...row,
      id: row.id || index,
    }))
  }, [logData])

  useEffect(() => {
    if (!showSuccess) return undefined
    const timer = setTimeout(() => setShowSuccess(false), 2800)
    return () => clearTimeout(timer)
  }, [showSuccess])

  const resetForm = () => setFormState(EMPTY_FORM)

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createReferringDoctor(userDetails?.accessToken, payload),
    onSuccess: (res) => {
      if (res?.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['referringDoctorsLog'] })
        resetForm()
        setShowSuccess(true)
      } else {
        toast.error(res?.message || 'Failed to add doctor', toastconfig)
      }
    },
    onError: (err) =>
      toast.error(err?.message || 'Failed to add doctor', toastconfig),
  })

  const handleContactChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormState((prev) => ({ ...prev, contactNumber: digits }))
  }

  const handleSubmit = (e) => {
    e?.preventDefault?.()

    const doctorName = formState.doctorName?.trim().replace(/^dr\.?\s*/i, '')
    if (!doctorName) {
      toast.error('Doctor name is required', toastconfig)
      return
    }
    if (!formState.specialization?.trim()) {
      toast.error('Specialization is required', toastconfig)
      return
    }
    if (!formState.branchId) {
      toast.error('Branch is required', toastconfig)
      return
    }
    if (!formState.areaVillage?.trim()) {
      toast.error('Area / Village is required', toastconfig)
      return
    }
    if (!/^[0-9]{10}$/.test(formState.contactNumber || '')) {
      toast.error('Contact number must be exactly 10 digits', toastconfig)
      return
    }
    if (!formState.hospitalName?.trim()) {
      toast.error('Hospital name is required', toastconfig)
      return
    }

    createMutation.mutate({
      doctorName,
      specialization: formState.specialization.trim(),
      branchId: Number(formState.branchId),
      areaVillage: formState.areaVillage.trim(),
      contactNumber: formState.contactNumber,
      hospitalName: formState.hospitalName.trim(),
      isActive: 1,
    })
  }

  const logColumns = [
    {
      field: 'doctorDisplayName',
      headerName: 'Doctor Name',
      flex: 1,
      minWidth: 170,
    },
    {
      field: 'specialization',
      headerName: 'Specialization',
      flex: 0.8,
      minWidth: 140,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 0.5,
      minWidth: 100,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'areaVillage',
      headerName: 'Area / Village',
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'contactNumber',
      headerName: 'Contact Number',
      flex: 0.6,
      minWidth: 130,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'hospitalName',
      headerName: 'Hospital Name',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.5,
      minWidth: 110,
    },
    {
      field: 'performedBy',
      headerName: 'Performed By',
      flex: 0.7,
      minWidth: 120,
      valueFormatter: (value) => value || '-',
    },
    {
      field: 'performedAt',
      headerName: 'Date & Time',
      flex: 0.7,
      minWidth: 150,
    },
  ]

  const handleTabChange = (_, value) => {
    if (value === 'log' && !canViewLog) return
    setActiveTab(value)
  }

  return (
    <div className="w-full h-full p-5">
      <TabContext value={activeTab}>
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-secondary m-0">
              Referring Doctors
            </h1>
            <TabList
              onChange={handleTabChange}
              aria-label="Referring doctors tabs"
            >
              <Tab label="Add Doctors" value="addDoctors" />
              {canViewLog && <Tab label="Log" value="log" />}
            </TabList>
          </div>

          <TabPanel value="addDoctors" sx={{ p: 0, flex: 1 }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              className="relative bg-white shadow rounded-lg p-6 md:p-8 max-w-2xl mx-auto"
              sx={{ minHeight: 420 }}
            >
              <Typography
                variant="h6"
                className="text-secondary font-semibold mb-6"
              >
                Add Referring Doctor
              </Typography>

              <Box className="flex flex-col gap-4">
                <TextField
                  label="Doctor Name"
                  required
                  fullWidth
                  value={formState.doctorName}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      doctorName: e.target.value,
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Dr.</InputAdornment>
                    ),
                  }}
                  placeholder="Ramesh Kumar"
                  disabled={createMutation.isPending || showSuccess}
                />

                <TextField
                  label="Specialization"
                  required
                  fullWidth
                  value={formState.specialization}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      specialization: e.target.value,
                    }))
                  }
                  placeholder="e.g. Gynecologist, General Physician"
                  disabled={createMutation.isPending || showSuccess}
                />

                <FormControl fullWidth required>
                  <InputLabel id="rd-branch-label">Branch</InputLabel>
                  <Select
                    labelId="rd-branch-label"
                    label="Branch"
                    value={formState.branchId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        branchId: e.target.value,
                      }))
                    }
                    disabled={createMutation.isPending || showSuccess}
                  >
                    {activeBranches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.branchCode || b.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Area / Village Name"
                  required
                  fullWidth
                  value={formState.areaVillage}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      areaVillage: e.target.value,
                    }))
                  }
                  disabled={createMutation.isPending || showSuccess}
                />

                <TextField
                  label="Doctor Contact Number"
                  required
                  fullWidth
                  value={formState.contactNumber}
                  onChange={handleContactChange}
                  inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">+91</InputAdornment>
                    ),
                  }}
                  helperText="10 digit mobile number"
                  disabled={createMutation.isPending || showSuccess}
                />

                <TextField
                  label="Hospital Name"
                  required
                  fullWidth
                  value={formState.hospitalName}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      hospitalName: e.target.value,
                    }))
                  }
                  disabled={createMutation.isPending || showSuccess}
                />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ color: 'white', minWidth: 120 }}
                    disabled={createMutation.isPending || showSuccess}
                  >
                    {createMutation.isPending ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </Box>

              <Fade in={showSuccess} timeout={400}>
                <Box
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.96)',
                    zIndex: 10,
                    pointerEvents: showSuccess ? 'auto' : 'none',
                  }}
                >
                  <Box
                    sx={{
                      animation:
                        'successPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '@keyframes successPop': {
                        '0%': { transform: 'scale(0)', opacity: 0 },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                      },
                    }}
                  >
                    <CheckCircleOutlineRoundedIcon
                      sx={{ fontSize: 88, color: 'success.main' }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 2,
                      color: 'success.main',
                      fontWeight: 600,
                      animation: 'fadeSlideUp 0.5s ease 0.15s both',
                      '@keyframes fadeSlideUp': {
                        '0%': { opacity: 0, transform: 'translateY(12px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    Doctor Saved Successfully!
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      animation: 'fadeSlideUp 0.5s ease 0.3s both',
                    }}
                  >
                    You can add another referring doctor now.
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </TabPanel>

          {canViewLog && (
            <TabPanel value="log" sx={{ p: 0, flex: 1 }}>
              <div
                className="grow bg-white shadow rounded p-2"
                style={{ minHeight: '65vh' }}
              >
                {logLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <CircularProgress />
                  </div>
                ) : logError ? (
                  <div className="flex justify-center items-center h-64 text-red-600">
                    Failed to load audit log
                  </div>
                ) : (
                  <DataGrid
                    rows={logRows}
                    columns={logColumns}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    sx={{
                      '& .MuiDataGrid-columnHeaders': { fontWeight: 'bold' },
                    }}
                  />
                )}
              </div>
            </TabPanel>
          )}
        </div>
      </TabContext>
    </div>
  )
}

export default withPermission(ReferringDoctorsPage, true, 'Patients', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
