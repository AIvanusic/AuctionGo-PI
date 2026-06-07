export function redirectByRole(user) {
  if (!user) {
    window.location.href = '/'
    return
  }

  if (user.korisnik_verificiran === 'ne') {
    window.location.href = '/complete-profile'
  } else if (user.korisnik_admin === 'da' || user.korisnik_superadmin === 'da') {
    window.location.href = '/admin-dashboard'
  } else if (user.korisnik_procjenitelj === 'da') {
    window.location.href = '/appraiser-dashboard'
  } else if (user.korisnik_voditelj === 'da') {
    window.location.href = '/manager-dashboard'
  } else {
    window.location.href = '/user-profile'
  }
}
