import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  Alert,
  Box,
  Button,
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
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import {
  LocalHospital as DischargeIcon,
  ReceiptLong as BillingIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import {
  closeIpRegistration,
  collectIPPayment,
  getActiveIP,
  getClosedIP,
  getIPBilling,
} from '@/constants/apis'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { toastconfig } from '@/utils/toastconfig'

const money = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0.00'
  return num.toFixed(2)
}

function IPModule() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails || []

  const [selectedBranch, setSelectedBranch] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [dischargeRow, setDischargeRow] = useState(null)
  const [dischargeDate, setDischargeDate] = useState(dayjs())
  const [billingRow, setBillingRow] = useState(null)
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [collectForm, setCollectForm] = useState({
    roomAmount: '',
    medicineAmount: '',
    packageAmount: '',
    otherAmount: '',
    otherDescription: '',
    remarks: '',
  })

  useEffect(() => {
    if (!branches?.length) return
    const queryBranch = router.query.branch
    if (queryBranch) {
      const match = branches.find((b) => String(b.id) === String(queryBranch))
      if (match) {
        setSelectedBranch(match.id)
        return
      }
    }
    if (!selectedBranch) {
      setSelectedBranch(branches[0].id)
    }
  }, [branches, router.query.branch, selectedBranch])

  const { data: activeIPData } = useQuery({
    queryKey: ['activeIP', selectedBranch],
    queryFn: () => getActiveIP(user.accessToken, selectedBranch),
    enabled: Boolean(user.accessToken && selectedBranch),
  })

  const { data: closedIPData } = useQuery({
    queryKey: ['closedIP', selectedBranch],
    queryFn: () => getClosedIP(user.accessToken, selectedBranch),
    enabled: Boolean(user.accessToken && selectedBranch),
  })

  const {
    data: billingResponse,
    isLoading: loadingBilling,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ['ipBilling', billingRow?.id],
    queryFn: () => getIPBilling(user.accessToken, billingRow.id),
    enabled: Boolean(user.accessToken && billingRow?.id),
  })

  const billing = billingResponse?.data
  const medicinesIncludedInPackage = Boolean(
    billing?.medicinesIncludedInPackage ??
      Number(billing?.billed?.package || 0) > 0,
  )
  const payableBilled = billing
    ? medicinesIncludedInPackage
      ? Number(billing.billed?.room || 0) +
        Number(billing.billed?.package || 0) +
        Number(billing.billed?.other || 0)
      : Number(billing.billed?.total || 0)
    : 0
  const payablePending = billing
    ? medicinesIncludedInPackage
      ? Number(billing.pending?.room || 0) +
        Number(billing.pending?.package || 0)
      : Number(billing.pending?.total || 0)
    : 0

  useEffect(() => {
    if (!billing?.pending) return
    const includeMedicinesInPackage = Boolean(
      billing.medicinesIncludedInPackage ??
        Number(billing.billed?.package || 0) > 0,
    )
    setCollectForm((prev) => ({
      ...prev,
      roomAmount: billing.pending.room ? String(billing.pending.room) : '',
      medicineAmount: includeMedicinesInPackage
        ? ''
        : billing.pending.medicine
          ? String(billing.pending.medicine)
          : '',
      packageAmount: billing.pending.package
        ? String(billing.pending.package)
        : '',
    }))
  }, [billing])

  const dischargeMutation = useMutation({
    mutationFn: (payload) => closeIpRegistration(user.accessToken, payload),
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        toast.error(
          response.message || 'Failed to discharge patient',
          toastconfig,
        )
        return
      }
      toast.success('Patient discharged and bed freed', toastconfig)
      setDischargeRow(null)
      queryClient.invalidateQueries({ queryKey: ['activeIP'] })
      queryClient.invalidateQueries({ queryKey: ['closedIP'] })
      queryClient.invalidateQueries({ queryKey: ['bookOptionBeds'] })
      queryClient.invalidateQueries({ queryKey: ['layoutsOverview'] })
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to discharge patient', toastconfig)
    },
  })

  const collectMutation = useMutation({
    mutationFn: (payload) => collectIPPayment(user.accessToken, payload),
    onSuccess: async () => {
      toast.success('Payment collected', toastconfig)
      setCollectForm((prev) => ({
        ...prev,
        otherAmount: '',
        otherDescription: '',
        remarks: '',
      }))
      await refetchBilling()
      queryClient.invalidateQueries({ queryKey: ['activeIP'] })
      queryClient.invalidateQueries({ queryKey: ['closedIP'] })
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to collect payment', toastconfig)
    },
  })

  const handleBranchChange = (event) => {
    const branchId = event.target.value
    setSelectedBranch(branchId)
    router.push(
      {
        pathname: '/ipmodule',
        query: { branch: branchId },
      },
      undefined,
      { shallow: true },
    )
  }

  const collectTotal = useMemo(() => {
    return (
      Number(collectForm.roomAmount || 0) +
      (medicinesIncludedInPackage
        ? 0
        : Number(collectForm.medicineAmount || 0)) +
      Number(collectForm.packageAmount || 0) +
      Number(collectForm.otherAmount || 0)
    )
  }, [collectForm, medicinesIncludedInPackage])

  const handleCollect = () => {
    if (!billingRow?.id) return
    if (collectTotal <= 0) {
      toast.error('Enter at least one amount to collect', toastconfig)
      return
    }
    collectMutation.mutate({
      ipId: Number(billingRow.id),
      paymentMode,
      roomAmount: Number(collectForm.roomAmount || 0),
      medicineAmount: medicinesIncludedInPackage
        ? 0
        : Number(collectForm.medicineAmount || 0),
      packageAmount: Number(collectForm.packageAmount || 0),
      otherAmount: Number(collectForm.otherAmount || 0),
      otherDescription: collectForm.otherDescription || null,
      remarks: collectForm.remarks || null,
    })
  }

  const handleDischarge = () => {
    if (!dischargeRow?.id) return
    if (!dischargeDate) {
      toast.error('Discharge date is required', toastconfig)
      return
    }
    dischargeMutation.mutate({
      id: Number(dischargeRow.id),
      dateOfDischarge: dayjs(dischargeDate).format('YYYY-MM-DD'),
    })
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'patientId', headerName: 'Patient ID', width: 110 },
    {
      field: 'patientName',
      headerName: 'Display Name',
      flex: 1,
      minWidth: 180,
    },
    { field: 'visitId', headerName: 'Visit ID', width: 110 },
    { field: 'roomCode', headerName: 'Room', width: 120 },
    {
      field: 'dateOfAdmission',
      headerName: 'Admission Date',
      width: 140,
    },
    {
      field: 'timeOfAdmission',
      headerName: 'Admission Time',
      width: 140,
    },
    {
      field: 'dateOfDischarge',
      headerName: 'Discharge Date',
      width: 140,
    },
    {
      field: 'packageAmount',
      headerName: 'Package Amount',
      width: 140,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 170,
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ height: '100%' }}
        >
          <Tooltip title="Billing / Collect payment">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setBillingRow(params.row)
                setPaymentMode('CASH')
                setCollectForm({
                  roomAmount: '',
                  medicineAmount: '',
                  packageAmount: '',
                  otherAmount: '',
                  otherDescription: '',
                  remarks: '',
                })
              }}
            >
              <BillingIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {activeTab === 0 && (
            <Tooltip title="Discharge">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setDischargeRow(params.row)
                  setDischargeDate(
                    params.row.dateOfDischarge
                      ? dayjs(params.row.dateOfDischarge)
                      : dayjs(),
                  )
                }}
              >
                <DischargeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">IP Module</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Branch</InputLabel>
            <Select
              value={selectedBranch}
              onChange={handleBranchChange}
              label="Branch"
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name || branch.branchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              router.push({
                pathname: '/book-option',
                query: selectedBranch ? { branchId: selectedBranch } : {},
              })
            }
          >
            Book Option
          </Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Active IP" />
          <Tab label="Closed IP" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <FilteredDataGrid
          rows={activeIPData?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          className="h-[calc(100vh-250px)]"
        />
      )}

      {activeTab === 1 && (
        <FilteredDataGrid
          rows={closedIPData?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          className="h-[calc(100vh-250px)]"
        />
      )}

      <Dialog
        open={Boolean(dischargeRow)}
        onClose={() => !dischargeMutation.isPending && setDischargeRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Discharge patient</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>
              Discharge{' '}
              <strong>{dischargeRow?.patientName || 'this patient'}</strong>{' '}
              from room <strong>{dischargeRow?.roomCode || '-'}</strong> and
              free the bed.
            </Typography>
            <DatePicker
              label="Discharge date"
              value={dischargeDate}
              onChange={(value) => setDischargeDate(value)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <Alert severity="info">
              After discharge this record moves to Closed IP and the bed becomes
              Available again.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDischargeRow(null)}
            disabled={dischargeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDischarge}
            disabled={dischargeMutation.isPending}
          >
            {dischargeMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirm discharge'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(billingRow)}
        onClose={() => !collectMutation.isPending && setBillingRow(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>IP billing & collection</DialogTitle>
        <DialogContent dividers>
          {loadingBilling && !billing ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : billing ? (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {billing.ip.patientName} (
                    {billing.ip.patientDisplayId || billing.ip.patientId})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Room / Bed
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {billing.ip.roomCode} · {billing.ip.bedName || 'Bed'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Stay
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {dayjs(billing.ip.dateOfAdmission).format('DD MMM YYYY')} ·{' '}
                    {billing.ip.stayDays} day
                    {billing.ip.stayDays === 1 ? '' : 's'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      size="small"
                      color={billing.ip.isActive ? 'success' : 'default'}
                      label={billing.ip.isActive ? 'Active IP' : 'Closed IP'}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Bill summary
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Billed</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      Room amount
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        ₹{money(billing.ip.roomChargePerDay)} / day ×{' '}
                        {billing.ip.stayDays} day
                        {billing.ip.stayDays === 1 ? '' : 's'}
                        {Number(billing.ip.bedCharge) > 0
                          ? ` + bed ₹${money(billing.ip.bedCharge)}`
                          : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.billed.room)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.paid.room)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.pending.room)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Medicines bill
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        Auto-fetched from IP Indent
                        {billing.medicines?.length
                          ? ` · ${billing.medicines.length} item${
                              billing.medicines.length === 1 ? '' : 's'
                            }`
                          : ' · no indent items for this stay'}
                      </Typography>
                      {medicinesIncludedInPackage && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="success.main"
                          sx={{ fontWeight: 600 }}
                        >
                          Included in package — not added to amount payable
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.billed.medicine)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.paid.medicine)}
                    </TableCell>
                    <TableCell align="right">
                      {medicinesIncludedInPackage
                        ? '—'
                        : `₹${money(billing.pending.medicine)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Package amount
                      {medicinesIncludedInPackage && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Includes IP Indent medicines
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.billed.package)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.paid.package)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.pending.package)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Other</TableCell>
                    <TableCell align="right">
                      ₹{money(billing.billed.other)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.paid.other)}
                    </TableCell>
                    <TableCell align="right">
                      ₹{money(billing.pending.other)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{money(payableBilled)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{money(billing.paid.total)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{money(payablePending)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  IP Indent pharmacy items
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rate is pharmacy selling price per unit (GRN MRP ÷ pack size)
                  {medicinesIncludedInPackage
                    ? ' · consumption only, already included in package'
                    : ''}
                </Typography>
                {billing.medicines?.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Prescribed on</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Rate / unit</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billing.medicines.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.itemName || `Item ${item.id}`}
                          </TableCell>
                          <TableCell>
                            {item.prescribedOn
                              ? dayjs(item.prescribedOn).format('DD MMM YYYY')
                              : '-'}
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            ₹{money(item.unitPrice)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{money(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                          Medicines total
                          {medicinesIncludedInPackage
                            ? ' (included in package)'
                            : ''}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{money(billing.billed.medicine)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <Alert severity="info">
                    No pharmacy items found in IP Indent for this patient.
                  </Alert>
                )}
              </>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Collect payment
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Room amount"
                    value={collectForm.roomAmount}
                    onChange={(e) =>
                      setCollectForm((prev) => ({
                        ...prev,
                        roomAmount: e.target.value,
                      }))
                    }
                  />
                </Grid>
                {!medicinesIncludedInPackage && (
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Medicines bill"
                      helperText="From this patient's IP Indent"
                      value={collectForm.medicineAmount}
                      onChange={(e) =>
                        setCollectForm((prev) => ({
                          ...prev,
                          medicineAmount: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Package amount"
                    helperText={
                      medicinesIncludedInPackage
                        ? 'Includes medicines from IP Indent'
                        : undefined
                    }
                    value={collectForm.packageAmount}
                    onChange={(e) =>
                      setCollectForm((prev) => ({
                        ...prev,
                        packageAmount: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Other amount"
                    value={collectForm.otherAmount}
                    onChange={(e) =>
                      setCollectForm((prev) => ({
                        ...prev,
                        otherAmount: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Other description"
                    placeholder="Labs, procedures, extras"
                    value={collectForm.otherDescription}
                    onChange={(e) =>
                      setCollectForm((prev) => ({
                        ...prev,
                        otherDescription: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment mode</InputLabel>
                    <Select
                      label="Payment mode"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CARD">Card</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    value={collectForm.remarks}
                    onChange={(e) =>
                      setCollectForm((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>

              <Alert severity={collectTotal > 0 ? 'success' : 'info'}>
                {medicinesIncludedInPackage
                  ? `Amount payable (package includes medicines): ₹${money(
                      collectTotal,
                    )}`
                  : `Collecting now: ₹${money(collectTotal)}`}
              </Alert>

              {billing.payments?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Collection history
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell align="right">Room</TableCell>
                        <TableCell align="right">Medicines</TableCell>
                        <TableCell align="right">Package</TableCell>
                        <TableCell align="right">Other</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billing.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.createdAt
                              ? dayjs(payment.createdAt).format(
                                  'DD MMM YYYY HH:mm',
                                )
                              : '-'}
                          </TableCell>
                          <TableCell>{payment.paymentMode}</TableCell>
                          <TableCell align="right">
                            ₹{money(payment.roomAmount)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{money(payment.medicineAmount)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{money(payment.packageAmount)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{money(payment.otherAmount)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{money(payment.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Stack>
          ) : (
            <Alert severity="warning">
              Unable to load billing for this IP.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBillingRow(null)}
            disabled={collectMutation.isPending}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCollect}
            disabled={collectMutation.isPending || collectTotal <= 0}
          >
            {collectMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `Collect ₹${money(collectTotal)}`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default withPermission(IPModule, true, 'ipmodule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
