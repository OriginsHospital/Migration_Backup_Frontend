import dayjs from 'dayjs'
import InfoItem from './InfoItem'

const VitalsInformation = ({ vitals }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ">
      <InfoItem label="Blood Pressure" value={vitals?.bp || '-'} />
      <InfoItem label="BMI" value={vitals?.bmi || '-'} />
      <InfoItem label="Height" value={vitals?.height || '-'} />
      <InfoItem
        label="Weight"
        value={vitals?.weight ? `${vitals?.weight} kg` : '-'}
      />
      {/* <InfoItem label="Respiration" value={vitals?.respiration || '-'} /> */}
      <InfoItem label="Initials" value={vitals?.initials || '-'} />
      {console.log(vitals)}
      <InfoItem
        label="Taken On"
        value={
          vitals?.vitalsTakenTime
            ? `${dayjs(vitals?.vitalsTakenTime).format('DD-MM-YYYY')}`
            : '-'
        }
      />
      {/* <InfoItem
        label="Vitals Taken Date"
        value={
          vitals?.vitalsTakenTime
            ? `${dayjs(vitals?.vitalsTakenTime).format(' DD-MM-YYYY')}`
            : '-'
        }
      /> */}
      <div className="col-span-2">
        <InfoItem label="Notes" value={vitals?.notes || '-'} />
      </div>
      {/* <Button className="text-secondary col-span-3"
          onClick={() => dispatch(openModal('OPDSheet'))}
        >View OPD sheet</Button> */}
    </div>
  )
}

export default VitalsInformation
