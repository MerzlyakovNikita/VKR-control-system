export const capitalize = (str) =>
  str ? str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase() : null

export const normalizePhone = (phone) => {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  let normalized
  if (digits.length === 10) {
    normalized = '7' + digits
  } else if (digits.length === 11 && digits.startsWith('8')) {
    normalized = '7' + digits.slice(1)
  } else {
    normalized = digits
  }
  return '+' + normalized
}

export const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : null)
