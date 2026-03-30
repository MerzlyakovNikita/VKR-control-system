import { Card, Descriptions, Avatar, Select, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { api } from '../../shared/api/axios'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data } = await api.get('/users/me')
      setUser(data)
    } catch {
      message.error('Ошибка загрузки профиля')
    }
  }

  if (!user) return null

  return (
    <Card>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Avatar
          size={80}
          style={{ backgroundColor: '#1677ff' }}
          icon={<UserOutlined />}
        />

        <div>
          <h2 style={{ margin: 0 }}>
            {user.last_name} {user.first_name} {user.middle_name}
          </h2>
          <div>{user.email}</div>
          <div>{user.phone}</div>
        </div>
      </div>

      <Descriptions column={1} bordered>
        {/* пока без группы */}
        <Descriptions.Item label="Группа">
          <Select
            placeholder="Будет доступно позже"
            style={{ width: 250 }}
            disabled
          />
        </Descriptions.Item>

        {user.role === 'TEACHER' && (
          <Descriptions.Item label="Должность">
            {user.position}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  )
}