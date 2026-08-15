function InfoItem({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

export default InfoItem
