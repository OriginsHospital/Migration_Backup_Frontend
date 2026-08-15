import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  DownloadOutlined,
  VisibilityOutlined,
  Close,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import {
  getNotesHistoryByVisitId,
  getPatientVisits,
  getPrescriptionDetailsByTreatmentCycleId,
  getTreatmentsHistoryByVisitId,
} from '@/constants/apis'
import OpdSummaryDisplay from '@/components/OpdSummaryDisplay'

const getOutcomeFromText = (text = '') => {
  const value = String(text).toLowerCase()
  if (value.includes('positive')) return 'Positive'
  if (value.includes('negative')) return 'Negative'
  return '-'
}

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

const formatDoctorRemark = (remark = '') => {
  if (!remark) return '-'
  if (typeof window === 'undefined') return String(remark).trim() || '-'

  const htmlString = String(remark)
  const parser = new DOMParser()
  const parsedDoc = parser.parseFromString(htmlString, 'text/html')
  const text = parsedDoc?.body?.textContent || ''
  const normalizedText = text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalizedText || '-'
}

export default function PreviousPrescriptionTab({ patientDetails }) {
  const user = useSelector((store) => store.user)
  const [selectedFollicularData, setSelectedFollicularData] = useState(null)

  const {
    data: visitsResponse,
    isLoading: visitsLoading,
    error: visitsError,
  } = useQuery({
    queryKey: ['previousPrescriptionVisits', patientDetails?.patientId],
    queryFn: () =>
      getPatientVisits(user?.accessToken, patientDetails?.patientId),
    enabled: !!patientDetails?.patientId,
  })

  const visits = visitsResponse?.data?.visitDetails || []

  const treatmentQueries = useQueries({
    queries: visits.map((visit) => ({
      queryKey: ['previousPrescriptionTreatments', visit.visitId],
      queryFn: () =>
        getTreatmentsHistoryByVisitId(user?.accessToken, visit.visitId),
      enabled: !!visit?.visitId,
    })),
  })

  const notesQueries = useQueries({
    queries: visits.map((visit) => ({
      queryKey: ['previousPrescriptionNotes', visit.visitId],
      queryFn: () => getNotesHistoryByVisitId(user?.accessToken, visit.visitId),
      enabled: !!visit?.visitId,
    })),
  })

  const follicularMutate = useMutation({
    mutationFn: async ({ treatmentCycleId }) => {
      return getPrescriptionDetailsByTreatmentCycleId(
        user?.accessToken,
        treatmentCycleId,
      )
    },
    onSuccess: (response, variables) => {
      const list = response?.data || []
      setSelectedFollicularData({
        treatmentCycleId: variables.treatmentCycleId,
        treatmentName: variables.treatmentName,
        list,
      })
    },
  })

  const downloadFollicularCsv = (
    treatmentName,
    treatmentCycleId,
    list = [],
  ) => {
    const headers = [
      'Treatment/Cycle',
      'Treatment Cycle Id',
      'Medicine',
      'Prescribed Quantity',
      'Purchased Quantity',
      'Prescription Days',
    ]
    const rows = (list || []).map((item) => [
      treatmentName || '-',
      treatmentCycleId || '-',
      item?.itemName || '-',
      item?.prescribedQuantity ?? 0,
      item?.purchaseQuantity ?? 0,
      item?.prescriptionDays ?? 0,
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => csvEscape(cell)).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `follicular-${treatmentCycleId}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const cycles = useMemo(() => {
    const notesByVisit = new Map()
    notesQueries.forEach((query, index) => {
      const visitId = visits[index]?.visitId
      const notes = (query?.data?.data || []).filter(
        (entry) => entry?.type === 'Treatment',
      )
      notesByVisit.set(visitId, notes)
    })

    const allCycles = []
    treatmentQueries.forEach((query, index) => {
      const visit = visits[index]
      const treatments = query?.data?.data || []
      const visitNotes = notesByVisit.get(visit?.visitId) || []

      treatments.forEach((treatment) => {
        const appointments = [...(treatment?.appointmentDetails || [])].sort(
          (a, b) => new Date(b?.appointmentDate) - new Date(a?.appointmentDate),
        )
        const latestAppointment = appointments[0]
        const latestNotes = visitNotes[0]?.notes || ''
        const stageText = latestAppointment?.currentStage || ''
        const appointmentReason = latestAppointment?.appointmentReason || '-'
        const isClosedOrCancelled = /close|closed|cancel|cancelled/i.test(
          stageText,
        )
        const outcome =
          getOutcomeFromText(latestNotes) !== '-'
            ? getOutcomeFromText(latestNotes)
            : getOutcomeFromText(stageText)

        const endReasonFromApi = [
          treatment?.closeCancelReason,
          treatment?.endedReason,
          treatment?.fetEndedReason,
          treatment?.eraEndedReason,
        ]
          .map((v) => (v != null ? String(v).trim() : ''))
          .find((s) => s.length > 0)

        const closeReason =
          endReasonFromApi ||
          (isClosedOrCancelled && appointmentReason && appointmentReason !== '-'
            ? appointmentReason
            : null) ||
          '-'

        allCycles.push({
          visitId: visit?.visitId,
          visitType: visit?.visitType,
          visitDate: visit?.visitDate,
          treatmentCycleId:
            treatment?.treatmentCycleId ?? treatment?.treatment_cycle_id,
          treatmentTimestampId:
            treatment?.treatmentTimestampId ??
            treatment?.treatment_timestamp_id,
          treatmentType: treatment?.treatmentType || 'Treatment',
          treatmentDate: treatment?.treatmentDate,
          stage: stageText || '-',
          outcome,
          doctorName: latestAppointment?.consultationDoctor || '-',
          closeReason,
          notes: latestNotes || '-',
        })
      })
    })

    return allCycles.sort(
      (a, b) =>
        new Date(b?.treatmentDate || 0) - new Date(a?.treatmentDate || 0),
    )
  }, [notesQueries, treatmentQueries, visits])

  const isHistoryLoading =
    visitsLoading ||
    treatmentQueries.some((query) => query.isLoading) ||
    notesQueries.some((query) => query.isLoading)

  if (!patientDetails?.patientId) {
    return (
      <Alert severity="info">
        Search and select a patient to view previous prescriptions.
      </Alert>
    )
  }

  if (isHistoryLoading) {
    return (
      <Box className="flex justify-center py-10">
        <CircularProgress />
      </Box>
    )
  }

  if (visitsError) {
    return (
      <Alert severity="error">
        {visitsError.message || 'Failed to load history'}
      </Alert>
    )
  }

  const patientId = patientDetails?.id || patientDetails?.patientId

  return (
    <div className="space-y-4">
      <OpdSummaryDisplay patientId={patientId} />
      {!cycles.length && (
        <Alert severity="info">
          No previous treatment cycles found for this patient.
        </Alert>
      )}

      {cycles.map((cycle) => {
        const isOutcomePositive =
          String(cycle.outcome).toLowerCase() === 'positive'
        const isOutcomeNegative =
          String(cycle.outcome).toLowerCase() === 'negative'
        return (
          <Card
            key={`${cycle.visitId}-${cycle.treatmentCycleId}`}
            className="shadow-sm border"
          >
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Typography variant="h6" className="font-semibold">
                    {cycle.treatmentType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(cycle.treatmentDate).isValid()
                      ? dayjs(cycle.treatmentDate).format('DD-MM-YYYY')
                      : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Treatment cycle ID: {cycle.treatmentCycleId ?? '-'}
                  </Typography>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip
                    label={`Treatment cycle ID: ${cycle.treatmentCycleId ?? '-'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Treatment timestamp ID: ${cycle.treatmentTimestampId ?? '-'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Visit ID: ${cycle.visitId ?? '-'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Visit: ${cycle.visitType || '-'}`}
                    size="small"
                  />
                  <Chip
                    label={cycle.outcome}
                    size="small"
                    color={
                      isOutcomePositive
                        ? 'success'
                        : isOutcomeNegative
                          ? 'error'
                          : 'default'
                    }
                  />
                </div>
              </div>
              <Divider />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Typography variant="body2">
                  <strong>Treatment cycle ID:</strong>{' '}
                  {cycle.treatmentCycleId ?? '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Treatment timestamp ID:</strong>{' '}
                  {cycle.treatmentTimestampId ?? '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Visit ID:</strong> {cycle.visitId ?? '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Current Status:</strong> {cycle.stage}
                </Typography>
                <Typography variant="body2">
                  <strong>Doctor:</strong> {cycle.doctorName}
                </Typography>
                <Typography variant="body2">
                  <strong>Visit Date:</strong>{' '}
                  {dayjs(cycle.visitDate).isValid()
                    ? dayjs(cycle.visitDate).format('DD-MM-YYYY')
                    : '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Close/Cancel Reason:</strong> {cycle.closeReason}
                </Typography>
              </div>

              <Typography variant="body2">
                <strong>Doctor Notes/Remarks:</strong>{' '}
                {formatDoctorRemark(cycle.notes)}
              </Typography>

              <div className="flex items-center gap-2">
                <Tooltip title="View follicular sheet">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityOutlined />}
                      onClick={() =>
                        follicularMutate.mutate({
                          treatmentCycleId: cycle.treatmentCycleId,
                          treatmentName: cycle.treatmentType,
                        })
                      }
                      disabled={follicularMutate.isPending}
                    >
                      View Follicular
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Download follicular sheet">
                  <span>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadOutlined />}
                      onClick={async () => {
                        const res =
                          await getPrescriptionDetailsByTreatmentCycleId(
                            user?.accessToken,
                            cycle.treatmentCycleId,
                          )
                        downloadFollicularCsv(
                          cycle.treatmentType,
                          cycle.treatmentCycleId,
                          res?.data || [],
                        )
                      }}
                    >
                      Download Follicular
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Dialog
        open={!!selectedFollicularData}
        onClose={() => setSelectedFollicularData(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center pr-2">
          <span>
            Follicular Sheet - {selectedFollicularData?.treatmentName || '-'} (
            {selectedFollicularData?.treatmentCycleId || '-'})
          </span>
          <IconButton onClick={() => setSelectedFollicularData(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {!selectedFollicularData?.list?.length ? (
            <Alert severity="info">
              No follicular prescription details found.
            </Alert>
          ) : (
            <div className="space-y-2">
              {selectedFollicularData.list.map((item, index) => (
                <Card key={`${item.itemName}-${index}`} variant="outlined">
                  <CardContent className="py-2">
                    <Typography variant="subtitle2">
                      {item.itemName || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prescribed: {item.prescribedQuantity ?? 0} | Purchased:{' '}
                      {item.purchaseQuantity ?? 0} | Days:{' '}
                      {item.prescriptionDays ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
