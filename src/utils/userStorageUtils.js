export function getStoredUser(storageValue) {
  try {
    if (!storageValue || storageValue === 'undefined' || storageValue === '[object Object]') {
      return null
    }

    return JSON.parse(storageValue)
  } catch {
    return null
  }
}
