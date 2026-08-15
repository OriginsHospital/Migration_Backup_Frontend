import dayjs from 'dayjs'

const formatDate = (value) => {
  if (!value) return ''
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : ''
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const displayValue = (value) => {
  if (value == null) return ''
  const text = String(value).trim()
  return text
}

const joinLines = (...parts) =>
  parts
    .map((part) => displayValue(part))
    .filter(Boolean)
    .join('\n')

const mapReportToPrintFields = (report = {}) => {
  const legacyFinalDiagnosis =
    !report.finalDiagnosisAfterOperation &&
    report.consultantName &&
    !report.expertConsultant
      ? report.consultantName
      : ''

  const diagnosis = displayValue(
    report.diagnosis ||
      report.clinicalDiagnosis ||
      report.finalDiagnosisAfterOperation ||
      legacyFinalDiagnosis,
  )

  const operativeFindingsProcedure = joinLines(
    report.operativeFindings,
    report.anesthesiaType || report.procedure
      ? `Procedure: ${report.anesthesiaType || report.procedure}`
      : '',
    report.entry ? `Entry: ${report.entry}` : '',
    report.intraopComplications
      ? `Intra-op Complications: ${report.intraopComplications}`
      : '',
    report.gynecologist ? `Gynaecologist: ${report.gynecologist}` : '',
    report.assistant ? `Assistant: ${report.assistant}` : '',
    report.anesthetist ? `Anaesthetist: ${report.anesthetist}` : '',
    report.otAssistant ? `OT Assistant: ${report.otAssistant}` : '',
    report.hospitalBranch ? `Hospital: ${report.hospitalBranch}` : '',
    report.procedureDate
      ? `Date of Procedure: ${formatDate(report.procedureDate)}`
      : '',
  )

  const generalExamination = joinLines(
    report.generalExamination,
    report.uterus ? `Uterus: ${report.uterus}` : '',
    report.endometrialThickness
      ? `Endometrial Thickness: ${report.endometrialThickness}`
      : '',
    report.distensionMedia || report.abnormality
      ? `Abnormality: ${report.distensionMedia || report.abnormality}`
      : '',
  )

  return {
    patientName: displayValue(
      report.patientName || report.PatientName || report.name,
    ),
    age: displayValue(report.age || report.patientAge || report.Age),
    lmp: formatDate(report.lmp),
    dayOfCycle: displayValue(report.dayOfCycle),
    admissionDate: formatDate(report.admissionDate),
    dischargeDate: formatDate(report.dischargeDate),
    consultantName: displayValue(
      report.expertConsultant ||
        report.consultantName ||
        report.gynecologist ||
        '',
    ),
    diagnosis,
    surgeryPerformed: displayValue(report.procedureType),
    chiefComplaints: displayValue(
      report.chiefComplaints || report.clinicalDiagnosis,
    ),
    obstetricHistory: displayValue(report.obstetricHistory),
    menstrualHistory: displayValue(report.menstrualHistory),
    pastSurgeryHistory: displayValue(report.pastSurgeryHistory),
    pastMedicalHistory: displayValue(report.pastMedicalHistory),
    allergicHistory: displayValue(report.allergicHistory),
    generalExamination,
    vitals: displayValue(report.vitals),
    systematicExamination: displayValue(report.systematicExamination),
    courseInHospital: displayValue(report.courseInHospital),
    operativeFindingsProcedure,
    postOperativePeriod: displayValue(report.postopCourse),
    conditionAtDischarge: displayValue(
      report.conditionAtDischarge ||
        report.finalDiagnosisAfterOperation ||
        legacyFinalDiagnosis,
    ),
    treatmentOnDischarge: displayValue(report.dischargeMedications),
    adviceOnDischarge: displayValue(report.adviceOnDischarge),
    followUp: displayValue(
      report.followUp ||
        (report.reviewOn ? `Review On: ${formatDate(report.reviewOn)}` : ''),
    ),
  }
}

const infoCell = (label, value) => `
  <td class="info-label">${escapeHtml(label)}</td>
  <td class="info-value">${escapeHtml(value)}</td>`

const sectionBlock = (title, value) => `
  <div class="section">
    <div class="section-title">${escapeHtml(title)}</div>
    <div class="section-box">${escapeHtml(value).replace(/\n/g, '<br/>')}</div>
  </div>`

export const buildHysteroLapPrintBodyHtml = (report = {}) => {
  const fields = mapReportToPrintFields(report)

  return `
    <h1>DISCHARGE SUMMARY</h1>
    <table class="info-table">
      <tr>
        ${infoCell('Patient Name', fields.patientName)}
        ${infoCell('LMP', fields.lmp)}
      </tr>
      <tr>
        ${infoCell('Age', fields.age)}
        ${infoCell('Date of Admission', fields.admissionDate)}
      </tr>
      <tr>
        ${infoCell('Day of Cycle', fields.dayOfCycle)}
        ${infoCell('Date of Discharge', fields.dischargeDate)}
      </tr>
      <tr>
        <td class="info-label">Consultant Name</td>
        <td class="info-value" colspan="3">${escapeHtml(fields.consultantName)}</td>
      </tr>
    </table>

    ${sectionBlock('DIAGNOSIS', fields.diagnosis)}
    ${sectionBlock('SURGERY PERFORMED', fields.surgeryPerformed)}
    ${sectionBlock('CHIEF COMPLAINTS', fields.chiefComplaints)}
    ${sectionBlock('OBSTETRIC HISTORY', fields.obstetricHistory)}
    ${sectionBlock('MENSTRUAL HISTORY', fields.menstrualHistory)}
    ${sectionBlock('PAST SURGERY HISTORY', fields.pastSurgeryHistory)}
    ${sectionBlock('PAST MEDICAL HISTORY', fields.pastMedicalHistory)}
    ${sectionBlock('ALLERGIC HISTORY', fields.allergicHistory)}
    ${sectionBlock('GENERAL EXAMINATION', fields.generalExamination)}
    ${sectionBlock('VITALS', fields.vitals)}
    ${sectionBlock('SYSTEMATIC EXAMINATION', fields.systematicExamination)}
    ${sectionBlock('COURSE IN HOSPITAL', fields.courseInHospital)}
    ${sectionBlock('OPERATIVE FINDINGS & PROCEDURE', fields.operativeFindingsProcedure)}
    ${sectionBlock('POST OPERATIVE PERIOD', fields.postOperativePeriod)}
    ${sectionBlock('CONDITION AT DISCHARGE', fields.conditionAtDischarge)}
    ${sectionBlock('TREATMENT ON DISCHARGE', fields.treatmentOnDischarge)}
    ${sectionBlock('ADVICE ON DISCHARGE', fields.adviceOnDischarge)}
    ${sectionBlock('FOLLOW UP', fields.followUp)}

    <div class="signature">
      <span>Consultant Signature:</span>
      <span class="signature-line"></span>
    </div>
  `
}

const PRINT_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px 20px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #111;
    background: #fff;
  }
  h1 {
    margin: 0 0 14px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    table-layout: fixed;
  }
  .info-table td {
    border: 1px solid #111;
    padding: 6px 8px;
    vertical-align: middle;
    word-break: break-word;
  }
  .info-label {
    width: 18%;
    font-weight: 700;
    white-space: nowrap;
  }
  .info-value {
    width: 32%;
    min-height: 22px;
  }
  .section {
    margin-bottom: 10px;
  }
  .section-title {
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 4px;
    font-size: 12px;
  }
  .section-box {
    border: 1px solid #111;
    min-height: 28px;
    padding: 6px 8px;
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .signature {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 28px;
    font-weight: 700;
  }
  .signature-line {
    flex: 1;
    max-width: 280px;
    border-bottom: 1px solid #111;
    height: 18px;
  }
`

export const buildHysteroLapPrintHtml = (report = {}) => {
  const body = buildHysteroLapPrintBodyHtml(report)

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Discharge Summary</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>${body}</body>
</html>`
}

export const openHysteroLapPrintWindow = (report = {}) => {
  const html = buildHysteroLapPrintHtml(report)
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return false

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  return true
}
