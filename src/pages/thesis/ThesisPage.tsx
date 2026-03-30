import { getUser } from '../../shared/lib/auth'
import StudentThesisPage from './StudentThesisPage'
import SupervisorThesisPage from './SupervisorThesisPage'
import SecretaryThesisPage from './SecretaryThesisPage'

export default function ThesisPage() {
  const { role } = getUser()

  switch (role) {
    case 'STUDENT':
      return <StudentThesisPage />

    case 'SUPERVISOR':
      return <SupervisorThesisPage />

    case 'SECRETARY':
      return <SecretaryThesisPage />

    default:
      return null
  }
}