import { useEffect, useState } from 'react'
import { Card, Button, Input, Select, Form, message, Modal } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined, LockOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { DEGREE_LABELS, POSITION_LABELS } from '../../shared/lib/constants'
import { formatPhone } from '../../shared/lib/normalize'
import './ProfilePage.css'

function hasDegree(position?: string): boolean {
  return position === 'ASSOCIATE_PROFESSOR' || position === 'PROFESSOR'
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="info-row">
      <div className="label">{label}</div>
      <div className="value">{value || '—'}</div>
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const loadUser = async () => {
    const { data } = await api.get('/users/me')
    setUser(data)
  }

  useEffect(() => {
    loadUser()
  }, [])

  const handleEdit = () => {
    form.setFieldsValue({
      last_name: user.last_name,
      first_name: user.first_name,
      middle_name: user.middle_name,
      email: user.email,
      phone: user.phone,
      degree: user.degree,
      position: user.position,
    })
    setIsEditing(true)
  }

  const handleCancel = () => setIsEditing(false)

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await api.put('/users/me', values)
      message.success('Профиль обновлён')
      setIsEditing(false)
      loadUser()
    } catch {
      message.error('Ошибка при сохранении')
    }
  }

  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields()
      await api.put('/users/me/password', {
        current_password: values.current_password,
        new_password: values.new_password,
      })
      message.success('Пароль изменён')
      setIsPasswordModalOpen(false)
      passwordForm.resetFields()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (msg) {
        message.error(msg)
      } else if (err?.errorFields) {
        // Ошибка проверки, ничего не делать
      } else {
        message.error('Ошибка при смене пароля')
      }
    }
  }

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false)
    passwordForm.resetFields()
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <Card className="profile-card">
        {!isEditing ? (
          <>
            <InfoRow
              label="ФИО"
              value={[user.last_name, user.first_name, user.middle_name].filter(Boolean).join(' ')}
            />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Телефон" value={formatPhone(user.phone)} />
            <InfoRow
              label="Должность"
              value={user.position ? POSITION_LABELS[user.position] : undefined}
            />
            {hasDegree(user.position) && (
              <InfoRow
                label="Учёная степень"
                value={user.degree ? DEGREE_LABELS[user.degree] : undefined}
              />
            )}
            <div className="card-actions">
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                Редактировать
              </Button>
              <Button icon={<LockOutlined />} onClick={() => setIsPasswordModalOpen(true)}>
                Сменить пароль
              </Button>
            </div>
          </>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(changed) => {
              if ('position' in changed && !hasDegree(changed.position)) {
                form.setFieldValue('degree', undefined)
              }
            }}
          >
            <Form.Item
              label="Фамилия"
              name="last_name"
              rules={[{ required: true, message: 'Введите фамилию' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Имя"
              name="first_name"
              rules={[{ required: true, message: 'Введите имя' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Отчество" name="middle_name">
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Введите email' },
                { type: 'email', message: 'Некорректный email' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Телефон" name="phone">
              <Input />
            </Form.Item>
            <Form.Item label="Должность" name="position">
              <Select
                allowClear={!user.position}
                placeholder="Выберите должность"
                options={Object.entries(POSITION_LABELS).map(([key, label]) => ({
                  value: key,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.position !== cur.position}>
              {({ getFieldValue }) =>
                hasDegree(getFieldValue('position')) ? (
                  <Form.Item label="Учёная степень" name="degree">
                    <Select
                      allowClear={!user.degree}
                      placeholder="Выберите степень"
                      options={Object.entries(DEGREE_LABELS).map(([key, label]) => ({
                        value: key,
                        label,
                      }))}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <div className="card-actions">
              <Button icon={<CloseOutlined />} onClick={handleCancel}>
                Отмена
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          </Form>
        )}
      </Card>

      <Modal
        title="Смена пароля"
        open={isPasswordModalOpen}
        onOk={handlePasswordChange}
        onCancel={handlePasswordModalClose}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Текущий пароль"
            name="current_password"
            rules={[{ required: true, message: 'Введите текущий пароль' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Новый пароль"
            name="new_password"
            rules={[
              { required: true, message: 'Введите новый пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Повторите новый пароль"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Повторите новый пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Пароли не совпадают'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
