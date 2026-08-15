export const isValid = function(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false
  } else {
    return true
  }
}

export const isValidEmail = function(data) {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(data)
}

export function checkPassword(str) {
  var re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/
  return re.test(str)
}

export function checkname(str) {
  var nameRegex = /^[A-Z a-z]+$/
  return nameRegex.test(str)
}

export function checkDate(str) {
  var dateRegex = /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/
  return dateRegex.test(str)
}
