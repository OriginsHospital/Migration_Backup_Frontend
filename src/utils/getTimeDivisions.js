export function getTimeDivisions(eachDivisionInMinutes) {
  const arr = []
  let id = 1
  let currentTime = '00:00'
  const timeIncrement = eachDivisionInMinutes // in minutes
  const hoursPerDay = 24
  const minutesPerHour = 60

  for (let hour = 0; hour < hoursPerDay; hour++) {
    for (let minute = 0; minute < minutesPerHour; minute += timeIncrement) {
      arr.push({
        id: id,
        time: `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`,
      })
      id++
    }
  }
  arr.push({
    id: id,
    time: `24:00`,
  })

  return arr
}
