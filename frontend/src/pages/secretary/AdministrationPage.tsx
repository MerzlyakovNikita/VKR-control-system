import { useEffect, useState } from 'react'
import { Table, Button, Select, Modal, message, Empty, Tabs, Tag, Input } from 'antd'
import { CheckOutlined, CloseOutlined, LockOutlined, EditOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { ROLE_OPTIONS } from '../../shared/lib/constants'
import './AdministrationPage.css'

const ALL_ROLE_OPTIONS = [{ value: 'SECRETARY', label: 'Секретарь' }, ...ROLE_OPTIONS]

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_ROLE_OPTIONS.map((o) => [o.value, o.label]),
)

const fio = (u: any) => [u.last_name, u.first_name, u.middle_name].filter(Boolean).join(' ')

export default function AdministrationPage() {
  const [pending, setPending] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string[]>>({})

  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingRoles, setEditingRoles] = useState<{ userId: number; roles: string[] } | null>(null)
  const [rolesLoading, setRolesLoading] = useState(false)

  const [tempPasswordModal, setTempPasswordModal] = useState<{
    open: boolean
    password: string
    userName: string
  }>({ open: false, password: '', userName: '' })

  const loadPending = async () => {
    setPendingLoading(true)
    try {
      const { data } = await api.get('/users/pending')
      setPending(data)
    } catch {
      message.error('Ошибка загрузки заявок')
    } finally {
      setPendingLoading(false)
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const { data } = await api.get('/users/active')
      setActiveUsers(data)
    } catch {
      message.error('Ошибка загрузки пользователей')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
    loadUsers()
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
      content: (
        <span>
          <strong>{fio(user)}</strong> будет добавлен с ролями: «{roleLabels}»
        </span>
      ),
      okText: 'Одобрить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.post(`/users/${user.id}/approve`, { roles })
          message.success('Пользователь одобрен')
          loadPending()
          loadUsers()
        } catch {
          message.error('Ошибка одобрения')
        }
      },
    })
  }

  const handleReject = (user: any) => {
    Modal.confirm({
      title: 'Отклонить заявку?',
      content: (
        <span>
          Аккаунт <strong>{fio(user)}</strong> будет удалён
        </span>
      ),
      okText: 'Отклонить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/users/${user.id}/reject`)
          message.success('Заявка отклонена')
          loadPending()
        } catch {
          message.error('Ошибка отклонения')
        }
      },
    })
  }

  const handleSaveRoles = async () => {
    if (!editingRoles) return
    if (editingRoles.roles.length === 0) {
      message.warning('У пользователя должна быть хотя бы одна роль')
      return
    }
    setRolesLoading(true)
    try {
      await api.put(`/users/${editingRoles.userId}/roles`, { roles: editingRoles.roles })
      message.success('Роли обновлены')
      setEditingRoles(null)
      loadUsers()
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Ошибка обновления ролей')
    } finally {
      setRolesLoading(false)
    }
  }

  const handleResetPassword = (user: any) => {
    Modal.confirm({
      title: 'Сбросить пароль?',
      content: (
        <span>
          Текущий пароль пользователя <strong>{fio(user)}</strong> будет заменён временным.
        </span>
      ),
      okText: 'Сбросить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const { data } = await api.post(`/users/${user.id}/reset-password`)
          setTempPasswordModal({ open: true, password: data.tempPassword, userName: fio(user) })
        } catch {
          message.error('Ошибка сброса пароля')
        }
      },
    })
  }

  const pendingColumns = [
    { title: 'ФИО', key: 'fio', width: 320, render: (row: any) => fio(row) },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 280 },
    {
      title: 'Роли',
      key: 'roles',
      render: (row: any) => (
        <Select
          mode="multiple"
          placeholder="Выберите роли"
          className="roles-select"
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
        <div className="table-actions">
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

  const usersColumns = [
    { title: 'ФИО', key: 'fio', width: 320, render: (row: any) => fio(row) },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 280 },
    {
      title: 'Роли',
      key: 'roles',
      render: (row: any) => {
        const isEditing = editingRoles?.userId === row.id
        if (isEditing) {
          return (
            <Select
              mode="multiple"
              className="roles-select"
              value={editingRoles!.roles}
              onChange={(val) => setEditingRoles({ userId: row.id, roles: val })}
              options={ALL_ROLE_OPTIONS}
              placeholder="Выберите роли"
            />
          )
        }
        return (
          <div className="roles-tags">
            {(row.roles as string[]).map((r) => (
              <Tag key={r}>{ROLE_LABELS[r] ?? r}</Tag>
            ))}
          </div>
        )
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 250,
      render: (row: any) => {
        const isEditing = editingRoles?.userId === row.id
        if (isEditing) {
          return (
            <div className="table-actions">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                loading={rolesLoading}
                onClick={handleSaveRoles}
              />
              <Button icon={<CloseOutlined />} size="small" onClick={() => setEditingRoles(null)} />
            </div>
          )
        }
        return (
          <div className="table-actions">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => setEditingRoles({ userId: row.id, roles: row.roles })}
            >
              Роли
            </Button>
            <Button icon={<LockOutlined />} size="small" onClick={() => handleResetPassword(row)}>
              Сбросить пароль
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="administration-page">
      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: 'Пользователи системы',
            children: (
              <Table
                dataSource={activeUsers}
                columns={usersColumns}
                rowKey="id"
                loading={usersLoading}
                pagination={false}
              />
            ),
          },
          {
            key: 'pending',
            label: `Заявки на регистрацию${pending.length > 0 ? ` (${pending.length})` : ''}`,
            children:
              pending.length === 0 && !pendingLoading ? (
                <Empty description="Новых заявок нет" />
              ) : (
                <Table
                  dataSource={pending}
                  columns={pendingColumns}
                  rowKey="id"
                  loading={pendingLoading}
                  pagination={false}
                  tableLayout="fixed"
                />
              ),
          },
        ]}
      />

      <Modal
        open={tempPasswordModal.open}
        title="Временный пароль сгенерирован"
        onOk={() => setTempPasswordModal({ open: false, password: '', userName: '' })}
        onCancel={() => setTempPasswordModal({ open: false, password: '', userName: '' })}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Закрыть"
      >
        <p className="temp-password-note">
          Передайте этот пароль пользователю <strong>{tempPasswordModal.userName}</strong>. После
          входа он сможет сменить его в профиле.
        </p>
        <Input value={tempPasswordModal.password} readOnly className="temp-password-input" />
      </Modal>
    </div>
  )
}
