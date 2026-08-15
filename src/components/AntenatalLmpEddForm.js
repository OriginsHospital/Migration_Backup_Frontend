import React, { useEffect, useState } from 'react'
import { Button, TextField } from '@mui/material'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { saveVisitLmpEdd } from '@/constants/apis'
import InfoItem from '@/components/InfoItem'

function isAntenatalVisit(visitTypeId, visitTypeName) {
  const typeName = String(visitTypeName || '').toLowerCase()
  return Number(visitTypeId) === 2 || typeName.includes('antenatal')
}

function asText(value) {
  if (value == null) return ''
  return String(value).trim()
}

export default function AntenatalLmpEddForm({
  patientInfo,
  selectedPatient,
  accessToken,
  onSaved,
}) {
  const visitId =
    selectedPatient?.visit_id || patientInfo?.activeVisitId || null
  const visitTypeId =
    selectedPatient?.visitTypeId ?? patientInfo?.visitTypeId ?? null
  const visitTypeName =
    selectedPatient?.visitType || patientInfo?.visitType || ''
  const visitIsActiveRaw =
    selectedPatient?.visitIsActive ?? patientInfo?.visitIsActive
  const visitIsActive =
    visitIsActiveRaw === true ||
    visitIsActiveRaw === 1 ||
    visitIsActiveRaw === '1'
  const savedLmp = asText(selectedPatient?.lmp || patientInfo?.lmp)
  const savedEdd = asText(selectedPatient?.edd || patientInfo?.edd)
  const antenatal = isAntenatalVisit(visitTypeId, visitTypeName)
  const hasSavedValues = Boolean(savedLmp && savedEdd)
  const canEdit =
    antenatal && Boolean(visitId) && visitIsActive && !hasSavedValues

  const [lmp, setLmp] = useState(savedLmp)
  const [edd, setEdd] = useState(savedEdd)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLmp(savedLmp)
    setEdd(savedEdd)
  }, [savedLmp, savedEdd, visitId, selectedPatient?.appointmentId])

  if (!antenatal) return null

  const handleSave = async () => {
    const lmpValue = asText(lmp)
    const eddValue = asText(edd)
    if (!lmpValue || !eddValue) {
      toast.error('Please enter both LMP and EDD', toastconfig)
      return
    }
    if (!visitId) {
      toast.error('Active visit not found for this patient', toastconfig)
      return
    }

    try {
      setSaving(true)
      const response = await saveVisitLmpEdd(accessToken, {
        visitId: Number(visitId),
        lmp: lmpValue,
        edd: eddValue,
      })
      if (response.status === 200) {
        toast.success('LMP and EDD saved for this visit', toastconfig)
        onSaved?.({
          lmp: lmpValue,
          edd: eddValue,
        })
      } else {
        toast.error(
          response?.message || 'Failed to save LMP and EDD',
          toastconfig,
        )
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to save LMP and EDD', toastconfig)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded border border-gray-200 p-3 bg-white">
      <div className="text-sm font-semibold text-secondary mb-2">
        Antenatal details
      </div>
      {canEdit ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="LMP"
              size="small"
              fullWidth
              value={lmp}
              onChange={(event) => setLmp(event.target.value)}
            />
            <TextField
              label="EDD"
              size="small"
              fullWidth
              value={edd}
              onChange={(event) => setEdd(event.target.value)}
            />
          </div>
          <div>
            <Button
              variant="contained"
              size="small"
              className="capitalize bg-secondary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save LMP / EDD'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoItem label="LMP" value={savedLmp || '-'} />
          <InfoItem label="EDD" value={savedEdd || '-'} />
        </div>
      )}
    </div>
  )
}
