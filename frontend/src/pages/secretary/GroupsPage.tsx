import { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Select, Card, message, Row, Col, Empty } from 'antd'
import { api } from '../../shared/api/axios'
import './GroupsPage.css'
import { useNavigate } from 'react-router-dom'
import {
  EditOutlined,
  DeleteOutlined,
  SelectOutlined,
  ApartmentOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  EDUCATION_FORMS,
  EDUCATION_FORM_LABELS,
  EDUCATION_LEVEL_LABELS,
  getCourseByForm,
} from '../../shared/lib/constants'

const { Search } = Input

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [directions, setDirections] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const navigate = useNavigate()

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups')
      setGroups(data.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ru')))
    } catch {
      message.error('Ошибка загрузки групп')
    }
  }

  const loadDirections = async () => {
    try {
      const { data } = await api.get('/directions')
      setDirections(data)
    } catch {
      message.error('Ошибка загрузки направлений')
    }
  }

  useEffect(() => {
    loadGroups()
    loadDirections()
  }, [])

  const handleDirectionChange = async (directionId: number) => {
    form.setFieldsValue({ profile_id: undefined })
    setProfiles([])
    try {
      const { data } = await api.get(`/directions/${directionId}/profiles`)
      setProfiles(data)
    } catch {
      message.error('Ошибка загрузки профилей')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const direction = directions.find((d) => d.id === values.direction_id)
      const course = getCourseByForm(values.education_form, direction?.education_level)
      const payload = { ...values, course }

      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, payload)
        message.success('Информация об учебной группе изменена')
      } else {
        await api.post('/groups', payload)
        message.success('Учебная группа добавлена')
      }
      setOpen(false)
      setEditingGroup(null)
      form.resetFields()
      setProfiles([])
      loadGroups()
    } catch (e) {
      console.error(e)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEditingGroup(null)
    form.resetFields()
    setProfiles([])
  }

  const handleEdit = async (group: any) => {
    setEditingGroup(group)
    setOpen(true)
    try {
      const { data } = await api.get(`/directions/${group.direction_id}/profiles`)
      setProfiles(data)
    } catch {}
    form.setFieldsValue({
      name: group.name,
      direction_id: group.direction_id,
      profile_id: group.profile_id,
      education_form: group.education_form,
    })
  }

  const confirmDeleteGroup = (groupId: string) => {
    Modal.confirm({
      title: 'Удалить учебную группу?',
      content: 'Все студенты этой учебной группы также будут удалены',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/groups/${groupId}`)
          message.success('Учебная группа удалена')
          loadGroups()
        } catch {
          message.error('Ошибка удаления')
        }
      },
    })
  }

  const filteredGroups = groups.filter((g) => {
    const value = search.toLowerCase()
    return (
      g.name.toLowerCase().includes(value) ||
      (g.direction_name || '').toLowerCase().includes(value) ||
      (g.direction_code || '').toLowerCase().includes(value)
    )
  })

  return (
    <div className="groups-page">
      <h2>Учебные группы</h2>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col span={19}>
          {filteredGroups.length === 0 ? (
            <Empty description="Учебные группы не добавлены" />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredGroups.map((g) => (
                <Col span={8} key={g.id}>
                  <Card className="group-card">
                    <div className="group-card-header">
                      <div className="group-card-title">
                        <b>{g.name}</b>
                        <div className="group-card-direction">
                          {g.direction_code} {g.direction_name}
                        </div>
                      </div>
                      <div className="group-card-icons">
                        <SelectOutlined
                          className="navigate-icon"
                          onClick={() => navigate(`/theses?group=${encodeURIComponent(g.name)}`)}
                        />
                        <EditOutlined className="edit-icon" onClick={() => handleEdit(g)} />
                        <DeleteOutlined
                          className="delete-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            confirmDeleteGroup(g.id)
                          }}
                        />
                      </div>
                    </div>
                    {g.profile_name && (
                      <div className="group-card-meta">Профиль: {g.profile_name}</div>
                    )}
                    <div className="group-card-meta">
                      {EDUCATION_LEVEL_LABELS[g.education_level] || g.education_level}, {g.course}{' '}
                      курс, {EDUCATION_FORM_LABELS[g.education_form] || g.education_form}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        <Col span={5} className="right-panel">
          <Card title="Управление">
            <Search
              placeholder="Поиск группы..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value.trimStart())}
            />
            <div className="panel-buttons">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} block>
                Добавить группу
              </Button>
              <Button icon={<ApartmentOutlined />} onClick={() => navigate('/directions')} block>
                Направления подготовки
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        open={open}
        onCancel={handleClose}
        onOk={handleSubmit}
        okText="Сохранить"
        cancelText="Отмена"
        title={editingGroup ? 'Редактировать учебную группу' : 'Добавить учебную группу'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Название группы"
            rules={[{ required: true, message: 'Введите название группы' }]}
          >
            <Input placeholder="РИС-22-2б" />
          </Form.Item>

          <Form.Item
            name="direction_id"
            label="Направление подготовки"
            rules={[{ required: true, message: 'Выберите направление' }]}
          >
            <Select
              placeholder="Выберите направление"
              onChange={handleDirectionChange}
              options={directions.map((d) => ({
                label: `${d.code} — ${d.name}`,
                value: d.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="profile_id" label="Профиль">
            <Select
              placeholder="Выберите профиль"
              allowClear
              disabled={profiles.length === 0}
              options={profiles.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item
            name="education_form"
            label="Форма обучения"
            rules={[{ required: true, message: 'Выберите форму обучения' }]}
          >
            <Select
              placeholder="Выберите форму"
              options={EDUCATION_FORMS.map((f) => ({
                label: EDUCATION_FORM_LABELS[f],
                value: f,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
