import React from 'react'
import MedicationSheet from './MedicationSheet'

const ERASheet = ({
  eraFormData,
  setERAFormData,
  eraTemplate,
  medicationOptions,
}) => {
  return (
    <div className="w-full p-4">
      <MedicationSheet
        medicationFormData={eraFormData}
        setMedicationFormData={setERAFormData}
        columns={eraTemplate?.columns}
        medicationOptions={medicationOptions}
      />
    </div>
  )
}

export default ERASheet
