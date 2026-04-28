import { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Select, Card, message, Row, Col } from 'antd'
import { api } from '../../shared/api/axios'
import './GroupsPage.css'
import { useNavigate } from 'react-router-dom'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Search } = Input

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const [editingGroup, setEditingGroup] = useState<any | null>(null)

  const educationForms = ['очная', 'заочная', 'очно-заочная']
  const educationLevels = ['бакалавриат', 'магистратура']

  const [courses, setCourses] = useState<number[]>([1, 2, 3, 4])

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups')
      setGroups(data.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ru')))
    } catch {
      message.error('Ошибка загрузки групп')
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleLevelChange = (value: string) => {
    if (value === 'магистратура') {
      setCourses([1, 2])
    } else {
      setCourses([1, 2, 3, 4])
    }
    form.setFieldValue('course', undefined)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, values)
        message.success('Информация о группе изменена')
      } else {
        await api.post('/groups', values)
        message.success('Группа добавлена')
      }

      setOpen(false)
      setEditingGroup(null)
      form.resetFields()
      loadGroups()
    } catch (e) {
      console.error(e)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEditingGroup(null)
    form.resetFields()
  }

  const filteredGroups = groups.filter((g) => {
    const value = search.toLowerCase()

    return (
      g.name.toLowerCase().includes(value) ||
      g.direction.toLowerCase().includes(value) ||
      g.direction_code.toLowerCase().includes(value)
    )
  })

  const handleEdit = (group: any) => {
    setEditingGroup(group)
    setOpen(true)

    form.setFieldsValue({
      ...group,
    })
  }

  const confirmDeleteGroup = (groupId: string) => {
    Modal.confirm({
      title: 'Удалить группу?',
      content: 'У студентов этой группы она будет сброшена',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',

      onOk: async () => {
        try {
          await api.delete(`/groups/${groupId}`)

          message.success('Группа удалена')
          loadGroups()
        } catch {
          message.error('Ошибка удаления')
        }
      },
    })
  }

  return (
    <div className="groups-page">
      <h2>Группы</h2>

      <Row gutter={16} style={{ marginTop: 10 }}>
        <Col span={16}>
          <Row gutter={[16, 16]}>
            {filteredGroups.map((g) => (
              <Col span={12} key={g.id}>
                <Card
                  className="group-card"
                  actions={[
                    <Button
                      type="link"
                      className="open-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/groups/${g.id}`)
                      }}
                    >
                      Открыть
                    </Button>,
                  ]}
                >
                  <div className="group-card-header">
                    <div className="group-card-title">
                      <b>
                        {g.name} ({g.direction_code})
                      </b>{' '}
                      — {g.direction}
                    </div>

                    <EditOutlined className="edit-icon" onClick={() => handleEdit(g)} />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDeleteGroup(g.id)
                      }}
                    />
                  </div>
                  {g.profile && (
                    <>
                      Профиль: {g.profile} <br />
                    </>
                  )}
                  {g.education_level}, {g.course} курс, {g.education_form}
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col span={8} className="right-panel">
          <Card title="Управление">
            <Search
              placeholder="Поиск группы..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value.trimStart())}
            />

            <Button type="primary" style={{ marginTop: 20 }} onClick={() => setOpen(true)}>
              Добавить группу
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal
        open={open}
        onCancel={handleClose}
        onOk={handleSubmit}
        okText="Сохранить"
        cancelText="Отмена"
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
            name="direction"
            label="Направление"
            rules={[{ required: true, message: 'Введите направление' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="direction_code"
            label="Код направления"
            rules={[{ required: true, message: 'Введите код направления' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="profile"
            label="Профиль"
            rules={[{ required: true, message: 'Введите профиль' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="education_form"
            label="Форма обучения"
            rules={[{ required: true, message: 'Выберите форму обучения' }]}
          >
            <Select
              placeholder="Выберите форму"
              options={educationForms.map((f) => ({
                label: f,
                value: f,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="education_level"
            label="Уровень образования"
            rules={[{ required: true, message: 'Выберите уровень образования' }]}
          >
            <Select
              placeholder="Выберите уровень"
              onChange={handleLevelChange}
              options={educationLevels.map((l) => ({
                label: l,
                value: l,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="course"
            label="Курс"
            rules={[{ required: true, message: 'Выберите курс' }]}
          >
            <Select
              placeholder="Выберите курс"
              options={courses.map((c) => ({
                label: c,
                value: c,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
