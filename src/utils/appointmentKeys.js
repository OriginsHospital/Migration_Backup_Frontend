export const getAppointmentCompositeId = (appointment) => {
  if (
    appointment?.appointmentId === undefined ||
    appointment?.appointmentId === null
  ) {
    return ''
  }

  return `${appointment?.type || 'Unknown'}-${appointment.appointmentId}`
}

export const getAppointmentModalKey = (appointment, prefix = '') =>
  `${prefix}${getAppointmentCompositeId(appointment)}`

export const getLineBillsQueryKey = (appointment) => [
  'getLineBills',
  appointment?.type,
  appointment?.appointmentId,
]
