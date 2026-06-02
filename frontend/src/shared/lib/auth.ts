export const getUser = () => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export const hasRole = (role: string): boolean => {
  return getUser()?.roles?.includes(role) || false
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}
