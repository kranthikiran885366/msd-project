// Small validation helpers used by services

function validateTimezone(tz) {
  try {
    // Try to format a date using the timezone — will throw on invalid tz in many Node versions
    Intl.DateTimeFormat(undefined, { timeZone: tz }).format(new Date())
    return true
  } catch (e) {
    return false
  }
}

function validateLanguage(lang) {
  if (!lang || typeof lang !== 'string') return false
  // Basic BCP-47-ish check: e.g. en, en-US, fr-CA
  return /^[a-z]{2,3}(-[A-Z]{2,3})?$/.test(lang)
}

module.exports = {
  validateTimezone,
  validateLanguage,
}
