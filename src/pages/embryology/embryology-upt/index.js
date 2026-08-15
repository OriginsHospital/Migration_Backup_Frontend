import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DataGrid } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import Breadcrumb from '@/components/Breadcrumb'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  getAllPatients,
  getAllPatientTracker,
  getPatientTrackerByPatientId,
  upsertPatientTrackerEmbryologyUpt,
} from '@/constants/apis'

const uptResultOptions = [
  { value: 'Positive', label: 'Positive' },
  { value: 'Negative', label: 'Negative' },
  { value: 'Others', label: 'Others' },
]

const emptyForm = () => ({
  numberOfEmbryos: '0',
  numberOfEmbryosUsed: '0',
  numberOfEmbryosDiscarded: '0',
  lastRenewalDate: null,
  uptResult: '',
  uptManualEntry: '',
})

const toDayjsOrNull = (value) => {
  if (!value || value === '-') return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

const formatDateDisplay = (value) => {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '—'
}

const formatDateTimeDisplay = (value) => {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : '—'
}

const getPatientDisplayName = (patient) => {
  if (!patient) return ''
  return (
    patient.Name ||
    patient.patientName ||
    `${patient.lastName || ''} ${patient.firstName || ''}`.trim() ||
    ''
  )
}

const getPatientLabel = (patient) => {
  if (!patient) return ''
  const name = getPatientDisplayName(patient)
  const id = patient.patientId || patient.PatientId || ''
  const mobile = patient.mobileNo || patient.mobileNumber || ''
  return [id, name, mobile].filter(Boolean).join(' · ')
}

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
)

