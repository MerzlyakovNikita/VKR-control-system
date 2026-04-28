export const getUser = () => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export const getRole = () => {
  return getUser()?.role
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}
