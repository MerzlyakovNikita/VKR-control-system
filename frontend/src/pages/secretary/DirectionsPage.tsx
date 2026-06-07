import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { api } from '../../shared/api/axios'
import { EDUCATION_LEVEL_LABELS } from '../../shared/lib/constants'
import './DirectionsPage.css'

interface Profile {
  id: number
  name: string
}
interface Direction {
  id: number
  code: string
  name: string
  education_level: string
  profiles: Profile[]
}

export default function DirectionsPage() {
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(false)

  const [addModal, setAddModal] = useState(false)
  const [addForm] = Form.useForm()
  const [addLoading, setAddLoading] = useState(false)

  const [editModal, setEditModal] = useState<{ open: boolean; direction: Direction | null }>({
    open: false,
    direction: null,
  })
  const [editForm] = Form.useForm()
  const [editLoading, setEditLoading] = useState(false)
  const [editingProfiles, setEditingProfiles] = useState<Profile[]>([])

  const load = () => {
    setLoading(true)
    api
      .get('/directions')
      .then(({ data }) => setDirections(data))
      .catch(() => message.error('Ошибка загрузки направлений'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openEdit = (dir: Direction) => {
    setEditModal({ open: true, direction: dir })
    setEditingProfiles(dir.profiles.map((p) => ({ ...p })))
    editForm.setFieldsValue({
      education_level: dir.education_level,
      code: dir.code,
      name: dir.name,
      newProfiles: [],
    })
  }

  const closeEdit = () => {
    setEditModal({ open: false, direction: null })
    setEditingProfiles([])
    editForm.resetFields()
  }

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields()
      const profiles: string[] = (values.profiles || [])
        .map((p: { name: string }) => p.name)
        .filter(Boolean)
      setAddLoading(true)
      await api.post('/directions', { ...values, profiles })
      message.success('Направление добавлено')
      setAddModal(false)
      addForm.resetFields()
      load()
    } catch {
    } finally {
      setAddLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editModal.direction) return
    try {
      const values = await editForm.validateFields()
      const newProfiles: string[] = (values.newProfiles || [])
        .map((p: { name: string }) => p.name)
        .filter(Boolean)
      setEditLoading(true)

      await api.put(`/directions/${editModal.direction.id}`, {
        code: values.code,
        name: values.name,
        education_level: values.education_level,
      })

      const originalProfiles = editModal.direction.profiles
      for (const orig of originalProfiles) {
        const current = editingProfiles.find((p) => p.id === orig.id)
        if (!current) {
          await api.delete(`/directions/${editModal.direction.id}/profiles/${orig.id}`)
        } else if (current.name.trim() !== orig.name) {
          await api.put(`/directions/${editModal.direction.id}/profiles/${orig.id}`, {
            name: current.name,
          })
        }
      }

      for (const profileName of newProfiles) {
        await api.post(`/directions/${editModal.direction.id}/profiles`, { name: profileName })
      }

      message.success('Изменения сохранены')
      closeEdit()
      load()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      if (msg) message.error(msg)
    } finally {
      setEditLoading(false)
    }
  }

  const confirmDeleteDirection = (dir: Direction) => {
    Modal.confirm({
      title: 'Удалить направление подготовки?',
      content: `«${dir.code} ${dir.name}» и все его профили будут удалены.`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/directions/${dir.id}`)
          message.success('Направление удалено')
          load()
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Ошибка удаления')
        }
      },
    })
  }

  const columns: ColumnsType<Direction> = [
    { title: 'Код', dataIndex: 'code', key: 'code', width: 130 },
    { title: 'Направление подготовки', dataIndex: 'name', key: 'name', width: 400 },
    {
      title: 'Профили подготовки',
      key: 'profiles',
      render: (row: Direction) => (
        <div className="profiles-cell">
          {row.profiles.map((p) => (
            <div key={p.id} className="profile-cell-item">
              {p.name}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      width: 64,
      render: (row: Direction) => (
        <div className="direction-actions">
          <EditOutlined className="direction-edit-icon" onClick={() => openEdit(row)} />
          <DeleteOutlined
            className="direction-delete-icon"
            onClick={() => confirmDeleteDirection(row)}
          />
        </div>
      ),
    },
  ]

  const directionFields = (
    <>
      <Form.Item
        name="education_level"
        label="Уровень образования"
        rules={[{ required: true, message: 'Выберите уровень образования' }]}
      >
        <Select
          placeholder="Выберите уровень"
          options={Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Form.Item>
      <Form.Item
        name="code"
        label="Код"
        rules={[{ required: true, message: 'Введите код направления' }]}
      >
        <Input placeholder="09.03.01" />
      </Form.Item>
      <Form.Item
        name="name"
        label="Название"
        rules={[{ required: true, message: 'Введите название направления' }]}
      >
        <Input placeholder="Информатика и вычислительная техника" />
      </Form.Item>
    </>
  )

  return (
    <div className="directions-page">
      <div className="directions-header">
        <h2>Направления подготовки</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
          Добавить направление
        </Button>
      </div>

      {Object.entries(EDUCATION_LEVEL_LABELS).map(([level, label]) => {
        const rows = directions.filter((d) => d.education_level === level)
        return (
          <div key={level} className="directions-section">
            <h4 className="directions-section-title">{label}</h4>
            <Table
              dataSource={rows}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Направления не добавлены' }}
            />
          </div>
        )
      })}

      <Modal
        open={addModal}
        title="Добавить направление подготовки"
        okText="Добавить"
        cancelText="Отмена"
        onOk={handleAdd}
        onCancel={() => {
          setAddModal(false)
          addForm.resetFields()
        }}
        confirmLoading={addLoading}
        width={560}
      >
        <Form form={addForm} layout="vertical">
          {directionFields}
          <Form.List name="profiles">
            {(fields, { add, remove }) => (
              <>
                <div className="profiles-form-header">
                  <span>Профили подготовки</span>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => add()}>
                    Добавить профиль
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="profile-form-row">
                    <Form.Item name={[field.name, 'name']} noStyle>
                      <Input placeholder="Название профиля" />
                    </Form.Item>
                    <Button
                      size="small"
                      danger
                      onClick={() => remove(field.name)}
                      className="profile-remove-btn"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        open={editModal.open}
        title="Редактировать направление подготовки"
        okText="Сохранить"
        cancelText="Отмена"
        onOk={handleEdit}
        onCancel={closeEdit}
        confirmLoading={editLoading}
        width={560}
      >
        <Form form={editForm} layout="vertical">
          {directionFields}
          <Form.List name="newProfiles">
            {(fields, { add, remove }) => (
              <>
                <div className="profiles-form-header">
                  <span>Профили подготовки</span>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => add()}>
                    Добавить профиль
                  </Button>
                </div>
                {editingProfiles.map((p) => (
                  <div key={p.id} className="profile-form-row">
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        setEditingProfiles((prev) =>
                          prev.map((ep) => (ep.id === p.id ? { ...ep, name: e.target.value } : ep)),
                        )
                      }
                    />
                    <Button
                      size="small"
                      danger
                      className="profile-remove-btn"
                      onClick={() =>
                        setEditingProfiles((prev) => prev.filter((ep) => ep.id !== p.id))
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {fields.map((field) => (
                  <div key={field.key} className="profile-form-row">
                    <Form.Item name={[field.name, 'name']} noStyle>
                      <Input placeholder="Название нового профиля" />
                    </Form.Item>
                    <Button
                      size="small"
                      danger
                      onClick={() => remove(field.name)}
                      className="profile-remove-btn"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}
