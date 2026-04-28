import { api } from '../../shared/api/axios'

export const getThesisList = async () => {
  const { data } = await api.get('/thesis')
  return data
}