function EmbryologyUptEntry() {
  const user = useSelector((store) => store.user)
  const accessToken = user?.accessToken

  const [pageTab, setPageTab] = useState(0)

  const [patientSuggestions, setPatientSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [trackerRecord, setTrackerRecord] = useState(null)
  const [isLoadingTracker, setIsLoadingTracker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const [logRows, setLogRows] = useState([])
  const [isLoadingLog, setIsLoadingLog] = useState(false)
  const [logSearch, setLogSearch] = useState('')
  const [viewRecord, setViewRecord] = useState(null)

  const embryosRemaining = useMemo(() => {
    const total = parseInt(form.numberOfEmbryos, 10) || 0
    const used = parseInt(form.numberOfEmbryosUsed, 10) || 0
    return Math.max(0, total - used)
  }, [form.numberOfEmbryos, form.numberOfEmbryosUsed])

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const debouncedPatientSearch = useMemo(
    () =>
      debounce(async (searchText) => {
        if (!accessToken || !searchText || searchText.trim().length < 2) {
          setPatientSuggestions([])
          return
        }
        setIsSearching(true)
        try {
          const response = await getAllPatients(accessToken, searchText.trim())
          if (response?.status === 200 && Array.isArray(response.data)) {
            setPatientSuggestions(response.data)
          } else {
            setPatientSuggestions([])
          }
        } catch (err) {
          console.error(err)
          setPatientSuggestions([])
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [accessToken],
  )

  useEffect(() => {
    return () => debouncedPatientSearch.cancel()
  }, [debouncedPatientSearch])

  const applyTrackerToForm = useCallback((record) => {
    if (!record) {
      setForm(emptyForm())
      return
    }
    setForm({
      numberOfEmbryos: String(record.numberOfEmbryos ?? 0),
      numberOfEmbryosUsed: String(record.numberOfEmbryosUsed ?? 0),
      numberOfEmbryosDiscarded: String(record.numberOfEmbryosDiscarded ?? 0),
      lastRenewalDate: toDayjsOrNull(record.lastRenewalDate),
      uptResult: record.uptResult || '',
      uptManualEntry: record.uptManualEntry || '',
    })
  }, [])

  const loadTrackerForPatient = useCallback(
    async (patient) => {
      const patientId = patient?.patientId || patient?.PatientId
      if (!accessToken || !patientId) return

      setIsLoadingTracker(true)
      try {
        const response = await getPatientTrackerByPatientId(
          accessToken,
          patientId,
        )
        const record =
          response?.status === 200 && response.data ? response.data : null
        setTrackerRecord(record)
        applyTrackerToForm(record)
      } catch (err) {
        console.error(err)
        setTrackerRecord(null)
        applyTrackerToForm(null)
        toast.error('Unable to load tracker data for patient', {
          position: 'top-right',
        })
      } finally {
        setIsLoadingTracker(false)
      }
    },
    [accessToken, applyTrackerToForm],
  )

  const handleSelectPatient = useCallback(
    (patient) => {
      setSelectedPatient(patient)
      setPatientSuggestions([])
      if (patient) {
        loadTrackerForPatient(patient)
      } else {
        setTrackerRecord(null)
        setForm(emptyForm())
      }
    },
    [loadTrackerForPatient],
  )

  const handleReset = useCallback(() => {
    applyTrackerToForm(trackerRecord)
  }, [applyTrackerToForm, trackerRecord])

  const handleClear = useCallback(() => {
    setSelectedPatient(null)
    setTrackerRecord(null)
    setForm(emptyForm())
    setPatientSuggestions([])
  }, [])

  const loadLog = useCallback(async () => {
    if (!accessToken) return
    setIsLoadingLog(true)
    try {
      const response = await getAllPatientTracker(accessToken)
      if (response?.status === 200 && Array.isArray(response.data)) {
        const rows = [...response.data]
          .sort((a, b) => {
            const dateA = dayjs(a.updatedAt || a.date)
            const dateB = dayjs(b.updatedAt || b.date)
            if (dateB.isAfter(dateA)) return 1
            if (dateB.isBefore(dateA)) return -1
            return (b.id || 0) - (a.id || 0)
          })
          .map((row) => ({
            ...row,
            id: row.id,
            embryosRemainingDisplay:
              row.embryosRemaining != null
                ? row.embryosRemaining
                : Math.max(
                    0,
                    (Number(row.numberOfEmbryos) || 0) -
                      (Number(row.numberOfEmbryosUsed) || 0),
                  ),
          }))
        setLogRows(rows)
      } else {
        setLogRows([])
      }
    } catch (err) {
      console.error(err)
      setLogRows([])
      toast.error('Unable to load Embryology & UPT log', {
        position: 'top-right',
      })
    } finally {
      setIsLoadingLog(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (pageTab === 1) {
      loadLog()
    }
  }, [pageTab, loadLog])

  const filteredLogRows = useMemo(() => {
    const q = logSearch.trim().toLowerCase()
    if (!q) return logRows
    return logRows.filter((row) => {
      const haystack = [
        row.patientId,
        row.patientName,
        row.mobileNumber,
        row.uptResult,
        row.uptManualEntry,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [logRows, logSearch])

  const openEditFromLog = useCallback(
    (record) => {
      if (!record?.patientId) {
        toast.error('Invalid log record', { position: 'top-right' })
        return
      }
      const patientStub = {
        patientId: record.patientId,
        patientName: record.patientName,
        Name: record.patientName,
        mobileNo: record.mobileNumber,
        mobileNumber: record.mobileNumber,
        branchId: record.branchId,
      }
      setSelectedPatient(patientStub)
      setTrackerRecord(record)
      applyTrackerToForm(record)
      setPageTab(0)
      toast.info(`Editing ${record.patientId} — update and save`, {
        position: 'top-right',
      })
    },
    [applyTrackerToForm],
  )

  const handleSave = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first', { position: 'top-right' })
      return
    }

    const patientId =
      selectedPatient.patientId || selectedPatient.PatientId || ''
    if (!patientId) {
      toast.error('Selected patient has no Patient ID', {
        position: 'top-right',
      })
      return
    }

    const patientName = getPatientDisplayName(selectedPatient)
    const branchIdRaw =
      selectedPatient.branchId ||
      trackerRecord?.branchId ||
      user?.branchDetails?.[0]?.id ||
      null
    const branchId =
      branchIdRaw != null && branchIdRaw !== '' ? Number(branchIdRaw) : null

    if (!trackerRecord?.id && (!branchId || Number.isNaN(branchId))) {
      toast.error(
        'Branch is required to create tracker data for this patient',
        { position: 'top-right' },
      )
      return
    }

    const mobileRaw =
      selectedPatient.mobileNo ||
      selectedPatient.mobileNumber ||
      trackerRecord?.mobileNumber ||
      null

    const payload = {
      patientId,
      patientName: patientName || trackerRecord?.patientName || patientId,
      branchId: branchId && !Number.isNaN(branchId) ? branchId : null,
      mobileNumber: mobileRaw != null ? String(mobileRaw).slice(0, 15) : null,
      date: dayjs().format('YYYY-MM-DD'),
      plan:
        selectedPatient.plan && selectedPatient.plan !== '-'
          ? String(selectedPatient.plan).slice(0, 255)
          : trackerRecord?.plan || null,
      treatmentType: trackerRecord?.treatmentType || undefined,
      cycleStatus: trackerRecord?.cycleStatus || undefined,
      numberOfEmbryos: parseInt(form.numberOfEmbryos, 10) || 0,
      numberOfEmbryosUsed: parseInt(form.numberOfEmbryosUsed, 10) || 0,
      numberOfEmbryosDiscarded:
        parseInt(form.numberOfEmbryosDiscarded, 10) || 0,
      embryosRemaining,
      lastRenewalDate: form.lastRenewalDate
        ? dayjs(form.lastRenewalDate).format('YYYY-MM-DD')
        : null,
      uptResult: form.uptResult || null,
      uptManualEntry:
        form.uptResult === 'Others' ? form.uptManualEntry || null : null,
    }

    setSaving(true)
    try {
      const response = await upsertPatientTrackerEmbryologyUpt(
        accessToken,
        payload,
      )
      if (response?.status === 200) {
        toast.success(
          'Embryology & UPT saved — visible in Patient Tracker for this patient',
          { position: 'top-right' },
        )
        setTrackerRecord(response.data || { ...trackerRecord, ...payload })
        // Refresh log in background so Log tab stays current
        loadLog()
      } else {
        toast.error(response?.message || 'Failed to save Embryology & UPT', {
          position: 'top-right',
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save Embryology & UPT', { position: 'top-right' })
    } finally {
      setSaving(false)
    }
  }

  const logColumns = useMemo(
    () => [
      {
        field: 'updatedAt',
        headerName: 'Updated',
        width: 150,
        valueGetter: (_value, row) =>
          formatDateTimeDisplay(row.updatedAt || row.date),
      },
      {
        field: 'patientId',
        headerName: 'Patient ID',
        width: 120,
      },
      {
        field: 'patientName',
        headerName: 'Patient Name',
        flex: 1,
        minWidth: 160,
      },
      {
        field: 'mobileNumber',
        headerName: 'Mobile',
        width: 120,
        valueGetter: (value) => value || '—',
      },
      {
        field: 'numberOfEmbryos',
        headerName: 'Embryos',
        width: 90,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'numberOfEmbryosUsed',
        headerName: 'Used',
        width: 80,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'numberOfEmbryosDiscarded',
        headerName: 'Discarded',
        width: 100,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'embryosRemainingDisplay',
        headerName: 'Remaining',
        width: 100,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'lastRenewalDate',
        headerName: 'Last Renewal',
        width: 120,
        valueGetter: (value) => formatDateDisplay(value),
      },
      {
        field: 'uptResult',
        headerName: 'UPT',
        width: 110,
        valueGetter: (_value, row) => {
          if (row.uptResult === 'Others' && row.uptManualEntry) {
            return `Others (${row.uptManualEntry})`
          }
          return row.uptResult || '—'
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewRecord(params.row)
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  openEditFromLog(params.row)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [openEditFromLog],
  )

  return (
    <div className="p-4 md:p-6">
      <Breadcrumb />
      <Box sx={{ mb: 1, mt: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          Embryology & UPT
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter embryo and UPT details, or review recent logs. Saved values
          appear in Reports → Patient Tracker.
        </Typography>
      </Box>

      <Tabs
        value={pageTab}
        onChange={(_e, next) => setPageTab(next)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}
      >
        <Tab label="Data Entry" />
        <Tab label="Log" />
      </Tabs>

      <TabPanel value={pageTab} index={0}>
        <Card variant="outlined" sx={{ maxWidth: 920 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={patientSuggestions}
                  loading={isSearching}
                  value={selectedPatient}
                  onChange={(_e, value) => handleSelectPatient(value)}
                  onInputChange={(_e, value, reason) => {
                    if (reason === 'input') {
                      debouncedPatientSearch(value)
                    }
                  }}
                  getOptionLabel={getPatientLabel}
                  isOptionEqualToValue={(option, value) =>
                    String(option?.id || option?.patientId) ===
                    String(value?.id || value?.patientId)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search patient"
                      placeholder="Name, Patient ID, or mobile"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {selectedPatient && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Chip
                      label={
                        selectedPatient.patientId ||
                        selectedPatient.PatientId ||
                        '—'
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {getPatientDisplayName(selectedPatient) || 'Patient'}
                    </Typography>
                    {(selectedPatient.mobileNo ||
                      selectedPatient.mobileNumber) && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedPatient.mobileNo ||
                          selectedPatient.mobileNumber}
                      </Typography>
                    )}
                    <Chip
                      size="small"
                      label={
                        trackerRecord?.id
                          ? 'Existing tracker — will update'
                          : 'No tracker yet — will create'
                      }
                      color={trackerRecord?.id ? 'info' : 'warning'}
                      variant="outlined"
                    />
                    {isLoadingTracker && (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    )}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 1 }}
                >
                  Embryology & UPT
                </Typography>
              </Grid>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Embryos"
                    value={form.numberOfEmbryos}
                    onChange={(e) =>
                      setField('numberOfEmbryos', e.target.value)
                    }
                    inputProps={{ min: 0 }}
                    disabled={!selectedPatient || isLoadingTracker}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Used"
                    value={form.numberOfEmbryosUsed}
                    onChange={(e) =>
                      setField('numberOfEmbryosUsed', e.target.value)
                    }
                    inputProps={{ min: 0 }}
                    disabled={!selectedPatient || isLoadingTracker}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Discarded"
                    value={form.numberOfEmbryosDiscarded}
                    onChange={(e) =>
                      setField('numberOfEmbryosDiscarded', e.target.value)
                    }
                    inputProps={{ min: 0 }}
                    disabled={!selectedPatient || isLoadingTracker}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Remaining"
                    value={embryosRemaining}
                    InputProps={{ readOnly: true }}
                    helperText="Embryos − Used"
                    disabled={!selectedPatient || isLoadingTracker}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Last Renewal"
                    value={form.lastRenewalDate}
                    onChange={(v) => setField('lastRenewalDate', v)}
                    format="DD/MM/YYYY"
                    disabled={!selectedPatient || isLoadingTracker}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        placeholder: 'DD/MM/YYYY',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!selectedPatient || isLoadingTracker}
                  >
                    <InputLabel>UPT Result</InputLabel>
                    <Select
                      label="UPT Result"
                      value={form.uptResult}
                      onChange={(e) => setField('uptResult', e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {uptResultOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {form.uptResult === 'Others' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="UPT Manual Entry"
                      value={form.uptManualEntry}
                      onChange={(e) =>
                        setField('uptManualEntry', e.target.value)
                      }
                      disabled={!selectedPatient || isLoadingTracker}
                    />
                  </Grid>
                )}
              </LocalizationProvider>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    mt: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleClear}
                    disabled={saving}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={handleReset}
                    disabled={!selectedPatient || saving || isLoadingTracker}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!selectedPatient || saving || isLoadingTracker}
                  >
                    {saving ? 'Saving…' : 'Save to Patient Tracker'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={pageTab} index={1}>
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mr: 1 }}>
                Recent Embryology & UPT Log
              </Typography>
              <TextField
                size="small"
                placeholder="Search by ID, name, mobile, UPT…"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                sx={{ minWidth: 260, ml: { xs: 0, sm: 'auto' } }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadLog}
                disabled={isLoadingLog}
              >
                Refresh
              </Button>
            </Box>

            <Box sx={{ height: 480, width: '100%' }}>
              <DataGrid
                rows={filteredLogRows}
                columns={logColumns}
                loading={isLoadingLog}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'grey.50',
                  },
                }}
                slots={{
                  noRowsOverlay: () => (
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No embryology entries yet. Save from Data Entry to see
                        logs here.
                      </Typography>
                    </Box>
                  ),
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <Dialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Embryology & UPT — View</DialogTitle>
        <DialogContent dividers>
          {viewRecord && (
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Patient ID
                </Typography>
                <Typography fontWeight={600}>{viewRecord.patientId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Patient Name
                </Typography>
                <Typography fontWeight={600}>
                  {viewRecord.patientName || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Mobile
                </Typography>
                <Typography>{viewRecord.mobileNumber || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography>
                  {formatDateTimeDisplay(
                    viewRecord.updatedAt || viewRecord.date,
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Embryos
                </Typography>
                <Typography fontWeight={600}>
                  {viewRecord.numberOfEmbryos ?? 0}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Used
                </Typography>
                <Typography fontWeight={600}>
                  {viewRecord.numberOfEmbryosUsed ?? 0}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Discarded
                </Typography>
                <Typography fontWeight={600}>
                  {viewRecord.numberOfEmbryosDiscarded ?? 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Remaining
                </Typography>
                <Typography fontWeight={600}>
                  {viewRecord.embryosRemainingDisplay ??
                    viewRecord.embryosRemaining ??
                    0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Renewal
                </Typography>
                <Typography fontWeight={600}>
                  {formatDateDisplay(viewRecord.lastRenewalDate)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  UPT Result
                </Typography>
                <Typography fontWeight={600}>
                  {viewRecord.uptResult || '—'}
                </Typography>
              </Grid>
              {viewRecord.uptResult === 'Others' && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    UPT Manual Entry
                  </Typography>
                  <Typography fontWeight={600}>
                    {viewRecord.uptManualEntry || '—'}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRecord(null)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              const record = viewRecord
              setViewRecord(null)
              if (record) openEditFromLog(record)
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default withPermission(EmbryologyUptEntry, true, 'embryology', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
