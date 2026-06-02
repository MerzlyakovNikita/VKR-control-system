import { useEffect, useState } from 'react'
import { Table, Button, Select, Modal, message, Empty } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { ROLE_OPTIONS } from '../../shared/lib/constants'
import { formatPhone } from '../../shared/lib/normalize'
import './RegistrationRequestsPage.css'

export default function RegistrationRequestsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string[]>>({})

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/pending')
      setUsers(data)
    } catch {
      message.error('Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = (user: any) => {
    const roles = selectedRoles[user.id]
    if (!roles || roles.length === 0) {
      message.warning('Выберите хотя бы одну роль')
      return
    }
    const roleLabels = roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label).join(', ')
    Modal.confirm({
      title: 'Одобрить заявку?',
      content: `${user.last_name} ${user.first_name} ${user.middle_name || ''} будет добавлен с ролями: «${roleLabels}»`,
      okText: 'Одобрить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.post(`/users/${user.id}/approve`, { roles })
          message.success('Пользователь одобрен')
          load()
        } catch {
          message.error('Ошибка одобрения')
        }
      },
    })
  }

  const handleReject = (user: any) => {
    Modal.confirm({
      title: 'Отклонить заявку?',
      content: `Аккаунт ${user.last_name} ${user.first_name} ${user.middle_name || ''} будет удалён`,
      okText: 'Отклонить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/users/${user.id}/reject`)
          message.success('Заявка отклонена')
          load()
        } catch {
          message.error('Ошибка отклонения')
        }
      },
    })
  }

  const columns = [
    {
      title: 'ФИО',
      key: 'fio',
      width: 200,
      render: (row: any) => `${row.last_name} ${row.first_name} ${row.middle_name || ''}`.trim(),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (v: string) => formatPhone(v) || '—',
    },
    {
      title: 'Роли',
      key: 'roles',
      width: 380,
      render: (row: any) => (
        <Select
          mode="multiple"
          placeholder="Выберите роли"
          style={{ width: '100%' }}
          value={selectedRoles[row.id] ?? []}
          onChange={(val) => setSelectedRoles((prev) => ({ ...prev, [row.id]: val }))}
          options={ROLE_OPTIONS}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => handleApprove(row)}
          />
          <Button danger icon={<CloseOutlined />} size="small" onClick={() => handleReject(row)} />
        </div>
      ),
    },
  ]

  return (
    <div className="requests-page">
      {users.length === 0 && !loading ? (
        <Empty description="Новых заявок нет" />
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          tableLayout="fixed"
        />
      )}
    </div>
  )
}
