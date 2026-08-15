import React, { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { CircularProgress, Chip } from '@mui/material'
import dayjs from 'dayjs'
import {
  getTreatmentSheetByTreatmentCycleId,
  getDischargeSummaryTemplate,
  getPickupSheetTemplate,
  getEmbryologyReportsByTreatmentCycleId,
} from '@/constants/apis'
import { isIuiTreatment } from '@/utils/treatmentTypeUtils'

function HtmlPreview({ html, title, minHeight = 420 }) {
  const iframeRef = useRef(null)

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    doc.open()
    doc.write(
      html ||
        '<html><body style="font-family:Arial,sans-serif;padding:16px;color:#666;">No data available</body></html>',
    )
    doc.close()
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      title={title}
      className="w-full border rounded bg-white"
      style={{ minHeight }}
    />
  )
}

function SectionCard({ title, children, action }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="text-sm font-semibold text-secondary">{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function LoadingBlock({ label }) {
  return (
    <div className="flex items-center gap-2 p-2">
      <CircularProgress size={16} />
      <span className="text-xs opacity-60">{label}</span>
    </div>
  )
}

// Read-only visualization of the follicular scan
function FollicularReadOnlyTable({ template, formData }) {
  const columns = Array.isArray(template?.columns) ? template.columns : []
  const rows = Array.isArray(template?.rows) ? template.rows : []

  if (columns.length === 0 || rows.length === 0) {
    return (
      <span className="opacity-50 text-xs">
        No follicular sheet data captured for this cycle
      </span>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="bg-secondary text-white p-2 border min-w-32">
              <p>Follicular Scan</p>
              <p className="text-xs">(in mm)</p>
            </th>
            {columns.map((day, index) => (
              <th
                key={`hist-folicular-h-${day}-${index}`}
                className="bg-secondary text-white p-2 border text-center"
                colSpan={2}
              >
                <div>{`Day ${index + 1}`}</div>
                <div className="text-xs">{day}</div>
              </th>
            ))}
          </tr>
          <tr>
            <th className="border"></th>
            {columns.flatMap((day, index) => [
              <th
                key={`hist-folicular-${day}-${index}-R`}
                className="p-1 border text-center text-xs"
              >
                R
              </th>,
              <th
                key={`hist-folicular-${day}-${index}-L`}
                className="p-1 border text-center text-xs"
              >
                L
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ value }, size) => (
            <tr
              key={`hist-folicular-row-${size}`}
              className={size % 2 === 0 ? 'bg-slate-100' : ''}
            >
              <td
                className={`p-2 border-green-500 border text-center font-medium ${
                  size < 5
                    ? 'bg-green-200 text-green-900'
                    : size <= 10
                      ? 'bg-green-300 text-green-800'
                      : size === 21
                        ? 'bg-violet-300 text-white'
                        : 'bg-green-400 text-white'
                }`}
              >
                {value}
              </td>
              {columns.flatMap((day, index) => {
                if (size === 21) {
                  const note = formData?.[`${day}-note`]
                  return [
                    <td
                      key={`hist-folicular-${day}-${index}-ET-${size}`}
                      className="border p-1 text-xs align-top whitespace-pre-wrap"
                      colSpan={2}
                    >
                      {note || '-'}
                    </td>,
                  ]
                }
                const rVal = formData?.[`${day}-R-${size}`]
                const lVal = formData?.[`${day}-L-${size}`]
                return [
                  <td
                    key={`hist-folicular-${day}-${index}-R-${size}`}
                    className="border p-1 text-center w-12 h-8"
                  >
                    {rVal === '' || rVal === undefined || rVal === null
                      ? ''
                      : rVal}
                  </td>,
                  <td
                    key={`hist-folicular-${day}-${index}-L-${size}`}
                    className="border p-1 text-center w-12 h-8"
                  >
                    {lVal === '' || lVal === undefined || lVal === null
                      ? ''
                      : lVal}
                  </td>,
                ]
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TreatmentCycleHistoryView({ treatmentCycleId, treatmentType }) {
  const user = useSelector((store) => store.user)
  const showIcsiSections = !isIuiTreatment({ treatmentType })

  const {
    data: treatmentSheet,
    isLoading: isTreatmentSheetLoading,
    isError: isTreatmentSheetError,
  } = useQuery({
    queryKey: ['historyTreatmentSheet', treatmentCycleId],
    enabled: !!treatmentCycleId,
    queryFn: async () => {
      const responsejson = await getTreatmentSheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson?.status === 200 && responsejson?.data?.template) {
        try {
          return JSON.parse(responsejson.data.template)
        } catch (err) {
          console.warn('Failed to parse treatment sheet template', err)
          return null
        }
      }
      return null
    },
  })

  const {
    data: pickupSheet,
    isLoading: isPickupSheetLoading,
    isError: isPickupSheetError,
  } = useQuery({
    queryKey: ['historyPickupSheet', treatmentCycleId],
    enabled: !!treatmentCycleId && showIcsiSections,
    queryFn: async () => {
      const responsejson = await getPickupSheetTemplate(
        user.accessToken,
        treatmentCycleId,
      )
      return responsejson?.data?.template || ''
    },
  })

  const {
    data: embryologyReports,
    isLoading: isEmbryologyLoading,
    isError: isEmbryologyError,
  } = useQuery({
    queryKey: ['historyEmbryologyReports', treatmentCycleId],
    enabled: !!treatmentCycleId && showIcsiSections,
    queryFn: async () => {
      const responsejson = await getEmbryologyReportsByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson?.status === 200) {
        return responsejson.data || []
      }
      return []
    },
  })

  const {
    data: dischargeSummary,
    isLoading: isDischargeSummaryLoading,
    isError: isDischargeSummaryError,
  } = useQuery({
    queryKey: ['historyDischargeSummary', treatmentCycleId],
    enabled: !!treatmentCycleId && showIcsiSections,
    queryFn: async () => {
      const responsejson = await getDischargeSummaryTemplate(
        user.accessToken,
        treatmentCycleId,
      )
      return responsejson?.data?.template || ''
    },
  })

  const follicularTemplate = treatmentSheet
    ? {
        columns: treatmentSheet?.columns,
        rows: treatmentSheet?.rows,
      }
    : null

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Follicular Sheet">
        {isTreatmentSheetLoading ? (
          <LoadingBlock label="Loading follicular sheet..." />
        ) : isTreatmentSheetError ? (
          <span className="opacity-50 text-xs">
            Unable to load follicular sheet
          </span>
        ) : !treatmentSheet ? (
          <span className="opacity-50 text-xs">
            No follicular sheet data for this cycle
          </span>
        ) : (
          <FollicularReadOnlyTable
            template={follicularTemplate}
            formData={treatmentSheet?.follicularSheet}
          />
        )}
      </SectionCard>

      {showIcsiSections && (
        <>
          <SectionCard title="OPU Sheet">
            {isPickupSheetLoading ? (
              <LoadingBlock label="Loading OPU sheet..." />
            ) : isPickupSheetError ? (
              <span className="opacity-50 text-xs">
                Unable to load OPU sheet
              </span>
            ) : (
              <HtmlPreview
                html={pickupSheet}
                title="OPU Sheet"
                minHeight={360}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Embryology Reports"
            action={
              embryologyReports?.length > 0 ? (
                <Chip
                  size="small"
                  label={`${embryologyReports.length} report${
                    embryologyReports.length === 1 ? '' : 's'
                  }`}
                  color="primary"
                  variant="outlined"
                />
              ) : null
            }
          >
            {isEmbryologyLoading ? (
              <LoadingBlock label="Loading embryology reports..." />
            ) : isEmbryologyError ? (
              <span className="opacity-50 text-xs">
                Unable to load embryology reports
              </span>
            ) : !embryologyReports?.length ? (
              <span className="opacity-50 text-xs">
                No embryology reports recorded for this treatment cycle
              </span>
            ) : (
              <div className="flex flex-col gap-4">
                {embryologyReports.map((report, index) => (
                  <div
                    key={`${report.appointmentId}-${report.embryologyName}-${report.categoryType}-${index}`}
                    className="border rounded p-2"
                  >
                    <div className="flex flex-wrap gap-2 items-center mb-2 text-xs text-gray-600">
                      <span className="font-semibold text-secondary capitalize">
                        {report.embryologyName}
                      </span>
                      {report.categoryType && (
                        <Chip
                          size="small"
                          label={report.categoryType}
                          variant="outlined"
                        />
                      )}
                      <span>
                        {dayjs(report.appointmentDate).format('DD-MM-YYYY')}
                      </span>
                      {report.doctorName && (
                        <span>Dr. {report.doctorName}</span>
                      )}
                    </div>
                    <HtmlPreview
                      html={report.template}
                      title={report.embryologyName}
                      minHeight={280}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cycle Results (IVF-ICSI Discharge Summary)">
            {isDischargeSummaryLoading ? (
              <LoadingBlock label="Loading cycle results..." />
            ) : isDischargeSummaryError ? (
              <span className="opacity-50 text-xs">
                Unable to load cycle results
              </span>
            ) : !dischargeSummary ? (
              <span className="opacity-50 text-xs">
                No cycle results recorded for this cycle
              </span>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  Patient, doctor, embryologist, and plan details are filled
                  automatically. Use the Discharge Summary button above to enter
                  oocyte, embryo transfer, cryopreservation, and sperm details.
                </p>
                <HtmlPreview
                  html={dischargeSummary}
                  title="Cycle Results"
                  minHeight={520}
                />
              </>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

export default TreatmentCycleHistoryView
