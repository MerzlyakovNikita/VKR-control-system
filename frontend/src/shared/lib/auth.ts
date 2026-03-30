import type { User } from '../../entities/user/model/types'

export const getUser = (): User => ({
  id: '1',
  role: 'STUDENT',
  firstName: 'Иван',
  lastName: 'Иванов',
  middleName: 'Иванович',
  email: 'ivan@test.ru',
  phone: '+79000000000',
  group: 'АСУ1-21-1б',
  direction: 'Информатика и вычислительная техника',
  directionCode: '09.03.01',
})