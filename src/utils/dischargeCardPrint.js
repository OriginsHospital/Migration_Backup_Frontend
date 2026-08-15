const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const displayValue = (value) => {
  if (value == null) return ''
  return String(value).trim()
}

const lineOrBlank = (value) => {
  const text = displayValue(value)
  return text || '&nbsp;'
}

const multilineBox = (value, minHeight = 48) => `
  <div class="section-box" style="min-height:${minHeight}px">
    ${escapeHtml(displayValue(value)).replace(/\n/g, '<br/>') || '&nbsp;'}
  </div>`

const PRINT_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 10mm 12mm;
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
    color: #000;
    background: #fff;
    line-height: 1.35;
  }
  .card-title {
    margin: 0 0 14px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-decoration: underline;
  }
  .consultant-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 700;
  }
  .consultant-row .line {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 18px;
    font-weight: 400;
    padding: 0 4px 2px;
  }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 12px;
  }
  .info-table td {
    border: 1px solid #000;
    padding: 5px 7px;
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
  .field-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 10px;
  }
  .field-row .label {
    font-weight: 700;
    white-space: nowrap;
  }
  .field-row .value {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 18px;
    padding: 0 4px 2px;
  }
  .section {
    margin-bottom: 10px;
  }
  .section-title {
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 4px;
    font-size: 13px;
  }
  .section-box {
    border: 1px solid #000;
    padding: 6px 8px;
    white-space: pre-wrap;
    line-height: 1.45;
  }
  .review-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 14px 0 28px;
    font-weight: 700;
  }
  .review-row .line {
    flex: 1;
    max-width: 360px;
    border-bottom: 1px solid #000;
    min-height: 18px;
    font-weight: 400;
    padding: 0 4px 2px;
  }
  .signature {
    display: flex;
    justify-content: flex-end;
    margin-top: 36px;
  }
  .signature-block {
    text-align: center;
    min-width: 220px;
  }
  .signature-line {
    border-bottom: 1px solid #000;
    height: 28px;
    margin-bottom: 6px;
  }
  .signature-label {
    font-weight: 700;
  }
`

export const buildDischargeCardBodyHtml = (data = {}) => {
  const f = {
    consultantDr: displayValue(data.consultantDr),
    patientName: displayValue(data.patientName),
    age: displayValue(data.age),
    woDo: displayValue(data.woDo),
    sex: displayValue(data.sex),
    address: displayValue(data.address),
    regdNo: displayValue(data.regdNo),
    dateOfAdmission: displayValue(data.dateOfAdmission),
    typeOfDelivery: displayValue(data.typeOfDelivery),
    dateOfOperation: displayValue(data.dateOfOperation),
    dateOfDelivery: displayValue(data.dateOfDelivery),
    dateOfDischarge: displayValue(data.dateOfDischarge),
    timeOfDelivery: displayValue(data.timeOfDelivery),
    sexOfBaby: displayValue(data.sexOfBaby),
    birthWeight: displayValue(data.birthWeight),
    diagnosis: displayValue(data.diagnosis),
    typeOfOperation: displayValue(data.typeOfOperation),
    history: displayValue(data.history),
    findings: displayValue(data.findings),
    treatmentGiven: displayValue(data.treatmentGiven),
    investigations: displayValue(data.investigations),
    dischargeAdvise: displayValue(data.dischargeAdvise),
    followUp: displayValue(data.followUp),
    reviewAfter: displayValue(data.reviewAfter),
  }

  const cell = (label, value) => `
    <td class="info-label">${escapeHtml(label)}</td>
    <td class="info-value">${lineOrBlank(escapeHtml(value))}</td>`

  return `
    <h1 class="card-title">ORIGINS HOSPITAL - DISCHARGE CARD</h1>

    <div class="consultant-row">
      <span>Consultant Dr.:</span>
      <span class="line">${escapeHtml(f.consultantDr) || '&nbsp;'}</span>
    </div>

    <table class="info-table">
      <tr>
        ${cell('Pt. Name', f.patientName)}
        ${cell('Age', f.age)}
      </tr>
      <tr>
        ${cell('W/o, D/o', f.woDo)}
        ${cell('Sex', f.sex)}
      </tr>
      <tr>
        ${cell('Address', f.address)}
        ${cell('Regd. No.', f.regdNo)}
      </tr>
      <tr>
        ${cell('Date of Admission', f.dateOfAdmission)}
        ${cell('Type of Delivery', f.typeOfDelivery)}
      </tr>
      <tr>
        ${cell('Date of Operation', f.dateOfOperation)}
        ${cell('Date of Delivery', f.dateOfDelivery)}
      </tr>
      <tr>
        ${cell('Date of Discharge', f.dateOfDischarge)}
        ${cell('Time of Delivery', f.timeOfDelivery)}
      </tr>
    </table>

    <div class="field-row">
      <span class="label">Sex of Baby :</span>
      <span class="value">${escapeHtml(f.sexOfBaby) || '&nbsp;'}</span>
    </div>
    <div class="field-row">
      <span class="label">Birth Weight :</span>
      <span class="value">${escapeHtml(f.birthWeight) || '&nbsp;'}</span>
    </div>
    <div class="field-row">
      <span class="label">Diagnosis :</span>
      <span class="value">${escapeHtml(f.diagnosis) || '&nbsp;'}</span>
    </div>
    <div class="field-row">
      <span class="label">Type of Operation :</span>
      <span class="value">${escapeHtml(f.typeOfOperation) || '&nbsp;'}</span>
    </div>
    <div class="field-row">
      <span class="label">History :</span>
      <span class="value">${escapeHtml(f.history) || '&nbsp;'}</span>
    </div>
    <div class="field-row">
      <span class="label">Findings :</span>
      <span class="value">${escapeHtml(f.findings) || '&nbsp;'}</span>
    </div>

    <div class="section">
      <div class="section-title">TREATMENT GIVEN :</div>
      ${multilineBox(f.treatmentGiven, 72)}
    </div>
    <div class="section">
      <div class="section-title">INVESTIGATIONS :</div>
      ${multilineBox(f.investigations, 72)}
    </div>
    <div class="section">
      <div class="section-title">DISCHARGE ADVISE :</div>
      ${multilineBox(f.dischargeAdvise, 72)}
    </div>
    <div class="section">
      <div class="section-title">FOLLOW UP :</div>
      ${multilineBox(f.followUp, 56)}
    </div>

    <div class="review-row">
      <span>Review after</span>
      <span class="line">${escapeHtml(f.reviewAfter) || '&nbsp;'}</span>
    </div>

    <div class="signature">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Consulting Doctor Sign.</div>
      </div>
    </div>
  `
}

export const buildDischargeCardPrintHtml = (data = {}) => {
  const body = buildDischargeCardBodyHtml(data)
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>ORIGINS HOSPITAL - DISCHARGE CARD</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>${body}</body>
</html>`
}

export const openDischargeCardPrintWindow = (data = {}) => {
  const html = buildDischargeCardPrintHtml(data)
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return false

  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 250)
  return true
}
