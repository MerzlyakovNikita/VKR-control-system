export type Role = 'STUDENT' | 'TEACHER' | 'HEAD' | 'SECRETARY'

export interface User {
  id: string
  role: Role
  firstName: string
  lastName: string
  middleName: string
  email: string
  phone?: string

  // студент
  group?: string
  direction?: string
  directionCode?: string
}
