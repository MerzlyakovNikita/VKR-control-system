import { Card, Descriptions, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getUser } from '../../shared/lib/auth'

export default function ProfilePage() {
  const user = getUser()

  return (
    <Card>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Avatar size={80} icon={<UserOutlined />} />

        <div>
          <h2 style={{ margin: 0 }}>
            {user.lastName} {user.firstName} {user.middleName}
          </h2>
          <div>{user.email}</div>
          <div>{user.phone}</div>
        </div>
      </div>

      <Descriptions column={1} bordered>
        {user.role === 'STUDENT' && (
          <>
            <Descriptions.Item label="Группа">
              {user.group}
            </Descriptions.Item>
            <Descriptions.Item label="Направление">
              {user.direction}
            </Descriptions.Item>
            <Descriptions.Item label="Код направления">
              {user.directionCode}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Card>
  )
}