import React from 'react'
import MedicationSheet from './MedicationSheet'

const ERASheet = ({
  eraFormData,
  setERAFormData,
  eraTemplate,
  medicationOptions,
  allBillTypeValues,
}) => {
  return (
    <div className="w-full p-4">
      <MedicationSheet
        medicationFormData={eraFormData}
        setMedicationFormData={setERAFormData}
        columns={eraTemplate?.columns}
        medicationOptions={medicationOptions}
        allBillTypeValues={allBillTypeValues}
      />
    </div>
  )
}

export default ERASheet
