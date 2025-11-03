// Validation Utilities
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidCronExpression = (expression) => {
  const cronRegex =
    /^(\*|([0-5]?\d))\s+(\*|([01]?\d|2[0-3]))\s+(\*|([01]?\d|2[0-9]|3[01]))\s+(\*|([1-7]))\s+(\*|([0-9]|1[0-2]))$/
  return cronRegex.test(expression)
}

const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

module.exports = {
  isValidEmail,
  isValidCronExpression,
  isValidUrl,
}
